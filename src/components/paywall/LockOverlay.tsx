import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, ArrowRight, RefreshCw, AlertTriangle, Check, CheckCircle2, 
  MessageSquare, ExternalLink, HelpCircle, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface LockOverlayProps {
  shop: any;
  onUnlockSuccess: (updatedShop: any) => void;
  onOpenHowToPayDirectly?: boolean;
  onCloseDirectHowToPay?: () => void;
}

export const LockOverlay: React.FC<LockOverlayProps> = ({ 
  shop, 
  onUnlockSuccess, 
  onOpenHowToPayDirectly = false,
  onCloseDirectHowToPay
}) => {
  // Screens: 
  // 'expired' (main landing notice for non-active subscription)
  // 'how_to_pay' (details on payment channels)
  // 'paid_form' (receipt verification input)
  // 'claims_pending' (awaiting manual review from dashboard)
  // 'success' (unlocked transition)
  const [screen, setScreen] = useState<'expired' | 'how_to_pay' | 'paid_form' | 'claims_pending' | 'success'>('expired');

  // Form Fields
  const [whatsapp, setWhatsapp] = useState('');
  const [ecocash, setEcocash] = useState('');
  const [reference, setReference] = useState('');
  const [formErrors, setFormErrors] = useState<{ whatsapp?: string; ecocash?: string; reference?: string }>({});

  const [activeShop, setActiveShop] = useState<any>(shop);
  const [currentClaim, setCurrentClaim] = useState<any>(null);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [checkingNetwork, setCheckingNetwork] = useState(false);

  // User Metadata values for pre-filled WhatsApp report
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  // Sandbox simulation panel toggle
  const [showSandbox, setShowSandbox] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Sync activeShop if prop changes
  useEffect(() => {
    if (shop) {
      setActiveShop(shop);
    }
  }, [shop]);

  // Fetch Owner Metadata info
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setOwnerEmail(user.email || '');
          setOwnerName(user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Store Owner');
        }
      } catch (err) {
        console.warn('Could not read session details:', err);
      }
    };
    fetchUserData();
  }, []);

  const fetchLatestShop = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shop.id)
        .maybeSingle();
      if (!error && data) {
        setActiveShop(data);
        if (data.subscription_status === 'active') {
          triggerSuccessTransition(data);
        } else if (data.subscription_status === 'pending_verification') {
          setScreen('claims_pending');
        }
      }
    } catch (e) {
      console.warn('Error pulling storefront record:', e);
    }
  };

  const fetchLatestClaim = async () => {
    try {
      setLoadingClaim(true);
      const { data, error } = await supabase
        .from('payment_claims')
        .select('*')
        .eq('shop_id', shop.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setCurrentClaim(data);
        if (data.status === 'pending') {
          setScreen('claims_pending');
        } else if (data.status === 'verified') {
          // If claim has been marked verified, verify shop status is active and transition
          await fetchLatestShop();
        }
      } else {
        // Double check secondary payments table
        const { data: payData } = await supabase
          .from('payments')
          .select('*')
          .eq('shop_id', shop.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (payData) {
          const mapped = {
            id: payData.id,
            shop_id: payData.shop_id,
            whatsapp_number: payData.whatsapp_number,
            ecocash_number: payData.ecocash_number || payData.whatsapp_number,
            status: payData.status === 'activated' ? 'verified' : payData.status === 'rejected' ? 'rejected' : 'pending',
            reference: payData.reference,
            submitted_at: payData.submitted_at || payData.created_at
          };
          setCurrentClaim(mapped);
          if (mapped.status === 'pending') {
            setScreen('claims_pending');
          }
        }
      }
    } catch (e) {
      console.warn('Fallback claim check:', e);
    } finally {
      setLoadingClaim(false);
    }
  };

  // Poll for shop/claim updates via Supabase on-mount
  useEffect(() => {
    if (!shop?.id) return;
    const initDataFetch = async () => {
      await fetchLatestShop();
      await fetchLatestClaim();
    };
    initDataFetch();
  }, [shop?.id]);

  // Handle active claim updates via WebSockets for real-time unlock
  useEffect(() => {
    if (!shop?.id) return;

    // Real-time changes to payment claims table
    const claimsChannel = supabase
      .channel(`payment_claims_websocket_${shop.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_claims',
          filter: `shop_id=eq.${shop.id}`
        },
        async (payload: any) => {
          console.log('WS claim change:', payload);
          const claim = payload.new;
          if (claim) {
            setCurrentClaim(claim);
            if (claim.status === 'verified') {
              await fetchLatestShop();
            } else if (claim.status === 'rejected') {
              toast.error('Payment verification rejected by admin. Please resubmit clean details.');
              setScreen('paid_form');
            }
          }
        }
      )
      .subscribe();

    // Real-time changes to shops table
    const shopsChannel = supabase
      .channel(`shops_websocket_${shop.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shops',
          filter: `id=eq.${shop.id}`
        },
        (payload: any) => {
          console.log('WS shop update:', payload);
          const updatedShop = payload.new;
          if (updatedShop) {
            setActiveShop(updatedShop);
            if (updatedShop.subscription_status === 'active') {
              triggerSuccessTransition(updatedShop);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(claimsChannel);
      supabase.removeChannel(shopsChannel);
    };
  }, [shop?.id]);

  const triggerSuccessTransition = (updatedShop: any) => {
    setScreen('success');
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#c8ff00', '#ffffff', '#000000']
    });
  };

  // Zimbabwean formats: 77XXXXXXX / 78XXXXXXX / 71XXXXXXX / 73XXXXXXX / 077XXXXXXX / 078XXXXXXX / 071XXXXXXX / 073XXXXXXX
  const validateZimNumber = (num: string) => {
    const cleaned = num.replace(/\s+/g, '').replace(/-/g, '');
    const regex = /^(07|7)(7|8|1|3)\d{7}$/;
    return regex.test(cleaned);
  };

  const cleanZimNumberForDisplay = (num: string) => {
    let cleaned = num.replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    return cleaned;
  };

  // Manual Check Button trigger
  const handleManualCheckStatus = async () => {
    setCheckingNetwork(true);
    try {
      // 1. Fetch latest shop record
      const { data: updatedShop, error: shopErr } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shop.id)
        .maybeSingle();

      if (shopErr) throw shopErr;

      // 2. Fetch latest claim record
      const { data: updatedClaim } = await supabase
        .from('payment_claims')
        .select('*')
        .eq('shop_id', shop.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (updatedClaim) {
        setCurrentClaim(updatedClaim);
      }

      if (updatedShop) {
        setActiveShop(updatedShop);
        
        if (updatedShop.subscription_status === 'active') {
          toast.success('Awesome news! Your payment is confirmed.');
          triggerSuccessTransition(updatedShop);
          return;
        }
      }

      toast.info('Your subscription status is still pending review. We will notify you on WhatsApp.');
    } catch (err: any) {
      console.error(err);
      toast.error('Network sync check failed. Please try again.');
    } finally {
      setCheckingNetwork(false);
    }
  };

  const openWhatsAppAutomaticFlow = (cleanRef: string, finalWhatsApp: string, finalEcoCash: string) => {
    const adminWhatsApp = "263789113734";
    const boldHeader = `*THREADZW PRO TRANSACTION SUBMISSION*`;
    const messageLines = [
      boldHeader,
      `========================`,
      `Shop Name: ${activeShop?.name || shop?.name || 'Mascot Brand'}`,
      `Owner Name: ${ownerName || 'Brand Owner'}`,
      `Registered Email: ${ownerEmail || 'Not configured'}`,
      `WhatsApp Contact: +${finalWhatsApp}`,
      `EcoCash Paid From: ${finalEcoCash}`,
      `Transaction ID / Ref: ${cleanRef}`,
      `========================`,
      `Kindly audit this receipt on the ledger system and activate our shopfront subscription. Thank you!`
    ];

    const messageText = messageLines.join('\n');
    const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(messageText)}`;
    
    // Safely execute link open
    window.open(whatsappUrl, '_blank');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { whatsapp?: string; ecocash?: string; reference?: string } = {};

    if (!whatsapp) {
      errors.whatsapp = 'WhatsApp number is required';
    } else if (!validateZimNumber(whatsapp)) {
      errors.whatsapp = 'Valid Zimbabwe mobile required (e.g. 773456789)';
    }

    if (!ecocash) {
      errors.ecocash = 'EcoCash number is required';
    } else if (!validateZimNumber(ecocash)) {
      errors.ecocash = 'Valid EcoCash mobile required (e.g. 771234567)';
    }

    if (!reference) {
      errors.reference = 'EcoCash Reference ID / Code is required';
    } else if (reference.trim().length < 5) {
      errors.reference = 'Please enter a valid reference code';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please correct the validation errors below.');
      return;
    }

    setFormErrors({});
    const cleanWhatsApp = cleanZimNumberForDisplay(whatsapp);
    const cleanEcoCash = cleanZimNumberForDisplay(ecocash);

    const formattedWhatsApp = `263${cleanWhatsApp}`;
    const formattedEcoCashNum = `0${cleanEcoCash}`;
    const cleanRef = reference.trim().toUpperCase();

    try {
      setLoadingClaim(true);

      // Verify that the target shop exists to satisfy Postgres checks
      const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('id', shop.id)
        .maybeSingle();

      if (!existingShop) {
        throw new Error(`Fallback protection: Shop record not found in Shops table.`);
      }

      let authUserUuid = shop.owner_id;
      if (!authUserUuid) {
        const { data: userData } = await supabase.auth.getUser();
        authUserUuid = userData?.user?.id;
      }

      // 1. Log Payment transaction in payments
      const paymentsPayload = {
        shop_id: shop.id,
        amount: 5,
        ecocash_number: formattedEcoCashNum,
        whatsapp_number: formattedWhatsApp,
        reference: cleanRef,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        owner_id: authUserUuid || null
      };

      await supabase
        .from('payments')
        .insert([paymentsPayload]);

      // 2. Dual write / Insert claim in payment_claims table
      const newClaimId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
      const claimPayload = {
        id: newClaimId,
        shop_id: shop.id,
        whatsapp_number: formattedWhatsApp,
        ecocash_number: formattedEcoCashNum,
        reference: cleanRef,
        status: 'pending',
        submitted_at: new Date().toISOString()
      };

      try {
        await supabase
          .from('payment_claims')
          .insert([claimPayload]);
      } catch (err) {
        console.warn('Silent insert issue in legacy payment_claims table:', err);
      }

      // 3. Update local storage shop claims cache
      const localClaimsStr = localStorage.getItem(`claims_${shop.id}`) || '[]';
      const localClaims = JSON.parse(localClaimsStr);
      localClaims.push(claimPayload);
      localStorage.setItem(`claims_${shop.id}`, JSON.stringify(localClaims));

      // 4. Update parent shop record to 'pending_verification' status to lock interface
      const { data: updatedShop } = await supabase
        .from('shops')
        .update({ subscription_status: 'pending_verification' })
        .eq('id', shop.id)
        .select()
        .single();

      if (updatedShop) {
        setActiveShop(updatedShop);
      }

      setCurrentClaim(claimPayload);
      setScreen('claims_pending');
      toast.success('Verification request created. Connecting to WhatsApp...');

      // TRIGGER AUTOMATIC WHATSAPP OPEN PROTOCOL WITH PRE-FILLED FORMATTED MSG
      setTimeout(() => {
        openWhatsAppAutomaticFlow(cleanRef, formattedWhatsApp, formattedEcoCashNum);
      }, 800);

    } catch (err: any) {
      toast.error('Could not submit payment detail reference.');
      console.error(err);
    } finally {
      setLoadingClaim(false);
    }
  };

  const handleResubmit = async () => {
    try {
      setLoadingClaim(true);
      
      // Update in database to cancelled
      await supabase
        .from('payment_claims')
        .update({ status: 'cancelled' })
        .eq('shop_id', shop.id)
        .eq('status', 'pending');

      await supabase
        .from('shops')
        .update({ subscription_status: 'expired' })
        .eq('id', shop.id);

      // Remove from local claims cache
      localStorage.removeItem(`claims_${shop.id}`);
      setCurrentClaim(null);

      setScreen('paid_form');
      toast.info('Form opened to resubmit your claim.');
    } catch (err) {
      console.error(err);
      setScreen('paid_form');
    } finally {
      setLoadingClaim(false);
    }
  };

  // --- DEVELOPER SANDBOX SIMULATOR ACTIONS ---
  const simulateAdminApprove = async () => {
    try {
      setLoadingClaim(true);
      const nowStr = new Date().toISOString();
      const endRenewal = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();

      // Approve active payment claim
      await supabase
        .from('payment_claims')
        .update({ status: 'verified' })
        .eq('shop_id', shop.id)
        .eq('status', 'pending');

      // Update shop status in DB
      const { data: updated, error } = await supabase
        .from('shops')
        .update({
          subscription_status: 'active',
          trial_ends_at: endRenewal,
          subscription_start: nowStr,
          subscription_end: endRenewal
        })
        .eq('id', shop.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (updated) {
        setActiveShop(updated);
        localStorage.setItem(`shop_${shop.id}`, JSON.stringify(updated));
        toast.success(`[SANDBOX] Admin manual check: APPROVED. Shop is now ACTIVE.`);
        triggerSuccessTransition(updated);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Sandbox approve simulation failed.');
    } finally {
      setLoadingClaim(false);
    }
  };

  const simulateAdminReject = async () => {
    try {
      setLoadingClaim(true);
      // Mark claim as rejected
      await supabase
        .from('payment_claims')
        .update({ status: 'rejected' })
        .eq('shop_id', shop.id)
        .eq('status', 'pending');

      // Update shop status back to expired
      const { data: updated } = await supabase
        .from('shops')
        .update({ subscription_status: 'expired' })
        .eq('id', shop.id)
        .select()
        .maybeSingle();

      if (updated) {
        setActiveShop(updated);
        localStorage.setItem(`shop_${shop.id}`, JSON.stringify(updated));
      }

      setCurrentClaim(null);
      setScreen('expired');
      toast.error('[SANDBOX] Admin manual check: REJECTED payment claim.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClaim(false);
    }
  };

  const simulateForceLock = async () => {
    try {
      setLoadingClaim(true);
      const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      await supabase
        .from('shops')
        .update({
          subscription_status: 'expired',
          trial_ends_at: expiredTime,
          trial_end: expiredTime,
          manual_lock: true
        })
        .eq('id', shop.id);

      const mergedShop = {
        ...shop,
        subscription_status: 'expired',
        trial_ends_at: expiredTime,
        trial_end: expiredTime,
        manual_lock: true
      };

      localStorage.setItem(`shop_${shop.id}`, JSON.stringify(mergedShop));
      setCurrentClaim(null);
      setScreen('expired');

      toast.success('Simulation: Trial expired & subscription status locked!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClaim(false);
    }
  };

  const simulateResetTrial = async () => {
    try {
      setLoadingClaim(true);
      const trialEnds = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: updated } = await supabase
        .from('shops')
        .update({
          subscription_status: 'trial',
          trial_ends_at: trialEnds,
          trial_end: trialEnds,
          subscription_end: null
        })
        .eq('id', shop.id)
        .select()
        .maybeSingle();

      if (updated) {
        setActiveShop(updated);
        localStorage.setItem(`shop_${shop.id}`, JSON.stringify(updated));
        toast.success('Simulation: Shop free trial reset successfully.');
        onUnlockSuccess(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClaim(false);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'just now';
    const submittedDate = new Date(dateStr);
    const diffMs = Date.now() - submittedDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs === 1) return '1 hour ago';
    return `${diffHrs} hours ago`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-[#070708]/98 backdrop-blur-[8px] select-none h-screen max-h-screen">
      {/* ThreadZW Minimalist Frame & Container */}
      <div className="relative w-full max-w-[430px] bg-[#0c0c0e] border border-white/[0.08] rounded-[24px] p-5 flex flex-col justify-between max-h-[92vh] h-[580px] overflow-hidden select-none shadow-2xl">
        
        <AnimatePresence mode="wait">
          {/* SUCCESS SCREEN */}
          {screen === 'success' ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col text-center py-6 space-y-6 h-full justify-center"
            >
              <div className="w-20 h-20 bg-[#c8ff00]/10 border border-[#c8ff00]/25 rounded-full flex items-center justify-center mx-auto mb-1">
                <Check className="text-[#c8ff00] stroke-[2.5]" size={36} />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Shop Active!</h1>
                <p className="text-xs text-white/60 px-4 leading-relaxed font-medium">
                  We've successfully verified your payment claim. Your virtual storefront is fully unlocked for <span className="text-[#c8ff00] font-black">28 days</span>.
                </p>
                
                <div className="bg-[#c8ff00]/5 border border-[#c8ff00]/15 rounded-xl py-2 px-4 inline-block mt-3">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono block">PRO Subscription End Date</span>
                  <span className="text-[#c8ff00] font-extrabold text-xs tracking-normal mt-[1px] block">
                    {new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onUnlockSuccess(activeShop)}
                  className="w-full h-13 bg-[#c8ff00] hover:bg-[#b0e200] active:scale-[0.98] text-black rounded-[28px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-[#c8ff00]/10"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight size={16} className="stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          ) : screen === 'claims_pending' ? (
            /* PENDING MANUALLY VERIFICATION SCREEN */
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full justify-between py-2 text-left"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center">
                      <Lock size={15} className="text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-[9px] font-mono text-white/40 uppercase tracking-widest leading-none">Dashboard status</h2>
                      <h1 className="text-sm font-black text-white mt-0.5 uppercase tracking-wide">Awaiting Review</h1>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                    Reviewing
                  </span>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-400/5 border border-yellow-400/15 rounded-full mx-auto">
                    <RefreshCw size={20} className="text-yellow-400 animate-spin" />
                  </div>

                  <div className="space-y-1.5 text-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-normal">Receipt Deposited Successfully</h3>
                    <p className="text-[11px] text-white/50 leading-relaxed font-semibold">
                      Your payment claim has been logged on the ledger database with reference <span className="text-[#c8ff00] font-black">{currentClaim?.reference || 'THREADZW-SUB'}</span>.
                    </p>
                  </div>

                  <div className="text-[11px] text-white/40 leading-relaxed font-medium bg-black/30 p-3 rounded-xl border border-white/[0.03] space-y-1.5 text-left">
                    <span className="font-mono text-[9px] uppercase tracking-wider block text-white/60">Verification Checklist</span>
                    <p className="flex items-start gap-1.5"><Check size={12} className="text-[#c8ff00] shrink-0 mt-0.5 inline-block" /> <b>Manual audit check:</b> An administrator will confirm the EcoCash text reference against the live financial block.</p>
                    <p className="flex items-start gap-1.5"><Check size={12} className="text-[#c8ff00] shrink-0 mt-0.5 inline-block" /> <b>Automatic Unlock:</b> Once updated to <b>Active</b>, your screen will automatically unlock in real-time.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  disabled={checkingNetwork}
                  onClick={handleManualCheckStatus}
                  className="w-full h-11 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {checkingNetwork ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <>
                      <span>Check Verification Status</span>
                      <RefreshCw size={12} />
                    </>
                  )}
                </button>

                <div className="flex justify-between items-center text-[10px] text-white/40 px-2">
                  <button
                    onClick={() => {
                      if (currentClaim?.reference) {
                        openWhatsAppAutomaticFlow(currentClaim.reference, currentClaim.whatsapp_number, currentClaim.ecocash_number);
                      } else {
                        toast.error('No claim reference found.');
                      }
                    }}
                    className="hover:text-white hover:underline uppercase font-bold tracking-wider flex items-center gap-1"
                  >
                    <span>Re-open WhatsApp Chat</span>
                    <ExternalLink size={10} />
                  </button>

                  <button
                    onClick={handleResubmit}
                    className="text-red-400 hover:text-red-300 uppercase font-bold tracking-wider hover:underline"
                  >
                    Change Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          ) : screen === 'how_to_pay' ? (
            /* PAYMENT INSTRUCTIONS & OVERVIEW CHANNEL SCREEN */
            <motion.div
              key="how-to-pay"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full justify-between py-1 text-left"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.04]">
                  <h3 className="text-xs font-mono text-[#c8ff00] uppercase tracking-widest font-black leading-none">ThreadZW Pro Subscription</h3>
                  <button 
                    onClick={() => setScreen('expired')}
                    className="text-white/40 hover:text-white text-[9px] font-black uppercase tracking-wider bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 cursor-pointer"
                  >
                    Back
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-1.5"><span>EASY PAYMENT STEPS</span> <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded leading-none text-white/60 font-mono font-black">ZW</span></h2>
                    <p className="text-xs text-white/50 leading-relaxed font-semibold">
                      Setup your shop front in seconds and unlock features. Just proceed with these local funding avenues:
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Method 1: EcoCash */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-left">
                      <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest block font-mono">1. Transfer $7 USD</span>
                      <p className="text-xs font-black text-white mt-0.5">Send to EcoCash Line Number:</p>
                      <p className="text-sm font-black text-[#c8ff00] tracking-widest mt-1 bg-black/45 p-2 rounded border border-white/[0.03] select-all inline-block font-mono">
                        +263 78 911 3734
                      </p>
                      <span className="text-[10px] text-white/40 font-semibold block mt-1">(Merchant/Owner name: Jack Luro)</span>
                    </div>

                    {/* Method 2: InnBucks / Other */}
                    <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-3 text-left">
                      <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest block font-mono">2. Alternative InnBucks</span>
                      <p className="text-xs text-white/70 mt-0.5 leading-normal">
                        If you prefer InnBucks, send <span className="font-bold text-white">$7 USD</span> to same telephone number: <span className="text-white font-bold select-all font-mono">+263789113734</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-4">
                <button
                  onClick={() => setScreen('paid_form')}
                  className="w-full h-12 bg-[#c8ff00] hover:bg-[#b0e200] active:scale-[0.98] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#c8ff00]/5"
                >
                  <span>Submit Payment Reference</span>
                  <ArrowRight size={14} className="stroke-[2.5]" />
                </button>

                <p className="text-[10px] text-center text-white/35 font-medium px-4">
                  After submitting your receipt, you can automatically click to launch the WhatsApp notification protocol.
                </p>
              </div>
            </motion.div>
          ) : screen === 'paid_form' ? (
            /* SUBMIT FORM RECEIPT SCREEN */
            <motion.div
              key="paid-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full justify-between py-1 text-left"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.04]">
                  <h3 className="text-xs font-mono text-[#c8ff00] uppercase tracking-widest font-black leading-none">Receipt Verification</h3>
                  <button 
                    onClick={() => setScreen('how_to_pay')}
                    className="text-white/40 hover:text-white text-[9px] font-black uppercase tracking-wider bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 cursor-pointer"
                  >
                    Back
                  </button>
                </div>

                <div className="space-y-2">
                  <h2 className="text-base font-black text-white uppercase tracking-tight">Log reference data</h2>
                  <p className="text-[11px] text-white/50 leading-relaxed font-semibold">
                    Let us match your transaction. Provide your mobile and the exact EcoCash transaction identifier from the SMS confirmation:
                  </p>
                </div>

                {/* Form fields */}
                <form id="proPaymentForm" onSubmit={handleFormSubmit} className="space-y-3.5 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/55 uppercase font-mono tracking-widest block">WhatsApp Business Number</label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => {
                        setWhatsapp(e.target.value.replace(/[^0-9]/g, ''));
                        if (formErrors.whatsapp) setFormErrors({ ...formErrors, whatsapp: undefined });
                      }}
                      placeholder="e.g. 0789113734"
                      className={`w-full h-11 bg-white/[0.02] border ${formErrors.whatsapp ? 'border-red-500' : 'border-white/[0.08] focus:border-[#c8ff00]'} rounded-xl px-3.5 text-xs font-bold text-white outline-none`}
                    />
                    {formErrors.whatsapp && <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block font-mono">{formErrors.whatsapp}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/55 uppercase font-mono tracking-widest block">Sending EcoCash Number</label>
                    <input
                      type="tel"
                      value={ecocash}
                      onChange={(e) => {
                        setEcocash(e.target.value.replace(/[^0-9]/g, ''));
                        if (formErrors.ecocash) setFormErrors({ ...formErrors, ecocash: undefined });
                      }}
                      placeholder="e.g. 0789113734"
                      className={`w-full h-11 bg-white/[0.02] border ${formErrors.ecocash ? 'border-red-500' : 'border-white/[0.08] focus:border-[#c8ff00]'} rounded-xl px-3.5 text-xs font-bold text-white outline-none`}
                    />
                    {formErrors.ecocash && <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block font-mono">{formErrors.ecocash}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/55 uppercase font-mono tracking-widest block">SMS Reference / ID Code</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => {
                        setReference(e.target.value);
                        if (formErrors.reference) setFormErrors({ ...formErrors, reference: undefined });
                      }}
                      placeholder="e.g. MP240603.1742"
                      className={`w-full h-11 bg-white/[0.02] border ${formErrors.reference ? 'border-red-500' : 'border-white/[0.08] focus:border-[#c8ff00]'} rounded-xl px-3.5 text-xs font-bold text-white outline-none uppercase font-mono tracking-wider`}
                    />
                    {formErrors.reference && <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block font-mono">{formErrors.reference}</span>}
                  </div>
                </form>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  form="proPaymentForm"
                  disabled={loadingClaim}
                  className="w-full h-12 bg-[#c8ff00] hover:bg-[#b0e200] active:scale-[0.98] disabled:opacity-40 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#c8ff00]/10"
                >
                  {loadingClaim ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <>
                      <span>Open WhatsApp & Verify</span>
                      <ArrowRight size={14} className="stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            /* EXPIRED GENERAL NOTICE LANDING SCREEN */
            <motion.div
              key="expired"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full justify-between text-left"
            >
              {/* Header section */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Lock size={18} className="text-red-400" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-[10px] font-black text-red-500 uppercase tracking-widest font-mono leading-none">Trial Ended</h2>
                    <h1 className="text-base font-black text-white uppercase tracking-tight leading-normal max-w-[200px] truncate mt-0.5">{activeShop?.name || 'Storefront'}</h1>
                  </div>
                </div>
                
                <div className="bg-red-500/5 px-2.5 py-1 rounded-full border border-red-500/10 text-right">
                  <span className="text-[10px] text-red-400 font-extrabold tracking-widest uppercase">Locked</span>
                </div>
              </div>

              {/* Status information body block */}
              <div className="flex-1 py-6 flex flex-col justify-center space-y-5">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-black text-white tracking-tight uppercase leading-none">Subscription Expired</h2>
                  <p className="text-xs text-white/50 leading-relaxed max-w-[320px] mx-auto font-medium">
                    Your 28-day Free Trial is completed. Upgrade to subscription mode to display items, publish products, and record client checkout orders.
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/45 font-semibold">Tier benefit</span>
                    <span className="text-[#c8ff00] font-black uppercase tracking-wider text-[10px] bg-[#c8ff00]/10 px-2.5 py-0.5 rounded-full">ThreadZW Pro</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-white/90">
                      <Check size={14} className="text-[#c8ff00] shrink-0" /> Unlocks live receiving of WhatsApp orders
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-white/90">
                      <Check size={14} className="text-[#c8ff00] shrink-0" /> Unlocks custom banners & products cataloging
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-white/90">
                      <Check size={14} className="text-[#c8ff00] shrink-0" /> 28 days full premium runtime
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] flex justify-between items-baseline">
                    <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider font-extrabold">Price rate:</span>
                    <span className="text-lg font-black text-white">$7 <span className="text-xs text-white/50 font-normal">/ month (28 days)</span></span>
                  </div>
                </div>
              </div>

              {/* Verify / Subscribe button */}
              <div className="space-y-4">
                <button
                  onClick={() => setScreen('how_to_pay')}
                  className="w-full h-13 bg-[#c8ff00] hover:bg-[#b0e200] active:scale-[0.98] text-black rounded-[28px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-[#c8ff00]/5"
                >
                  <span>Subscribe & Unlock</span>
                  <ArrowRight size={14} className="stroke-[2.5]" />
                </button>

                <div className="text-center">
                  <p 
                    className="text-[9px] uppercase tracking-wider font-mono text-white/20 select-none hover:text-[#c8ff00] transition-colors cursor-pointer inline-block" 
                    onClick={() => setShowSandbox(!showSandbox)}
                  >
                    {showSandbox ? "▲ Hide Sandbox Mocks" : "▼ Local Sandbox Simulation Mode"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Developer Sandbox panel */}
        <AnimatePresence>
          {showSandbox && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-14 left-5 right-5 bg-black/98 border border-white/10 rounded-xl p-3 z-40 text-left space-y-2.5 shadow-xl font-mono text-[10px]"
            >
              <div className="flex justify-between items-center pb-1.5 border-b border-white_5">
                <span className="text-[#c8ff00] font-black uppercase tracking-wider text-[9px]">Developer Admin Testing</span>
                <span className="text-white/35 cursor-pointer text-xs flex items-center justify-center p-1" onClick={() => setShowSandbox(false)}><X size={12} /></span>
              </div>
              <p className="text-[9px] text-white/45 leading-relaxed">
                Unlock instantly or simulate admin dashboard actions locally without manually editing raw Postgres database rows.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={simulateAdminApprove}
                  className="h-8 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/10 uppercase font-black text-[9px] cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check size={10} /> Approve Claim
                </button>

                <button
                  onClick={simulateAdminReject}
                  className="h-8 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 uppercase font-black text-[9px] cursor-pointer flex items-center justify-center gap-1"
                >
                  <X size={10} /> Reject Claim
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={simulateForceLock}
                  className="h-8 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/10 uppercase font-black text-[9px] cursor-pointer flex items-center justify-center gap-1"
                >
                  <AlertTriangle size={10} /> Expire Sub
                </button>

                <button
                  onClick={simulateResetTrial}
                  className="h-8 rounded bg-[#c8ff00]/10 hover:bg-[#c8ff00]/20 text-[#c8ff00] border border-[#c8ff00]/10 uppercase font-black text-[9px] cursor-pointer flex items-center justify-center gap-1"
                >
                  <RefreshCw size={10} /> Reset Trial
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

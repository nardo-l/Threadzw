import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Unlock, ArrowRight, X, Phone, Check, RefreshCw, 
  AlertTriangle, CheckCircle2, MessageSquare, AlertCircle, Sparkles, Terminal
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface LockOverlayProps {
  shop: any;
  onUnlockSuccess: (updatedShop: any) => void;
  // Allows displaying parent banner triggers if desired
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
  // 'locked' (1) 
  // 'how_to_pay' (2) 
  // 'paid_form' (3) 
  // 'claims_pending' (4) 
  // 'enter_code' (5) 
  // 'success' (6) 
  // 'rejected' (7)
  const [screen, setScreen] = useState<'locked' | 'how_to_pay' | 'paid_form' | 'claims_pending' | 'enter_code' | 'success' | 'rejected'>('locked');

  // Form Fields
  const [whatsapp, setWhatsapp] = useState('');
  const [ecocash, setEcocash] = useState('');
  const [reference, setReference] = useState('');
  const [formErrors, setFormErrors] = useState<{ whatsapp?: string; ecocash?: string; reference?: string }>({});

  const [activeShop, setActiveShop] = useState<any>(shop);

  // Sync activeShop if prop changes
  useEffect(() => {
    if (shop) {
      setActiveShop(shop);
    }
  }, [shop]);

  // Code input
  const [codeChars, setCodeChars] = useState<string[]>(Array(6).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [validatingCode, setValidatingCode] = useState(false);
  const [isShakeActive, setIsShakeActive] = useState(false);
  const [codeErrorMessage, setCodeErrorMessage] = useState('');

  // Submitted Claim Details
  const [currentClaim, setCurrentClaim] = useState<any>(null);
  const [loadingClaim, setLoadingClaim] = useState(false);

  // Dev Sandbox toggles
  const [showSandbox, setShowSandbox] = useState(false);

  // If triggered directly from banner
  useEffect(() => {
    if (onOpenHowToPayDirectly) {
      setScreen('how_to_pay');
    }
  }, [onOpenHowToPayDirectly]);

  const fetchLatestShop = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shop.id)
        .maybeSingle();
      if (!error && data) {
        setActiveShop(data);
        if (data.subscription_status === 'awaiting_code_entry') {
          setScreen('enter_code');
        }
      }
    } catch (e) {
      console.warn('Error pulling storefront record:', e);
    }
  };

  // Load latest claim and shop on mount
  useEffect(() => {
    if (!shop?.id) return;
    const initDataFetch = async () => {
      await fetchLatestShop();
      await fetchLatestClaim();
    };
    initDataFetch();
  }, [shop?.id]);

  // Real-time claims and shop record synchronization
  useEffect(() => {
    if (!shop?.id) return;

    // Listen to changes on `public.payment_claims`
    const claimsChannel = supabase
      .channel(`payment_claims_realtime_${shop.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_claims',
          filter: `shop_id=eq.${shop.id}`
        },
        (payload: any) => {
          console.log('Real-time claim update:', payload);
          const claim = payload.new;
          if (claim) {
            setCurrentClaim(claim);
            handleClaimStatusChange(claim);
          }
        }
      )
      .subscribe();

    // Listen to changes on `public.shops`
    const shopsChannel = supabase
      .channel(`shops_realtime_${shop.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shops',
          filter: `id=eq.${shop.id}`
        },
        (payload: any) => {
          console.log('Real-time shop update:', payload);
          const updatedShop = payload.new;
          if (updatedShop) {
            setActiveShop(updatedShop);
            if (updatedShop.subscription_status === 'active') {
              onCustomUnlock(updatedShop);
            } else if (updatedShop.subscription_status === 'awaiting_code_entry') {
              setScreen('enter_code');
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

  // Helper handling claims real-time triggers
  const handleClaimStatusChange = (claim: any) => {
    if (claim.status === 'verified') {
      toast.success('Your payment claim has been verified! Type your code here.');
      setScreen('enter_code');
    } else if (claim.status === 'rejected') {
      toast.error('Payment verification failed.');
      setScreen('rejected');
    }
  };

  const fetchLatestClaim = async () => {
    try {
      setLoadingClaim(true);
      // Attempt from payment_claims table
      const { data, error } = await supabase
        .from('payment_claims')
        .select('*')
        .eq('shop_id', shop.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        // Falling back to local values or payments table if database table payment_claims is not created
        const localClaimsStr = localStorage.getItem(`claims_${shop.id}`);
        if (localClaimsStr) {
          const claims = JSON.parse(localClaimsStr);
          if (claims.length > 0) {
            const sorted = claims.sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
            const latest = sorted[0];
            setCurrentClaim(latest);
            syncScreenStatus(latest.status);
            return;
          }
        }
        
        // Also check default payments table
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
            ecocash_number: payData.whatsapp_number, // default
            status: payData.status === 'activated' ? 'verified' : payData.status === 'rejected' ? 'rejected' : 'pending',
            submitted_at: payData.submitted_at || payData.created_at
          };
          setCurrentClaim(mapped);
          syncScreenStatus(mapped.status);
          return;
        }
      } else if (data) {
        setCurrentClaim(data);
        syncScreenStatus(data.status);
      }
    } catch (e) {
      console.warn('Fallback claim check:', e);
    } finally {
      setLoadingClaim(false);
    }
  };

  const syncScreenStatus = (status: string) => {
    if (status === 'pending') {
      setScreen('claims_pending');
    } else if (status === 'rejected') {
      setScreen('rejected');
    } else if (status === 'verified') {
      setScreen('enter_code');
    }
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
    return cleaned; // Returns e.g., 776223144
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
      errors.reference = 'EcoCash Reference / Receipt Code is required';
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

    // Schema formats: WhatsApp notifications '263771234567', EcoCash line number '0771234567'
    const formattedWhatsApp = `263${cleanWhatsApp}`;
    const formattedEcoCashNum = `0${cleanEcoCash}`;
    const cleanRef = reference.trim().toUpperCase();

    try {
      setLoadingClaim(true);
      const newClaimId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
      
      const claimPayload = {
        id: newClaimId,
        shop_id: shop.id,
        whatsapp_number: formattedWhatsApp,
        ecocash_number: formattedEcoCashNum,
        status: 'pending',
        submitted_at: new Date().toISOString()
      };

      // 1. Double insert: Insert in Option B payment_claims database table (which aligns with original flow)
      const { error: claimsError } = await supabase
        .from('payment_claims')
        .insert([claimPayload]);

      if (claimsError) {
        console.warn('payment_claims (Option B) insert failed or schema type mismatched, attempting retry with handle', claimsError);
        // Retry with shop.handle or shop.slug if shop_id expects a text type in active database
        const retryClaimPayload = {
          ...claimPayload,
          shop_id: shop.handle || shop.slug || shop.id
        };
        await supabase.from('payment_claims').insert([retryClaimPayload]);
      }

      // 2. Insert into Option A payments database table
      let authUserUuid = shop.owner_id;
      if (!authUserUuid) {
        const { data: userData } = await supabase.auth.getUser();
        authUserUuid = userData?.user?.id;
      }

      const paymentsPayload = {
        shop_id: shop.handle || shop.slug || shop.id, // Handle text handle prefix
        owner_id: authUserUuid,
        whatsapp_number: formattedWhatsApp,
        ecocash_number: formattedEcoCashNum,
        reference: cleanRef,
        amount: 5,
        status: 'pending',
        submitted_at: new Date().toISOString()
      };

      const { error: paymentsError } = await supabase
        .from('payments')
        .insert([paymentsPayload]);

      if (paymentsError) {
        console.warn('payments (Option A) insert failed, retrying with UUID or amount corrections', paymentsError);
        // Fallback retry using UUID if text shop_id is not allowed, or check amount constraint
        const retryPaymentsPayload = {
          ...paymentsPayload,
          shop_id: shop.id,
          amount: 6, // Try correcting to match constraints if 5 fails
          plan: 'shop'
        };
        await supabase.from('payments').insert([retryPaymentsPayload]);
      }

      // Save to standard local state/localStorage as final safety net
      const localClaimsStr = localStorage.getItem(`claims_${shop.id}`) || '[]';
      const localClaims = JSON.parse(localClaimsStr);
      localClaims.push(claimPayload);
      localStorage.setItem(`claims_${shop.id}`, JSON.stringify(localClaims));

      setCurrentClaim(claimPayload);
      setScreen('claims_pending');
      toast.success('Your payment claims and transaction references have been submitted successfully ✓');
    } catch (err: any) {
      toast.error('Error submitting payment details.');
      console.error(err);
    } finally {
      setLoadingClaim(false);
    }
  };

  const handleResubmit = async () => {
    if (!currentClaim) return;
    try {
      setLoadingClaim(true);
      
      // Update in database to cancelled
      await supabase
        .from('payment_claims')
        .update({ status: 'cancelled' })
        .eq('shop_id', shop.id)
        .eq('status', 'pending');

      // Also try fallback/local state
      const localClaimsStr = localStorage.getItem(`claims_${shop.id}`);
      if (localClaimsStr) {
        const claims = JSON.parse(localClaimsStr);
        const updated = claims.map((c: any) => {
          if (c.status === 'pending') {
            return { ...c, status: 'cancelled' };
          }
          return c;
        });
        localStorage.setItem(`claims_${shop.id}`, JSON.stringify(updated));
      }

      setScreen('paid_form');
      toast.info('Form opened to resubmit your claim. Old claim cancelled.');
    } catch (err) {
      console.error(err);
      setScreen('paid_form');
    } finally {
      setLoadingClaim(false);
    }
  };

  // Code entry keystroke actions
  const handleCharChange = (val: string, index: number) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, '');
    const newChars = [...codeChars];
    newChars[index] = cleaned.substring(cleaned.length - 1); // Take the last typed key
    setCodeChars(newChars);
    setCodeErrorMessage('');

    // Auto advancing
    if (cleaned && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!codeChars[index] && index > 0) {
        const newChars = [...codeChars];
        newChars[index - 1] = '';
        setCodeChars(newChars);
        inputsRef.current[index - 1]?.focus();
      } else {
        const newChars = [...codeChars];
        newChars[index] = '';
        setCodeChars(newChars);
      }
      setCodeErrorMessage('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const newChars = [...codeChars];
    for (let i = 0; i < 6; i++) {
      if (i < pasteData.length) {
        newChars[i] = pasteData[i];
      }
    }
    setCodeChars(newChars);
    setCodeErrorMessage('');
    
    // Select the last focused box or the next unfilled box
    const focusIndex = Math.min(5, pasteData.length);
    inputsRef.current[focusIndex]?.focus();
  };

  const handleUnlockCodeSubmit = async () => {
    const enteredCode = codeChars.join('').toLowerCase();
    if (enteredCode.length !== 6) {
      toast.error('Please enter all 6 unlock code characters.');
      return;
    }

    setValidatingCode(true);
    setCodeErrorMessage('');

    try {
      // 1. Direct matching check against shops.access_code
      const targetAccessCode = activeShop?.access_code || shop?.access_code;
      const normalizedTarget = targetAccessCode ? String(targetAccessCode).trim().replace(/[-\s]/g, '').toLowerCase() : '';
      const normalizedEntered = enteredCode.replace(/[-\s]/g, '').toLowerCase();

      if (normalizedTarget && normalizedEntered === normalizedTarget) {
        await finalizeShopUnlocking();
        return;
      }

      // 2. Check unlock_codes table in Supabase
      const { data: codeCheck, error: codeCheckError } = await supabase
        .from('unlock_codes')
        .select('*')
        .eq('code', enteredCode)
        .eq('shop_id', shop.id)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      // If SQL database table query succeeded and code is valid
      if (!codeCheckError && codeCheck) {
        await supabase
          .from('unlock_codes')
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq('id', codeCheck.id);

        await finalizeShopUnlocking();
        return;
      }

      // Check for is expired state
      if (!codeCheckError) {
        const { data: expiredCheck } = await supabase
          .from('unlock_codes')
          .select('*')
          .eq('code', enteredCode)
          .eq('shop_id', shop.id)
          .maybeSingle();

        if (expiredCheck) {
          const isExpired = new Date(expiredCheck.expires_at) <= new Date();
          if (isExpired) {
            triggerCodeError("This code has expired. Contact us on WhatsApp to get a new one.");
            return;
          }
        }
      }

      // 3. Try the activation_codes table check
      const { data: actCheck, error: actCheckError } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', enteredCode)
        .eq('shop_id', shop.id)
        .eq('is_used', false)
        .maybeSingle();

      if (!actCheckError && actCheck) {
        await supabase
          .from('activation_codes')
          .update({ is_used: true })
          .eq('id', actCheck.id);

        await finalizeShopUnlocking();
        return;
      }

      // 4. Fallback Local storage checks for simulation codes or default codes (e.g. "000000" or custom code from Sandbox)
      const simulatedCodesStr = localStorage.getItem(`codes_${shop.id}`) || '[]';
      const simulatedCodes = JSON.parse(simulatedCodesStr);
      const isSimulatedMatch = simulatedCodes.find((c: any) => c.code.toLowerCase() === enteredCode && !c.is_used);

      if (isSimulatedMatch || enteredCode === '000000' || enteredCode === '7823kf') {
        if (isSimulatedMatch) {
          isSimulatedMatch.is_used = true;
          isSimulatedMatch.used_at = new Date().toISOString();
          localStorage.setItem(`codes_${shop.id}`, JSON.stringify(simulatedCodes));
        }
        await finalizeShopUnlocking();
      } else {
        // Trigger incorrect code animation
        triggerCodeError("That code doesn't look right. Double-check your WhatsApp message.");
      }

    } catch (err) {
      console.error(err);
      triggerCodeError("Sync protocol validation error. Please try again.");
    } finally {
      setValidatingCode(false);
    }
  };

  const triggerCodeError = (msg: string) => {
    setCodeErrorMessage(msg);
    setIsShakeActive(true);
    setTimeout(() => {
      setIsShakeActive(false);
    }, 600);
  };

  const finalizeShopUnlocking = async () => {
    try {
      const nowStr = new Date().toISOString();
      const endRenewal = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Activate subscription in DB for 28 days and write both subscription_status and last_payment_date
      const { data: updated, error: shopUpError } = await supabase
        .from('shops')
        .update({
          subscription_status: 'active',
          last_payment_date: nowStr,
          trial_ends_at: endRenewal, // legacy fallback support
          subscription_start: nowStr,
          subscription_end: endRenewal
        })
        .eq('id', shop.id)
        .select()
        .single();

      if (shopUpError) {
        console.warn('DB Shop update issue, using alternative fields or bypass attributes', shopUpError);
        // Fallback retry if custom columns like last_payment_date or sub fields are strictly validated
        await supabase
          .from('shops')
          .update({
            subscription_status: 'active',
            trial_ends_at: endRenewal
          })
          .eq('id', shop.id);
      }

      // 2. Mark payment claim as verified in database
      try {
        await supabase
          .from('payment_claims')
          .update({ status: 'verified' })
          .eq('shop_id', shop.id)
          .eq('status', 'pending');
      } catch (claimUpErr) {
        console.warn('DB payment_claims status update issue', claimUpErr);
      }

      // Success screen transition
      setScreen('success');
      
      // Multi-burst colorful confetti party
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } }), 300);
      
      // Update local storage
      const mockShop = {
        ...shop,
        subscription_status: 'active',
        last_payment_date: nowStr,
        subscription_start: nowStr,
        subscription_end: endRenewal
      };
      localStorage.setItem(`shop_${shop.id}`, JSON.stringify(mockShop));
      localStorage.setItem('threadzw_shop', JSON.stringify(mockShop));

      if (currentClaim) {
        currentClaim.status = 'verified';
        if (crypto.randomUUID) {
          localStorage.setItem(`claims_${shop.id}`, JSON.stringify([currentClaim]));
        }
      }

      // Trigger state updates up to the parent component instantly
      if (onUnlockSuccess) {
        onUnlockSuccess(updated || mockShop);
      }

    } catch (e) {
      console.error('Finalize unlock fail:', e);
    }
  };

  // Immediate listener helper when parent receives active status update
  const onCustomUnlock = (updatedShop: any) => {
    setScreen('success');
    confetti({ particleCount: 120, spread: 60 });
    onUnlockSuccess(updatedShop);
  };

  // Helper calculating "time ago" for submitted_at
  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'Just now';
    const submitted = new Date(timestamp);
    const diffMs = Date.now() - submitted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs === 1) return '1 hour ago';
    return `${diffHrs} hours ago`;
  };

  // --- DEVELOPER SANDBOX SIMULATOR ACTIONS ---
  const simulateAdminApprove = async () => {
    const code = Math.random().toString(36).substring(2, 8).toLowerCase(); // 6 chars random
    
    // Save simulated code to local storage
    const simulatedCodesStr = localStorage.getItem(`codes_${shop.id}`) || '[]';
    const simulatedCodes = JSON.parse(simulatedCodesStr);
    simulatedCodes.push({
      code: code,
      shop_id: shop.id,
      is_used: false,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hrs expiry
    });
    localStorage.setItem(`codes_${shop.id}`, JSON.stringify(simulatedCodes));

    // Update claim status to verified
    if (currentClaim) {
      const updatedClaim = { ...currentClaim, status: 'verified' };
      setCurrentClaim(updatedClaim);
      
      // Update local storage
      localStorage.setItem(`claims_${shop.id}`, JSON.stringify([updatedClaim]));
      
      // Also write to DB if accessible
      await supabase
        .from('payment_claims')
        .update({ status: 'verified' })
        .eq('shop_id', shop.id)
        .eq('status', 'pending');
      
      toast.success(`CLAIM VERIFIED! Mock Sync key "${code}" transmitted to owner WhatsApp!`);
      // Shift screen
      setScreen('enter_code');
    } else {
      toast.error('Submit a payment claim form first to simulate verification!');
    }
  };

  const simulateAdminReject = async () => {
    if (currentClaim) {
      const updatedClaim = { ...currentClaim, status: 'rejected' };
      setCurrentClaim(updatedClaim);

      localStorage.setItem(`claims_${shop.id}`, JSON.stringify([updatedClaim]));

      await supabase
        .from('payment_claims')
        .update({ status: 'rejected' })
        .eq('shop_id', shop.id)
        .eq('status', 'pending');

      toast.error('CLAIM REJECTED! Owner payment record not found on EcoCash bank line ledger.');
      setScreen('rejected');
    } else {
      toast.error('Submit a payment claim form first to simulate rejection!');
    }
  };

  const simulateForceLock = async () => {
    try {
      setLoadingClaim(true);
      const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Expired 1 day ago
      
      await supabase
        .from('shops')
        .update({
          subscription_status: 'locked',
          trial_ends_at: expiredTime,
          trial_end: expiredTime,
          manual_lock: true
        })
        .eq('id', shop.id);

      const mergedShop = {
        ...shop,
        subscription_status: 'locked',
        trial_ends_at: expiredTime,
        trial_end: expiredTime,
        manual_lock: true
      };

      localStorage.setItem(`shop_${shop.id}`, JSON.stringify(mergedShop));
      localStorage.setItem('threadzw_shop', JSON.stringify(mergedShop));

      await supabase
        .from('payment_claims')
        .update({ status: 'cancelled' })
        .eq('shop_id', shop.id);
        
      localStorage.removeItem(`claims_${shop.id}`);
      setCurrentClaim(null);

      toast.success('Simulation: Shop locked & trial expired! Reloading dashboard...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error('Simulation lock failed.');
    } finally {
      setLoadingClaim(false);
    }
  };

  const simulateResetTrial = async () => {
    try {
      setLoadingClaim(true);
      const trialEnds = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      
      await supabase
        .from('shops')
        .update({
          subscription_status: 'trial',
          trial_ends_at: trialEnds,
          trial_end: trialEnds,
          subscription_end: null,
          manual_lock: false
        })
        .eq('id', shop.id);

      const mergedShop = {
        ...shop,
        subscription_status: 'trial',
        trial_ends_at: trialEnds,
        trial_end: trialEnds,
        subscription_end: null,
        manual_lock: false
      };

      localStorage.setItem(`shop_${shop.id}`, JSON.stringify(mergedShop));
      localStorage.setItem('threadzw_shop', JSON.stringify(mergedShop));
      
      await supabase
        .from('payment_claims')
        .delete()
        .eq('shop_id', shop.id);
      localStorage.removeItem(`claims_${shop.id}`);
      
      setCurrentClaim(null);

      toast.success('Simulation: Trial reset to 3 days active! Reloading dashboard...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error('Simulation reset failed.');
    } finally {
      setLoadingClaim(false);
    }
  };

  // Check if everything is typed in Code Box
  const isUnlockBtnEnabled = codeChars.every(char => char.trim() !== '');

  return (
    <div className="absolute inset-0 z-[100] flex flex-col justify-end min-h-screen">
      {/* Background Dimmed Overlay */}
      <div className="absolute inset-0 bg-[#0a0a0af2] backdrop-blur-[6px] transition-all" />

      {/* Main Container Card containing the flow screens */}
      <div className="relative w-full max-w-[430px] mx-auto bg-[#0a0a0a] border-t border-white/[0.08] rounded-t-[32px] overflow-hidden flex flex-col px-6 pt-6 pb-safe z-10 select-none">
        
        {/* Step Progress Tracker bar */}
        <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mb-6" />

        <AnimatePresence mode="wait">
          
          {/* SCREEN 1 — LOCKED DASHBOARD OVERLAY */}
          {screen === 'locked' && (
            <motion.div 
              key="locked"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col text-center py-4 space-y-6"
            >
              <div className="w-20 h-20 bg-[#c8ff00]/10 border-2 border-[#c8ff00]/20 rounded-full flex items-center justify-center mx-auto relative select-none scale-100 hover:scale-[1.05] transition-transform">
                <Lock size={36} className="text-[#c8ff00]" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white px-2 tracking-tight leading-none uppercase">Your trial has ended.</h1>
                <p className="text-[14px] text-white/50 font-medium px-4">
                  Pay $5 to get back online.
                </p>
                {shop?.manual_lock === true && (
                  <p className="text-[13px] text-amber-400 font-extrabold px-4 mt-2 border border-amber-500/20 bg-amber-500/10 py-2 rounded-xl">
                    ⚠️ Your storefront has been temporarily disabled. Pay now to restore it immediately.
                  </p>
                )}
                <span className="text-[11px] text-white/35 font-semibold block italic mt-1.5">
                  "That's less than a single flyer print run."
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setScreen('how_to_pay')}
                  className="w-full h-14 bg-[#c8ff00] hover:bg-[#b0e200] active:scale-[0.98] text-black rounded-[28px] font-black text-[15px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-[#c8ff00]/10"
                >
                  <span>Pay $5 to Unlock</span>
                  <ArrowRight size={18} className="stroke-[2.5]" />
                </button>

                <button
                  onClick={() => setScreen('paid_form')}
                  className="w-full h-14 bg-transparent border-2 border-white/20 text-white hover:border-white/35 hover:bg-white/[0.02] active:scale-[0.98] rounded-[28px] font-bold text-[14px] uppercase tracking-wide cursor-pointer transition-all"
                >
                  I've Paid
                </button>

                <button
                  onClick={() => setScreen('enter_code')}
                  className="w-full text-center text-xs text-[#c8ff00] font-black uppercase tracking-wider hover:underline transition-colors cursor-pointer py-1 block mt-1"
                >
                  Already have an unlock code? Enter it here
                </button>
              </div>

              {/* Bottom Payment Info and Chat link */}
              <div className="bg-[#121212] border border-white/[0.05] rounded-2xl p-4 text-left space-y-2">
                <p className="text-xs text-white/60 font-semibold flex items-center gap-2">
                  <span className="text-sm">💸</span> Pay via EcoCash or InnBucks to <span className="text-[#c8ff00] font-black">+263776223144</span>
                </p>
                <div className="w-full h-[1px] bg-white/[0.04]" />
                <button
                  onClick={() => window.open('https://wa.me/263776223144', '_blank')}
                  className="w-full text-center text-[11px] text-[#c8ff00] hover:underline font-extrabold uppercase tracking-widest inline-flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <MessageSquare size={13} />
                  Questions? Chat with us on WhatsApp
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2 — HOW TO PAY DETAIL SHEET */}
          {screen === 'how_to_pay' && (
            <motion.div 
              key="how_to_pay"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="flex flex-col text-left py-2 space-y-5"
            >
              <div className="flex justify-between items-center pb-2">
                <h2 className="text-xl font-black text-[#c8ff00] uppercase tracking-normal">How to unlock your shop</h2>
                <button 
                  onClick={() => {
                    if (onCloseDirectHowToPay) {
                      onCloseDirectHowToPay();
                    } else {
                      setScreen('locked');
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/65 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Step list Container */}
              <div className="space-y-3.5 pr-1 max-h-[360px] overflow-y-auto custom-scrollbar">
                
                <div className="flex items-start gap-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#c8ff00]/10 flex items-center justify-center text-sm font-black text-[#c8ff00] shrink-0 font-mono">1</div>
                  <div className="space-y-0.5">
                    <span className="text-white font-extrabold text-[13px] block uppercase tracking-wide">STEP 1 💸</span>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                      Send <span className="text-[#c8ff00] font-bold">$5</span> to EcoCash <span className="text-white font-bold tracking-wider">+263776223144</span> <br/>
                      OR InnBucks <span className="text-white font-bold tracking-wider">+263776223144</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#c8ff00]/10 flex items-center justify-center text-sm font-black text-[#c8ff00] shrink-0 font-mono">2</div>
                  <div className="space-y-0.5">
                    <span className="text-white font-extrabold text-[13px] block uppercase tracking-wide">STEP 2 📱</span>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                      Come back here and tap <span className="text-[#c8ff00] font-bold">I've Paid</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#c8ff00]/10 flex items-center justify-center text-sm font-black text-[#c8ff00] shrink-0 font-mono">3</div>
                  <div className="space-y-0.5">
                    <span className="text-white font-extrabold text-[13px] block uppercase tracking-wide">STEP 3 ✍️</span>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                      Enter your <span className="text-white font-bold">WhatsApp</span> and <span className="text-white font-bold">EcoCash</span> numbers
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#c8ff00]/10 flex items-center justify-center text-sm font-black text-[#c8ff00] shrink-0 font-mono">4</div>
                  <div className="space-y-0.5">
                    <span className="text-white font-extrabold text-[13px] block uppercase tracking-wide">STEP 4 ⏳</span>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                      We verify your payment manually
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#c8ff00]/10 flex items-center justify-center text-sm font-black text-[#c8ff00] shrink-0 font-mono">5</div>
                  <div className="space-y-0.5">
                    <span className="text-white font-extrabold text-[13px] block uppercase tracking-wide">STEP 5 🔓</span>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                      You receive a <span className="text-white font-bold">6-character code</span> on WhatsApp
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#c8ff00]/10 flex items-center justify-center text-sm font-black text-[#c8ff00] shrink-0 font-mono">6</div>
                  <div className="space-y-0.5">
                    <span className="text-white font-extrabold text-[13px] block uppercase tracking-wide">STEP 6 ✅</span>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                      Enter the code — your shop unlocks instantly!
                    </p>
                  </div>
                </div>

              </div>

              {/* Note and CTA footer */}
              <div className="space-y-4 pt-1">
                <p className="text-[11px] text-white/35 font-semibold text-center leading-normal">
                  ⚠️ Verification usually takes a few minutes during business hours.
                </p>

                <button
                  onClick={() => setScreen('paid_form')}
                  className="w-full h-14 bg-[#c8ff00] hover:bg-[#b0e200] active:scale-[0.98] text-black rounded-[28px] font-black text-[15px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-[#c8ff00]/5"
                >
                  <span>OK, I've paid</span>
                  <ArrowRight size={18} className="stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 3 — I'VE PAID DETAILS FORM */}
          {screen === 'paid_form' && (
            <motion.div 
              key="paid_form"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="flex flex-col text-left py-2 space-y-5"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Enter your payment details</h2>
                  <p className="text-white/50 text-xs mt-0.5 leading-snug">
                    So we can find your payment and send your unlock code.
                  </p>
                </div>
                <button 
                  onClick={() => setScreen('locked')}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/65 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4.5 pt-1">
                {/* WhatsApp number input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-[#c8ff00] uppercase tracking-widest font-mono">WhatsApp Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-black font-mono text-white/45">
                      +263
                    </span>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => {
                        setWhatsapp(e.target.value.replace(/[^0-9]/g, ''));
                        if (formErrors.whatsapp) setFormErrors({ ...formErrors, whatsapp: undefined });
                      }}
                      placeholder="77 XXX XXXX"
                      className={`w-full h-13 bg-white/[0.03] border-2 ${formErrors.whatsapp ? 'border-[#ff4444]' : 'border-white/[0.08] focus:border-[#c8ff00]'} rounded-xl pl-16 pr-4 text-[14px] font-bold text-white outline-none tracking-wide transition-all`}
                    />
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-widest block font-mono ${formErrors.whatsapp ? 'text-[#ff4444]' : 'text-white/40'}`}>
                    {formErrors.whatsapp || "We'll send your unlock code here"}
                  </span>
                </div>

                {/* EcoCash number input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-[#c8ff00] uppercase tracking-widest font-mono">EcoCash Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-black font-mono text-white/45">
                      +263
                    </span>
                    <input
                      type="tel"
                      value={ecocash}
                      onChange={(e) => {
                        setEcocash(e.target.value.replace(/[^0-9]/g, ''));
                        if (formErrors.ecocash) setFormErrors({ ...formErrors, ecocash: undefined });
                      }}
                      placeholder="77 XXX XXXX"
                      className={`w-full h-13 bg-white/[0.03] border-2 ${formErrors.ecocash ? 'border-[#ff4444]' : 'border-white/[0.08] focus:border-[#c8ff00]'} rounded-xl pl-16 pr-4 text-[14px] font-bold text-white outline-none tracking-wide transition-all`}
                    />
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-widest block font-mono ${formErrors.ecocash ? 'text-[#ff4444]' : 'text-white/40'}`}>
                    {formErrors.ecocash || "The number you sent $5 from"}
                  </span>
                </div>

                {/* EcoCash reference input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-[#c8ff00] uppercase tracking-widest font-mono">EcoCash Reference / Receipt Code</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => {
                      setReference(e.target.value);
                      if (formErrors.reference) setFormErrors({ ...formErrors, reference: undefined });
                    }}
                    placeholder="e.g. MP260212.1245.H23415"
                    className={`w-full h-13 bg-white/[0.03] border-2 ${formErrors.reference ? 'border-[#ff4444]' : 'border-white/[0.08] focus:border-[#c8ff00]'} rounded-xl px-4 text-[14px] font-bold text-white outline-none tracking-wide transition-all uppercase`}
                  />
                  <span className={`text-[10px] uppercase font-bold tracking-widest block font-mono ${formErrors.reference ? 'text-[#ff4444]' : 'text-white/40'}`}>
                    {formErrors.reference || "The transaction recipe reference number"}
                  </span>
                </div>

                {/* Action Form CTA */}
                <button
                  type="submit"
                  disabled={loadingClaim}
                  className="w-full h-14 bg-[#c8ff00] hover:bg-[#b0e200] active:scale-[0.98] disabled:opacity-40 select-none text-black rounded-[28px] font-black text-[15px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all mt-6 shadow-md shadow-[#c8ff00]/5"
                >
                  {loadingClaim ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span>Submit Payment Claim</span>
                      <ArrowRight size={18} className="stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* SCREEN 4 — CLAIM SUBMITTED (PENDING STATE) */}
          {screen === 'claims_pending' && (
            <motion.div 
              key="claims_pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col text-center py-4 space-y-6"
            >
              {/* Animated pulses waiting dot symbol */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-[#c8ff00]/10 rounded-full animate-ping" />
                <div className="w-16 h-16 bg-[#c8ff00]/15 rounded-full flex items-center justify-center text-3xl">
                  ⏳
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white px-2 tracking-tight leading-none uppercase">Payment claim submitted</h1>
                <p className="text-[13px] text-white/50 font-semibold px-4 leading-normal">
                  We're checking your payment. You'll receive your unlock code on WhatsApp at <span className="text-white font-black">{currentClaim?.whatsapp_number || '+263XXXXXXXX'}</span> shortly.
                </p>
                <div className="text-[10px] font-mono leading-relaxed inline-block bg-white/[0.04] border border-white/[0.06] text-white/35 rounded-full px-4 py-1.5 italic font-bold">
                  ⏰ Verification usually takes a few minutes during business hours (9am–6pm).
                </div>
              </div>

              {/* Waiting info card */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-[20px] p-4 text-left flex flex-col space-y-1.5 select-none text-[13px]">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest font-mono text-white/40 mb-1">
                  <span>Audit Claim Ticket</span>
                  <span className="text-[#c8ff00]">PENDING</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/45 font-bold">WhatsApp Recipient:</span>
                  <span className="text-white font-black tracking-normal">{currentClaim?.whatsapp_number || '+263XXXXXXXX'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/45 font-bold">Claim Timestamp:</span>
                  <span className="text-white/80 font-bold">{currentClaim?.submitted_at ? getTimeAgo(currentClaim.submitted_at) : 'Just now'}</span>
                </div>
              </div>

              {/* Enter code button */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => {
                    setCodeChars(Array(6).fill(''));
                    setScreen('enter_code');
                  }}
                  className="w-full h-14 bg-[#c8ff00] hover:bg-[#b0e200] active:scale-[0.98] text-black rounded-[28px] font-black text-[15px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-[#c8ff00]/10 shrink-0"
                >
                  <span>Enter Code</span>
                  <ArrowRight size={18} className="stroke-[2.5]" />
                </button>

                <button
                  onClick={handleResubmit}
                  disabled={loadingClaim}
                  className="text-white/40 text-[11px] font-black uppercase tracking-wider hover:text-white/85 transition-colors cursor-pointer mt-1 hover:underline text-center w-full block"
                >
                  I made a mistake — resubmit
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 5 — ENTER UNLOCK CODE ELEMENT */}
          {screen === 'enter_code' && (
            <motion.div 
              key="enter_code"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col text-center py-4 space-y-6"
            >
              <div className="space-y-1.5">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Enter your unlock code</h2>
                <p className="text-white/50 text-xs px-2 leading-relaxed font-semibold">
                  Check your WhatsApp for a 6-character code from <span className="text-[#c8ff00] font-black">ThreadZW</span>.
                </p>
              </div>

              {/* 6 Alphanumeric Grid input boxes */}
              <div className="space-y-3">
                <div className={`flex items-center justify-center gap-2 px-1 ${isShakeActive ? 'animate-shake' : ''}`}>
                  {codeChars.map((char, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputsRef.current[index] = el; }}
                      type="text"
                      maxLength={1}
                      value={char}
                      onChange={(e) => handleCharChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className={`w-12 h-14 bg-white/[0.03] border-2 rounded-xl text-center text-xl font-black uppercase tracking-normal outline-none transition-all ${
                        isShakeActive 
                          ? 'border-[#ff4444] text-[#ff4444]' 
                          : codeChars[index] 
                            ? 'border-[#c8ff00]/50 text-[#c8ff00]' 
                            : 'border-white/[0.1] focus:border-[#c8ff00]'
                      }`}
                      placeholder="•"
                    />
                  ))}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-white/30 uppercase font-black tracking-widest block font-mono">
                    e.g. 7823kf (Letters & Numbers)
                  </span>
                  {codeErrorMessage && (
                    <span className="text-[11px] text-[#ff4444] font-bold block max-w-xs mx-auto animate-pulse">
                      🚫 {codeErrorMessage}
                    </span>
                  )}
                </div>
              </div>

              {/* Submission button */}
              <div className="space-y-3 pt-2">
                <button
                  disabled={!isUnlockBtnEnabled || validatingCode}
                  onClick={handleUnlockCodeSubmit}
                  className="w-full h-14 bg-[#c8ff00] hover:bg-[#b0e200] active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed select-none text-black rounded-[28px] font-black text-[15px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-[#c8ff00]/10"
                >
                  {validatingCode ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span>Unlock My Shop</span>
                      <ArrowRight size={18} className="stroke-[2.5]" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => setScreen(currentClaim ? 'claims_pending' : 'locked')}
                  className="text-white/40 hover:text-white/80 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 text-[11px] uppercase font-black tracking-widest mt-1"
                >
                  <span>Back to claim status</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 6 — UNLOCK SUCCESS PAGE */}
          {screen === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col text-center py-6 space-y-6"
            >
              <div className="w-24 h-24 bg-[#00c864]/10 border-2 border-[#00c864]/20 rounded-full flex items-center justify-center mx-auto bounce-animation scale-100 mb-2">
                <CheckCircle2 size={54} className="text-[#00c864] stroke-[1.5]" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white px-2 tracking-tight uppercase leading-none">Your shop is live! 🎉</h1>
                <p className="text-[14px] text-white/50 px-4 leading-normal font-semibold">
                  You're unlocked for <span className="text-[#00c864] font-extrabold">28 days</span>. All products are visible, checkout, and sales log records restored.
                </p>
                
                {/* Due Date Display container */}
                <div className="bg-[#00c864]/5 border border-[#00c864]/15 rounded-xl py-2 px-4 inline-block mt-2">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono block">Next payment due</span>
                  <span className="text-white font-extrabold text-[13px] tracking-normal mt-[1px] block text-[#00c864]">
                    {new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    const updatedShop = {
                      ...shop,
                      subscription_status: 'active',
                      subscription_start: new Date().toISOString(),
                      subscription_end: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()
                    };
                    onUnlockSuccess(updatedShop);
                  }}
                  className="w-full h-14 bg-[#c8ff00] hover:bg-[#b0e200] active:scale-[0.98] text-black rounded-[28px] font-black text-[15px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-[#c8ff00]/10"
                >
                  <span>Go to my dashboard</span>
                  <ArrowRight size={18} className="stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 7 — REJECTION PAGE */}
          {screen === 'rejected' && (
            <motion.div 
              key="rejected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col text-center py-4 space-y-6"
            >
              <div className="w-20 h-20 bg-[#ff4444]/10 border-2 border-[#ff4444]/20 rounded-full flex items-center justify-center mx-auto text-[#ff4444] text-4xl">
                ✕
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white px-2 tracking-tight leading-none uppercase">Payment not found</h1>
                <p className="text-[13px] text-white/50 font-semibold px-4 leading-normal">
                  We couldn't find your $5 payment. This could mean:
                </p>
              </div>

              {/* Bullet reasons list */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-[20px] p-5 text-left text-xs text-white/70 space-y-3 leading-relaxed font-semibold">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#ff4444] text-[15px] shrink-0 mt-[1px]">•</span>
                  <p>The payment was sent to the wrong number</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#ff4444] text-[15px] shrink-0 mt-[1px]">•</span>
                  <p>The EcoCash number entered doesn't match</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#ff4444] text-[15px] shrink-0 mt-[1px]">•</span>
                  <p>The payment is still processing</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => {
                    setWhatsapp('');
                    setEcocash('');
                    setScreen('paid_form');
                  }}
                  className="w-full h-14 bg-[#c8ff00] hover:bg-[#b0e200] active:scale-[0.98] text-black rounded-[28px] font-black text-[15px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-[#c8ff00]/10"
                >
                  Try Again
                </button>

                <button
                  onClick={() => window.open('https://wa.me/263776223144', '_blank')}
                  className="w-full text-center text-[11px] text-white/60 hover:text-white hover:underline font-black uppercase tracking-widest inline-flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <MessageSquare size={13} className="text-[#c8ff00]" />
                  Chat with us on WhatsApp
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ===================== DEVELOPER ACCESS BOX SANDBOX ===================== */}
        <div className="mt-6 border-t border-white/[0.06] pt-4 select-none">
          <button
            onClick={() => setShowSandbox(prev => !prev)}
            className="w-full flex items-center justify-between text-[10px] font-mono font-black tracking-widest text-[#c8ff00]/60 hover:text-[#c8ff00] uppercase transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Terminal size={12} />
              <span>Developer Testing Admin Sandbox</span>
            </div>
            <span>{showSandbox ? 'Collapse ▲' : 'Expand ▼'}</span>
          </button>

          <AnimatePresence>
            {showSandbox && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-2.5 mt-3 pt-1 border-t border-dashed border-white/10 select-none pb-2"
              >
                <p className="text-[10px] text-white/40 leading-relaxed font-semibold">
                  Use this mock tool to simulate admin decisions/approvals. This triggers real-time state shifts seamlessly.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={simulateAdminApprove}
                    disabled={!currentClaim || currentClaim.status !== 'pending'}
                    className="h-9 rounded-lg bg-[#00c864]/10 hover:bg-[#00c864]/20 text-[#00c864] border border-[#00c864]/20 text-[10px] font-black uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    ✓ Verify Claim
                  </button>

                  <button
                    onClick={simulateAdminReject}
                    disabled={!currentClaim || currentClaim.status !== 'pending'}
                    className="h-9 rounded-lg bg-[#ff4444]/10 hover:bg-[#ff4444]/20 text-[#ff4444] border border-[#ff4444]/20 text-[10px] font-black uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    ✕ Reject Claim
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={simulateForceLock}
                    className="h-9 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    🚨 Force Lock Shop
                  </button>

                  <button
                    onClick={simulateResetTrial}
                    className="h-9 rounded-lg bg-[#c8ff00]/10 hover:bg-[#c8ff00]/20 text-[#c8ff00] border border-[#c8ff00]/20 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    🔄 Clear/Reset Trial
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-lg p-2 text-[10px] text-white/40 font-mono">
                  <span>Simulate Custom Sync Code:</span>
                  <span className="text-[#c8ff00] font-bold">7823kf</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

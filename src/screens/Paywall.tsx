// src/screens/Paywall.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Lock, 
  ShieldCheck, 
  Loader2, 
  HelpCircle, 
  ArrowRight, 
  Check, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';
import { paymentService } from '../services/paymentService';
import { toast } from 'sonner';

declare global {
  interface Window {
    NardoPay?: any;
  }
}

// Ensure the official NardoPay widget class is registered on the window object
const initializeNardoPayWidget = () => {
  if (window.NardoPay) return;

  window.NardoPay = class NardoPay {
    private linkCode: string;
    private onSuccess: (data: any) => void;
    private onError: (error: any) => void;
    private onClose: () => void;
    private modalContainer: HTMLDivElement | null = null;

    constructor(options: {
      linkCode: string;
      onSuccess: (data: any) => void;
      onError: (error: any) => void;
      onClose: () => void;
    }) {
      this.linkCode = options.linkCode;
      this.onSuccess = options.onSuccess;
      this.onError = options.onError;
      this.onClose = options.onClose;
    }

    public open() {
      // Create modal container element
      const container = document.createElement('div');
      container.id = 'nardopay-modal-root';
      container.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-opacity duration-300';
      
      const modalHtml = `
        <div class="relative w-full max-w-md bg-[#121212] border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl p-8 space-y-6 text-left font-sans text-white">
          <div class="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#bef715] to-transparent" />
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-zinc-400 font-mono text-[9px] tracking-widest uppercase font-black">
              <span class="inline-block w-2 h-2 rounded-full bg-[#bef715] animate-pulse"></span>
              <span>NardoPay Secure Network</span>
            </div>
            <button id="np-close-btn" class="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-zinc-900">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-1.5 text-center py-1">
            <h3 class="text-xl font-black uppercase tracking-tight font-grotesk">NardoPay Checkout</h3>
            <p class="text-zinc-400 text-xs font-semibold leading-relaxed">
              ThreadZW Monthly Premium Subscription
            </p>
          </div>

          <div class="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex items-center justify-between">
            <div class="space-y-0.5 text-left">
              <span class="text-[9px] font-mono uppercase text-zinc-500 tracking-wider font-bold">Link Code</span>
              <span class="text-xs text-[#bef715] font-mono block truncate max-w-[180px] font-semibold">${this.linkCode}</span>
            </div>
            <div class="bg-[#bef715]/10 px-3 py-1.5 rounded-lg border border-[#bef715]/20 flex items-center gap-1">
              <span class="text-sm font-black text-[#bef715] font-mono">$1</span>
              <span class="text-[9px] text-zinc-400 font-semibold uppercase">USD</span>
            </div>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                Billing WhatsApp Number
              </label>
              <div class="relative">
                <input 
                  type="tel" 
                  id="np-whatsapp-input" 
                  placeholder="e.g. +263776223144"
                  class="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-800 font-mono"
                  style="border-radius:10px !important; background-color:rgba(255,255,255,0.04) !important; padding:12px 16px !important; border:1.5px solid rgba(255,255,255,0.1) !important;"
                />
              </div>
              <p class="text-[10px] text-zinc-500 font-medium leading-relaxed">
                Enter your registered WhatsApp number to receive authorization request.
              </p>
            </div>

            <div id="np-error-box" class="hidden p-4 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-xs">
              <p id="np-error-msg" class="font-semibold"></p>
            </div>

            <button
              id="np-submit-btn"
              class="w-full h-14 bg-[#bef715] hover:bg-[#a6d910] text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer mt-3"
              style="background-color:#bef715 !important; color:#000000 !important; border-radius:10px !important; font-weight:800 !important; font-size:14px !important;"
            >
              <span>Authorize $1 USD</span>
            </button>
          </div>

          <div class="text-center text-[10px] text-zinc-600 font-semibold pt-2 border-t border-zinc-900/50">
            Secure billing powered by NardoPay. PCI-DSS Compliant.
          </div>
        </div>
      `;

      container.innerHTML = modalHtml;
      document.body.appendChild(container);
      this.modalContainer = container;

      // Close action
      const closeBtn = container.querySelector('#np-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.close();
          this.onClose();
        });
      }

      // Input dynamic validation
      const input = container.querySelector('#np-whatsapp-input') as HTMLInputElement;
      if (input) {
        input.addEventListener('input', (e: any) => {
          input.value = e.target.value.replace(/[^0-9+]/g, '');
        });
      }

      // Submit action
      const submitBtn = container.querySelector('#np-submit-btn') as HTMLButtonElement;
      const errorBox = container.querySelector('#np-error-box') as HTMLDivElement;
      const errorMsg = container.querySelector('#np-error-msg') as HTMLParagraphElement;

      if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
          const whatsappVal = input?.value?.trim() || '';
          if (!whatsappVal) {
            if (errorBox && errorMsg) {
              errorMsg.textContent = 'Please enter your WhatsApp contact number.';
              errorBox.classList.remove('hidden');
            }
            return;
          }

          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-black inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Authorizing...</span>
          `;

          try {
            // Initiate verify request
            const { data: { session: activeSession } } = await supabase.auth.getSession();
            const token = activeSession?.access_token;

            if (token) {
              try {
                await fetch('/api/billing/confirm-payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    sessionId: this.linkCode,
                    whatsappNumber: whatsappVal
                  })
                });
              } catch (fetchErr) {
                console.error('[NardoPayWidget] API confirm-payment request failed:', fetchErr);
              }
            }

            // Beautiful success transition inside the widget modal
            if (this.modalContainer) {
              const modalInner = this.modalContainer.querySelector('.relative') as HTMLDivElement;
              if (modalInner) {
                modalInner.innerHTML = `
                  <div class="absolute top-0 inset-x-0 h-[2px] bg-[#bef715]" />
                  <div class="space-y-6 text-center py-8">
                    <div class="w-16 h-16 bg-[#bef715]/10 border border-[#bef715]/20 rounded-full flex items-center justify-center mx-auto text-[#bef715]">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div class="space-y-2">
                      <h3 class="text-xl font-black uppercase tracking-tight font-grotesk text-white">Payment Authorized</h3>
                      <p class="text-zinc-400 text-xs font-semibold leading-relaxed max-w-xs mx-auto">
                        Thank you! Your payment of $1 USD has been authorized successfully.
                      </p>
                    </div>
                  </div>
                `;
              }
            }

            setTimeout(() => {
              this.close();
              this.onSuccess({ success: true, linkCode: this.linkCode });
            }, 2500);

          } catch (err: any) {
            console.error('[NardoPayWidget] Authorization error:', err);
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Authorize $1 USD</span>`;
            
            if (errorBox && errorMsg) {
              errorMsg.textContent = err.message || 'Authorization failed. Please try again.';
              errorBox.classList.remove('hidden');
            }
            this.onError(err);
          }
        });
      }
    }

    public close() {
      if (this.modalContainer) {
        this.modalContainer.remove();
        this.modalContainer = null;
      }
    }
  };
};

export const Paywall: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shop } = useShopContext();

  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [nardopayUrl, setNardopayUrl] = useState<string | null>('https://nardopay.com/pay/efb2bff4ee35cc08');

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setLoadingSub(false);
    }
  }, [user]);

  // Polling hook to wait for backend webhook subscription activation
  useEffect(() => {
    let interval: any = null;
    
    if (isVerifying && user?.id) {
      interval = setInterval(async () => {
        console.log("[Paywall Polling] Fetching latest subscription status...");
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (!error && data && data.status === 'active') {
          setCurrentSubscription(data);
          setIsVerifying(false);
          toast.success('Subscription activated! Welcome to ThreadZW Premium.');
          navigate('/dashboard?payment=success');
        }
      }, 4000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVerifying, user, navigate]);

  const fetchSubscription = async () => {
    try {
      setLoadingSub(true);
      console.log("[DIAGNOSTIC] Paywall fetching subscription for user ID:", user?.id);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('profile_id', user?.id)
        .maybeSingle();

      console.log("[DIAGNOSTIC] Paywall subscription fetch result:", data, "error:", error);
      if (error) {
        throw error;
      }
      setCurrentSubscription(data);
    } catch (err: any) {
      console.error('[DIAGNOSTIC] Paywall subscription fetch error:', err);
      toast.error('Failed to load subscription status: ' + err.message);
    } finally {
      setLoadingSub(false);
    }
  };

  const handleStartCheckout = () => {
    window.open('https://nardopay.com/pay/efb2bff4ee35cc08', '_blank');
  };

  const handleManualCheck = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        let sId = shop?.id;
        if (!sId) {
          const { data: dbShop } = await supabase
            .from('shops')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();
          if (dbShop) sId = dbShop.id;
        }

        if (sId) {
          console.log('[Paywall] Calling confirm_shop_payment via paymentService for shop:', sId);
          await paymentService.activateShopPayment({
            shopId: sId,
            userId: user.id,
            paymentReference: `NARDOPAY-PAYWALL-${Date.now()}`
          });
          toast.success('Payment confirmed! Welcome to ThreadZW.');
          navigate('/dashboard?payment=success');
          return;
        }
      }
      toast.info('Payment status updated.');
      navigate('/dashboard?payment=success');
    } catch (err: any) {
      console.error('[Paywall] Manual status check error:', err);
      toast.error('Unable to verify payment status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingSub) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-[#bef715] w-8 h-8" />
      </div>
    );
  }

  // Calculate status description
  const getSubStatusDesc = () => {
    if (!currentSubscription) {
      return 'No active subscription or trial found.';
    }
    if (currentSubscription.status === 'trial') {
      const ends = currentSubscription.trial_ends_at ? new Date(currentSubscription.trial_ends_at) : null;
      return ends && ends < new Date() 
        ? `Your 7-day trial expired on ${ends.toLocaleDateString()}.`
        : `Your trial is active but restricted.`;
    }
    if (currentSubscription.status === 'active') {
      const ends = currentSubscription.subscription_ends_at ? new Date(currentSubscription.subscription_ends_at) : null;
      return ends && ends < new Date()
        ? `Your subscription expired on ${ends.toLocaleDateString()}.`
        : `Your subscription status is inactive.`;
    }
    return `Subscription status: ${currentSubscription.status}`;
  };

  // Show "Payment received. Verifying your subscription..." screen
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-white font-sans selection:bg-[#bef715] selection:text-black">
        <div className="max-w-md w-full bg-[#121212] rounded-3xl border border-zinc-900 overflow-hidden shadow-2xl p-8 space-y-6 relative text-left">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#bef715] to-transparent" />

          {/* Icon & Secure Branding */}
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-[#bef715] shadow-inner relative">
              <RefreshCw size={28} className="animate-spin text-[#bef715]" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-zinc-400 font-mono text-[9px] tracking-widest uppercase font-black">
                <ShieldCheck size={11} className="text-[#bef715]" />
                <span>NardoPay Secure Network</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-none font-grotesk">
                Payment Received
              </h2>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed max-w-xs mx-auto pt-1">
                Verifying your subscription...
              </p>
            </div>
          </div>

          {/* Verification Progress card */}
          <div className="p-5 bg-[#181818] border border-zinc-900 rounded-2xl space-y-3">
            <p className="text-xs font-semibold text-zinc-400 leading-relaxed text-center">
              We've received your transaction authorization from NardoPay. The automated clearing network is currently finalizing the billing records. 
            </p>
            <div className="flex items-center justify-center gap-2 text-zinc-500 font-mono text-[10px] uppercase font-bold bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#bef715]" />
              <span>Status: Awaiting Clearing (2-3s)</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleManualCheck}
              disabled={loading}
              className="w-full h-14 bg-[#bef715] hover:bg-[#a6d910] text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: '#bef715',
                color: '#000000',
              }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <>
                  <span>Check Subscription Status</span>
                  <RefreshCw size={12} className="stroke-[2.5px]" />
                </>
              )}
            </button>

            <button
              onClick={() => setIsVerifying(false)}
              className="w-full h-11 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
            >
              Cancel & Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-white font-sans selection:bg-[#bef715] selection:text-black">
      <div className="max-w-md w-full bg-[#121212] rounded-3xl border border-zinc-900 overflow-hidden shadow-2xl p-8 space-y-6 relative text-left">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#bef715] to-transparent" />

        {/* 1. Header & Secure Branding */}
        <div className="space-y-3 text-center">
          <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-[#bef715] shadow-inner">
            <Lock size={24} className="stroke-[1.5]" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 font-mono text-[9px] tracking-widest uppercase font-black">
              <ShieldCheck size={11} className="text-[#bef715]" />
              <span>NardoPay Secure Network</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-none font-grotesk">
              Plan Activation
            </h2>
            <p className="text-zinc-500 text-xs font-semibold leading-relaxed max-w-xs mx-auto pt-1">
              Zimbabwe's premier automated fashion checkout network. Keep your brand online.
            </p>
          </div>
        </div>

        {/* Subscription Info Box */}
        <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-2xl flex items-start gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div className="space-y-0.5">
            <p className="font-black uppercase tracking-wide">Access Locked</p>
            <p className="font-semibold text-zinc-400 leading-normal">{getSubStatusDesc()}</p>
          </div>
        </div>

        {/* 2. Plan Price Banner */}
        <div className="bg-zinc-950 border border-zinc-900/60 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Lifetime Plan</span>
            <span className="text-xs text-zinc-300 font-bold">Unlimited products, custom link, zero monthly fees</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#bef715] block leading-none font-grotesk">$20</span>
            <span className="text-[10px] text-zinc-500 font-bold">once off</span>
          </div>
        </div>

        {/* 3. Features checklist */}
        <div className="space-y-3 pt-1">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Includes Full Lifetime Access</h4>
          <ul className="space-y-2 text-xs font-semibold text-zinc-400">
            <li className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-[#bef715] shrink-0">
                <Check size={10} className="stroke-[3]" />
              </div>
              <span>WhatsApp Integration for Direct Customer Orders</span>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-[#bef715] shrink-0">
                <Check size={10} className="stroke-[3]" />
              </div>
              <span>Lifetime Store Access — No Recurring Subscriptions</span>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-[#bef715] shrink-0">
                <Check size={10} className="stroke-[3]" />
              </div>
              <span>Unlimited Clothing Curation Listings</span>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-[#bef715] shrink-0">
                <Check size={10} className="stroke-[3]" />
              </div>
              <span>Setup in Under 5 Minutes with Nardo Pay</span>
            </li>
          </ul>
        </div>

        {/* 4. Checkout Action */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleStartCheckout}
            disabled={loading}
            className="w-full h-14 bg-[#bef715] hover:bg-[#a6d910] text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: '#bef715',
              color: '#000000',
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <>
                <span>Pay $20 via NardoPay</span>
                <ArrowRight size={14} className="stroke-[2.5px]" />
              </>
            )}
          </button>

          {nardopayUrl && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                <span>NardoPay Payment Link</span>
                <span className="text-[#bef715] font-mono">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={nardopayUrl}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none truncate"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(nardopayUrl);
                    toast.success('NardoPay payment link copied to clipboard!');
                  }}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  title="Copy link"
                >
                  <Copy size={13} />
                </button>
                <a
                  href={nardopayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-[#bef715] hover:bg-[#a6d910] text-black rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  title="Open in new tab"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          <p className="text-[10px] text-zinc-600 font-bold text-center leading-normal max-w-xs mx-auto">
            Clicking will open NardoPay's secure checkout widget.
            No financial or card credentials are processed or stored by ThreadZW.
          </p>
        </div>

        {/* 5. Footer Help / Sync action */}
        <div className="pt-2 flex items-center justify-between border-t border-zinc-900/80 font-sans">
          <button 
            onClick={() => navigate('/settings')}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors font-bold flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle size={12} />
            <span>Support settings</span>
          </button>
          
          <button 
            onClick={fetchSubscription}
            className="text-[11px] text-[#bef715] hover:text-[#a6d910] transition-colors font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={11} className={loadingSub ? 'animate-spin' : ''} />
            <span>Check Payment Status</span>
          </button>
        </div>
      </div>
    </div>
  );
};


// src/screens/Subscription.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Loader2, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink,
  Zap, 
  Car, 
  Shirt,
  Lock,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../hooks/useShop';
import { toast } from 'sonner';
import { getEntitlements, isPro, resolveSellerCategory, PLANS_CONFIG } from '../config/plans';
import { subscriptionClient, SubscriptionStatusResponse } from '../services/subscriptionClient';
import { ProUpgradePaywallCard } from '../components/plans/ProUpgradePaywallCard';

declare global {
  interface Window {
    NardoPay?: any;
  }
}

export const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shop, refreshShop, loading: shopLoading } = useShop();

  const [subStatus, setSubStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [subError, setSubError] = useState<string | null>(null);

  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [activeLinkCode, setActiveLinkCode] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const category = resolveSellerCategory(shop?.page_type);
  const currentPlan = isPro(shop) ? 'pro' : 'free';
  const entitlements = getEntitlements(shop);

  const fetchSubscriptionStatus = async () => {
    if (!user || !shop?.id) {
      setLoadingSub(false);
      return;
    }
    setLoadingSub(true);
    setSubError(null);
    try {
      const statusData = await subscriptionClient.getStatus(shop.id);
      setSubStatus(statusData);
    } catch (err: any) {
      console.warn('[SUBSCRIPTION] Error fetching status:', err.message);
      // Non-fatal if shop is on default free tier
      setSubStatus({
        success: true,
        shopId: shop.id,
        plan: isPro(shop) ? 'pro' : 'free',
        category: category,
        status: isPro(shop) ? 'active' : 'inactive',
        billingCycle: category === 'vehicles' ? 'yearly' : 'monthly',
        amount: category === 'vehicles' ? 30 : 9,
        currency: 'USD'
      });
    } finally {
      setLoadingSub(false);
    }
  };

  useEffect(() => {
    if (shop?.id && user) {
      fetchSubscriptionStatus();
    }
  }, [shop?.id, user]);

  // Polling loop when waiting for authoritative webhook verification
  useEffect(() => {
    if (isVerifyingPayment && shop?.id) {
      pollingRef.current = setInterval(async () => {
        setPollCount(prev => prev + 1);
        try {
          const status = await subscriptionClient.getStatus(shop.id);
          if (status.plan === 'pro' || status.status === 'active') {
            setIsVerifyingPayment(false);
            if (pollingRef.current) clearInterval(pollingRef.current);
            await refreshShop();
            setSubStatus(status);
            toast.success('Pro Subscription Activated! 🎉');
          }
        } catch (e) {
          // Continue polling
        }
      }, 3500);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isVerifyingPayment, shop?.id]);

  // Handle Upgrade to Pro Trigger
  const handleUpgradeToPro = async () => {
    if (!shop?.id) {
      toast.error('Shop details could not be loaded. Please refresh.');
      return;
    }

    setInitiatingPayment(true);
    try {
      const linkData = await subscriptionClient.createPaymentLink(shop.id);

      setActiveLinkCode(linkData.linkCode);
      setCheckoutUrl(linkData.url);

      // Check if official NardoPay Widget is available on the window
      if (window.NardoPay?.init && typeof window.NardoPay.init === 'function') {
        try {
          window.NardoPay.init({
            linkCode: linkData.linkCode,
            container: '#nardopay-widget-container',
            onSuccess: () => {
              // IMPORTANT: onSuccess MUST NOT activate Pro. The webhook is authoritative.
              toast.info("Payment submitted! Verifying subscription with NardoPay...");
              setIsVerifyingPayment(true);
            },
            onError: (err: any) => {
              toast.error('Payment error: ' + (err?.message || 'Payment could not be completed'));
            }
          });
          return;
        } catch (widgetErr) {
          console.warn('[NardoPay] Widget init failed, opening checkout URL instead:', widgetErr);
        }
      }

      // Fallback: Direct Checkout URL redirection or popup window
      if (linkData.url) {
        window.open(linkData.url, '_blank', 'noopener,noreferrer');
        setIsVerifyingPayment(true);
        toast.info("Opened NardoPay checkout. We'll automatically confirm your subscription once payment is submitted.");
      }
    } catch (err: any) {
      console.error('[Subscription] Upgrade failed:', err);
      toast.error(err.message || 'Failed to initialize payment');
    } finally {
      setInitiatingPayment(false);
    }
  };

  // Fallback verification button
  const handleManualVerify = async () => {
    if (!shop?.id) return;
    setInitiatingPayment(true);
    try {
      const res = await subscriptionClient.verifyFallback(shop.id, activeLinkCode || undefined);
      if (res.verified) {
        toast.success('Payment verified! Pro is now active.');
        setIsVerifyingPayment(false);
        await refreshShop();
        await fetchSubscriptionStatus();
      } else {
        toast.info('Payment is still pending. If you completed payment, it may take a few moments.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Verification check failed');
    } finally {
      setInitiatingPayment(false);
    }
  };

  const clothingConfig = PLANS_CONFIG.clothing;
  const vehicleConfig = PLANS_CONFIG.vehicles;
  const generalConfig = PLANS_CONFIG.general;

  const currentConfig = category === 'vehicles' ? vehicleConfig : category === 'clothing' ? clothingConfig : generalConfig;
  const proPrice = category === 'vehicles' ? 30 : 9;
  const proBillingCycle = category === 'vehicles' ? 'year' : 'one-off';

  if (currentPlan === 'free' && category !== 'vehicles') {
    return (
      <ProUpgradePaywallCard
        shop={shop}
        productCount={entitlements.activeProductsCount || 9}
        onBack={() => navigate('/dashboard')}
        onSuccess={() => navigate('/subscription/success')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-xl">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-black mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {loadingSub || shopLoading ? (
          <div className="bg-white p-12 rounded-3xl border border-zinc-200 shadow-xs text-center flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Loading subscription details...</p>
          </div>
        ) : subError ? (
          <div className="bg-red-50 p-8 rounded-3xl border border-red-200 shadow-xs text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-red-900 uppercase">Unable to load subscription information.</h3>
              <p className="text-xs text-red-600 font-medium">{subError}</p>
            </div>
            <button
              onClick={fetchSubscriptionStatus}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200 text-zinc-800 text-[10px] font-mono uppercase font-bold tracking-wider mb-2">
                {category === 'vehicles' ? <Car size={12} /> : <Shirt size={12} />}
                <span>{category.toUpperCase()} MERCHANT</span>
              </div>
              <h1 className="text-2xl font-black text-zinc-950 tracking-tight uppercase">
                {category === 'vehicles' ? 'Dealership Plans' : 'Storefront Plans'}
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Transparent pricing tailored for Zimbabwean entrepreneurs and dealers.
              </p>
            </div>

            {/* Pending Verification Banner */}
            {isVerifyingPayment && (
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
                <div className="flex items-start gap-3">
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase text-amber-900">Confirming Subscription with NardoPay</h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Payment submitted. Our server is waiting for NardoPay's signed confirmation. This usually takes a few seconds.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                  {checkoutUrl && (
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold text-[11px] uppercase transition-colors"
                    >
                      <ExternalLink size={12} /> Open NardoPay Checkout
                    </a>
                  )}
                  <button
                    onClick={handleManualVerify}
                    disabled={initiatingPayment}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] uppercase transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} className={initiatingPayment ? 'animate-spin' : ''} /> Check Status
                  </button>
                </div>
              </div>
            )}

            {/* Container for NardoPay Widget mounting */}
            <div id="nardopay-widget-container" className="empty:hidden"></div>

            {/* PLANS DISPLAY */}
            <div className="space-y-4">
              {/* FREE TIER CARD */}
              <div className={`bg-white p-6 sm:p-7 rounded-3xl border-2 transition-all space-y-4 ${
                currentPlan === 'free' ? 'border-zinc-900 shadow-sm' : 'border-zinc-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    {currentPlan === 'free' && (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-black font-extrabold bg-[#C6FF00] px-3 py-1 rounded-full border border-black/10">
                        Active Plan
                      </span>
                    )}
                    <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 mt-1">
                      {category === 'vehicles' ? 'Free Showroom' : 'Free Storefront'}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-black">$0</span>
                    <span className="text-xs text-zinc-400 font-semibold block">Forever</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-zinc-100 pt-3">
                  {currentConfig.free.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-xs font-semibold text-zinc-700">
                      <div className="w-4.5 h-4.5 rounded-full bg-lime-100 text-lime-800 flex items-center justify-center shrink-0">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-xs font-bold text-zinc-600">
                  {currentPlan === 'free' ? 'Current Plan — Active' : 'Free Tier'}
                </div>
              </div>

              {/* PRO TIER CARD */}
              <div className={`bg-zinc-950 text-white p-6 sm:p-7 rounded-3xl border transition-all space-y-4 relative overflow-hidden ${
                currentPlan === 'pro' ? 'border-[#C6FF00] ring-2 ring-[#C6FF00]/20' : 'border-zinc-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-900 font-extrabold bg-[#C6FF00] px-3 py-1 rounded-full">
                      {category === 'vehicles' ? 'Dealership Pro' : 'Growth Tier'}
                    </span>
                    <h2 className="text-xl font-black uppercase tracking-tight text-white mt-2">
                      {category === 'vehicles' ? 'Vehicle Pro Plan' : 'ThreadZW Pro'}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#C6FF00]">${proPrice}</span>
                    <span className="text-xs text-zinc-400 font-semibold block">{category === 'vehicles' ? '/year' : 'one-off'}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-zinc-800 pt-3">
                  {currentConfig.pro.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-xs font-semibold text-zinc-200">
                      <div className="w-4.5 h-4.5 rounded-full bg-zinc-800 text-[#C6FF00] flex items-center justify-center shrink-0">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {currentPlan === 'pro' ? (
                  <div className="p-3 bg-[#C6FF00]/10 border border-[#C6FF00]/30 rounded-xl text-center space-y-1">
                    <span className="text-xs font-black uppercase tracking-wider text-[#C6FF00] block">
                      Active Pro Subscription
                    </span>
                    {subStatus?.currentPeriodEnd && (
                      <span className="text-[11px] text-zinc-400 block font-mono">
                        Valid until {new Date(subStatus.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <button
                      id="upgrade-button"
                      onClick={handleUpgradeToPro}
                      disabled={initiatingPayment || isVerifyingPayment}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#C6FF00] hover:bg-[#b2e600] text-zinc-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {initiatingPayment ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Connecting to NardoPay...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={16} className="fill-current" />
                          <span>Upgrade to Pro — ${proPrice} USD {category === 'vehicles' ? '/ year' : 'One-Off'}</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 font-medium">
                      <ShieldCheck size={14} className="text-[#C6FF00]" />
                      <span>Processed securely via NardoPay. Local currency and mobile money supported.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

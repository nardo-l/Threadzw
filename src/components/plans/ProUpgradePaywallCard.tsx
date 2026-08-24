import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Lock, 
  Check, 
  Sparkles, 
  Loader2, 
  ShieldCheck 
} from 'lucide-react';
import { toast } from 'sonner';
import { Shop } from '../../types';
import { subscriptionClient } from '../../services/subscriptionClient';
import { useShopContext } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';

interface ProUpgradePaywallCardProps {
  shop?: Shop | null;
  productCount?: number;
  onBack?: () => void;
  onSuccess?: () => void;
}

export const ProUpgradePaywallCard: React.FC<ProUpgradePaywallCardProps> = ({
  shop: propShop,
  productCount = 9,
  onBack,
  onSuccess
}) => {
  const navigate = useNavigate();
  const { shop: contextShop, refreshShop } = useShopContext();
  const { refreshSubscription } = useAuth();
  const shop = propShop || contextShop;

  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!shop?.id) {
      toast.error('Shop details not found. Please refresh the page.');
      return;
    }

    setLoading(true);
    try {
      const linkData = await subscriptionClient.createPaymentLink(shop.id);
      if (!linkData?.url) throw new Error('NardoPay did not return a checkout URL');

      window.open(linkData.url, '_blank', 'noopener,noreferrer');
      toast.info('Checkout opened. Premium activates only after our server verifies NardoPay’s signed webhook.');

      const pollInterval = window.setInterval(async () => {
        try {
          const status = await subscriptionClient.getStatus(shop.id);
          if (status.plan === 'premium' && status.status === 'active') {
            window.clearInterval(pollInterval);
            await refreshShop();
            if (refreshSubscription) await refreshSubscription();
            toast.success('Premium access is active.');
            onSuccess?.();
          }
        } catch {
          // Keep polling; the webhook may still be in flight.
        }
      }, 3500);
      window.setTimeout(() => window.clearInterval(pollInterval), 120000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to initialize NardoPay payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="w-full max-w-[430px] mx-auto bg-white min-h-screen flex flex-col font-sans selection:bg-[#7C3AED] selection:text-white">
      {/* 1. Header with back button & title */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3.5 flex items-center justify-between border-b border-zinc-100">
        <button
          type="button"
          onClick={handleGoBack}
          className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-zinc-700 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-base font-bold text-zinc-950 tracking-tight">
          Upgrade to Premium
        </h1>

        {/* Empty space for visual balance */}
        <div className="w-9" />
      </header>

      {/* Main Body */}
      <div className="flex-1 px-4 py-4 space-y-4">
        
        {/* 2. Top Purple Alert Card */}
        <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5">
            <Lock size={22} className="stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-zinc-950 leading-snug">
              Keep receiving customer enquiries
            </h2>
            <p className="text-xs text-zinc-600 font-medium leading-relaxed">
              Free clothing shops have unlimited products. The free tier includes 50 unique visits and 10 WhatsApp or directions interests for life; Premium keeps those customer actions open.
            </p>
          </div>
        </div>

        {/* 3. Your Current Plan Card */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 space-y-3.5 shadow-xs">
          <div className="text-xs font-bold text-zinc-900 tracking-tight">
            Your current plan
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-[#7C3AED]">
                Free Trial
              </div>
              <div className="text-xs text-zinc-500 font-medium mt-0.5">
                50 visits / 10 interests for life
              </div>
            </div>

            <div className="inline-flex items-center bg-[#FEE2E2] text-[#DC2626] border border-red-200/80 px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-tight">
              Unlimited products
            </div>
          </div>

          <div className="space-y-2 pt-0.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500">
              <span>Lifetime usage allowance</span>
              <span>50 visits · 10 interests</span>
            </div>
            <div className="w-full h-2 bg-[#EDE9FE] rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-[#7C3AED] rounded-full" />
            </div>
            <p className="text-xs text-zinc-500 font-medium">Browsing remains open; WhatsApp and directions pause after either threshold.</p>
          </div>
        </div>

        {/* 4. Upgrade to Pro Card */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-zinc-950">
              Upgrade to Premium
            </h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              One-time payment. Lifetime access.
            </p>
          </div>

          {/* Pricing & Benefits Grid */}
          <div className="grid grid-cols-12 gap-3 items-start border-t border-zinc-100 pt-3">
            {/* Left Pricing */}
            <div className="col-span-5 pr-2 space-y-1">
              <div className="flex items-baseline">
                <span className="text-4xl font-black text-zinc-950 tracking-tight leading-none">
                  $9
                </span>
                <span className="text-xs text-zinc-500 font-bold uppercase font-mono ml-1">
                  USD
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                one-time payment
              </p>
            </div>

            {/* Right Feature Checklist */}
            <div className="col-span-7 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
                  <Check size={10} strokeWidth={3.5} />
                </div>
                <span className="text-xs font-semibold text-zinc-800">
                  Unlimited products
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
                  <Check size={10} strokeWidth={3.5} />
                </div>
                <span className="text-xs font-semibold text-zinc-800">
                  Grow your shop
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
                  <Check size={10} strokeWidth={3.5} />
                </div>
                <span className="text-xs font-semibold text-zinc-800">
                  No monthly fees
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
                  <Check size={10} strokeWidth={3.5} />
                </div>
                <span className="text-xs font-semibold text-zinc-800">
                  One-time payment
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
                  <Check size={10} strokeWidth={3.5} />
                </div>
                <span className="text-xs font-semibold text-zinc-800">
                  Secure with NardoPay
                </span>
              </div>
            </div>
          </div>

          {/* Mini Purple Benefit Callout */}
          <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl p-3.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={15} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-950">
                Premium keeps customer actions open
              </div>
              <div className="text-[11px] text-zinc-600 font-medium leading-relaxed mt-0.5">
                Keep receiving WhatsApp enquiries and directions after your lifetime free allowance is used.
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={handleUpgrade}
              className="w-full h-13 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-[#7C3AED]/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting NardoPay...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Upgrade to Premium — $9</span>
                </>
              )}
            </button>

            {/* Reassurance text */}
            <p className="text-xs text-zinc-500 text-center font-medium">
              Secure payment powered by NardoPay. Activation is webhook-verified.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

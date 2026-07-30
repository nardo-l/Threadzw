import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useShopContext } from '../../context/ShopContext';

export const SubscriptionCountdownBanner: React.FC = () => {
  const navigate = useNavigate();
  const { subscription } = useAuth();
  const { shop } = useShopContext();
  const [dismissed, setDismissed] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  // Ticking timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine countdown mode and target end date
  const bannerConfig = useMemo(() => {
    const status = subscription?.status || shop?.subscription_status;

    // Check trial first
    if (status === 'trial' || (!status && (subscription?.trial_ends_at || shop?.trial_ends_at))) {
      const trialEndStr = subscription?.trial_ends_at || shop?.trial_ends_at;
      if (trialEndStr) {
        const target = new Date(trialEndStr);
        if (!isNaN(target.getTime()) && target > now) {
          return {
            mode: 'trial' as const,
            targetDate: target,
            title: 'Free Trial Active',
            headline: 'The countdown has begun!',
            subtext: "We're giving you full access to ThreadZW Pro features. Upgrade anytime to keep selling without interruption.",
            buttonText: '🚀 Upgrade to Pro',
          };
        }
      }
    }

    // Check active subscription (only show when left with <= 7 days)
    if (status === 'active' || shop?.subscription_status === 'active') {
      const subEndStr = subscription?.subscription_ends_at || shop?.subscription_end || shop?.subscription_ends_at;
      if (subEndStr) {
        const target = new Date(subEndStr);
        if (!isNaN(target.getTime())) {
          const diffMs = target.getTime() - now.getTime();
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (diffMs > 0 && diffMs <= sevenDaysMs) {
            return {
              mode: 'active' as const,
              targetDate: target,
              title: 'Next Subscription Renewal',
              headline: 'Your next billing cycle is approaching!',
              subtext: 'Your Pro subscription ends soon. Renew your plan now to stay active without store downtime.',
              buttonText: '💳 Renew Subscription',
            };
          }
        }
      }
    }

    return null;
  }, [subscription, shop, now]);

  if (dismissed || !bannerConfig) {
    return null;
  }

  const { targetDate, title, headline, subtext, buttonText, mode } = bannerConfig;

  // Calculate time diff
  const diff = Math.max(0, targetDate.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const formatTwoDigits = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-sm mb-5 relative overflow-hidden transition-all font-sans">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#96D100] animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
            {mode === 'trial' ? <Sparkles size={15} className="text-lime-600 fill-lime-500/20" /> : <Clock size={15} className="text-amber-500" />}
            {title}
          </h3>
        </div>

        <button 
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          title="Dismiss banner"
        >
          <X size={18} />
        </button>
      </div>

      {/* Dark Timer Pill Box (matching the inspo image) */}
      <div className="bg-[#18181b] text-white rounded-2xl py-4 px-3 sm:px-6 my-4 shadow-inner flex items-center justify-around sm:justify-center gap-1 sm:gap-4 text-center">
        {/* Days */}
        <div className="flex-1 max-w-[80px]">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono leading-none">
            {formatTwoDigits(days)}
          </div>
          <div className="text-[10px] sm:text-xs text-zinc-400 font-semibold uppercase tracking-wider mt-1.5">
            Days
          </div>
        </div>

        <div className="text-zinc-700 font-light text-xl sm:text-2xl select-none">|</div>

        {/* Hours */}
        <div className="flex-1 max-w-[80px]">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono leading-none">
            {formatTwoDigits(hours)}
          </div>
          <div className="text-[10px] sm:text-xs text-zinc-400 font-semibold uppercase tracking-wider mt-1.5">
            Hours
          </div>
        </div>

        <div className="text-zinc-700 font-light text-xl sm:text-2xl select-none">|</div>

        {/* Minutes */}
        <div className="flex-1 max-w-[80px]">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono leading-none">
            {formatTwoDigits(minutes)}
          </div>
          <div className="text-[10px] sm:text-xs text-zinc-400 font-semibold uppercase tracking-wider mt-1.5">
            Minutes
          </div>
        </div>

        <div className="text-zinc-700 font-light text-xl sm:text-2xl select-none">|</div>

        {/* Seconds */}
        <div className="flex-1 max-w-[80px]">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono leading-none">
            {formatTwoDigits(seconds)}
          </div>
          <div className="text-[10px] sm:text-xs text-zinc-400 font-semibold uppercase tracking-wider mt-1.5">
            Seconds
          </div>
        </div>
      </div>

      {/* Description & Action */}
      <div className="text-center space-y-1.5 max-w-md mx-auto">
        <h4 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
          {headline}
        </h4>
        <p className="text-xs text-zinc-500 font-normal leading-relaxed">
          {subtext}
        </p>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={() => navigate('/subscription')}
          className="w-full max-w-xs py-3 px-6 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{buttonText}</span>
          <ArrowRight size={14} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

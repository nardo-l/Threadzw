import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useShopContext } from '../../context/ShopContext';

export const SubscriptionCountdownBanner: React.FC = () => {
  const navigate = useNavigate();
  const { subscription } = useAuth();
  const { shop } = useShopContext();
  const [dismissed, setDismissed] = useState(false);

  const isPaidLifetime = shop?.plan_type === 'lifetime' || shop?.subscription_status === 'active' || subscription?.status === 'active';

  if (dismissed) {
    return null;
  }

  return (
    <div className="bg-[#111111] border border-zinc-800 text-white rounded-2xl p-4 sm:p-5 shadow-lg mb-5 relative overflow-hidden transition-all font-sans">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#C6FF00]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C6FF00] animate-pulse" />
          <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 uppercase font-mono">
            <Sparkles size={14} className="text-[#C6FF00]" />
            {isPaidLifetime ? 'Lifetime Store Access Active' : 'ThreadZW $20 / Once Off Lifetime Plan'}
          </h3>
        </div>

        <button 
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>

      {/* Feature Checkmarks Bar (matching image style) */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 my-3 py-2.5 px-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-200">
        <div className="flex items-center gap-1.5">
          <Check size={14} className="text-[#C6FF00] stroke-[3]" />
          <span>$20 Once-Off Plan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Check size={14} className="text-[#C6FF00] stroke-[3]" />
          <span>Zero Monthly Fees</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Check size={14} className="text-[#C6FF00] stroke-[3]" />
          <span>Setup in Under 5 Minutes</span>
        </div>
      </div>

      {/* Subtext and Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 relative z-10">
        <div className="text-center sm:text-left space-y-0.5">
          <p className="text-xs font-medium text-zinc-400">
            {isPaidLifetime 
              ? 'Your store is fully activated with lifetime merchant access. No recurring subscription fees.' 
              : 'One payment of $20 grants unlimited access to your custom WhatsApp storefront forever.'}
          </p>
        </div>

        {!isPaidLifetime && (
          <button
            onClick={() => window.open('https://nardopay.com/pay/efb2bff4ee35cc08', '_blank')}
            className="w-full sm:w-auto py-2.5 px-5 bg-[#C6FF00] hover:bg-[#b2e600] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
          >
            <span>Pay $20 Once Off</span>
            <ArrowRight size={14} className="stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
};


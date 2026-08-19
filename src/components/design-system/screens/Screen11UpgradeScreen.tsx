// src/components/design-system/screens/Screen11UpgradeScreen.tsx

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Home, 
  Tag, 
  PlusCircle, 
  BarChart2, 
  Menu as MenuIcon 
} from 'lucide-react';

interface Screen11UpgradeScreenProps {
  onBack?: () => void;
  onUpgradeToPro?: () => void;
  interactive?: boolean;
}

export const Screen11UpgradeScreen: React.FC<Screen11UpgradeScreenProps> = ({
  onBack,
  onUpgradeToPro,
  interactive = false
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const proPrice = billingCycle === 'monthly' ? '$1.59' : '$1.27';
  const proPeriod = '/month';

  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black -mx-1">
      
      {/* Top Header Bar */}
      <div className="flex items-center gap-2 pt-1 px-1">
        <button
          onClick={onBack}
          className={`p-1 -ml-1 rounded-full text-black hover:bg-zinc-100 transition-colors ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <ArrowLeft size={16} className="stroke-[2.5]" />
        </button>
        <span className="text-xs font-bold text-black tracking-tight">
          Upgrade to Pro
        </span>
      </div>

      {/* Headline & Subtext */}
      <div className="py-1 px-1 space-y-0.5">
        <h1 className="text-2xl sm:text-[26px] font-black text-black tracking-tight leading-tight">
          Unlock more.<br />Sell more.
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          Upgrade to Pro and scale your store without limits.
        </p>
      </div>

      {/* Pricing Toggle */}
      <div className="px-1 py-1">
        <div className="w-full bg-zinc-100/90 border border-zinc-200/80 p-1 rounded-xl flex items-center">
          <button
            onClick={() => interactive && setBillingCycle('monthly')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
              billingCycle === 'monthly'
                ? 'bg-[#C6FF00] text-black shadow-2xs'
                : 'text-zinc-500 hover:text-black font-semibold'
            } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => interactive && setBillingCycle('yearly')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-[#C6FF00] text-black shadow-2xs'
                : 'text-zinc-500 hover:text-black font-semibold'
            } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <span>Yearly</span>
            <span className="text-[9px] bg-black text-[#C6FF00] px-1.5 py-0.2 rounded-full uppercase font-black tracking-tight">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Side-by-Side 2-Column Pricing Cards */}
      <div className="grid grid-cols-2 gap-2 px-1 my-auto py-1 items-stretch">
        
        {/* Free Plan Card */}
        <div className="p-3 rounded-2xl border border-zinc-200 bg-white flex flex-col justify-between shadow-2xs">
          <div className="space-y-2">
            <div>
              <span className="text-xs font-black text-black block">
                Free
              </span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-xl font-black text-black">$0</span>
                <span className="text-[10px] text-zinc-400 font-medium">{proPeriod}</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-1.5 pt-1 text-[10px] font-medium text-zinc-600">
              <div className="flex items-center gap-1.5">
                <Check size={11} className="text-black stroke-[3] shrink-0" />
                <span>2 Products</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={11} className="text-black stroke-[3] shrink-0" />
                <span>5 Photos per product</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={11} className="text-black stroke-[3] shrink-0" />
                <span>Basic store analytics</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={11} className="text-black stroke-[3] shrink-0" />
                <span>ThreadZW branding</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pro Plan Card */}
        <div className="p-3 rounded-2xl border-2 border-[#C6FF00] bg-white flex flex-col justify-between relative shadow-sm">
          {/* Most Popular Badge */}
          <div className="absolute -top-2.5 right-3">
            <span className="bg-[#C6FF00] text-black font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
              Most Popular
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-xs font-black text-black block">
                Pro
              </span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-xl font-black text-black">{proPrice}</span>
                <span className="text-[10px] text-zinc-400 font-medium">{proPeriod}</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-1.5 pt-1 text-[10px] font-medium text-zinc-700">
              <div className="flex items-center gap-1.5">
                <Check size={11} className="text-black stroke-[3] shrink-0" />
                <span className="font-semibold text-black">Unlimited products</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={11} className="text-black stroke-[3] shrink-0" />
                <span>10 Photos per product</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={11} className="text-black stroke-[3] shrink-0" />
                <span>Advanced analytics</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={11} className="text-black stroke-[3] shrink-0" />
                <span>Remove branding</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={11} className="text-black stroke-[3] shrink-0" />
                <span>Featured products</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={11} className="text-black stroke-[3] shrink-0" />
                <span>Priority support</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Primary CTA & Cancel Subtext */}
      <div className="space-y-1.5 pt-2 px-1">
        <button
          onClick={onUpgradeToPro}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl flex items-center justify-between transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <span className="font-extrabold tracking-wide">UPGRADE TO PRO</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>

        <p className="text-[10px] text-zinc-400 font-medium text-center">
          Cancel anytime. No hidden fees.
        </p>
      </div>

      {/* Bottom App Navigation Bar */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between px-3 text-zinc-400">
        <div className="flex flex-col items-center hover:text-black">
          <Home size={16} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <Tag size={16} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <PlusCircle size={17} />
        </div>
        <div className="flex flex-col items-center text-black">
          <div className="w-6 h-6 rounded-md bg-[#C6FF00] flex items-center justify-center text-black shadow-2xs">
            <BarChart2 size={14} className="stroke-[2.5]" />
          </div>
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <MenuIcon size={16} />
        </div>
      </div>

    </div>
  );
};

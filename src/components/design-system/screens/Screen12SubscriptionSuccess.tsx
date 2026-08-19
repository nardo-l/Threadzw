// src/components/design-system/screens/Screen12SubscriptionSuccess.tsx

import React from 'react';
import { 
  Check, 
  ArrowRight, 
  Home, 
  Tag, 
  PlusCircle, 
  BarChart2, 
  Menu as MenuIcon 
} from 'lucide-react';

interface Screen12SubscriptionSuccessProps {
  onGoToDashboard?: () => void;
  interactive?: boolean;
}

export const Screen12SubscriptionSuccess: React.FC<Screen12SubscriptionSuccessProps> = ({
  onGoToDashboard,
  interactive = false
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black -mx-1 relative overflow-hidden">
      
      {/* Floating Confetti / Particles Animation/Visual Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Lime Diamonds & Confetti Strips */}
        <div className="w-2 h-2 rounded-xs bg-[#C6FF00] absolute top-8 left-8 rotate-12 opacity-80" />
        <div className="w-1.5 h-3 rounded-full bg-zinc-300 absolute top-12 left-6 -rotate-45" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#C6FF00] absolute top-7 right-10 opacity-75" />
        <div className="w-1.5 h-3 bg-zinc-400/50 absolute top-16 right-6 rotate-45 rounded-xs" />
        <div className="w-2 h-2 rounded-full bg-[#C6FF00] absolute top-28 left-4 opacity-70" />
        <div className="w-2 h-2 rounded-xs bg-[#C6FF00] absolute top-32 right-8 -rotate-12 opacity-80" />
      </div>

      {/* Top Centerpiece Success Checkmark & Headline */}
      <div className="pt-3 px-1 text-center flex flex-col items-center space-y-2 relative z-10">
        
        {/* Large Lime Check Circle */}
        <div className="w-13 h-13 rounded-full bg-[#C6FF00] text-black flex items-center justify-center shadow-sm">
          <Check size={26} className="stroke-[3.5]" />
        </div>

        {/* Headline */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-[28px] font-black text-black tracking-tight leading-tight flex items-center justify-center gap-1.5">
            <span>Welcome to<br />Pro!</span>
            <span className="text-2xl -mt-4">🎉</span>
          </h1>
          <div className="text-xs text-zinc-500 font-medium leading-relaxed max-w-[240px] mx-auto">
            <p>Your store just leveled up.</p>
            <p className="text-zinc-600 font-semibold">You now have access to all Pro features.</p>
          </div>
        </div>

      </div>

      {/* You've unlocked: Unlocked Features Card */}
      <div className="px-1 my-auto py-1">
        <div className="w-full bg-white border border-zinc-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
          <span className="text-[11px] font-bold text-black block">
            You've unlocked:
          </span>

          <div className="space-y-2 text-xs font-semibold text-zinc-700">
            
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#C6FF00] text-black flex items-center justify-center shrink-0 shadow-2xs">
                <Check size={10} className="stroke-[3.5]" />
              </div>
              <span className="text-[11px] font-medium text-black">Unlimited products</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#C6FF00] text-black flex items-center justify-center shrink-0 shadow-2xs">
                <Check size={10} className="stroke-[3.5]" />
              </div>
              <span className="text-[11px] font-medium text-black">10 photos per product</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#C6FF00] text-black flex items-center justify-center shrink-0 shadow-2xs">
                <Check size={10} className="stroke-[3.5]" />
              </div>
              <span className="text-[11px] font-medium text-black">Advanced analytics</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#C6FF00] text-black flex items-center justify-center shrink-0 shadow-2xs">
                <Check size={10} className="stroke-[3.5]" />
              </div>
              <span className="text-[11px] font-medium text-black">Remove ThreadZW branding</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#C6FF00] text-black flex items-center justify-center shrink-0 shadow-2xs">
                <Check size={10} className="stroke-[3.5]" />
              </div>
              <span className="text-[11px] font-medium text-black">Featured products</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#C6FF00] text-black flex items-center justify-center shrink-0 shadow-2xs">
                <Check size={10} className="stroke-[3.5]" />
              </div>
              <span className="text-[11px] font-medium text-black">Priority support</span>
            </div>

          </div>
        </div>
      </div>

      {/* Primary CTA Button */}
      <div className="pt-2 px-1">
        <button
          onClick={onGoToDashboard}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl flex items-center justify-between transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <span className="font-extrabold tracking-wide">GO TO DASHBOARD</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* Bottom App Navigation Bar */}
      <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between px-3 text-zinc-400">
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

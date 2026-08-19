// src/components/design-system/screens/Screen1Welcome.tsx

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Screen1WelcomeProps {
  onGetStarted?: () => void;
  interactive?: boolean;
}

export const Screen1Welcome: React.FC<Screen1WelcomeProps> = ({
  onGetStarted,
  interactive = false
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black">
      {/* Top Brand Identity */}
      <div className="pt-2">
        <div className="space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-black flex items-center">
            <span>THREAD</span>
            <span className="text-[#C6FF00]">ZW</span>
          </h2>
          <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.18em] text-zinc-400">
            SELL MORE. STRESS LESS.
          </p>
        </div>
      </div>

      {/* Main Value Proposition Headlines */}
      <div className="py-3 space-y-2">
        <h1 className="text-3xl sm:text-[34px] font-black text-black tracking-tight leading-[1.08]">
          Launch your<br />
          clothing store<br />
          in under<br />
          <span className="text-[#C6FF00]">60 seconds.</span>
        </h1>
        <p className="text-xs sm:text-[13px] text-zinc-500 font-medium leading-relaxed pt-1">
          No coding. No website builders.<br />
          Just your brand.
        </p>
      </div>

      {/* Product Imagery: 2 Overlapping angled streetwear & sneaker cards */}
      <div className="py-2 my-auto flex items-center justify-center relative">
        <div className="relative w-full max-w-[260px] h-[190px] bg-zinc-50/80 rounded-2xl p-2 border border-zinc-100 flex items-center justify-center overflow-hidden">
          
          {/* Card 1: Streetwear Graphic Tee Flatlay (Left angled) */}
          <div className="w-[110px] h-[145px] rounded-xl overflow-hidden shadow-[0_12px_24px_-6px_rgba(0,0,0,0.2)] -rotate-6 absolute left-3 top-4 border-2 border-white z-10 bg-white">
            <img
              src="https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/save%20it%20for%20later.jfif"
              alt="Streetwear Cross Graphic Tee"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to high quality streetwear photo if storage image is unreachable
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80';
              }}
            />
          </div>

          {/* Card 2: Red Sneakers & Apparel Rack (Right angled) */}
          <div className="w-[115px] h-[145px] rounded-xl overflow-hidden shadow-[0_14px_28px_-6px_rgba(0,0,0,0.25)] rotate-6 absolute right-3 top-6 border-2 border-white z-20 bg-white">
            <img
              src="https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/Puma%20Men's%20Trainers%20(1).jfif"
              alt="Red Puma Sneakers on rack"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to high quality sneaker photo
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=400&q=80';
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom CTA Button & Trust Note */}
      <div className="pt-4 space-y-2.5 text-center">
        <button
          onClick={onGetStarted}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-6 rounded-2xl flex items-center justify-between transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <span className="font-extrabold tracking-wide">GET STARTED</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
        <p className="text-[11px] text-zinc-400 font-medium">
          Join thousands of brands in Zimbabwe
        </p>
      </div>
    </div>
  );
};

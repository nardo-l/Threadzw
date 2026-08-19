// src/components/design-system/screens/RealisticPhoneFrame.tsx

import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface RealisticPhoneFrameProps {
  children: React.ReactNode;
  currentTime?: string;
  className?: string;
  scale?: number;
}

export const RealisticPhoneFrame: React.FC<RealisticPhoneFrameProps> = ({
  children,
  currentTime = '9:41',
  className = '',
  scale = 1
}) => {
  return (
    <div 
      className={`relative select-none transition-transform duration-300 ${className}`}
      style={{ transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: 'top center' }}
    >
      {/* Physical Hardware Buttons */}
      {/* Action Button */}
      <div className="absolute top-[90px] -left-[3px] w-[3px] h-[22px] bg-[#27272A] rounded-l-md z-0" />
      {/* Volume Up */}
      <div className="absolute top-[125px] -left-[3px] w-[3px] h-[44px] bg-[#27272A] rounded-l-md z-0" />
      {/* Volume Down */}
      <div className="absolute top-[180px] -left-[3px] w-[3px] h-[44px] bg-[#27272A] rounded-l-md z-0" />
      {/* Power Button */}
      <div className="absolute top-[140px] -right-[3px] w-[3px] h-[65px] bg-[#27272A] rounded-r-md z-0" />

      {/* Main Outer Titanium / Matte Black Bezel */}
      <div className="bg-[#09090B] border-[10px] border-[#18181B] rounded-[52px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.1),0_12px_24px_-8px_rgba(0,0,0,0.2)] p-2 relative overflow-hidden w-[340px] sm:w-[355px] h-[720px] sm:h-[735px] mx-auto z-10 flex flex-col">
        
        {/* Screen Glass Boundary */}
        <div className="bg-white w-full h-full rounded-[42px] relative overflow-hidden border border-black/5 flex flex-col justify-between">
          
          {/* Top Status Bar & Dynamic Island */}
          <div className="absolute top-0 inset-x-0 pt-3 px-7 flex items-center justify-between z-40 text-black pointer-events-none bg-transparent">
            {/* Clock Time */}
            <span className="text-[13px] font-bold tracking-tight font-sans pl-1">{currentTime}</span>
            
            {/* Dynamic Island Pill */}
            <div className="w-[95px] h-[26px] bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2.5 flex items-center justify-end pr-2.5 shadow-xs">
              {/* Subtle Camera Lens reflection */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#111115] border border-white/10 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#1C2035]" />
              </div>
            </div>

            {/* Right Status Icons */}
            <div className="flex items-center gap-1.5 pr-1">
              <Signal size={12} className="fill-current stroke-[2.5]" />
              <Wifi size={12} className="stroke-[2.5]" />
              <Battery size={15} className="fill-current stroke-[1.8]" />
            </div>
          </div>

          {/* Screen Content Container (Scrollable or Fitted) */}
          <div className="flex-1 flex flex-col pt-11 pb-6 px-5 overflow-y-auto no-scrollbar relative z-10">
            {children}
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="absolute bottom-1.5 inset-x-0 flex justify-center z-40 pointer-events-none">
            <div className="w-32 h-1 bg-black/80 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

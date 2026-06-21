import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#000000] flex flex-col items-center justify-center select-none font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes customSpin {
          to { transform: rotate(360deg); }
        }
      ` }} />

      <div className="flex flex-col items-center justify-center text-center px-6">
        {/* Animated Custom Green Hanger SVG */}
        <div className="mb-6 animate-pulse">
          <svg className="w-16 h-16 text-[#C6FF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            {/* Elegant Hanger hook */}
            <path d="M12 9 C 12 6, 15 5, 14 3.5 C 13.5 2.8, 12.5 2.5, 12 2.5 C 11.2 2.5, 10.5 3, 10.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Elegant Hanger body triangle */}
            <path d="M12 9 L2.5 17.5 C 1.8 18.2, 2.3 19, 3.2 19 L20.8 19 C 21.7 19, 22.2 18.2, 21.5 17.5 Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Brand Display Title */}
        <h1 className="text-3xl font-black tracking-[0.2em] text-white uppercase font-sans mb-2">
          THREADZW
        </h1>
        <p className="text-[#A0A0A0] text-xs uppercase tracking-[0.15em] font-medium max-w-xs leading-relaxed">
          Shopfronts for Zimbabwean Fashion
        </p>

        {/* Circular Indicator spinner */}
        <div 
          className="mt-12 w-6 h-6 rounded-full border-2 border-[#1A1A1A] border-t-[#C6FF00]" 
          style={{ animation: 'customSpin 0.8s linear infinite' }}
        />
      </div>
    </div>
  );
};

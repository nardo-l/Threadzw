import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0B0B0B] flex flex-col items-center justify-center select-none font-mono">
      {/* Dynamic inline styles for rotating animation loops */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes customSpin {
          to { transform: rotate(360deg); }
        }
      ` }} />

      <div className="flex flex-col items-center justify-center">
        {/* Brand Display Header */}
        <h1 className="text-[#C6FF00] font-black text-[28px] tracking-[-1px] uppercase">
          ThreadZW
        </h1>

        {/* Circular Indicator spinner */}
        <div 
          className="mt-6 w-6 h-6 rounded-full border-[2.5px] border-[#1A1A1A] border-t-[#C6FF00]" 
          style={{ animation: 'customSpin 0.7s linear infinite' }}
        />
      </div>
    </div>
  );
};

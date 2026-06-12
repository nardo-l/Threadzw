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
        <div className="flex justify-center mb-4">
          <img 
            src="https://4htrv9mv32e5k648.public.blob.vercel-storage.com/file_000000009c74724684851106c3e2946c.png" 
            alt="ThreadZW Logo" 
            referrerPolicy="no-referrer"
            className="h-9 w-auto object-contain" 
          />
        </div>

        {/* Circular Indicator spinner */}
        <div 
          className="mt-6 w-6 h-6 rounded-full border-[2.5px] border-[#1A1A1A] border-t-[#C6FF00]" 
          style={{ animation: 'customSpin 0.7s linear infinite' }}
        />
      </div>
    </div>
  );
};

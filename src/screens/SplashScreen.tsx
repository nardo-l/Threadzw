import React from 'react';

export const SplashScreen: React.FC = () => (
  <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#000] text-white select-none">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(198,255,0,0.10),transparent_32%),linear-gradient(180deg,#030303_0%,#080808_100%)]" />
    <div className="absolute left-1/2 top-[17%] h-52 w-52 -translate-x-1/2 rounded-full border border-[#C6FF00]/10" />
    <div className="absolute left-1/2 top-[19%] h-44 w-44 -translate-x-1/2 rounded-full border border-[#C6FF00]/20" />

    <div className="relative flex h-full flex-col items-center justify-center px-7 text-center">
      <div className="mb-8 flex h-20 w-20 -rotate-6 items-center justify-center rounded-[26px] border border-[#C6FF00]/30 bg-[#C6FF00] text-3xl font-black text-black shadow-[8px_8px_0_rgba(255,255,255,0.9)]">TZ</div>
      <h1 className="text-4xl font-black tracking-[-.04em] sm:text-5xl">THREAD<span className="text-[#C6FF00]">ZW</span></h1>
      <p className="mt-3 max-w-xs text-[11px] font-bold uppercase tracking-[.18em] text-zinc-500">Zimbabwe's Fashion Marketplace</p>
      <div className="mt-16 h-1.5 w-32 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full w-1/2 animate-[splashProgress_1.1s_ease-in-out_infinite] rounded-full bg-[#C6FF00]" />
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[.2em] text-zinc-700">Loading your style</p>
    </div>
    <style>{`@keyframes splashProgress { 0% { transform: translateX(-100%); } 50% { transform: translateX(100%); } 100% { transform: translateX(240%); } }`}</style>
  </div>
);

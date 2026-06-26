// src/screens/LandingPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onStartFree: () => void;
  onLoginSuccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFree }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff] flex flex-col justify-between selection:bg-[#C6FF00] selection:text-black font-sans antialiased">
      
      {/* Header / Top Nav */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)] py-4">
        <div className="max-w-[480px] mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <span 
            onClick={() => navigate('/')} 
            className="text-xl font-black tracking-tight text-[#C6FF00] hover:opacity-90 transition-opacity cursor-pointer select-none"
          >
            ThreadZW
          </span>

          {/* Actions */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-[#9ca3af] hover:text-[#ffffff] transition-colors cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={onStartFree}
              className="bg-[#C6FF00] hover:opacity-90 active:scale-[0.98] text-black text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer"
            >
              Start Free
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-[480px] mx-auto w-full">
        
        {/* Made in Zimbabwe Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111111] border border-[rgba(255,255,255,0.08)] text-[11px] font-bold text-zinc-300 mb-8 select-none">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          <span>🇿🇼 Made in Zimbabwe</span>
        </div>

        {/* Hero Heading */}
        <h1 className="text-[44px] sm:text-[48px] font-black tracking-tight text-white text-center leading-[1.08] mb-4 select-none">
          Create your<br />
          online<br />
          shop in<br />
          <span className="relative inline-block border-b-[5px] border-[#C6FF00] pb-1">
            minutes.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-[#9ca3af] text-sm sm:text-base text-center max-w-[320px] leading-relaxed mb-10">
          No website skills needed. Create your shop, upload products, and share your link.
        </p>

        {/* Big CTA Button */}
        <button
          onClick={onStartFree}
          className="w-full max-w-[290px] py-4 bg-[#C6FF00] hover:opacity-95 active:scale-[0.98] text-black font-black text-sm uppercase rounded-full transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#C6FF00]/10 cursor-pointer mb-6"
        >
          <span>Start Free →</span>
        </button>

        {/* View Demo Shop */}
        <button
          onClick={() => navigate('/demo')}
          className="text-white hover:text-[#C6FF00] transition-colors font-extrabold text-sm flex items-center gap-1 cursor-pointer mb-12"
        >
          <span>View Demo Shop →</span>
        </button>

        {/* Social Proof overlapping avatars */}
        <div className="flex items-center gap-3.5 select-none mb-10">
          <div className="flex -space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#ff4b4b] border-2 border-black flex items-center justify-center text-[10px] font-black text-white shadow-md">K</div>
            <div className="w-8 h-8 rounded-full bg-[#00a2ff] border-2 border-black flex items-center justify-center text-[10px] font-black text-white shadow-md">T</div>
            <div className="w-8 h-8 rounded-full bg-[#a200ff] border-2 border-black flex items-center justify-center text-[10px] font-black text-white shadow-md">B</div>
            <div className="w-8 h-8 rounded-full bg-[#80c000] border-2 border-black flex items-center justify-center text-[10px] font-black text-white shadow-md">A</div>
          </div>
          <p className="text-xs font-bold">
            <span className="text-white font-black">+50 shops</span>{' '}
            <span className="text-zinc-500 font-semibold">already live 🇿🇼</span>
          </p>
        </div>

        {/* Bottom Link Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-[10px] font-black text-zinc-400 tracking-wider mb-2 select-none">
          <span>🔗</span>
          <span>YOUR OWN LINK</span>
        </div>

      </main>

      {/* Spacing footer */}
      <footer className="py-6 border-t border-[rgba(255,255,255,0.03)] bg-black">
        <div className="max-w-[480px] mx-auto px-6 text-center text-[11px] text-zinc-600 font-semibold select-none">
          &copy; {new Date().getFullYear()} ThreadZW. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

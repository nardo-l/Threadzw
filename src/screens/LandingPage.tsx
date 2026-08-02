// src/screens/LandingPage.tsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ShoppingBag, Check } from 'lucide-react';
import { trackLandingPageView } from '../lib/analytics';

interface LandingPageProps {
  onStartFree: () => void;
  onLoginSuccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFree }) => {
  const navigate = useNavigate();

  useEffect(() => {
    trackLandingPageView();
  }, []);

  // Colorful profile circles for social proof
  const profiles = [
    { name: 'Kure', color: 'bg-indigo-600', text: 'K' },
    { name: 'TrendSetter', color: 'bg-rose-500', text: 'T' },
    { name: 'Bespoke', color: 'bg-emerald-600', text: 'B' },
    { name: 'Apex', color: 'bg-amber-500', text: 'A' },
    { name: 'Vogue', color: 'bg-fuchsia-600', text: 'V' },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff] flex flex-col font-sans select-none overflow-x-hidden selection:bg-[#bef715] selection:text-black">
      
      {/* Header Area */}
      <header className="w-full shrink-0 max-w-[480px] mx-auto px-6 pt-6">
        <div className="flex justify-between items-center py-4 relative z-20">
          <span 
            onClick={() => navigate('/')}
            className="text-2xl font-black tracking-tighter text-[#bef715] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
          >
            ThreadZW<span className="text-white">.</span>
          </span>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-black tracking-wider text-zinc-400 hover:text-white uppercase transition-colors cursor-pointer"
            >
              LOGIN
            </button>
            <button
              onClick={onStartFree}
              className="bg-[#bef715] hover:opacity-95 text-black text-xs font-black px-4.5 py-2 rounded-full transition-all cursor-pointer shadow-md shadow-[#bef715]/10 tracking-wider uppercase"
            >
              START FREE
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-[480px] mx-auto px-6 py-4 relative z-10 space-y-12">
        
        {/* Made in Zimbabwe Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 shadow-xl"
        >
          <span className="text-sm">🇿🇼</span>
          <span>Made in Zimbabwe</span>
        </motion.div>

        {/* Hero Copy */}
        <div className="w-full text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] uppercase"
          >
            Create your<br />
            online shop in<br />
            <span className="text-[#bef715]">minutes.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-zinc-400 text-sm sm:text-base leading-relaxed font-semibold max-w-[320px] mx-auto"
          >
            No website skills needed. Create your shop, upload products, and share your link.
          </motion.p>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full flex flex-col gap-3.5 pt-2"
        >
          <button
            onClick={onStartFree}
            className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10 uppercase tracking-wider"
          >
            <span>START FREE</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </motion.div>

        {/* Floating Phone Storefront Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative w-full h-56 flex items-center justify-center mt-2"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute w-44 h-44 bg-[#bef715]/5 rounded-full blur-3xl -z-10 animate-pulse" />
          
          {/* Stylized Phone Frame */}
          <div className="w-68 bg-zinc-950 border border-zinc-900 rounded-2xl p-3.5 shadow-2xl text-left relative overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500 ease-out">
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#bef715]/40 to-transparent" />
            
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-900/60 mb-2.5">
              <div className="w-5.5 h-5.5 rounded-full bg-[#bef715]/15 border border-[#bef715]/30 flex items-center justify-center text-[#bef715] text-[9px] font-black">TZ</div>
              <div>
                <h4 className="text-[10px] font-black text-white uppercase leading-none">Harare Fits</h4>
                <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">Active Storefront</span>
              </div>
            </div>

            {/* Product mock layout */}
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-zinc-900 flex items-center justify-center relative overflow-hidden border border-zinc-900/60">
                <ShoppingBag className="w-6 h-6 text-[#bef715]/20 animate-pulse" />
                <span className="absolute bottom-1.5 left-1.5 bg-[#bef715] text-black font-mono font-black text-[8px] px-1.5 py-0.5 rounded-md">$18.00</span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-24 bg-white/90 rounded-full" />
                <div className="h-1 w-12 bg-zinc-800 rounded-full" />
              </div>
              {/* WhatsApp bar */}
              <div className="w-full py-1 bg-green-950/20 border border-green-900/30 text-green-400 rounded-md text-center text-[8px] font-black tracking-widest uppercase flex items-center justify-center gap-1">
                <span>Order on WhatsApp</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pricing Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full bg-zinc-950 border border-zinc-900 rounded-3xl p-6 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#bef715] to-transparent" />
          
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-[#bef715] tracking-widest font-extrabold">PRICING PLAN</span>
            <h3 className="text-2xl font-black uppercase tracking-tight">ThreadZW Pro</h3>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-black text-white">$2.99</span>
              <span className="text-zinc-500 font-bold text-sm">/month</span>
            </div>
            <p className="text-xs text-zinc-400">7-day free trial included for every new shop.</p>
          </div>

          <div className="space-y-3 text-left">
            {[
              'Unlimited products',
              'Online storefront',
              'WhatsApp ordering integration',
              'Custom shop link',
              'Priority merchant support'
            ].map(benefit => (
              <div key={benefit} className="flex items-center gap-2.5 text-xs font-bold text-zinc-300">
                <div className="w-4 h-4 rounded-full bg-[#bef715]/10 flex items-center justify-center text-[#bef715] shrink-0">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onStartFree}
            className="w-full h-12 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-[#bef715]/10"
          >
            Start Free Trial
          </button>
        </motion.div>

        {/* Social Proof Live Shops Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="w-full pt-2 flex flex-col items-center space-y-2.5 shrink-0"
        >
          <div className="flex items-center justify-center">
            {/* Overlapping profile circles */}
            <div className="flex -space-x-2 mr-3">
              {profiles.map((p, idx) => (
                <div
                  key={idx}
                  className={`w-7.5 h-7.5 rounded-full ${p.color} border border-black flex items-center justify-center text-[10px] font-black text-white`}
                >
                  {p.text}
                </div>
              ))}
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-zinc-400 tracking-tight">
              +50 shops already live 🇿🇼
            </span>
          </div>
        </motion.div>

      </main>

      {/* Simple elegant footer */}
      <footer className="w-full py-6 shrink-0 border-t border-zinc-900/80 bg-black mt-auto">
        <p className="text-center text-[10px] text-zinc-600 font-black tracking-wider uppercase">
          THREADZW PLATFORM • HARARE
        </p>
      </footer>

    </div>
  );
};


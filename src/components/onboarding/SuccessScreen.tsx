import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { useShopContext } from '../../context/ShopContext';
import { setOnboardingStep } from '../../hooks/useOnboarding';

interface SuccessScreenProps {
  onContinue?: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ onContinue }) => {
  const navigate = useNavigate();
  const { shop } = useShopContext();

  const handleContinue = async () => {
    if (shop?.id) {
      await setOnboardingStep(shop.id, 'step1');
    }
    if (onContinue) {
      onContinue();
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black font-sans antialiased flex flex-col justify-between items-center p-6 sm:p-10 select-none">
      
      {/* TOP BRAND LOGO */}
      <header className="w-full max-w-md mx-auto pt-2 flex items-center justify-center">
        <div className="flex items-center text-2xl font-black tracking-tight">
          <span className="text-black">THREAD</span>
          <span className="text-[#C6FF00] bg-black px-1.5 py-0.5 rounded-md ml-0.5 text-xl font-extrabold tracking-widest">
            ZW
          </span>
        </div>
      </header>

      {/* CENTER CONTENT */}
      <main className="w-full max-w-md mx-auto flex-1 flex flex-col items-center justify-center py-8 space-y-8 text-center">
        
        {/* 3D-STYLE STOREFRONT LIVE ILLUSTRATION */}
        <motion.div 
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-64 sm:w-72 h-64 sm:h-72 flex items-center justify-center my-2"
        >
          {/* Streamers / Party Poppers & Confetti Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Confetti Ribbon 1 - Yellow */}
            <svg className="absolute top-2 left-6 w-8 h-8 text-[#C6FF00] animate-bounce" style={{ animationDuration: '3s' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
            </svg>
            {/* Confetti Ribbon 2 - Lime Streamer */}
            <div className="absolute top-4 right-8 w-3 h-8 bg-[#C6FF00] rounded-full transform rotate-45" />
            {/* Confetti Dot Black 1 */}
            <div className="absolute top-12 left-10 w-2.5 h-2.5 bg-black rounded-full" />
            {/* Confetti Dot Black 2 */}
            <div className="absolute bottom-16 right-6 w-3 h-3 bg-black rounded-full" />
            {/* Confetti Lime Square */}
            <div className="absolute bottom-12 left-8 w-2.5 h-2.5 bg-[#C6FF00] rotate-12" />
            {/* Streamer Curve */}
            <div className="absolute top-8 right-16 w-1.5 h-10 bg-[#C6FF00] rounded-full rotate-[-25deg]" />
            <div className="absolute bottom-8 right-14 w-2 h-6 bg-black rounded-full rotate-[15deg]" />
          </div>

          {/* MAIN STORE FRONT BUILDING CARD */}
          <div className="relative z-10 w-48 sm:w-52 bg-white rounded-3xl p-4 border-2 border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex flex-col items-center">
            
            {/* Black Striped Awning */}
            <div className="w-full h-11 bg-zinc-900 rounded-2xl flex overflow-hidden border border-zinc-800 shadow-inner mb-3">
              <div className="flex-1 bg-zinc-900" />
              <div className="flex-1 bg-white/20" />
              <div className="flex-1 bg-zinc-900" />
              <div className="flex-1 bg-white/20" />
              <div className="flex-1 bg-zinc-900" />
            </div>

            {/* Shop Window & Door with LIVE Badge */}
            <div className="w-full h-24 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-12 h-16 bg-zinc-100 border border-zinc-300 rounded-t-xl mb-0 mt-auto flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-zinc-400" />
              </div>
              
              {/* LIVE BADGE */}
              <div className="absolute top-3 bg-[#C6FF00] text-black text-[11px] font-black tracking-widest px-3 py-1 rounded-full border border-black/10 shadow-sm flex items-center gap-1">
                <span>LIVE</span>
              </div>
            </div>

          </div>

          {/* LEFT BADGE: TW SHOPPING BAG */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="absolute left-1 bottom-6 z-20 w-16 h-20 bg-zinc-900 rounded-2xl border-2 border-zinc-800 shadow-xl flex flex-col items-center justify-center p-2"
          >
            {/* Bag Handle */}
            <div className="w-6 h-3 border-2 border-zinc-500 rounded-t-lg -mt-3 mb-1" />
            <span className="text-[#C6FF00] font-black text-xs tracking-wider">TW</span>
          </motion.div>

          {/* RIGHT BADGE: GREEN CHECKMARK CIRCLE */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4, type: 'spring' }}
            className="absolute right-2 bottom-8 z-20 w-14 h-14 bg-[#C6FF00] rounded-full border-4 border-white shadow-xl flex items-center justify-center text-black"
          >
            <Check className="w-8 h-8 stroke-[3]" />
          </motion.div>

        </motion.div>

        {/* HEADINGS */}
        <div className="space-y-3 px-4">
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight leading-tight">
            🎉 Welcome to <br />
            ThreadZW!
          </h1>
          <p className="text-zinc-500 text-sm sm:text-base font-medium leading-relaxed max-w-xs mx-auto">
            Your storefront is live. <br />
            Let's make it look like your brand.
          </p>
        </div>

      </main>

      {/* BOTTOM ACTION BUTTON */}
      <footer className="w-full max-w-md mx-auto pb-4">
        <button
          onClick={handleContinue}
          className="w-full h-14 sm:h-16 bg-[#C6FF00] hover:bg-[#b8eb00] text-black font-extrabold text-base rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xl shadow-[#C6FF00]/25"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </footer>

    </div>
  );
};

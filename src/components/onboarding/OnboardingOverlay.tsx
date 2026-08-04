import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Pencil, Sparkles, Flame, Shirt } from 'lucide-react';
import { useOnboarding, OnboardingStep } from '../../hooks/useOnboarding';

interface OnboardingOverlayProps {
  shop: any | null;
  productsCount?: number;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ shop, productsCount }) => {
  const navigate = useNavigate();
  const { step, updateStep } = useOnboarding(shop?.id, productsCount, shop);

  if (!shop?.id || step === 'completed' || step === 'success') {
    return null;
  }

  const handleCustomiseShop = () => {
    navigate('/edit-shop');
  };

  const handleAddFirstProduct = () => {
    navigate('/add-product');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm select-none">
        
        {/* OVERLAY CARD 1: STEP 1 - CUSTOMISE SHOP */}
        {step === 'step1' && (
          <motion.div
            key="overlay-step1"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[360px] sm:max-w-[400px] bg-white rounded-[32px] p-6 sm:p-8 flex flex-col items-center text-center space-y-6 shadow-2xl relative border border-zinc-100"
          >
            {/* PROGRESS INDICATOR - STEP 1 */}
            <div className="flex flex-col items-center gap-1.5 w-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-2 rounded-full bg-[#C6FF00]" />
                <div className="w-2 h-2 rounded-full bg-zinc-200" />
              </div>
              <span className="text-[11px] font-bold text-zinc-400">1 of 2</span>
            </div>

            {/* ILLUSTRATION: STORE BRAND CARD WITH PENCIL BADGE */}
            <div className="w-32 h-32 rounded-full bg-zinc-100 flex items-center justify-center relative my-1">
              <div className="w-24 h-16 bg-white rounded-xl border border-zinc-200/80 p-2 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="w-full h-7 bg-zinc-200 rounded-md overflow-hidden relative">
                  <div className="absolute top-1 left-1.5 w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center text-[7px] font-black text-[#C6FF00]">
                    TW
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="w-3 h-2 bg-zinc-200 rounded-xs" />
                  <div className="w-6 h-2 bg-zinc-100 rounded-xs" />
                </div>
              </div>

              {/* LIME PENCIL BADGE */}
              <div className="absolute bottom-1 right-2 w-9 h-9 rounded-full bg-[#C6FF00] border-2 border-white flex items-center justify-center text-black shadow-md">
                <Pencil className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* TEXT CONTENT */}
            <div className="space-y-2 max-w-xs mx-auto">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#8BB800] bg-[#C6FF00]/15 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Step 1</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight leading-snug">
                Make your shop look <br />
                like your brand.
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm font-medium leading-relaxed pt-1">
                Upload your logo, banner, write a short bio and add your shop directions so customers immediately trust your storefront.
              </p>
            </div>

            {/* ACTION BUTTON */}
            <button
              onClick={handleCustomiseShop}
              className="w-full h-14 bg-[#C6FF00] hover:bg-[#b8eb00] text-black font-extrabold text-base rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-[#C6FF00]/20"
            >
              <span>Customise Shop</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </motion.div>
        )}

        {/* OVERLAY CARD 2: STEP 2 - ADD FIRST PRODUCT */}
        {step === 'step2' && (
          <motion.div
            key="overlay-step2"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[360px] sm:max-w-[400px] bg-white rounded-[32px] p-6 sm:p-8 flex flex-col items-center text-center space-y-6 shadow-2xl relative border border-zinc-100"
          >
            {/* PROGRESS INDICATOR - STEP 2 */}
            <div className="flex flex-col items-center gap-1.5 w-full">
              <div className="flex items-center gap-1">
                <div className="w-6 h-2 rounded-full bg-[#C6FF00]" />
                <div className="w-4 h-0.5 bg-[#C6FF00]" />
                <div className="w-6 h-2 rounded-full bg-[#C6FF00]" />
              </div>
              <span className="text-[11px] font-bold text-zinc-400">2 of 2</span>
            </div>

            {/* ILLUSTRATION: T-SHIRT IN OPEN BOX */}
            <div className="w-32 h-32 rounded-full bg-zinc-100 flex items-center justify-center relative my-1">
              {/* Confetti Rays */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-28 h-28 border border-dashed border-[#C6FF00] rounded-full opacity-60 animate-spin" style={{ animationDuration: '20s' }} />
              </div>

              {/* Gift Box with T-Shirt */}
              <div className="relative z-10 flex flex-col items-center">
                {/* T-Shirt popping out */}
                <div className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center text-[#C6FF00] shadow-md -mb-3 z-10 transform -rotate-3">
                  <span className="font-black text-xs tracking-wider border border-[#C6FF00]/40 px-1 py-0.5 rounded">TW</span>
                </div>
                {/* Open Green Box */}
                <div className="w-20 h-10 bg-[#C6FF00] rounded-b-xl border-2 border-black/10 shadow-lg flex items-center justify-center">
                  <div className="w-10 h-1.5 bg-black/10 rounded-full" />
                </div>
              </div>
            </div>

            {/* TEXT CONTENT */}
            <div className="space-y-2 max-w-xs mx-auto">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 bg-amber-500/15 px-3 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                <span>Great job!</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight leading-snug">
                Your storefront now <br />
                looks professional.
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm font-medium leading-relaxed pt-1">
                Now let's give customers something to buy. Add your first product to start receiving WhatsApp orders.
              </p>
            </div>

            {/* ACTION BUTTON */}
            <button
              onClick={handleAddFirstProduct}
              className="w-full h-14 bg-[#C6FF00] hover:bg-[#b8eb00] text-black font-extrabold text-base rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-[#C6FF00]/20"
            >
              <span>Add First Product</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </motion.div>
        )}

      </div>
    </AnimatePresence>
  );
};

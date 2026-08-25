import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, Check, ImageOff } from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_0000000018cc81f484c84af953e86338.png',
    shortLabel: 'Start here',
    eyebrow: 'Account access',
    title: 'Log in or create your shop',
    description: 'Use Log In if you already have an account, or choose Get Started to create your ThreadZW shop.',
    tip: 'Keep your email and password safe so you can return to your dashboard anytime.'
  },
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_00000000e54c8246b0ef327984326b75.png',
    shortLabel: 'Add products',
    eyebrow: 'Build your catalogue',
    title: 'Add your first product',
    description: 'Open Add Product from Quick Actions or use the plus button to list your first item.',
    tip: 'Use a clear photo and include the price, available sizes, colours, and a short description.'
  },
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_00000000ad7c81f4a9ca283392e8bd37.png',
    shortLabel: 'Contact & directions',
    eyebrow: 'Help customers reach you',
    title: 'Set your WhatsApp and directions',
    description: 'Add the WhatsApp number customers should message and short directions to your physical shop.',
    tip: 'Mention a landmark, building, floor, or shop number so a first-time visitor can find you.'
  },
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_00000000b04081f4bf35206b09da3e46.png',
    shortLabel: 'Add your branding',
    eyebrow: 'Make the shop recognizable',
    title: 'Add your logo and banner',
    description: 'Upload a profile photo or logo and a banner that represent your clothing brand and style.',
    tip: 'A clear logo and banner make customers trust your shop and recognize it when they return.'
  },
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_000000007a7881f4a37067f6e6393557.png',
    shortLabel: 'Share your link',
    eyebrow: 'Turn views into enquiries',
    title: 'Share your store link',
    description: 'Copy your storefront link from the dashboard and send one link with all your products to customers everywhere.',
    tip: 'Add it to your Instagram bio and share it on WhatsApp, TikTok, Facebook, status updates, and flyers.'
  }
] as const;

interface TutorialModalProps {
  shopId: string;
  onComplete: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ shopId, onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const step = TUTORIAL_STEPS[currentScreen - 1];

  const handleComplete = () => {
    if (shopId) {
      try {
        localStorage.setItem(`threadzw_tutorial_completed_${shopId}`, 'true');
      } catch (_) {}
    }
    onComplete();
  };

  const handleNext = () => {
    if (currentScreen < TUTORIAL_STEPS.length) setCurrentScreen(previous => previous + 1);
    else handleComplete();
  };

  const handleBack = () => {
    if (currentScreen > 1) setCurrentScreen(previous => previous - 1);
  };

  try {
    if (shopId && localStorage.getItem(`threadzw_tutorial_completed_${shopId}`) === 'true') return null;
  } catch (_) {}

  const renderImage = () => {
    if (imageErrors[currentScreen]) {
      return (
        <div className="w-full h-full bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#bef715] text-black flex items-center justify-center shadow-lg mb-4">
            <ImageOff size={24} strokeWidth={2.5} />
          </div>
          <strong className="text-sm font-black">{step.title}</strong>
          <span className="text-[11px] text-zinc-400 mt-1.5">Use the guidance below to complete this step.</span>
        </div>
      );
    }

    return (
      <img
        src={step.image}
        alt={`${step.title} tutorial screenshot`}
        referrerPolicy="no-referrer"
        onError={() => setImageErrors(previous => ({ ...previous, [currentScreen]: true }))}
        className="w-full h-full object-contain"
        loading={currentScreen === 1 ? 'eager' : 'lazy'}
        decoding="async"
      />
    );
  };

  return (
    <AnimatePresence>
      <div
        id="tutorial-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/80 backdrop-blur-md select-none overflow-y-auto"
      >
        <motion.div
          id="tutorial-card-container"
          key={`tutorial-screen-${currentScreen}`}
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -12 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[430px] bg-white rounded-[28px] sm:rounded-[34px] p-4 sm:p-6 flex flex-col shadow-2xl relative border border-white/60 my-auto max-h-[94vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between w-full mb-4 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {currentScreen > 1 ? (
                <button
                  id="tutorial-back-btn"
                  onClick={handleBack}
                  className="p-2 -ml-1 rounded-xl text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
                  title="Previous step"
                  aria-label="Previous tutorial step"
                >
                  <ArrowLeft size={19} strokeWidth={2.5} />
                </button>
              ) : (
                <div className="flex items-center text-lg font-black tracking-tight select-none">
                  <span className="text-zinc-950">Thread</span>
                  <span className="text-[#96D100] ml-0.5">ZW</span>
                </div>
              )}
              <div className="h-5 w-px bg-zinc-200" />
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 truncate">Quick tour</span>
            </div>

            <button
              id="tutorial-skip-top-btn"
              onClick={handleComplete}
              className="text-[10px] font-black tracking-wider uppercase text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer shrink-0 ml-3"
            >
              Skip
            </button>
          </div>

          <div className="flex items-center justify-between mb-3 px-0.5">
            <div className="flex items-center gap-1.5">
              {TUTORIAL_STEPS.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index + 1 === currentScreen ? 'w-7 bg-[#bef715]' : index + 1 < currentScreen ? 'w-1.5 bg-[#96D100]' : 'w-1.5 bg-zinc-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              {currentScreen} / {TUTORIAL_STEPS.length} · {step.shortLabel}
            </span>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="relative w-full h-[275px] sm:h-[345px] rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-950 shadow-inner border border-zinc-200/70 flex items-center justify-center">
              {renderImage()}
              <div className="absolute top-3 left-3 rounded-full bg-black/65 backdrop-blur-sm text-white px-2.5 py-1 text-[10px] font-black tracking-wider">
                STEP {currentScreen}
              </div>
            </div>

            <div className="w-full pt-4 sm:pt-5">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#3b6d05] bg-[#edf8d6] px-3 py-1 rounded-full border border-lime-200/70">
                <Check size={12} strokeWidth={3} />
                <span>{step.eyebrow}</span>
              </div>
              <h2 className="text-[25px] sm:text-[28px] leading-[1.05] font-black text-zinc-950 tracking-tight mt-3">
                {step.title}
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm font-medium leading-relaxed max-w-sm mx-auto mt-2.5">
                {step.description}
              </p>
              <div className="mt-3 mx-auto max-w-sm rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-left flex gap-2.5 items-start">
                <span className="text-[#96D100] text-sm leading-none mt-0.5">✦</span>
                <p className="text-[11px] text-zinc-600 leading-relaxed font-medium">{step.tip}</p>
              </div>
            </div>
          </div>

          <div className="w-full pt-4 mt-1 flex flex-col gap-2 shrink-0">
            <button
              id={currentScreen === 1 ? 'tutorial-show-around-btn' : currentScreen === TUTORIAL_STEPS.length ? 'tutorial-finish-btn' : 'tutorial-next-btn'}
              onClick={handleNext}
              className="w-full h-12 sm:h-13 bg-[#bef715] hover:bg-[#aeea0a] active:scale-[0.99] text-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-lime-400/20"
            >
              <span>{currentScreen === 1 ? 'START THE TOUR' : currentScreen === TUTORIAL_STEPS.length ? 'GO TO DASHBOARD' : 'NEXT STEP'}</span>
              <ArrowRight size={17} strokeWidth={3} />
            </button>
            <button
              id={currentScreen === TUTORIAL_STEPS.length ? 'tutorial-finish-skip-btn' : currentScreen === 1 ? 'tutorial-skip-bottom-btn' : 'tutorial-skip-step-btn'}
              onClick={handleComplete}
              className="w-full py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              Skip tutorial
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

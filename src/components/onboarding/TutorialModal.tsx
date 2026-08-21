import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const TUTORIAL_IMAGES = {
  intro: "https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_0000000018cc81f484c84af953e86338.png",
  edits: "https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_00000000e54c8246b0ef327984326b75.png",
  products: "https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_00000000ad7c81f4a9ca283392e8bd37.png",
  copyLink: "https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_00000000b04081f4bf35206b09da3e46.png",
  shareLink: "https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_000000007a7881f4a37067f6e6393557.png",
};

interface TutorialModalProps {
  shopId: string;
  onComplete: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ shopId, onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState<number>(1);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const handleComplete = () => {
    if (shopId) {
      try {
        localStorage.setItem(`threadzw_tutorial_completed_${shopId}`, 'true');
      } catch (e) {}
    }
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleNext = () => {
    if (currentScreen < 5) {
      setCurrentScreen(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentScreen > 1) {
      setCurrentScreen(prev => prev - 1);
    }
  };

  try {
    if (shopId && localStorage.getItem(`threadzw_tutorial_completed_${shopId}`) === 'true') {
      return null;
    }
  } catch (e) {}

  const renderImageOrFallback = (screenNum: number, src: string, alt: string) => {
    if (imageErrors[screenNum]) {
      return (
        <div className="w-full h-48 sm:h-56 bg-zinc-950 text-white rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black opacity-80" />
          <div className="relative z-10 flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#bef715] text-black font-black flex items-center justify-center text-lg shadow-md">
              TW
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">{alt}</span>
            <span className="text-[11px] text-zinc-400 font-medium">ThreadZW Storefront Preview</span>
          </div>
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onError={() => setImageErrors(prev => ({ ...prev, [screenNum]: true }))}
        className="w-full max-h-[310px] sm:max-h-[350px] object-contain rounded-xl sm:rounded-2xl"
        loading="eager"
      />
    );
  };

  return (
    <AnimatePresence>
      <div 
        id="tutorial-backdrop" 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md select-none overflow-y-auto"
      >
        <motion.div
          id="tutorial-card-container"
          key={`tutorial-screen-${currentScreen}`}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[430px] bg-white rounded-[32px] sm:rounded-[36px] p-5 sm:p-7 flex flex-col justify-between shadow-2xl relative border border-zinc-100 my-auto max-h-[94vh] overflow-y-auto"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between w-full mb-3 shrink-0">
            <div className="flex items-center gap-2">
              {currentScreen > 1 ? (
                <button
                  id="tutorial-back-btn"
                  onClick={handleBack}
                  className="p-1.5 -ml-1.5 rounded-xl text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                  title="Previous step"
                >
                  <ArrowLeft size={20} className="stroke-[2.5]" />
                </button>
              ) : (
                <div className="flex items-center text-lg font-black tracking-tight select-none">
                  <span className="text-zinc-950">Thread</span>
                  <span className="text-[#96D100] ml-0.5">ZW</span>
                </div>
              )}
            </div>

            {/* Progress indicator for tutorial steps (Screens 2-5 -> Steps 1-4) */}
            {currentScreen > 1 && (
              <div className="flex items-center gap-1.5 bg-zinc-100 px-3 py-1 rounded-full">
                <span className="text-xs font-bold text-zinc-800">
                  {currentScreen - 1} / 4
                </span>
                <span className="text-[11px] font-medium text-zinc-500">
                  {currentScreen === 2 ? '• Edit Shop' : currentScreen === 3 ? '• Products' : currentScreen === 4 ? '• Copy Link' : '• Share Link'}
                </span>
              </div>
            )}

            <button
              id="tutorial-skip-top-btn"
              onClick={handleSkip}
              className="text-xs font-bold tracking-wider uppercase text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              SKIP TUTORIAL
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center text-center my-1 space-y-3.5">
            {currentScreen === 1 && (
              /* SCREEN 1: INTRODUCTION ("Your shop is ready.") */
              <div className="w-full flex flex-col items-center space-y-3.5">
                {/* Large Featured Tutorial Screenshot */}
                <div className="w-full bg-[#f8fafc] border border-zinc-100 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex items-center justify-center overflow-hidden shadow-inner">
                  {renderImageOrFallback(1, TUTORIAL_IMAGES.intro, "ThreadZW Storefront Preview")}
                </div>

                {/* Text Content */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="inline-flex items-center justify-center text-xs font-semibold text-[#3b6d05] bg-[#edf8d6] px-3.5 py-0.5 rounded-full border border-lime-200/40">
                    <span>Welcome</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                    Your shop is ready.
                  </h2>
                  <p className="text-zinc-500 text-xs sm:text-sm font-medium leading-relaxed max-w-xs mx-auto">
                    Take a quick tour. This will only take a few seconds to show you around.
                  </p>
                </div>
              </div>
            )}

            {currentScreen === 2 && (
              /* SCREEN 2: EDIT YOUR SHOP */
              <div className="w-full flex flex-col items-center space-y-3.5">
                <div className="w-full bg-[#f8fafc] border border-zinc-100 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex items-center justify-center overflow-hidden shadow-inner">
                  {renderImageOrFallback(2, TUTORIAL_IMAGES.edits, "Edit Your Shop")}
                </div>
                <div className="space-y-1 text-center w-full px-1">
                  <h3 className="text-xl font-bold text-zinc-950 tracking-tight">Edit Your Shop</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
                    Customize your shop name, logo, banner, bio, and directions so customers instantly recognize your brand.
                  </p>
                </div>
              </div>
            )}

            {currentScreen === 3 && (
              /* SCREEN 3: ADD PRODUCTS */
              <div className="w-full flex flex-col items-center space-y-3.5">
                <div className="w-full bg-[#f8fafc] border border-zinc-100 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex items-center justify-center overflow-hidden shadow-inner">
                  {renderImageOrFallback(3, TUTORIAL_IMAGES.products, "Add Products")}
                </div>
                <div className="space-y-1 text-center w-full px-1">
                  <h3 className="text-xl font-bold text-zinc-950 tracking-tight">Add Products</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
                    Easily add items to your catalog with photos, prices, and stock counts to manage and sell your inventory.
                  </p>
                </div>
              </div>
            )}

            {currentScreen === 4 && (
              /* SCREEN 4: COPY YOUR SHOP LINK */
              <div className="w-full flex flex-col items-center space-y-3.5">
                <div className="w-full bg-[#f8fafc] border border-zinc-100 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex items-center justify-center overflow-hidden shadow-inner">
                  {renderImageOrFallback(4, TUTORIAL_IMAGES.copyLink, "Copy Your Shop Link")}
                </div>
                <div className="space-y-1 text-center w-full px-1">
                  <h3 className="text-xl font-bold text-zinc-950 tracking-tight">Copy Your Shop Link</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
                    Quickly copy your unique storefront link from the dashboard to share with buyers anywhere.
                  </p>
                </div>
              </div>
            )}

            {currentScreen === 5 && (
              /* SCREEN 5: SHARE & USE YOUR LINK */
              <div className="w-full flex flex-col items-center space-y-3.5">
                <div className="w-full bg-[#f8fafc] border border-zinc-100 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex items-center justify-center overflow-hidden shadow-inner">
                  {renderImageOrFallback(5, TUTORIAL_IMAGES.shareLink, "Share & Use Your Link")}
                </div>
                <div className="space-y-1 text-center w-full px-1">
                  <h3 className="text-xl font-bold text-zinc-950 tracking-tight">Share & Use Your Link</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
                    Share your link on WhatsApp, Instagram, TikTok, Facebook, status updates, flyers, and more to receive instant orders.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="w-full pt-3 mt-1 flex flex-col gap-2 shrink-0">
            {currentScreen === 1 ? (
              <>
                <button
                  id="tutorial-show-around-btn"
                  onClick={handleNext}
                  className="w-full h-13 sm:h-14 bg-[#bef715] hover:bg-[#b0eb07] active:scale-[0.99] text-black font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-lime-400/20"
                >
                  <span>SHOW ME AROUND</span>
                  <ArrowRight size={18} className="stroke-[3]" />
                </button>
                <button
                  id="tutorial-skip-bottom-btn"
                  onClick={handleSkip}
                  className="w-full py-1 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  SKIP TUTORIAL
                </button>
              </>
            ) : currentScreen < 5 ? (
              <>
                <button
                  id="tutorial-next-btn"
                  onClick={handleNext}
                  className="w-full h-13 sm:h-14 bg-[#bef715] hover:bg-[#b0eb07] active:scale-[0.99] text-black font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-lime-400/20"
                >
                  <span>NEXT</span>
                  <ArrowRight size={18} className="stroke-[3]" />
                </button>
                <button
                  id="tutorial-skip-step-btn"
                  onClick={handleSkip}
                  className="w-full py-1 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  SKIP TUTORIAL
                </button>
              </>
            ) : (
              <>
                <button
                  id="tutorial-finish-btn"
                  onClick={handleNext}
                  className="w-full h-13 sm:h-14 bg-[#bef715] hover:bg-[#b0eb07] active:scale-[0.99] text-black font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-lime-400/20"
                >
                  <span>GO TO DASHBOARD</span>
                  <ArrowRight size={18} className="stroke-[3]" />
                </button>
                <button
                  id="tutorial-finish-skip-btn"
                  onClick={handleSkip}
                  className="w-full py-1 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  SKIP TUTORIAL
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

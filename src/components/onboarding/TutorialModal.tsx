import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, X, Sparkles, CheckCircle2 } from 'lucide-react';

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none">
        <motion.div
          key={`tutorial-screen-${currentScreen}`}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] bg-white rounded-[32px] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative border border-zinc-100 min-h-[520px]"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-2">
              {currentScreen > 1 ? (
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 rounded-xl text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                  title="Previous step"
                >
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <div className="flex items-center text-sm font-black tracking-tight">
                  <span className="text-black">Thread</span>
                  <span className="text-[#96D100] ml-0.5">ZW</span>
                </div>
              )}
            </div>

            {/* Progress indicator for tutorial steps (Screens 2-5 -> Steps 1-4) */}
            {currentScreen > 1 ? (
              <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1 rounded-full">
                <span className="text-xs font-bold text-zinc-800">
                  {currentScreen - 1} / 4
                </span>
                <span className="text-[11px] font-medium text-zinc-500">
                  {currentScreen === 2 ? '— Edit Shop' : currentScreen === 3 ? '— Products' : currentScreen === 4 ? '— Copy Link' : '— Share Link'}
                </span>
              </div>
            ) : (
              <button
                onClick={handleSkip}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                Skip tutorial
              </button>
            )}

            {currentScreen > 1 && (
              <button
                onClick={handleSkip}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                Skip
              </button>
            )}
          </div>

          {/* Center Content based on screen */}
          <div className="flex-1 flex flex-col items-center justify-center text-center my-2 space-y-4">
            {currentScreen === 1 && (
              /* SCREEN 1: INTRODUCTION */
              <div className="space-y-4 w-full">
                <div className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl overflow-hidden p-2 flex items-center justify-center">
                  <img
                    src={TUTORIAL_IMAGES.intro}
                    alt="Welcome to ThreadZW"
                    style={{ objectFit: 'contain' }}
                    className="w-full h-40 sm:h-44 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-black text-lime-700 bg-lime-500/10 px-3.5 py-1 rounded-full">
                    <span>Welcome</span>
                  </div>
                  <h2 className="text-2xl font-black text-zinc-950 tracking-tight">
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
              <div className="space-y-4 w-full">
                <div className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl overflow-hidden p-3 flex items-center justify-center">
                  <img
                    src={TUTORIAL_IMAGES.edits}
                    alt="Edit your shop"
                    style={{ objectFit: 'contain' }}
                    className="w-full h-44 sm:h-48 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Edit Your Shop</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Customize your shop name, logo, banner, bio, and directions so customers instantly recognize your brand.
                  </p>
                </div>
              </div>
            )}

            {currentScreen === 3 && (
              /* SCREEN 3: ADD PRODUCTS */
              <div className="space-y-4 w-full">
                <div className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl overflow-hidden p-3 flex items-center justify-center">
                  <img
                    src={TUTORIAL_IMAGES.products}
                    alt="Add products"
                    style={{ objectFit: 'contain' }}
                    className="w-full h-44 sm:h-48 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Add Products</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Easily add items to your catalog with photos, prices, and stock counts to manage and sell your inventory.
                  </p>
                </div>
              </div>
            )}

            {currentScreen === 4 && (
              /* SCREEN 4: COPY YOUR SHOP LINK */
              <div className="space-y-4 w-full">
                <div className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl overflow-hidden p-3 flex items-center justify-center">
                  <img
                    src={TUTORIAL_IMAGES.copyLink}
                    alt="Copy your shop link"
                    style={{ objectFit: 'contain' }}
                    className="w-full h-44 sm:h-48 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Copy Your Shop Link</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Quickly copy your unique storefront link from the dashboard to share with buyers anywhere.
                  </p>
                </div>
              </div>
            )}

            {currentScreen === 5 && (
              /* SCREEN 5: SHARE & USE YOUR LINK */
              <div className="space-y-4 w-full">
                <div className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl overflow-hidden p-3 flex items-center justify-center">
                  <img
                    src={TUTORIAL_IMAGES.shareLink}
                    alt="Share and use your link"
                    style={{ objectFit: 'contain' }}
                    className="w-full h-44 sm:h-48 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Share & Use Your Link</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Share your link on WhatsApp, Instagram, TikTok, Facebook, status updates, flyers, and more to receive instant orders.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="w-full pt-4 mt-2 border-t border-zinc-100 flex flex-col gap-2.5">
            {currentScreen === 1 ? (
              <>
                <button
                  onClick={handleNext}
                  className="w-full h-14 bg-[#96D100] hover:bg-[#85b800] text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md shadow-lime-500/20"
                >
                  <span>Show me around</span>
                  <ArrowRight size={18} className="stroke-[2.5]" />
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                >
                  Skip tutorial
                </button>
              </>
            ) : currentScreen < 5 ? (
              <button
                onClick={handleNext}
                className="w-full h-14 bg-[#96D100] hover:bg-[#85b800] text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md shadow-lime-500/20"
              >
                <span>Next</span>
                <ArrowRight size={18} className="stroke-[2.5]" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full h-14 bg-[#96D100] hover:bg-[#85b800] text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md shadow-lime-500/20"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={18} className="stroke-[2.5]" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

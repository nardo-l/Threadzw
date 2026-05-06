import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const slides = [
  {
    emoji: '🧵',
    title: "You're about to open your shop.",
    body: "Thousands of buyers in Zimbabwe are looking for what you sell. Let's get you in front of them."
  },
  {
    emoji: '⚡',
    title: "Set up in under 2 minutes.",
    body: "Add your shop name, your products, and your directions. That's it. Buyers find you and reach out on WhatsApp."
  },
  {
    emoji: '📦',
    title: "Every new drop becomes a story.",
    body: "When you list something new it automatically appears as a story in the feed. Your followers see it first."
  },
  {
    emoji: '💰',
    title: "20 days completely free.",
    body: "No payment needed to start. Your first 20 days are on us. After that it's just $4 or $8 a month."
  },
  {
    emoji: '🔥',
    title: "Zimbabwe's closet is waiting.",
    body: "You're joining the platform built for local fashion. Let's set up your shop."
  }
];

interface SellerOnboardingProps {
  onComplete: () => void;
}

export const SellerOnboarding: React.FC<SellerOnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleSkip = () => {
    localStorage.setItem('thread_shop_onboarding_done', 'true');
    onComplete();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      localStorage.setItem('thread_shop_onboarding_done', 'true');
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <button 
        onClick={handleSkip}
        className="absolute top-12 right-6 text-[#888] text-[13px] font-medium"
      >
        Skip
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <span className="text-[64px] mb-5">{slides[currentSlide].emoji}</span>
            <h2 className="text-white text-[26px] font-bold leading-[1.2] mb-3 max-w-[280px]">
              {slides[currentSlide].title}
            </h2>
            <p className="text-[#888] text-[15px] leading-[1.6] max-w-[280px]">
              {slides[currentSlide].body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-20 flex flex-col items-center w-full">
        <div className="flex gap-2 mb-8">
          {slides.map((_, i) => (
            <div 
              key={i}
              className={`h-[6px] rounded-full transition-all duration-300 ${currentSlide === i ? 'w-[18px] bg-[#FF2D78]' : 'w-[6px] bg-[#333]'}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white font-bold text-[14px] px-[40px] py-[14px] rounded-full shadow-lg"
        >
          {currentSlide === slides.length - 1 ? "Let's Build →" : "Next →"}
        </button>
      </div>
    </div>
  );
};

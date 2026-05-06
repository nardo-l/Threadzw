import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';

const SLIDES = [
  {
    id: 'welcome',
    emoji: '🧵',
    title: "Welcome to Thread ZW",
    body: "Zimbabwe's fashion marketplace. Discover local brands, thrift shops, and sneaker stores all in one place.",
    bg: '#000000'
  },
  {
    id: 'browse',
    emoji: '🛍️',
    title: "Browse & Discover",
    body: "Scroll through hundreds of local products. Find your fit from shops across Zimbabwe.",
    bg: '#000000'
  },
  {
    id: 'sell',
    emoji: '📦',
    title: "Sell on Thread ZW",
    body: "Open your shop in 2 minutes. List products, reach buyers, and grow your brand.",
    bg: '#000000'
  },
  {
    id: 'quiz',
    emoji: '🔥',
    title: "Discover Your Style",
    body: "Take the How Fly Are You? quiz and find out your style personality. Share your result to Instagram Stories.",
    bg: '#000000'
  },
  {
    id: 'dresser',
    emoji: '🏆',
    title: "Best Dresser Contest",
    body: "Compete monthly for the title of Zimbabwe's Best Dresser. Win $30 cash. Coming soon.",
    bg: '#000000',
    comingSoon: true
  },
  {
    id: 'stories',
    emoji: '✨',
    title: "New Drop Stories",
    body: "When a shop adds something new it appears as a story. Be the first to see fresh drops from shops you follow.",
    bg: '#000000'
  }
];

interface Props {
  onComplete: () => void;
}

export const OnboardingSlides: React.FC<Props> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col overflow-hidden select-none font-sans">
      {/* Skip Button */}
      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={handleSkip}
          className="text-[#888] text-[13px] font-medium px-2 py-1 hover:text-white transition-colors"
        >
          Skip
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={`slide-${currentSlide}`}
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col"
        >
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[120px] mb-12"
            >
              {SLIDES[currentSlide].emoji}
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-[32px] font-bold text-white leading-tight">
                {SLIDES[currentSlide].title}
              </h2>
              
              <p className="mt-4 text-[#888] text-[15px] leading-relaxed">
                {SLIDES[currentSlide].body}
              </p>

              {SLIDES[currentSlide].comingSoon && (
                <div className="mt-6 flex justify-center">
                  <div className="bg-linear-to-r from-[#9B27AF] to-[#FF2D78] px-[14px] py-[5px] rounded-full">
                    <span className="text-white text-[11px] font-bold uppercase tracking-wider">COMING SOON</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Footer Controls */}
          <div className="p-8 pb-12 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-3">
              <span className="text-[#555] text-[11px] font-bold uppercase tracking-widest">
                Step {currentSlide + 1} of {SLIDES.length}
              </span>
              <div className="flex gap-2">
                {SLIDES.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlide ? 'bg-[#FF2D78] w-6' : 'bg-[#222] w-1.5'
                    }`} 
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={handleNextSlide} 
              className="w-full h-[52px] rounded-full font-bold text-[14px] bg-[#FF2D78] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              {currentSlide === SLIDES.length - 1 ? 'Continue' : 'Next'} <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

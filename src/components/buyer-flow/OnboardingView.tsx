import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useInventory } from '../../context/InventoryContext';

export const OnboardingView: React.FC = () => {
  const { setBuyerFlowState, setOnboardingComplete } = useInventory();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      emoji: '🔥',
      title: "Zimbabwe's Closet",
      body: "Discover local clothing brands, thrift shops, and sneaker stores all in one place.",
    },
    {
      emoji: '🏆',
      title: "Best Dresser of the Month",
      body: "Compete monthly. Tag @threadzw on Instagram. Win $30 cash.",
    },
    {
      emoji: '✨',
      title: "How Fly Are You?",
      body: "Take the quiz. Get your style personality. Share your result card to Instagram Stories.",
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setOnboardingComplete(true);
      setBuyerFlowState('home');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white relative p-8">
      {/* Skip Button */}
      <button 
        onClick={() => {
          setOnboardingComplete(true);
          setBuyerFlowState('home');
        }}
        className="absolute top-10 right-8 text-[#888888] text-[14px] font-bold z-10"
      >
        Skip
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex flex-col items-center max-w-[320px]"
          >
            <div className="w-32 h-32 bg-[#F5F5F5] rounded-[40px] flex items-center justify-center text-[64px] mb-10 shadow-sm">
              {slides[currentSlide].emoji}
            </div>
            <h2 className="text-[#111111] font-bold text-[32px] mt-2 leading-tight tracking-tight">
              {slides[currentSlide].title}
            </h2>
            <p className="text-[#888888] text-[17px] mt-4 leading-relaxed">
              {slides[currentSlide].body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation section */}
      <div className="flex flex-col items-center pb-12">
        {/* Pagination Dots */}
        <div className="flex items-center gap-2.5 mb-10">
          {slides.map((_, i) => (
            <motion.div 
              key={`onboarding-dot-${i}`}
              animate={{ 
                width: i === currentSlide ? 24 : 8,
                backgroundColor: i === currentSlide ? '#FF5FA2' : '#EEEEEE'
              }}
              className="h-2 rounded-full"
            />
          ))}
        </div>

        {/* CTA Button */}
        <button 
          onClick={handleNext}
          className="w-full h-16 rounded-[24px] bg-gradient-to-br from-[#9B27AF] to-[#FF5FA2] text-white font-bold text-[16px] shadow-xl shadow-pink-500/20 flex items-center justify-center active:scale-[0.98] transition-all"
        >
          {currentSlide === slides.length - 1 ? "Start Shopping" : "Next Step"}
        </button>
      </div>
    </div>
  );
};

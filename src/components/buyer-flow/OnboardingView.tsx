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
    <div className="flex flex-col min-h-screen bg-black relative p-6">
      {/* Skip Button */}
      <button 
        onClick={() => {
          setOnboardingComplete(true);
          setBuyerFlowState('home');
        }}
        className="absolute top-8 right-6 text-[#888888] text-[13px] font-medium z-10"
      >
        Skip
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex flex-col items-center max-w-[300px]"
          >
            <div className="text-[80px] mb-6">{slides[currentSlide].emoji}</div>
            <h2 className="text-white font-bold text-[28px] mt-6 leading-tight">
              {slides[currentSlide].title}
            </h2>
            <p className="text-[#888888] text-[15px] mt-3">
              {slides[currentSlide].body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation section */}
      <div className="flex flex-col items-center pb-10">
        {/* Pagination Dots */}
        <div className="flex items-center gap-2 mb-6">
          {slides.map((_, i) => (
            <motion.div 
              key={i}
              animate={{ 
                width: i === currentSlide ? 18 : 6,
                backgroundColor: i === currentSlide ? '#FF2D78' : '#333333'
              }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>

        {/* CTA Button */}
        <button 
          onClick={handleNext}
          className="w-[160px] h-[52px] rounded-full bg-linear-to-br from-[#9B27AF] to-[#FF2D78] text-white font-bold text-[15px] shadow-lg flex items-center justify-center active:scale-[0.98] transition-transform"
        >
          {currentSlide === slides.length - 1 ? "Let's Go →" : "Next →"}
        </button>
      </div>
    </div>
  );
};

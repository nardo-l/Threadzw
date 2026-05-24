import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';

const SLIDES = [
  {
    id: 'welcome',
    emoji: '🚀',
    title: "The Future of Selling in Zim",
    body: "Turn your inventory into a professional WhatsApp-ready storefront. The easiest way to sell online in Zimbabwe.",
    bg: '#000000'
  },
  {
    id: 'storefront',
    emoji: '🏪',
    title: "Pro Storefronts",
    body: "Deploy your shop link in minutes. No complex code, just your products and a clean link to share.",
    bg: '#000000'
  },
  {
    id: 'whatsapp',
    emoji: '💬',
    title: "Direct WhatsApp",
    body: "Receive orders directly in your WhatsApp inbox. No middlemen. Just real business conversations.",
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
    <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden select-none font-sans bg-[#0d0d0d]">
      {/* Skip Button */}
      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={handleSkip}
          className="text-[13px] font-medium px-2 py-1 transition-colors text-[#555]"
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
              className="text-[120px] mb-8"
            >
              {SLIDES[currentSlide].emoji}
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-[32px] font-syne font-black uppercase italic tracking-tighter leading-tight text-white">
                {SLIDES[currentSlide].title}
              </h2>
              
              <p className="mt-4 text-[15px] font-medium leading-relaxed text-zinc-500">
                {SLIDES[currentSlide].body}
              </p>
            </motion.div>
          </div>

          {/* Footer Controls */}
          <div className="p-8 pb-12 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#333]">
                Step {currentSlide + 1} of {SLIDES.length}
              </span>
              <div className="flex gap-2">
                {SLIDES.map((_, i) => (
                  <div 
                    key={`slide-indicator-${i}`} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlide ? 'w-8' : 'w-2'
                    }`} 
                    style={{ background: i === currentSlide ? '#C6FF00' : '#222' }}
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={handleNextSlide} 
              className="w-full h-16 rounded-full font-syne font-black uppercase italic tracking-widest text-[14px] text-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-[#C6FF00] shadow-xl shadow-[#C6FF0015]"
            >
              {currentSlide === SLIDES.length - 1 ? 'LAUNCH PROTOCOL' : 'NEXT SEQUENCE'} <ArrowRight size={18} strokeWidth={3} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

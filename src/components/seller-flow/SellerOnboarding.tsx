import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Star, Heart, Sparkles, Zap, Smartphone, Package, ShieldCheck, Globe } from 'lucide-react';

const slides = [
  {
    icon: <Smartphone size={40} className="text-[#C6FF00]" />,
    title: "the operational node.",
    body: "Transform your vision into a high-performance digital terminal designed for the modern elite."
  },
  {
    icon: <Zap size={40} className="text-lime" />,
    title: "deploy instantly.",
    body: "Minimal configuration, maximum throughput. Your inventory broadcasts globally via WhatsApp routing."
  },
  {
    icon: <Package size={40} className="text-[#C6FF00]" />,
    title: "inventory engine.",
    body: "Manage stock units and capture sales with an operating system built for high-demand storefronts."
  },
  {
    icon: <ShieldCheck size={40} className="text-lime" />,
    title: "verified identity.",
    body: "Build trust with curated aesthetics. Designed to close sales, not just showcase them."
  },
  {
    icon: <Globe size={40} className="text-[#C6FF00]" />,
    title: "sync once. live.",
    body: "Your commerce node is ready for initial deployment. The future of commerce is curated."
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
    <div className="fixed inset-0 bg-cream z-50 flex flex-col items-center justify-between py-16 px-8 overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-10 left-10 text-[#C6FF00]/10 -rotate-12"><Star size={100} fill="currentColor" /></div>
      <div className="absolute bottom-10 right-10 text-charcoal/5 rotate-45"><Sparkles size={120} /></div>

      <header className="w-full flex justify-between items-center relative z-10">
        <span className="text-xl font-display font-black tracking-tighter italic">thread<span className="text-[#C6FF00]">zw</span></span>
        <button onClick={handleSkip} className="text-charcoal/40 text-[10px] font-black uppercase tracking-widest italic hover:text-[#C6FF00] transition-colors">
           Bypass Protocol
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className="flex flex-col items-center"
          >
            <div className="mb-12 relative">
               <div className="w-28 h-28 glass rounded-full flex items-center justify-center border-charcoal border-2 shadow-[8px_8px_0_#C6FF00]">
                  {slides[currentSlide].icon}
               </div>
               <div className="absolute -top-4 -right-4"><Heart size={24} className="text-[#C6FF00]" fill="currentColor" /></div>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-display font-black mb-6 italic leading-[0.9]">
              {slides[currentSlide].title}
            </h2>
            
            <p className="italic-accent text-charcoal/60 text-lg mb-4">"The elite merchant operating system."</p>

            <p className="text-charcoal text-[13px] leading-tight font-bold uppercase tracking-wide">
              {slides[currentSlide].body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="w-full flex flex-col items-center gap-10 relative z-10 max-w-sm">
        <div className="flex gap-3">
          {slides.map((_, i) => (
            <div 
              key={`onboarding-slide-dot-${i}`}
              className={`h-2 rounded-full transition-all duration-500 border border-charcoal/20 ${currentSlide === i ? 'w-12 bg-[#C6FF00]' : 'w-2 bg-charcoal/10'}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full h-16 bg-charcoal text-cream rounded-full font-black text-sm uppercase tracking-widest shadow-[8px_8px_0_#C6FF00] active:scale-95 transition-all flex items-center justify-center gap-3 italic mb-4"
        >
          {currentSlide === slides.length - 1 ? "Initialize Node" : "Next Engagement"}
          <ArrowRight size={18} strokeWidth={3} />
        </button>
        
        <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Verified Infrastructure Node Established 2026</span>
      </footer>
    </div>
  );
};

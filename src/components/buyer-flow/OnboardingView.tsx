import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useInventory } from '../../context/InventoryContext';
import { 
  ChevronRight, 
  ArrowLeft, 
  Smartphone, 
  Trophy, 
  Sparkles, 
  ShoppingBag, 
  Instagram, 
  Check, 
  Flame, 
  TrendingUp, 
  Award,
  Link as LinkIcon 
} from 'lucide-react';

export const OnboardingView: React.FC = () => {
  const { setBuyerFlowState, setOnboardingComplete } = useInventory();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Zimbabwe's Closet",
      subtitle: "THE UNIFIED PLATFORM",
      body: "Discover local clothing brands, thrift shops, and sneaker stores all in one unified, professional, lightning-fast storefront.",
    },
    {
      title: "Best Dresser",
      subtitle: "MONTHLY COMMUNITY TOURNAMENT",
      body: "Compete in our monthly community tournament bracket. Tag @threadzw on your Instagram outfits to enter and win.",
    },
    {
      title: "How Fly Are You?",
      subtitle: "STYLE PERSONALITY QUIZ",
      body: "Take our interactive style quiz. Get your bespoke style personality card and share it directly to your Instagram Stories.",
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      localStorage.setItem('onboarding_slides_done', 'true');
      setOnboardingComplete(true);
      setBuyerFlowState('home');
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col font-sans select-none overflow-y-auto z-[40] selection:bg-[#bef715] selection:text-black">
      
      {/* Top Header Navigation */}
      <div className="w-full shrink-0 max-w-[480px] mx-auto px-6 pt-8">
        <div className="flex justify-between items-center py-4 relative z-20">
          {currentSlide > 0 ? (
            <button 
              type="button"
              onClick={handleBack}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-white active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2]" />
            </button>
          ) : (
            <span className="text-2xl font-black tracking-tighter text-[#bef715]">
              ThreadZW<span className="text-white">.</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              localStorage.setItem('onboarding_slides_done', 'true');
              setOnboardingComplete(true);
              setBuyerFlowState('home');
            }}
            className="text-xs font-black tracking-widest text-zinc-500 hover:text-white uppercase transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Custom Segmented Progress Bar */}
        <div className="w-full grid grid-cols-3 gap-2 mt-2 mb-4">
          <div className={`h-[3px] rounded-full transition-all duration-300 ${currentSlide >= 0 ? 'bg-[#bef715]' : 'bg-zinc-900'}`} />
          <div className={`h-[3px] rounded-full transition-all duration-300 ${currentSlide >= 1 ? 'bg-[#bef715]' : 'bg-zinc-900'}`} />
          <div className={`h-[3px] rounded-full transition-all duration-300 ${currentSlide >= 2 ? 'bg-[#bef715]' : 'bg-zinc-900'}`} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[480px] mx-auto px-6 my-4 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-full flex flex-col justify-center text-left space-y-6"
          >
            {/* Header copy */}
            <div className="space-y-2">
              <span className="text-xs font-black tracking-wider text-[#bef715] uppercase font-mono">
                {slides[currentSlide].subtitle}
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] uppercase">
                {slides[currentSlide].title.split('\n')[0]}<br />
                {slides[currentSlide].title.split('\n')[1] || ''}
              </h1>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed font-medium">
                {slides[currentSlide].body}
              </p>
            </div>

            {/* Custom Illustration depending on current step */}
            {currentSlide === 0 && (
              /* SLIDE 0: ZIMBABWE'S CLOSET ILLUSTRATION */
              <div className="relative w-full h-64 flex items-center justify-center my-6">
                <div className="absolute w-56 h-56 bg-[#bef715]/5 rounded-full blur-3xl -z-10 animate-pulse" />
                
                <div className="w-68 border border-zinc-900 rounded-2xl bg-zinc-950 p-4 shadow-2xl text-left relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#bef715]/30 to-transparent" />
                  
                  {/* Mock Shop Headers */}
                  <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-900/60 mb-3">
                    <div className="w-6 h-6 rounded-full bg-[#bef715]/10 border border-[#bef715]/20 flex items-center justify-center text-[#bef715] text-[10px] font-black">TZ</div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase leading-none">MALL DIRECTORY</h4>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Active Storefronts</span>
                    </div>
                  </div>

                  {/* List of active shops/genres */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-[#bef715]/20 transition-all cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center text-[10px] font-bold text-zinc-400">01</div>
                        <span className="text-xs font-black text-white uppercase">STREETWEAR LABELS</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-[#bef715] bg-[#bef715]/10 px-1.5 py-0.5 rounded">Active</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-[#bef715]/20 transition-all cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center text-[10px] font-bold text-zinc-400">02</div>
                        <span className="text-xs font-black text-white uppercase">SNEAKER STORES</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-[#bef715] bg-[#bef715]/10 px-1.5 py-0.5 rounded">Active</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-[#bef715]/20 transition-all cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center text-[10px] font-bold text-zinc-400">03</div>
                        <span className="text-xs font-black text-white uppercase">THRIFT BOUTIQUES</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-[#bef715] bg-[#bef715]/10 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentSlide === 1 && (
              /* SLIDE 1: BEST DRESSER OF THE MONTH ILLUSTRATION */
              <div className="relative w-full h-64 flex items-center justify-center my-6">
                <div className="absolute w-56 h-56 bg-[#bef715]/5 rounded-full blur-3xl -z-10 animate-pulse" />
                
                <div className="w-72 bg-zinc-950 border border-zinc-900 rounded-3xl p-4 space-y-3 shadow-2xl relative">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-900/40">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-[#bef715]" /> Live Bracket Tournament
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#bef715] bg-[#bef715]/10 px-1.5 py-0.5 rounded">Round 2</span>
                  </div>

                  {/* Face-off matchups */}
                  <div className="grid grid-cols-2 gap-3 relative pt-2">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 border border-zinc-800 rounded-full w-7 h-7 flex items-center justify-center text-[10px] font-black text-zinc-500 z-10">VS</div>
                    
                    <div className="bg-zinc-900 border border-[#bef715]/20 p-3 rounded-2xl flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 rounded-full bg-[#bef715]/10 border border-[#bef715] flex items-center justify-center text-[12px] font-black text-[#bef715]">TZ</div>
                      <span className="text-[10px] font-black text-white">@tawanda</span>
                      <span className="text-[9px] font-mono font-bold text-[#bef715]">58% votes</span>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-900 p-3 rounded-2xl flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[12px] font-black text-zinc-500">HN</div>
                      <span className="text-[10px] font-black text-zinc-400">@hnyasha</span>
                      <span className="text-[9px] font-mono font-bold text-zinc-500">42% votes</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentSlide === 2 && (
              /* SLIDE 2: HOW FLY ARE YOU ILLUSTRATION */
              <div className="relative w-full h-64 flex items-center justify-center my-6">
                <div className="absolute w-56 h-56 bg-[#bef715]/5 rounded-full blur-3xl -z-10 animate-pulse" />
                
                <div className="w-68 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 shadow-2xl text-left relative overflow-hidden transform rotate-1">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#bef715]/10 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-1.5 mb-3">
                    <Sparkles className="w-4 h-4 text-[#bef715] animate-pulse" />
                    <span className="text-[9px] font-black tracking-widest text-[#bef715] uppercase">Style Personality Card</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-900/60">
                      <h4 className="text-[14px] font-black text-white leading-tight uppercase">STREETWEAR ELITE</h4>
                      <p className="text-[10px] font-medium text-zinc-500 mt-1 leading-snug">You appreciate rare drops, oversized cuts, and statement accessories.</p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-400 border-t border-zinc-900/40 pt-2.5">
                      <span>Drip Score: 98%</span>
                      <span className="text-[#bef715] flex items-center gap-1 font-black uppercase text-[9px] tracking-wider">
                        <Instagram className="w-3.5 h-3.5 text-[#bef715]" /> Share to Story
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Dot Indicators and Main Action Button */}
      <div className="w-full shrink-0 max-w-[480px] mx-auto px-6 pb-12 mt-2">
        <div className="w-full space-y-6">
          <button
            type="button"
            onClick={handleNext}
            className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
          >
            <span>{currentSlide === slides.length - 1 ? "Start Shopping" : "Continue"}</span>
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Dot Indicator under button to keep alignment exact with Signup screen */}
          <div className="flex justify-center gap-2 pt-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`transition-all duration-300 rounded-full h-1.5 ${i === currentSlide ? 'w-6 bg-[#bef715]' : 'w-1.5 bg-zinc-800'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

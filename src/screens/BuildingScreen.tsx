import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store } from 'lucide-react';

interface BuildingScreenProps {
  setAppStage: (stage: any) => void;
  setPaywallScreen?: (screen: number) => void;
}

const CHECKLIST_ITEMS = [
  "Setting up your storefront...",
  "Generating your shop link...",
  "Configuring WhatsApp orders...",
  "Almost ready..."
];

export const BuildingScreen: React.FC<BuildingScreenProps> = ({
  setAppStage,
  setPaywallScreen
}) => {
  const [itemsVisible, setItemsVisible] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Prevent default back button behavior / popstate override for safety on this page
    const handlePushState = () => {
      window.history.pushState(null, '', window.location.pathname);
    };
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePushState);

    // Staggered check item appearance: 0.8s, 1.6s, 2.4s, 3.2s
    const timers: NodeJS.Timeout[] = [];
    CHECKLIST_ITEMS.forEach((_, idx) => {
      const timer = setTimeout(() => {
        setItemsVisible(prev => [...prev, idx]);
      }, idx * 800);
      timers.push(timer);
    });

    // Animate progress bar from 0 to 100% over 5 seconds
    const intervalTime = 50; // 50ms intervals
    const totalDuration = 5000;
    const steps = totalDuration / intervalTime;
    const increment = 100 / steps;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        return next >= 100 ? 100 : next;
      });
    }, intervalTime);

    // Redirect to Dashboard stage after exactly 5 seconds
    const redirectTimer = setTimeout(() => {
      setAppStage('dashboard');
    }, 5000);

    return () => {
      window.removeEventListener('popstate', handlePushState);
      timers.forEach(clearTimeout);
      clearInterval(progressInterval);
      clearTimeout(redirectTimer);
    };
  }, [setAppStage, setPaywallScreen]);

  return (
    <div id="shop-building-screen" className="fixed inset-0 bg-[#0a0a0a] text-white flex flex-col justify-between z-50 font-sans selection:bg-[#C6FF00]/30 select-none overflow-hidden">
      
      {/* WORDMARK TOP CENTER */}
      <div className="pt-12 text-center">
        <div className="flex justify-center mb-1">
          <img 
            src="https://4htrv9mv32e5k648.public.blob.vercel-storage.com/file_000000009c74724684851106c3e2946c.png" 
            alt="ThreadZW Logo" 
            referrerPolicy="no-referrer"
            className="h-10 w-auto object-contain" 
          />
        </div>
      </div>

      {/* LARGE ANIMATED ICON CENTER SCREEN & CHECKLIST */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-12">
        {/* Spinner/pulsing ring with Store Icon */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Glow */}
          <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.4, 0.15] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute w-32 h-32 rounded-full bg-[#C6FF00]"
          />
          {/* Spinning dashed circle border */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute w-28 h-28 rounded-full border-2 border-dashed border-[#C6FF00]"
          />
          {/* Inner Badge */}
          <div className="relative w-22 h-22 bg-[#121212] border border-white/10 rounded-full flex items-center justify-center text-[#C6FF00]">
            <Store className="w-10 h-10" />
          </div>
        </div>

        {/* Staggered Checklist */}
        <div className="w-full max-w-[280px] space-y-4">
          <AnimatePresence>
            {CHECKLIST_ITEMS.map((item, idx) => {
              const visible = itemsVisible.includes(idx);
              return (
                <div key={idx} className="h-6">
                  {visible && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-[#C6FF00] text-lg font-bold">✓</span>
                      <span className="text-white font-bold text-base tracking-tight">
                        {item}
                      </span>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Subtext below checklist */}
        <p className="text-white/40 text-xs text-center font-medium">
          This takes just a moment.
        </p>
      </div>

      {/* FULL WIDTH PROGRESS BAR AT BOTTOM */}
      <div className="w-full h-[3px] bg-white/5 relative">
        <div 
          style={{ width: `${progress}%` }} 
          className="h-full bg-[#C6FF00] transition-all duration-75 ease-out" 
        />
      </div>

    </div>
  );
};

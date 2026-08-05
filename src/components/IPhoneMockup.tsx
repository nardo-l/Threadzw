import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Wifi, Battery, Signal } from 'lucide-react';

interface IPhoneMockupProps {
  className?: string;
}

export function IPhoneMockup({ className = '' }: IPhoneMockupProps) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('09:41');

  // Update clock time to match real Zulu time / system time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours().toString().padStart(2, '0');
      let minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  // Fetch images from "shop-images" bucket dynamically
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase.storage.from('shop-images').list();
        
        if (!error && data && data.length > 0) {
          // Remove any hidden utility files e.g. .emptyFolderPlaceholder
          const filtered = data.filter(file => file.name && !file.name.startsWith('.'));
          
          if (filtered.length > 0) {
            const urls = filtered.map(file => {
              const { data: { publicUrl } } = supabase.storage.from('shop-images').getPublicUrl(file.name);
              return publicUrl;
            });
            setImages(urls);
            setLoading(false);
            return;
          }
        }
        
        // Dynamic fallback URLs if bucket listing returns zero items or errors
        setImages([
          'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/save%20it%20for%20later.jfif',
          'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/Puma%20Men\'s%20Trainers%20(1).jfif',
          'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/download%20(2).jfif'
        ]);
      } catch (err) {
        console.warn('Error reading from shop-images storage bucket:', err);
        setImages([
          'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/save%20it%20for%20later.jfif',
          'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/Puma%20Men\'s%20Trainers%20(1).jfif',
          'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/download%20(2).jfif'
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Cycle through screenshots every 5 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images]);

  return (
    <div className={`relative select-none ${className}`}>
      
      {/* 1. PHYSICAL ACCENTS & BUTTONS FRAME */}
      {/* Silent mode switch (Left side) */}
      <div className="absolute top-[80px] -left-[3px] w-[3px] h-[16px] bg-[#3a3a3a] rounded-l-md z-0" />
      {/* Volume Up button (Left side) */}
      <div className="absolute top-[120px] -left-[3px] w-[3px] h-[32px] bg-[#3a3a3a] rounded-l-md z-0" />
      {/* Volume Down button (Left side) */}
      <div className="absolute top-[165px] -left-[3px] w-[3px] h-[32px] bg-[#3a3a3a] rounded-l-md z-0" />
      {/* Power Button (Right side) */}
      <div className="absolute top-[140px] -right-[3px] w-[3px] h-[48px] bg-[#3a3a3a] rounded-r-md z-0" />

      {/* 2. MAIN IPHONE OUTER CASING */}
      <div className="bg-[#0D0D11] border-[10px] border-[#22222A] rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] p-1.5 relative overflow-hidden aspect-[9/19] w-full max-w-[270px] mx-auto z-10 flex flex-col">
        
        {/* Antenna line top indicator */}
        <div className="absolute top-[-5px] left-1/4 w-[1px] h-[5px] bg-[#1c1c24]" />
        
        {/* Screen inner boundary stroke */}
        <div className="bg-[#050508] w-full h-full rounded-[35px] relative overflow-hidden border border-white/[0.04] flex flex-col">
          
          {/* IPHONE DYNAMIC ISLAND */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90px] h-[24px] bg-black rounded-full z-[100] flex items-center justify-between px-3 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-[#111116] border border-white/[0.04]" /> {/* Camera Lens */}
            <div className="w-1.5 h-1.5 rounded-full bg-[#032202]/40 relative"> {/* Active Indicator LED */}
              <div className="absolute inset-0 bg-[#35EF14] rounded-full animate-pulse opacity-75" style={{ width: '4px', height: '4px', margin: 'auto' }} />
            </div>
          </div>

          {/* SPEAKER GRILLE UPPER EDGE */}
          <div className="absolute top-[1px] left-1/2 -translate-x-1/2 w-14 h-[2.5px] bg-black rounded-full z-[101]" />

          {/* IPHONE STATUS BAR */}
          <div className="absolute top-1.5 left-0 right-0 px-5 flex justify-between items-center z-50 text-[9px] text-white font-extrabold tracking-tight">
            <span>{currentTime}</span>
            <div className="flex items-center gap-1 opacity-80">
              <Signal size={9} strokeWidth={3} className="text-white" />
              <div className="text-[7.5px] font-sans scale-90 font-black">5G</div>
              <Wifi size={9} strokeWidth={3} className="text-white" />
              <Battery size={11} strokeWidth={2.5} className="text-white fill-white" />
            </div>
          </div>

          {/* IPHONE BOTTOM HOME SWIPE INDICATOR */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-[4px] bg-white/40 rounded-full z-50" />

          {/* 3. SCREEN SCREENSHOT DISPLAY AREA */}
          <div className="w-full h-full relative overflow-hidden bg-[#0A0A0E] flex-1 flex flex-col justify-center items-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#C6FF00] border-t-transparent animate-spin" />
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold">PREVIEWING...</span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 w-full h-full"
                >
                  <img
                    src={images[currentIndex]}
                    alt="iPhone Shop Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Glass reflection overlay for exact iPhone premium finish */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.12] pointer-events-none z-40" />
                </motion.div>
              </AnimatePresence>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}

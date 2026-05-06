import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, Home } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const EntrySuccessView: React.FC = () => {
  const { setCommunityScreen } = useInventory();

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Confetti Particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
           key={i}
           initial={{ 
             x: window.innerWidth / 2, 
             y: window.innerHeight / 2,
             scale: 0,
             opacity: 1
           }}
           animate={{ 
             x: Math.random() * window.innerWidth,
             y: Math.random() * window.innerHeight,
             scale: Math.random() * 0.5 + 0.5,
             opacity: 0,
             rotate: Math.random() * 360
           }}
           transition={{ 
             duration: 2 + Math.random() * 2, 
             ease: "easeOut",
             delay: Math.random() * 0.2
           }}
           className={`absolute w-3 h-3 rounded-sm ${i % 2 === 0 ? 'bg-[#FF2D78]' : 'bg-[#9B27AF]'}`}
        />
      ))}

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 10, stiffness: 100 }}
        className="relative mb-10"
      >
        <div className="absolute inset-0 bg-[#FF2D7833] blur-3xl animate-pulse" />
        <div className="w-[120px] h-[120px] bg-linear-to-br from-[#9B27AF] to-[#FF2D78] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,45,120,0.5)] relative z-10">
           <CheckCircle2 size={64} className="text-white" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h2 className="text-white text-[32px] font-black tracking-tight mb-4">Entry Received!</h2>
        <p className="text-[#888] text-[16px] leading-relaxed max-w-[280px] mx-auto">
          Your fit is being reviewed by the Thread team. We'll notify you if you make it to the <span className="text-white font-bold">April Bracket</span>.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full mt-12 space-y-3"
      >
        <button 
          onClick={() => setCommunityScreen('hub')}
          className="w-full h-[64px] bg-linear-to-r from-[#9B27AF] to-[#FF2D78] rounded-full text-white font-bold text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-transform"
        >
          <Home size={20} /> Back to Hub
        </button>
        <button 
          onClick={() => setCommunityScreen('bracket')}
          className="w-full h-[64px] border border-[#222] rounded-full text-[#888] font-bold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          View Current Bracket <ChevronRight size={18} />
        </button>
      </motion.div>

      {/* Info Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 px-4 py-2 bg-[#111] rounded-full border border-[#222] flex items-center gap-2"
      >
         <span className="w-2 h-2 bg-[#f59e0b] rounded-full animate-pulse" />
         <span className="text-[#888] text-[12px] font-medium uppercase tracking-widest leading-none">Reviewing Entries...</span>
      </motion.div>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, Home } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const EntrySuccessView: React.FC = () => {
  const { setCommunityScreen } = useInventory();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 overflow-hidden bg-[#F5F5F5]">
      {/* Confetti Particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
           key={`success-confetti-${i}`}
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
           className={`absolute w-3 h-3 rounded-sm`}
           style={{ background: i % 2 === 0 ? '#C6FF00' : '#9B27AF' }}
        />
      ))}

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 10, stiffness: 100 }}
        className="relative mb-10"
      >
        <div className="absolute inset-0 blur-3xl animate-pulse bg-[#C6FF00]/20" />
        <div className="w-[124px] h-[124px] rounded-full flex items-center justify-center shadow-2xl relative z-10 bg-gradient-to-br from-[#9B27AF] to-[#C6FF00]">
           <CheckCircle2 size={64} className="text-white" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h2 className="text-[32px] font-bold tracking-tight mb-4 text-[#111111]">Entry Received!</h2>
        <p className="text-[16px] leading-relaxed max-w-[280px] mx-auto text-[#888888]">
          Your fit is being reviewed. We'll notify you if you make it to the <span className="font-bold text-[#111111]">April Bracket</span>.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full mt-12 space-y-4"
      >
        <button 
          onClick={() => setCommunityScreen('hub')}
          className="w-full h-[64px] rounded-full text-white font-bold text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all bg-gradient-to-br from-[#9B27AF] to-[#C6FF00]"
        >
          <Home size={20} /> Back to Hub
        </button>
        <button 
          onClick={() => setCommunityScreen('bracket')}
          className="w-full h-[64px] border border-[#EFEFEF] rounded-full font-bold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-white text-[#888888]"
        >
          View Live Bracket <ChevronRight size={18} />
        </button>
      </motion.div>

      {/* Info Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 px-5 py-2.5 rounded-full border border-[#EFEFEF] flex items-center gap-2 bg-white shadow-sm"
      >
         <span className="w-2 h-2 rounded-full animate-pulse bg-[#FFC107]" />
         <span className="text-[12px] font-bold uppercase tracking-widest leading-none text-[#888888]">Reviewing Entries</span>
      </motion.div>
    </div>
  );
};

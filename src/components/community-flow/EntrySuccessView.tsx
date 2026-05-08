import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, Home } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../App';

export const EntrySuccessView: React.FC = () => {
  const t = useTheme();
  const { setCommunityScreen } = useInventory();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 overflow-hidden" style={{ background: t.bg_primary }}>
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
           className={`absolute w-3 h-3 rounded-sm`}
           style={{ background: i % 2 === 0 ? t.accent : '#9B27AF' }}
        />
      ))}

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 10, stiffness: 100 }}
        className="relative mb-10"
      >
        <div className="absolute inset-0 blur-3xl animate-pulse" style={{ background: `${t.accent}33` }} />
        <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center shadow-2xl relative z-10" 
          style={{ background: t.gradient }}>
           <CheckCircle2 size={64} className="text-white" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h2 className="text-[32px] font-black tracking-tight mb-4" style={{ color: t.text_primary }}>Entry Received!</h2>
        <p className="text-[16px] leading-relaxed max-w-[280px] mx-auto" style={{ color: t.text_secondary }}>
          Your fit is being reviewed by the Thread team. We'll notify you if you make it to the <span className="font-bold" style={{ color: t.text_primary }}>April Bracket</span>.
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
          className="w-full h-[64px] rounded-full text-white font-bold text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-transform"
          style={{ background: t.gradient }}
        >
          <Home size={20} /> Back to Hub
        </button>
        <button 
          onClick={() => setCommunityScreen('bracket')}
          className="w-full h-[64px] border rounded-full font-bold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: t.bg_secondary, borderColor: t.border_secondary, color: t.text_tertiary }}
        >
          View Current Bracket <ChevronRight size={18} />
        </button>
      </motion.div>

      {/* Info Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 px-4 py-2 rounded-full border flex items-center gap-2"
        style={{ background: t.bg_card, borderColor: t.border_secondary }}
      >
         <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: t.amber }} />
         <span className="text-[12px] font-medium uppercase tracking-widest leading-none" style={{ color: t.text_tertiary }}>Reviewing Entries...</span>
      </motion.div>
    </div>
  );
};

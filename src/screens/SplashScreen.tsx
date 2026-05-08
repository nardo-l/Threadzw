import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../App';

export const SplashScreen: React.FC<{ onRetry?: () => void; onSignOut?: () => void }> = ({ onRetry, onSignOut }) => {
  const t = useTheme();
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-colors duration-500" style={{ background: t.bg_primary }}>
      <div className="flex flex-col items-center gap-8">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex flex-col items-center"
        >
          <h1 className="text-[52px] font-pacifico" style={{ color: t.accent }}>
            thread
          </h1>
          
          {/* Gradient Bar */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="h-1 mt-2" 
            style={{ background: t.gradient }}
          />
        </motion.div>

        {/* Tagline */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm font-sans"
          style={{ color: t.text_tertiary }}
        >
          Zimbabwe's Closet
        </motion.p>
      </div>

      {/* Loading Indicator */}
      <div className="absolute bottom-24 flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 rounded-full dot-pulse" style={{ background: t.accent }} />
          <div className="w-1.5 h-1.5 rounded-full dot-pulse" style={{ background: t.accent }} />
          <div className="w-1.5 h-1.5 rounded-full dot-pulse" style={{ background: t.accent }} />
        </div>

        {(onRetry || onSignOut) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex gap-4 mt-4"
          >
             {onRetry && (
               <button 
                 onClick={onRetry}
                 className="px-6 py-2 border rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                 style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_primary }}
               >
                 Retry Connection
               </button>
             )}
             {onSignOut && (
               <button 
                 onClick={onSignOut}
                 className="px-6 py-2 bg-transparent text-xs font-bold uppercase tracking-widest hover:brightness-125 transition-all"
                 style={{ color: t.text_tertiary }}
               >
                 Wipe & Sign Out
               </button>
             )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

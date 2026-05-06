import React from 'react';
import { motion } from 'motion/react';

export const SplashScreen: React.FC<{ onRetry?: () => void; onSignOut?: () => void }> = ({ onRetry, onSignOut }) => {
  return (
    <div className="fixed inset-0 bg-[#0d0d0d] z-[9999] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex flex-col items-center"
        >
          <h1 className="text-[52px] font-pacifico text-primary">
            thread
          </h1>
          
          {/* Gradient Bar */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="h-1 gradient-pink-purple mt-2" 
          />
        </motion.div>

        {/* Tagline */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm font-sans text-muted"
        >
          Zimbabwe's Closet
        </motion.p>
      </div>

      {/* Loading Indicator */}
      <div className="absolute bottom-24 flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary dot-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary dot-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary dot-pulse" />
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
                 className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white uppercase tracking-widest hover:bg-white/10"
               >
                 Retry Connection
               </button>
             )}
             {onSignOut && (
               <button 
                 onClick={onSignOut}
                 className="px-6 py-2 bg-transparent text-muted text-xs font-bold uppercase tracking-widest hover:text-white"
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

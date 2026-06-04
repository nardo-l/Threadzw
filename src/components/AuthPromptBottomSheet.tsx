import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';

export const AuthPromptBottomSheet: React.FC = () => {
  const { showAuthPrompt, setShowAuthPrompt, authPromptMessage } = useInventory();
  const navigate = useNavigate();

  if (!showAuthPrompt) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-end justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAuthPrompt(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-[500px] bg-zinc-900 border-t border-zinc-800 rounded-t-[40px] p-8 pb-12 shadow-2xl z-10"
        >
          {/* Drag Handle */}
          <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8" />

          {/* Close Button */}
          <button 
            onClick={() => setShowAuthPrompt(false)}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-90 transition-all"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-[24px] bg-[#C6FF00] flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(198,255,0,0.3)]">
              <Sparkles size={32} className="text-black" />
            </div>

            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-3">
              Join the Culture
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-10 max-w-[280px]">
              {authPromptMessage || "Sign up or log in to save your favorite drip, follow shops, and unlock your style persona."}
            </p>

            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => {
                  setShowAuthPrompt(false);
                  navigate('/auth?mode=signup');
                }}
                className="w-full h-16 rounded-xl text-black font-bold uppercase tracking-wider text-sm shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-[#C6FF00]"
              >
                <UserPlus size={18} />
                Create Account
              </button>

              <button
                onClick={() => {
                  setShowAuthPrompt(false);
                  navigate('/auth?mode=login');
                }}
                className="w-full h-16 rounded-full border border-zinc-800 text-white font-black uppercase tracking-widest text-[13px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all bg-zinc-900/50"
              >
                <LogIn size={18} />
                Sign In
              </button>
            </div>

            <button 
              onClick={() => setShowAuthPrompt(false)}
              className="mt-6 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors"
            >
              Continue Browsing as Guest
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const StyleResult = ({ onComplete }: { onComplete?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const selectedCard = location.state?.selectedCard;

  if (!selectedCard) {
    navigate('/onboarding/style-picker');
    return null;
  }

  const handleEnterApp = async () => {
    localStorage.setItem('thread_onboarding_complete', 'true');
    localStorage.setItem('thread_style_picked', 'true');
    localStorage.setItem('pending_style', selectedCard.style_label);

    if (session?.user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ style_preference: selectedCard.style_label })
          .eq('id', session.user.id);
        
        localStorage.removeItem('pending_style');
      } catch (err) {
        console.error('Error saving preference to profile:', err);
      }
    }
    
    if (onComplete) {
      onComplete();
    } else {
      window.location.reload(); 
    }
  };

  const handlePickAgain = () => {
    navigate('/onboarding/style-picker');
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-sans">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center brightness-[0.12] blur-[40px]"
          style={{ backgroundImage: `url(${selectedCard.image_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#050508]/95 via-[#120818]/90 to-[#0f0f0f]/95" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-7 pt-20 pb-12 flex flex-col items-center min-h-screen overflow-y-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="text-[64px]"
        >
          {selectedCard.result_emoji}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-5 bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] rounded-full px-5 py-2 text-[13px] font-bold uppercase tracking-widest"
        >
          {selectedCard.result_stat}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-5 text-[26px] font-bold text-center leading-[1.3] max-w-[300px]"
        >
          {selectedCard.result_headline}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-6 flex justify-center"
        >
          <div className="w-[110px] h-[140px] rounded-[14px] overflow-hidden border-[2.5px] border-[#FF2D78] shadow-[0_0_0_4px_rgba(255,45,120,0.15),0_16px_40px_rgba(0,0,0,0.5)]">
            <img
              src={selectedCard.image_url}
              alt="Style Preview"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 bg-white/5 border border-white/10 rounded-[16px] px-6 py-5 backdrop-blur-[10px] text-center w-full"
        >
          <p className="text-[15px] italic leading-[1.8] text-white">
            "{selectedCard.result_message}"
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-4 bg-[#FF2D78]/10 border border-[#FF2D78]/25 rounded-full px-[18px] py-[7px] flex items-center justify-center gap-1.5"
        >
          <span className="text-[#888] text-[12px]">Your style:</span>
          <span className="text-[#FF2D78] text-[12px] font-bold">{selectedCard.style_label}</span>
        </motion.div>

        <div className="mt-8 flex flex-col gap-2.5 w-full">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            onClick={handleEnterApp}
            className="w-full h-[48px] rounded-full bg-gradient-to-r from-[#FF2D78] to-[#9F33FF] text-white font-bold text-[14px] px-[28px]"
          >
            Enter Thread ZW →
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            onClick={handlePickAgain}
            className="w-full h-[42px] rounded-full bg-[#111] border border-[#222] text-white font-bold text-[13px] px-[28px]"
          >
            Pick Again
          </motion.button>
        </div>
      </div>
    </div>
  );
};

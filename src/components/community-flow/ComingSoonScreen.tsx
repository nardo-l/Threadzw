import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';

interface ComingSoonScreenProps {
  feature: 'bestDresser' | 'hallOfFame' | 'community';
}

const FEATURE_CONFIG = {
  bestDresser: {
    emoji: '🏆',
    title: 'Best Dresser Contest',
    description: 'Monthly style battles are coming to Thread ZW. Compete, get votes, win $30 cash.',
  },
  hallOfFame: {
    emoji: '👑',
    title: 'Hall of Fame',
    description: "Zimbabwe's top dressers will be crowned here. Watch this space.",
  },
  community: {
    emoji: '🌍',
    title: 'Community Hub',
    description: 'The full community hub is launching soon.',
  },
};

export const ComingSoonScreen: React.FC<ComingSoonScreenProps> = ({ feature }) => {
  const navigate = useNavigate();
  const { setCommunityScreen } = useInventory();
  const config = FEATURE_CONFIG[feature];

  const handleBack = () => {
    setCommunityScreen('hub');
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8 text-center bg-[#F5F5F5]">
      {/* Animated Icon */}
      <motion.div
        animate={{ translateY: [0, -10, 0] }}
        transition={{ 
          duration: 3, 
          ease: "easeInOut", 
          repeat: Infinity 
        }}
        className="text-[64px]"
      >
        {config.emoji}
      </motion.div>

      {/* Coming Soon Label */}
      <h1 className="mt-[24px] text-[32px] font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#9B27AF] to-[#C6FF00]">
        Coming Soon
      </h1>

      {/* Feature Name */}
      <h2 className="mt-[8px] text-[18px] font-bold text-[#111111]">
        {config.title}
      </h2>

      {/* Description */}
      <p className="mt-[12px] text-[14px] leading-[1.6] max-w-[260px] text-[#888888]">
        This feature is currently in the fitting room. It will be ready soon! ❤️
      </p>

      {/* Notify Me Card */}
      <div className="mt-[32px] w-full max-w-[320px] border border-[#EFEFEF] rounded-[32px] p-[24px] bg-white shadow-sm">
        <h3 className="text-[16px] font-bold mb-[8px] text-[#111111]">🔔 Get Notified</h3>
        <p className="text-[13px] leading-[1.6] mb-[20px] text-[#888888]">
          {config.description}
        </p>
        <button
          onClick={() => window.open('https://instagram.com/threadzw', '_blank')}
          className="w-full h-[52px] rounded-full border border-[#EFEFEF] font-bold text-[14px] active:scale-[0.98] transition-all bg-[#F5F5F5] text-[#111111]"
        >
          Follow @threadzw →
        </button>
      </div>

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="mt-[24px] w-full max-w-[320px] h-[60px] rounded-full font-bold text-[16px] active:scale-[0.98] transition-all bg-gradient-to-br from-[#9B27AF] to-[#C6FF00] text-white shadow-xl"
      >
        Go Back
      </button>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

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
    <div className="fixed inset-0 bg-[#000000] z-[100] flex flex-col items-center justify-center px-8 text-center">
      {/* Animated Icon */}
      <motion.div
        animate={{ translateY: [0, -8, 0] }}
        transition={{ 
          duration: 3, 
          ease: "easeInOut", 
          repeat: Infinity 
        }}
        className="text-[56px]"
      >
        {config.emoji}
      </motion.div>

      {/* Coming Soon Label */}
      <h1 className="mt-[20px] text-[28px] font-bold bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] bg-clip-text text-transparent">
        Coming Soon
      </h1>

      {/* Feature Name */}
      <h2 className="mt-[8px] text-white text-[16px] font-medium">
        {config.title}
      </h2>

      {/* Description */}
      <p className="mt-[12px] text-[#888] text-[14px] leading-[1.6] max-w-[260px]">
        This feature is currently in the fitting room. It will be ready soon! ❤️
      </p>

      {/* Notify Me Card */}
      <div className="mt-[28px] w-full max-w-[320px] bg-[#111111] border border-[#222] rounded-[16px] p-[20px]">
        <h3 className="text-white text-[15px] font-bold mb-[8px]">🔔 Get Notified</h3>
        <p className="text-[#888] text-[12px] leading-[1.5] mb-[14px]">
          {config.description}
        </p>
        <button
          onClick={() => window.open('https://instagram.com/threadzw', '_blank')}
          className="w-full h-[46px] rounded-full bg-[#1a1a1a] border border-white/10 text-white font-bold text-[13px] active:scale-[0.98] transition-transform"
        >
          Follow @threadzw →
        </button>
      </div>

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="mt-[32px] w-full max-w-[320px] h-[52px] rounded-full bg-white text-black font-bold text-[14px] active:scale-[0.98] transition-all"
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

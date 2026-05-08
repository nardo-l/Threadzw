import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../App';

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
  const t = useTheme();
  const navigate = useNavigate();
  const { setCommunityScreen } = useInventory();
  const config = FEATURE_CONFIG[feature];

  const handleBack = () => {
    setCommunityScreen('hub');
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8 text-center" style={{ background: t.bg_primary }}>
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
      <h1 className="mt-[20px] text-[28px] font-bold bg-clip-text text-transparent" style={{ backgroundImage: t.gradient }}>
        Coming Soon
      </h1>

      {/* Feature Name */}
      <h2 className="mt-[8px] text-[16px] font-medium" style={{ color: t.text_primary }}>
        {config.title}
      </h2>

      {/* Description */}
      <p className="mt-[12px] text-[14px] leading-[1.6] max-w-[260px]" style={{ color: t.text_secondary }}>
        This feature is currently in the fitting room. It will be ready soon! ❤️
      </p>

      {/* Notify Me Card */}
      <div className="mt-[28px] w-full max-w-[320px] border rounded-[16px] p-[20px]" 
        style={{ background: t.bg_card, borderColor: t.border_secondary }}>
        <h3 className="text-[15px] font-bold mb-[8px]" style={{ color: t.text_primary }}>🔔 Get Notified</h3>
        <p className="text-[12px] leading-[1.5] mb-[14px]" style={{ color: t.text_tertiary }}>
          {config.description}
        </p>
        <button
          onClick={() => window.open('https://instagram.com/threadzw', '_blank')}
          className="w-full h-[46px] rounded-full border font-bold text-[13px] active:scale-[0.98] transition-transform"
          style={{ background: t.bg_secondary, borderColor: t.border_secondary, color: t.text_primary }}
        >
          Follow @threadzw →
        </button>
      </div>

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="mt-[32px] w-full max-w-[320px] h-[52px] rounded-full font-bold text-[14px] active:scale-[0.98] transition-all"
        style={{ background: t.text_primary, color: t.bg_primary }}
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

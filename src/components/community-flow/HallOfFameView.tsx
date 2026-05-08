import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Medal, Instagram, ExternalLink, ChevronRight } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../App';

export const HallOfFameView: React.FC = () => {
  const t = useTheme();
  const { setCommunityScreen } = useInventory();

  const winners = [
    { 
      id: 1, 
      name: 'Tatenda M.', 
      handle: '@tatenda.fit', 
      month: 'March 2026', 
      emoji: '👔', 
      wins: 2, 
      color: 'from-[#FFC107] to-[#FF9800]',
      title: 'Drip Legend'
    },
    { 
      id: 2, 
      name: 'Nyasha Z.', 
      handle: '@nyasha.z', 
      month: 'February 2026', 
      emoji: '👗', 
      wins: 1, 
      color: 'from-[#9B27AF] to-[#FF2D78]',
      title: 'Style Icon'
    },
    { 
      id: 3, 
      name: 'Kelvin', 
      handle: '@kelvin_zw', 
      month: 'January 2026', 
      emoji: '👟', 
      wins: 1, 
      color: 'from-[#2196F3] to-[#00BCD4]',
      title: 'Hype King'
    },
    { 
      id: 4, 
      name: 'Dwayne', 
      handle: '@dwaynex', 
      month: 'December 2025', 
      emoji: '🧥', 
      wins: 3, 
      color: 'from-[#4CAF50] to-[#8BC34A]',
      title: 'Ultimate Dripper'
    },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-[120px]" style={{ background: t.bg_primary }}>
      {/* Top Bar */}
      <div 
        className="px-5 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-40 border-b"
        style={{ background: `${t.bg_primary}CC`, borderColor: t.border_secondary }}
      >
        <button onClick={() => setCommunityScreen('hub')}>
          <ArrowLeft style={{ color: t.text_primary }} size={24} />
        </button>
        <h1 className="font-bold text-[18px]" style={{ color: t.text_primary }}>Hall of Fame</h1>
        <Medal style={{ color: t.amber }} size={22} />
      </div>

      {/* Header Info */}
      <div className="px-5 py-6 text-center">
         <div className="w-16 h-16 border rounded-[20px] flex items-center justify-center mx-auto mb-4"
           style={{ background: `${t.amber}1A`, borderColor: `${t.amber}33` }}>
            <Trophy size={32} style={{ color: t.amber }} fill="currentColor" />
         </div>
         <h2 className="text-[24px] font-black tracking-tight" style={{ color: t.text_primary }}>ZW Style Legends</h2>
         <p className="text-[15px] mt-2 max-w-[280px] mx-auto leading-relaxed" style={{ color: t.text_secondary }}>
            Reserved for those who consistently prove they are the fliest in the community.
         </p>
      </div>

      {/* Winners List */}
      <div className="px-5 space-y-4">
        {winners.map((winner, i) => (
          <motion.div
            key={winner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="border rounded-[24px] p-5 flex items-center gap-4 group active:scale-[0.98] transition-transform"
            style={{ background: t.bg_card, borderColor: t.border_secondary }}
          >
             {/* Thumbnail / Emoji */}
             <div className={`w-[72px] h-[90px] rounded-[16px] bg-linear-to-br ${winner.color} flex flex-col items-center justify-center gap-1 shadow-lg`}>
                <span className="text-[32px]">{winner.emoji}</span>
                <span className="text-white/20 font-black text-[10px] tracking-tighter">WINNING FIT</span>
             </div>

             <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="font-bold text-[16px] truncate" style={{ color: t.text_primary }}>{winner.name}</h3>
                      <p className="text-[12px]" style={{ color: t.text_tertiary }}>{winner.handle}</p>
                   </div>
                   <div className="px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: `${t.amber}1A` }}>
                      <Star size={10} style={{ color: t.amber }} fill="currentColor" />
                      <span className="text-[10px] font-bold" style={{ color: t.amber }}>{winner.wins} Wins</span>
                   </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                   <div className="px-3 py-1 border rounded-full" style={{ background: t.bg_primary, borderColor: t.border_secondary }}>
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.accent }}>{winner.title}</span>
                   </div>
                   <div className="h-4 w-[1px]" style={{ background: t.border_secondary }} />
                   <span className="text-[11px] font-medium" style={{ color: t.text_tertiary }}>{winner.month}</span>
                </div>
             </div>

             <button className="transition-colors" style={{ color: t.text_tertiary }}>
                <ExternalLink size={18} />
             </button>
          </motion.div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-12 px-5 pb-[100px]">
        <div className="border rounded-[24px] p-8 flex flex-col items-center text-center"
          style={{ background: t.bg_card, borderColor: t.border_secondary }}>
            <h3 className="font-bold text-[20px]" style={{ color: t.text_primary }}>Your name here?</h3>
            <p className="text-[14px] mt-2 mb-6" style={{ color: t.text_secondary }}>
               Enter next month's Best Dresser contest and start your journey to legend status.
            </p>
            <button 
              onClick={() => setCommunityScreen('bestDresserEntry')}
              className="w-full h-[60px] rounded-full text-white font-bold text-[16px] flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
              style={{ background: t.gradient }}
            >
               Enter Contest Now <ChevronRight size={20} />
            </button>
         </div>
      </div>
    </div>
  );
};

const Star: React.FC<any> = (props) => (
  <svg 
    {...props} 
    viewBox="0 0 24 24" 
    fill={props.fill || "none"} 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

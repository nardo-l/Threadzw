import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Medal, Instagram, ExternalLink, ChevronRight } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const HallOfFameView: React.FC = () => {
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
    <div className="flex flex-col min-h-screen pb-[120px] bg-[#F5F5F5]">
      {/* Top Bar */}
      <div 
        className="px-5 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-40 bg-[#F5F5F5]/80"
      >
        <button onClick={() => setCommunityScreen('hub')}>
          <ArrowLeft className="text-[#111111]" size={24} />
        </button>
        <h1 className="font-bold text-[18px] text-[#111111]">Hall Of Fame</h1>
        <Medal className="text-[#FFC107]" size={22} />
      </div>

      {/* Header Info */}
      <div className="px-5 py-8 text-center">
         <div className="w-16 h-16 border border-[#FFC107]/20 rounded-[24px] flex items-center justify-center mx-auto mb-5 bg-[#FFC107]/10 shadow-sm">
            <Trophy size={32} className="text-[#FFC107]" fill="currentColor" />
         </div>
         <h2 className="text-[32px] font-bold tracking-tight text-[#111111]">ZW Style Legends</h2>
         <p className="text-[15px] mt-2 max-w-[280px] mx-auto leading-relaxed text-[#888888]">
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
            className="border border-[#EFEFEF] rounded-[32px] p-5 flex items-center gap-4 group active:scale-[0.98] transition-transform bg-white shadow-sm"
          >
             {/* Thumbnail / Emoji */}
             <div className={`w-[72px] h-[90px] rounded-[24px] bg-gradient-to-br ${winner.color} flex flex-col items-center justify-center gap-1 shadow-lg`}>
                <span className="text-[32px]">{winner.emoji}</span>
                <span className="text-white/30 font-black text-[9px] tracking-tighter uppercase">WINNER</span>
             </div>

             <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="font-bold text-[16px] truncate text-[#111111]">{winner.name}</h3>
                      <p className="text-[12px] text-[#888888]">{winner.handle}</p>
                   </div>
                   <div className="px-3 py-1 rounded-full flex items-center gap-1 bg-[#FFC107]/10 border border-[#FFC107]/20">
                      <Star size={10} className="text-[#FFC107]" fill="currentColor" />
                      <span className="text-[10px] font-bold text-[#FFC107] whitespace-nowrap">{winner.wins} Wins</span>
                   </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                   <div className="px-3 py-1 border border-[#FF2D78]/20 rounded-full bg-[#FF2D78]/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF2D78]">{winner.title}</span>
                   </div>
                   <div className="h-4 w-[1px] bg-[#EFEFEF]" />
                   <span className="text-[11px] font-medium text-[#888888]">{winner.month}</span>
                </div>
             </div>

             <button className="transition-colors text-[#888888] hover:text-[#111111]">
                <ExternalLink size={18} />
             </button>
          </motion.div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-12 px-5 pb-[120px]">
        <div className="border border-[#EFEFEF] rounded-[32px] p-8 flex flex-col items-center text-center bg-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF2D78]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            <h3 className="font-bold text-[22px] text-[#111111] relative z-10">Your Name Here?</h3>
            <p className="text-[14px] mt-2 mb-8 text-[#888888] relative z-10">
               Enter next month's Best Dresser contest and start your journey to legend status.
            </p>
            <button 
              onClick={() => setCommunityScreen('bestDresserEntry')}
              className="w-full h-[60px] rounded-full text-white font-bold text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all bg-gradient-to-br from-[#9B27AF] to-[#FF2D78] relative z-10"
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

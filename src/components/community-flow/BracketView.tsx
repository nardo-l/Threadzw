import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Instagram } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../App';

interface Player {
  name: string;
  handle: string;
  votes: number;
  winner?: boolean;
}

interface Matchup {
  id: number;
  p1: Player;
  p2: Player;
  status: 'completed' | 'active' | 'upcoming';
}

const ROUNDS = [
  { id: 'r1', name: 'Round 1', matchups: 8 },
  { id: 'qf', name: 'Quarter', matchups: 4 },
  { id: 'sf', name: 'Semi', matchups: 2 },
  { id: 'f', name: 'Finals', matchups: 1 },
];

const MOCK_MATCHUPS: Record<string, Matchup[]> = {
  r1: [
    { id: 1, p1: { name: 'Dwayne', handle: '@dwaynex', votes: 120 }, p2: { name: 'Simba', handle: '@simbalion', votes: 80 }, status: 'completed' },
    { id: 2, p1: { name: 'Tafadzwa', handle: '@taf.fit', votes: 150 }, p2: { name: 'Kelvin', handle: '@kelv', votes: 140 }, status: 'completed' },
  ],
  qf: [
    { id: 1, p1: { name: 'Dwayne', handle: '@dwaynex', votes: 450, winner: true }, p2: { name: 'Simba', handle: '@simbalion', votes: 310 }, status: 'completed' },
    { id: 2, p1: { name: 'Tafadzwa', handle: '@taf.fit', votes: 520 }, p2: { name: 'Nyasha', handle: '@nyasha.z', votes: 480 }, status: 'active' },
  ],
  sf: [
    { id: 1, p1: { name: 'TBD', handle: '', votes: 0 }, p2: { name: 'TBD', handle: '', votes: 0 }, status: 'upcoming' },
  ],
  f: [
    { id: 1, p1: { name: 'TBD', handle: '', votes: 0 }, p2: { name: 'TBD', handle: '', votes: 0 }, status: 'upcoming' },
  ]
};

export const BracketView: React.FC = () => {
  const t = useTheme();
  const { setCommunityScreen } = useInventory();
  const [activeRound, setActiveRound] = useState('qf');

  return (
    <div className="flex flex-col min-h-screen pb-[120px]" style={{ background: t.bg_primary }}>
      {/* Top Bar */}
      <div 
        className="px-5 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-40 border-b"
        style={{ background: `${t.bg_primary}CC`, borderColor: t.border_secondary }}
      >
        <button onClick={() => setCommunityScreen('bestDresser')}>
          <ArrowLeft style={{ color: t.text_primary }} size={24} />
        </button>
        <h1 className="font-bold text-[18px]" style={{ color: t.text_primary }}>The Bracket</h1>
        <Trophy style={{ color: t.amber }} size={22} fill="currentColor" />
      </div>

      {/* Round Tabs */}
      <div 
        className="px-5 py-2 overflow-x-auto no-scrollbar flex gap-2.5 sticky top-[60px] z-30 backdrop-blur-sm border-b"
        style={{ background: `${t.bg_primary}80`, borderColor: t.border_subtle }}
      >
        {ROUNDS.map(round => (
          <button
            key={round.id}
            onClick={() => setActiveRound(round.id)}
            className={`
              px-6 h-10 rounded-full text-[13px] font-bold whitespace-nowrap transition-all flex items-center gap-2 border
            `}
            style={{ 
              background: activeRound === round.id ? t.accent : t.bg_secondary,
              color: activeRound === round.id ? 'white' : t.text_tertiary,
              borderColor: activeRound === round.id ? t.accent : t.border_secondary,
              boxShadow: activeRound === round.id ? `0 0 15px ${t.accent}4D` : 'none'
            }}
          >
            {round.name}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full`}
              style={{
                background: activeRound === round.id ? 'rgba(255,255,255,0.2)' : t.bg_card,
                color: activeRound === round.id ? 'white' : t.text_tertiary
              }}
            >
               {round.matchups}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRound}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
             {(MOCK_MATCHUPS[activeRound as keyof typeof MOCK_MATCHUPS] || []).map((match, i) => (
                <div key={match.id} className="relative">
                   <div className="absolute top-0 left-0 w-full flex justify-center -translate-y-1/2">
                      <div className="border px-3 py-1 rounded-full" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
                         <span className="text-[10px] font-bold uppercase tracking-widest leading-none" style={{ color: t.text_tertiary }}>Matchup {i + 1}</span>
                      </div>
                   </div>

                   <div className={`border rounded-[24px] p-6 pt-8 overflow-hidden relative transition-all shadow-sm`}
                     style={{ 
                       background: t.bg_card, 
                       borderColor: match.status === 'active' ? t.accent : t.border_secondary,
                       boxShadow: match.status === 'active' ? `0 0 20px ${t.accent}0D` : 'none'
                     }}
                   >
                      {match.status === 'active' && (
                        <div className="absolute top-0 right-0 p-3">
                           <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: `${t.accent}1A` }}>
                             <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.accent }} />
                             <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: t.accent }}>Voting Live</span>
                           </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                         {/* P1 */}
                         <div className="flex flex-col items-center flex-1">
                            <div className="relative">
                               <div className="w-[60px] h-[60px] rounded-full border-2 flex items-center justify-center text-[24px] relative z-10" 
                                 style={{ background: t.bg_secondary, borderColor: t.border_secondary }}>👤</div>
                               {match.p1.winner && (
                                  <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center border-2 z-20"
                                    style={{ background: t.amber, borderColor: t.bg_card }}>
                                     <Trophy size={14} className="text-black" fill="currentColor" />
                                  </div>
                               )}
                            </div>
                            <span className={`text-[14px] mt-2.5 font-bold truncate w-full text-center`}
                              style={{ color: match.p1.winner ? t.amber : t.text_primary }}>
                               {match.p1.name || 'TBD'}
                            </span>
                         </div>

                         {/* Center */}
                         <div className="flex flex-col items-center gap-2">
                             <div className="font-black text-[13px] tracking-tighter italic" style={{ color: t.text_tertiary }}>VS</div>
                             <div className="h-6 w-[1px]" style={{ background: t.border_secondary }} />
                         </div>

                         {/* P2 */}
                         <div className="flex flex-col items-center flex-1">
                            <div className="relative">
                               <div className="w-[60px] h-[60px] rounded-full border-2 flex items-center justify-center text-[24px] relative z-10"
                                 style={{ background: t.bg_secondary, borderColor: t.border_secondary }}>👤</div>
                            </div>
                            <span className="text-[14px] mt-2.5 font-bold truncate w-full text-center" style={{ color: t.text_primary }}>
                               {match.p2.name || 'TBD'}
                            </span>
                         </div>
                      </div>

                      {/* Vote Progress */}
                      {match.status !== 'upcoming' && (
                         <div className="mt-8">
                            <div className="flex justify-between items-end mb-2 px-1">
                               <div className="flex flex-col">
                                  <span className={`text-[12px] font-bold`} style={{ color: match.status === 'active' ? t.accent : t.text_tertiary }}>{match.p1.votes} votes</span>
                               </div>
                               <div className="flex flex-col items-end">
                                  <span className="text-[12px] font-bold" style={{ color: t.text_tertiary }}>{match.p2.votes} votes</span>
                               </div>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden flex" style={{ background: t.bg_secondary }}>
                               <div 
                                 className={`h-full`} 
                                 style={{ 
                                   width: `${(match.p1.votes / (match.p1.votes + match.p2.votes)) * 100}%`,
                                   background: match.status === 'active' ? t.accent : t.text_tertiary
                                 }} 
                                />
                               <div className="h-full flex-1" />
                            </div>
                         </div>
                      )}

                      {match.status === 'active' && (
                        <button className="mt-6 w-full h-[52px] rounded-full text-white font-black text-[14px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-transform"
                          style={{ background: t.gradient }}>
                          <Instagram size={18} /> VOTE NOW
                        </button>
                      )}

                      {match.status === 'upcoming' && (
                        <div className="mt-6 w-full h-[52px] rounded-full flex items-center justify-center" style={{ background: t.bg_secondary }}>
                           <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: t.text_tertiary }}>Starts Friday</span>
                        </div>
                      )}
                   </div>
                </div>
             ))}

             {/* Tie-Breaker Hint */}
             <div className="p-6 border border-dashed rounded-[24px] flex items-center gap-4"
               style={{ background: t.bg_primary, borderColor: t.border_secondary }}>
                <div className="w-10 h-10 border rounded-full flex items-center justify-center shrink-0"
                  style={{ borderColor: `${t.amber}33` }}>
                  <span className="text-[18px]">💡</span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: t.text_secondary }}>
                   In case of a tie, the Thread judging panel will select the winner based on <span style={{ color: t.text_primary }}>creativity and photo quality</span>.
                </p>
             </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Instagram, ChevronRight } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

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
  const { setCommunityScreen } = useInventory();
  const [activeRound, setActiveRound] = useState('qf');

  return (
    <div className="flex flex-col bg-black min-h-screen pb-[120px]">
      {/* Top Bar */}
      <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-40">
        <button onClick={() => setCommunityScreen('bestDresser')}>
          <ArrowLeft className="text-white" size={24} />
        </button>
        <h1 className="text-white font-bold text-[18px]">The Bracket</h1>
        <Trophy className="text-[#f59e0b]" size={22} fill="#f59e0b" />
      </div>

      {/* Round Tabs */}
      <div className="px-5 py-2 overflow-x-auto no-scrollbar flex gap-2.5 bg-black/50 sticky top-[60px] z-30 backdrop-blur-sm border-b border-[#111]">
        {ROUNDS.map(round => (
          <button
            key={round.id}
            onClick={() => setActiveRound(round.id)}
            className={`
              px-6 h-10 rounded-full text-[13px] font-bold whitespace-nowrap transition-all flex items-center gap-2
              ${activeRound === round.id 
                ? 'bg-[#FF2D78] text-white shadow-[0_0_15px_rgba(255,45,120,0.3)]' 
                : 'bg-[#111] text-[#666] border border-[#222]'}
            `}
          >
            {round.name}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeRound === round.id ? 'bg-white/20 text-white' : 'bg-[#222] text-[#444]'}`}>
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
                      <div className="bg-[#111] border border-[#222] px-3 py-1 rounded-full">
                         <span className="text-[#555] text-[10px] font-bold uppercase tracking-widest leading-none">Matchup {i + 1}</span>
                      </div>
                   </div>

                   <div className={`
                      bg-[#111] border rounded-[24px] p-6 pt-8 overflow-hidden relative
                      ${match.status === 'active' ? 'border-[#FF2D784D] shadow-[0_0_20px_rgba(255,45,120,0.05)]' : 'border-[#222]'}
                   `}>
                      {match.status === 'active' && (
                        <div className="absolute top-0 right-0 p-3">
                           <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FF2D781A] rounded-full">
                             <div className="w-1.5 h-1.5 bg-[#FF2D78] rounded-full animate-pulse" />
                             <span className="text-[#FF2D78] text-[9px] font-bold uppercase tracking-wide">Voting Live</span>
                           </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                         {/* P1 */}
                         <div className="flex flex-col items-center flex-1">
                            <div className="relative">
                               <div className="w-[60px] h-[60px] rounded-full border-2 border-[#222] flex items-center justify-center text-[24px] relative z-10 bg-black">👤</div>
                               {match.p1.winner && (
                                  <div className="absolute -top-2 -left-2 w-7 h-7 bg-[#f59e0b] rounded-full flex items-center justify-center border-2 border-black z-20">
                                     <Trophy size={14} className="text-black" fill="currentColor" />
                                  </div>
                               )}
                            </div>
                            <span className={`text-[14px] mt-2.5 font-bold truncate w-full text-center ${match.p1.winner ? 'text-[#f59e0b]' : 'text-white'}`}>
                               {match.p1.name || 'TBD'}
                            </span>
                         </div>

                         {/* Center */}
                         <div className="flex flex-col items-center gap-2">
                             <div className="text-[#888] font-black text-[13px] tracking-tighter italic">VS</div>
                             <div className="h-6 w-[1px] bg-[#222]" />
                         </div>

                         {/* P2 */}
                         <div className="flex flex-col items-center flex-1">
                            <div className="relative">
                               <div className="w-[60px] h-[60px] rounded-full border-2 border-[#222] flex items-center justify-center text-[24px] relative z-10 bg-black">👤</div>
                            </div>
                            <span className="text-white text-[14px] mt-2.5 font-bold truncate w-full text-center">
                               {match.p2.name || 'TBD'}
                            </span>
                         </div>
                      </div>

                      {/* Vote Progress */}
                      {match.status !== 'upcoming' && (
                         <div className="mt-8">
                            <div className="flex justify-between items-end mb-2 px-1">
                               <div className="flex flex-col">
                                  <span className={`text-[12px] font-bold ${match.status === 'active' ? 'text-[#FF2D78]' : 'text-[#888]'}`}>{match.p1.votes} votes</span>
                               </div>
                               <div className="flex flex-col items-end">
                                  <span className="text-[#888] text-[12px] font-bold">{match.p2.votes} votes</span>
                               </div>
                            </div>
                            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden flex">
                               <div 
                                className={`h-full ${match.status === 'active' ? 'bg-[#FF2D78]' : 'bg-[#555]'}`} 
                                style={{ width: `${(match.p1.votes / (match.p1.votes + match.p2.votes)) * 100}%` }} 
                               />
                               <div className="h-full bg-[#222] flex-1" />
                            </div>
                         </div>
                      )}

                      {match.status === 'active' && (
                        <button className="mt-6 w-full h-[52px] bg-linear-to-r from-[#9B27AF] to-[#FF2D78] rounded-full text-white font-black text-[14px] flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(255,45,120,0.2)] active:scale-[0.98] transition-transform">
                          <Instagram size={18} /> VOTE NOW
                        </button>
                      )}

                      {match.status === 'upcoming' && (
                        <div className="mt-6 w-full h-[52px] bg-[#1a1a1a] rounded-full flex items-center justify-center">
                           <span className="text-[#555] text-[12px] font-bold uppercase tracking-widest">Starts Friday</span>
                        </div>
                      )}
                   </div>
                </div>
             ))}

             {/* Tie-Breaker Hint */}
             <div className="p-6 bg-black border border-dashed border-[#222] rounded-[24px] flex items-center gap-4">
                <div className="w-10 h-10 border border-[#f59e0b33] rounded-full flex items-center justify-center shrink-0">
                  <span className="text-[18px]">💡</span>
                </div>
                <p className="text-[#888] text-[12px] leading-relaxed">
                   In case of a tie, the Thread judging panel will select the winner based on <span className="text-white">creativity and photo quality</span>.
                </p>
             </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

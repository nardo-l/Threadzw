import React from 'react';
import { ArrowLeft, Trophy, Instagram, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';

export const BestDresserHub: React.FC = () => {
  const navigate = useNavigate();
  const { setBuyerFlowState } = useInventory();

  const winners = [
    { name: 'Tatenda', month: 'March 2026', color: 'from-[#FFC107] to-[#FF9800]' },
    { name: 'Nyasha', month: 'February 2026', color: 'from-[#9B27AF] to-[#C6FF00]' },
    { name: 'Kelvin', month: 'January 2026', color: 'from-[#2196F3] to-[#00BCD4]' },
  ];

  return (
    <div className="flex flex-col bg-black min-h-screen pb-[120px]">
      {/* Top Bar */}
      <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-20">
        <button onClick={() => navigate('/')}>
          <ArrowLeft className="text-white" size={24} />
        </button>
        <h1 className="text-white font-bold text-[18px]">Best Dresser</h1>
        <Trophy className="text-[#f59e0b]" size={22} fill="#f59e0b" />
      </div>

      {/* Current Round Card */}
      <div className="mx-5 mt-4 rounded-[16px] bg-linear-to-br from-[#f59e0b1f] to-[#C6FF001f] border border-[#f59e0b4d] p-5">
        <div className="flex justify-between items-center">
          <span className="text-[#f59e0b] text-[11px] font-bold tracking-widest uppercase">APRIL 2026</span>
          <span className="text-[#888] text-[12px]">3 days left</span>
        </div>
        <h2 className="text-white font-bold text-[22px] mt-2">Quarter Finals</h2>
        
        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[#888] text-[11px]">Round 2 of 4</span>
            <span className="text-[#888] text-[11px]">Day 11 of 14</span>
          </div>
          <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
             <div className="h-full bg-linear-to-r from-[#f59e0b] to-[#C6FF00]" style={{ width: '78%' }} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between mt-5">
           <div className="flex flex-col items-center">
              <span className="text-[#f59e0b] font-bold text-[20px]">12</span>
              <span className="text-[#888] text-[10px] mt-0.5">Nominees</span>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-[#f59e0b] font-bold text-[20px]">4</span>
              <span className="text-[#888] text-[10px] mt-0.5">Remaining</span>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-[#f59e0b] font-bold text-[20px]">$30</span>
              <span className="text-[#888] text-[10px] mt-0.5">Prize</span>
           </div>
        </div>
      </div>

      {/* Matchups */}
      <div className="mt-8">
        <h3 className="text-white font-bold text-[15px] px-5 mb-4">Quarter Finals Matchups</h3>
        <div className="space-y-4">
           {[1, 2].map(m => (
             <div key={m} className="mx-5 bg-[#111] border border-[#222] rounded-[16px] p-5">
                <span className="text-[#f59e0b] text-[10px] font-bold tracking-wider uppercase mb-5 block">MATCHUP {m}</span>
                <div className="flex items-center justify-between">
                   {/* P1 */}
                   <div className="flex flex-col items-center flex-1">
                      <div className="w-[52px] h-[52px] rounded-full bg-linear-to-br from-[#1a1a1a] to-[#222] flex items-center justify-center text-[24px]">👤</div>
                      <span className="text-white font-bold text-[13px] mt-2">Dwayne</span>
                      <span className="text-[#888] text-[11px] mt-0.5">@dwaynex</span>
                      <span className="text-[#C6FF00] font-bold text-[15px] mt-1.5">64%</span>
                   </div>
                   
                   {/* VS */}
                   <div className="flex flex-col items-center mx-4">
                      <div className="w-8 h-8 rounded-full border border-[#f59e0b] flex items-center justify-center">
                         <span className="text-white font-bold text-[14px]">VS</span>
                      </div>
                   </div>

                   {/* P2 */}
                   <div className="flex flex-col items-center flex-1">
                      <div className="w-[52px] h-[52px] rounded-full bg-linear-to-br from-[#1a1a1a] to-[#222] flex items-center justify-center text-[24px]">👤</div>
                      <span className="text-white font-bold text-[13px] mt-2">Simba</span>
                      <span className="text-[#888] text-[11px] mt-0.5">@simbalion</span>
                      <span className="text-[#C6FF00] font-bold text-[15px] mt-1.5">36%</span>
                   </div>
                </div>
                <button className="mt-5 w-full h-11 bg-[#f59e0b] rounded-full text-black font-bold text-[13px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                  <Instagram size={16} /> Vote on Instagram Stories
                </button>
             </div>
           ))}
        </div>
        <div className="text-center mt-6">
           <button className="text-[#C6FF00] text-[13px] font-bold">View All Matchups</button>
        </div>
      </div>

      {/* Enter Contest Section */}
      <div className="mx-5 mt-10 p-5 bg-[#111] border border-[#222] rounded-[16px]">
        <h3 className="text-white font-bold text-[16px]">Want to compete?</h3>
        <p className="text-[#888] text-[13px] mt-1 mb-5">Enter next month's contest</p>

        <div className="space-y-4">
           {[
             { n: 1, t: "Post an outfit photo on Instagram" },
             { n: 2, t: "Tag @threadzw in caption and photo" },
             { n: 3, t: "Submit your entry in the app" }
           ].map(step => (
             <div key={step.n} className="flex gap-3 items-center">
                <div className="w-[22px] h-[22px] rounded-full border border-[#C6FF00] flex items-center justify-center shrink-0">
                   <span className="text-[#C6FF00] text-[11px] font-bold">{step.n}</span>
                </div>
                <p className="text-[#888] text-[13px]">{step.t}</p>
             </div>
           ))}
        </div>

        <button 
          onClick={() => setBuyerFlowState('bestDresserEntry')}
          className="mt-6 w-full h-[52px] bg-linear-to-r from-[#9B27AF] to-[#C6FF00] rounded-full text-white font-bold text-[15px] flex items-center justify-center active:scale-[0.98] transition-transform shadow-lg"
        >
          Enter This Month →
        </button>
      </div>

      {/* Hall of Fame */}
      <div className="mt-10 mb-[120px]">
        <h3 className="text-white font-bold text-[15px] px-5 mb-4">Hall of Fame 👑</h3>
        <div className="flex overflow-x-auto no-scrollbar gap-4 px-5">
           {winners.map((w, i) => (
              <div key={`hof-winner-${i}`} className="w-[150px] bg-[#111] border border-[#f59e0b] rounded-[14px] p-5 flex flex-col items-center shrink-0">
                 <span className="text-[20px]">👑</span>
                 <div className="w-[48px] h-[48px] rounded-full border-2 border-[#f59e0b] p-0.5 mt-2">
                    <div className={`w-full h-full rounded-full bg-linear-to-br ${w.color}`} />
                 </div>
                 <span className="text-white font-bold text-[13px] mt-2.5">{w.name}</span>
                 <span className="text-[#888] text-[11px] mt-0.5">{w.month}</span>
                 <div className="mt-2 px-2.5 py-1 rounded-full bg-[#f59e0b26] text-[#f59e0b] text-[10px] font-bold uppercase tracking-wider">
                    Ambassador
                 </div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};

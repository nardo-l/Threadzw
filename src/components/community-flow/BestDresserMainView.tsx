import React from 'react';
import { ArrowLeft, Trophy, Instagram, ChevronRight, Info } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const BestDresserMainView: React.FC = () => {
  const { setCommunityScreen } = useInventory();

  const nominees = [
    { id: '1', name: 'Tafadzwa', handle: '@taf.fit', img: 'https://picsum.photos/seed/fashion1/400/600', votes: '1.2k' },
    { id: '2', name: 'Nyasha', handle: '@nyasha.z', img: 'https://picsum.photos/seed/fashion2/400/600', votes: '980' },
    { id: '3', name: 'Simba', handle: '@simba', img: 'https://picsum.photos/seed/fashion3/400/600', votes: '850' },
    { id: '4', name: 'Chino', handle: '@chino', img: 'https://picsum.photos/seed/fashion4/400/600', votes: '720' },
    { id: '5', name: 'Rudo', handle: '@rudo.v', img: 'https://picsum.photos/seed/fashion5/400/600', votes: '640' },
    { id: '6', name: 'Tinashe', handle: '@tina', img: 'https://picsum.photos/seed/fashion6/400/600', votes: '590' },
  ];

  const winners = [
    { name: 'Tatenda', month: 'March 2026', color: 'from-[#FFC107] to-[#FF9800]' },
    { name: 'Nyasha', month: 'February 2026', color: 'from-[#9B27AF] to-[#FF2D78]' },
    { name: 'Kelvin', month: 'January 2026', color: 'from-[#2196F3] to-[#00BCD4]' },
  ];

  return (
    <div className="flex flex-col bg-black min-h-screen pb-[120px]">
      {/* Top Bar */}
      <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-30">
        <button onClick={() => setCommunityScreen('hub')}>
          <ArrowLeft className="text-white" size={24} />
        </button>
        <h1 className="text-white font-bold text-[18px]">Best Dresser</h1>
        <Trophy className="text-[#f59e0b]" size={22} fill="#f59e0b" />
      </div>

      {/* Hero: Current Round */}
      <div className="mx-5 mt-4 rounded-[20px] bg-linear-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#f59e0b33] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#f59e0b1A] blur-3xl -mr-10 -mt-10" />
        
        <div className="flex justify-between items-center relative z-10">
          <span className="text-[#f59e0b] text-[11px] font-bold tracking-[0.2em] uppercase">APRIL 2026</span>
          <div className="flex items-center gap-1.5 text-[#888] text-[12px]">
             <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full animate-pulse" />
             3 days left
          </div>
        </div>

        <h2 className="text-white font-black text-[28px] mt-2 relative z-10 tracking-tight">Quarter Finals</h2>
        <p className="text-[#888] text-[14px] mt-1 relative z-10">Vote for the drippiest fits in ZW</p>
        
        {/* Progress */}
        <div className="mt-6 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-bold text-[11px] uppercase tracking-wider">Round 2 of 4</span>
            <span className="text-[#888] text-[11px]">78% Complete</span>
          </div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
             <div className="h-full bg-linear-to-r from-[#f59e0b] to-[#FF2D78]" style={{ width: '78%' }} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#f59e0b1A] relative z-10">
           <div className="flex flex-col">
              <span className="text-white font-bold text-[20px]">12</span>
              <span className="text-[#666] text-[10px] font-bold uppercase tracking-wider">Nominees</span>
           </div>
           <div className="flex flex-col">
              <span className="text-white font-bold text-[20px]">3.2k</span>
              <span className="text-[#666] text-[10px] font-bold uppercase tracking-wider">Votes</span>
           </div>
           <div className="flex flex-col">
              <span className="text-[#f59e0b] font-bold text-[20px]">$30</span>
              <span className="text-[#666] text-[10px] font-bold uppercase tracking-wider">Prize Pool</span>
           </div>
        </div>
      </div>

      {/* Nominees Grid */}
      <div className="mt-10 px-5">
        <h3 className="text-white font-bold text-[16px] mb-4">Top Nominees 💎</h3>
        <div className="grid grid-cols-2 gap-4">
           {nominees.map((n) => (
             <div key={n.id} className="relative aspect-[3/4] rounded-[24px] overflow-hidden group border border-[#222]">
                <img 
                  src={n.img} 
                  alt={n.name} 
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                   <p className="text-white font-bold text-[14px] leading-tight">{n.name}</p>
                   <p className="text-[#888] text-[11px] mt-0.5">{n.handle}</p>
                   
                   <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                         <Star size={10} className="text-[#f59e0b]" fill="currentColor" />
                         <span className="text-white font-bold text-[10px]">{n.votes}</span>
                      </div>
                      <div className="px-2 py-0.5 bg-[#FF2D781A] rounded-full border border-[#FF2D7833]">
                         <span className="text-[#FF2D78] text-[9px] font-bold">TOP 10</span>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Matchups Section */}
      <div className="mt-10 px-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-[16px]">Live Matchups 🔥</h3>
          <button onClick={() => setCommunityScreen('bracket')} className="text-[#FF2D78] text-[13px] font-bold flex items-center gap-1">
            See Full Bracket <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-4">
           {[1, 2].map(m => (
             <div key={m} className="bg-[#111] border border-[#222] rounded-[20px] p-5">
                <div className="flex items-center justify-between gap-4">
                   {/* P1 */}
                   <div className="flex flex-col items-center flex-1">
                      <div className="relative">
                        <div className="w-[64px] h-[64px] rounded-full bg-[#1a1a1a] border-2 border-[#222] flex items-center justify-center text-[28px] relative z-10">👤</div>
                        <div className="absolute inset-0 bg-linear-to-br from-[#9B27AF33] to-[#FF2D7833] blur-lg" />
                      </div>
                      <span className="text-white font-bold text-[14px] mt-2.5">Dwayne</span>
                      <span className="text-[#888] text-[11px]">@dwaynex</span>
                   </div>
                   
                   {/* VS */}
                   <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full border border-[#f59e0b33] bg-[#000] flex items-center justify-center mb-1">
                         <span className="text-[#f59e0b] font-black text-[12px]">VS</span>
                      </div>
                      <div className="h-4 w-[1px] bg-[#222]" />
                   </div>

                   {/* P2 */}
                   <div className="flex flex-col items-center flex-1">
                      <div className="relative">
                        <div className="w-[64px] h-[64px] rounded-full bg-[#1a1a1a] border-2 border-[#222] flex items-center justify-center text-[28px] relative z-10">👤</div>
                      </div>
                      <span className="text-white font-bold text-[14px] mt-2.5">Simba</span>
                      <span className="text-[#888] text-[11px]">@simbalion</span>
                   </div>
                </div>

                {/* Vote Indicator */}
                <div className="mt-6">
                   <div className="flex justify-between items-center mb-1.5 px-1">
                      <span className="text-[#FF2D78] font-black text-[16px]">64%</span>
                      <span className="text-[#888] font-black text-[16px]">36%</span>
                   </div>
                   <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden flex">
                      <div className="h-full bg-[#FF2D78]" style={{ width: '64%' }} />
                      <div className="h-full bg-[#333]" style={{ width: '36%' }} />
                   </div>
                </div>

                <button 
                  className="mt-6 w-full h-[52px] bg-white text-black rounded-full font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  onClick={() => window.open('https://instagram.com/threadzw', '_blank')}
                >
                  <Instagram size={18} /> Vote on IG Stories
                </button>
             </div>
           ))}
        </div>
      </div>

      {/* How it Works Section */}
      <div className="mt-10 px-5">
        <h3 className="text-white font-bold text-[16px] mb-4">How It Works 💡</h3>
        <div className="bg-[#111] border border-[#222] rounded-[20px] p-6 space-y-6">
          {[
            { n: 1, t: "Post your fit", d: "Post a high-quality photo of your outfit on Instagram." },
            { n: 2, t: "Tag @threadzw", d: "Make sure you tag our handle and use #ThreadBestDresser." },
            { n: 3, t: "Submit in-app", d: "Fill out the entry form with your post link to be reviewed." }
          ].map(step => (
            <div key={step.n} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#FF2D781A] border border-[#FF2D784D] flex items-center justify-center shrink-0">
                 <span className="text-[#FF2D78] font-bold text-[14px]">{step.n}</span>
              </div>
              <div className="flex flex-col">
                 <h4 className="text-white font-bold text-[15px]">{step.t}</h4>
                 <p className="text-[#888] text-[13px] mt-0.5 leading-relaxed">{step.d}</p>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setCommunityScreen('bestDresserEntry')}
            className="w-full h-[56px] bg-linear-to-r from-[#9B27AF] to-[#FF2D78] rounded-full text-white font-bold text-[16px] flex items-center justify-center shadow-lg active:scale-[0.98] transition-transform"
          >
            Enter Contest Entry →
          </button>
        </div>
      </div>

      {/* Hall of Fame Teaser */}
      <div className="mt-10">
        <div className="px-5 flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-[16px]">Hall of Fame 🏆</h3>
          <button onClick={() => setCommunityScreen('hallOfFame')} className="text-[#FF2D78] text-[13px] font-bold uppercase tracking-wider">
            View All
          </button>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-4 px-5 pb-4">
           {winners.slice(0, 3).map((w, i) => (
              <div key={i} className="min-w-[140px] bg-[#111] border border-[#f59e0b33] rounded-[20px] p-5 flex flex-col items-center">
                 <div className="relative">
                    <div className="w-[56px] h-[56px] rounded-full border-2 border-[#f59e0b] p-0.5">
                       <div className={`w-full h-full rounded-full bg-linear-to-br ${w.color}`} />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 text-[18px]">👑</span>
                 </div>
                 <h4 className="text-white font-bold text-[13px] mt-3 whitespace-nowrap">{w.name}</h4>
                 <span className="text-[#888] text-[11px] mt-0.5">{w.month}</span>
              </div>
           ))}
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

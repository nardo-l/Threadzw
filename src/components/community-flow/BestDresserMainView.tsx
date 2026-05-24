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
    <div className="flex flex-col min-h-screen pb-[120px] bg-[#F5F5F5]">
      {/* Top Bar */}
      <div 
        className="px-5 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-30 bg-[#F5F5F5]/80"
      >
        <button onClick={() => setCommunityScreen('hub')}>
          <ArrowLeft className="text-[#111111]" size={24} />
        </button>
        <h1 className="font-bold text-[18px] text-[#111111]">Best Dresser</h1>
        <Trophy className="text-[#FFC107]" size={22} fill="#FFC107" />
      </div>

      {/* Hero: Current Round */}
      <div 
        className="mx-5 mt-4 rounded-[20px] border p-6 relative overflow-hidden bg-white border-[#EFEFEF] shadow-sm"
      >
        <div 
          className="absolute top-0 right-0 w-24 h-24 blur-3xl -mr-10 -mt-10 bg-[#FFC107]/10" 
        />
        
        <div className="flex justify-between items-center relative z-10">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FFC107]">APRIL 2026</span>
          <div className="flex items-center gap-1.5 text-[12px] text-[#888888]">
             <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#FFC107]" />
             3 days left
          </div>
        </div>

        <h2 className="font-bold text-[28px] mt-2 relative z-10 tracking-tight text-[#111111]">Quarter Finals</h2>
        <p className="text-[14px] mt-1 relative z-10 text-[#888888]">Vote for the drippiest fits in ZW</p>
        
        {/* Progress */}
        <div className="mt-6 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#111111]">Round 2 of 4</span>
            <span className="text-[11px] text-[#888888]">78% Complete</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-[#F5F5F5]">
             <div className="h-full bg-gradient-to-r from-[#9B27AF] to-[#FF2D78]" style={{ width: '78%' }} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t relative z-10 border-[#EFEFEF]">
           <div className="flex flex-col">
              <span className="font-bold text-[20px] text-[#111111]">12</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Nominees</span>
           </div>
           <div className="flex flex-col">
              <span className="font-bold text-[20px] text-[#111111]">3.2k</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Votes</span>
           </div>
           <div className="flex flex-col">
              <span className="font-bold text-[20px] text-[#FF2D78] tracking-tighter">$30</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Prize Pool</span>
           </div>
        </div>
      </div>

      {/* Nominees Grid */}
      <div className="mt-10 px-5">
        <h3 className="font-bold text-[16px] mb-4 text-[#111111]">Top Nominees 💎</h3>
        <div className="grid grid-cols-2 gap-4">
           {nominees.map((n) => (
             <div key={n.id} className="relative aspect-[3/4] rounded-[24px] overflow-hidden group border border-[#EFEFEF] shadow-sm">
                <img 
                  src={n.img} 
                  alt={n.name} 
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                   <p className="text-white font-bold text-[14px] leading-tight">{n.name}</p>
                   <p className="text-white/60 text-[11px] mt-0.5">{n.handle}</p>
                   
                   <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                         <Star size={10} className="text-[#FFC107]" fill="currentColor" />
                         <span className="text-white font-bold text-[10px]">{n.votes}</span>
                      </div>
                      <div className="px-2 py-0.5 rounded-full border bg-[#FF2D78]/20 border-white/20 backdrop-blur-sm">
                         <span className="text-[9px] font-bold text-white">TOP 10</span>
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
          <h3 className="font-bold text-[16px] text-[#111111]">Live Matchups 🔥</h3>
          <button onClick={() => setCommunityScreen('bracket')} className="text-[13px] font-bold flex items-center gap-1 text-[#FF2D78]">
            See Full Bracket <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-4">
           {[1, 2].map(m => (
             <div key={m} className="border border-[#EFEFEF] rounded-[24px] p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-4">
                   {/* P1 */}
                   <div className="flex flex-col items-center flex-1">
                      <div className="relative">
                        <div className="w-[64px] h-[64px] rounded-full border flex items-center justify-center text-[28px] relative z-10 bg-[#F5F5F5] border-[#EFEFEF] shadow-sm">👤</div>
                        <div className="absolute inset-0 blur-lg bg-[#FF2D78]/20" />
                      </div>
                      <span className="font-bold text-[14px] mt-2.5 text-[#111111]">Dwayne</span>
                      <span className="text-[11px] text-[#888888]">@dwaynex</span>
                   </div>
                   
                   {/* VS */}
                   <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full border flex items-center justify-center mb-1 border-[#FF2D78] bg-[#FF2D78]/10">
                         <span className="font-black text-[12px] text-[#FF2D78]">VS</span>
                      </div>
                      <div className="h-4 w-[1px] bg-[#EFEFEF]" />
                   </div>

                   {/* P2 */}
                   <div className="flex flex-col items-center flex-1">
                      <div className="relative">
                        <div className="w-[64px] h-[64px] rounded-full border flex items-center justify-center text-[28px] relative z-10 bg-[#F5F5F5] border-[#EFEFEF] shadow-sm">👤</div>
                      </div>
                      <span className="font-bold text-[14px] mt-2.5 text-[#111111]">Simba</span>
                      <span className="text-[11px] text-[#888888]">@simbalion</span>
                   </div>
                </div>

                {/* Vote Indicator */}
                <div className="mt-6">
                   <div className="flex justify-between items-center mb-1.5 px-1">
                      <span className="font-bold text-[16px] text-[#FF2D78]">64%</span>
                      <span className="font-bold text-[16px] text-[#888888]">36%</span>
                   </div>
                   <div className="h-1.5 rounded-full overflow-hidden flex bg-[#F5F5F5]">
                      <div className="h-full bg-[#FF2D78]" style={{ width: '64%' }} />
                      <div className="h-full bg-[#888888]/20" style={{ width: '36%' }} />
                   </div>
                </div>

                <button 
                  className="mt-6 w-full h-[52px] rounded-full font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md bg-[#111111] text-white"
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
        <h3 className="font-bold text-[16px] mb-4 text-[#111111]">How It Works 💡</h3>
        <div className="border border-[#EFEFEF] rounded-[24px] p-6 space-y-6 bg-white shadow-sm">
          {[
            { n: 1, t: "Post your fit", d: "Post a high-quality photo of your outfit on Instagram." },
            { n: 2, t: "Tag @threadzw", d: "Make sure you tag our handle and use #ThreadBestDresser." },
            { n: 3, t: "Submit in-app", d: "Fill out the entry form with your post link to be reviewed." }
          ].map(step => (
            <div key={step.n} className="flex gap-4">
              <div className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0 bg-[#FF2D78]/10 border-[#FF2D78]/20">
                 <span className="font-bold text-[14px] text-[#FF2D78]">{step.n}</span>
              </div>
              <div className="flex flex-col">
                 <h4 className="font-bold text-[15px] text-[#111111]">{step.t}</h4>
                 <p className="text-[13px] mt-0.5 leading-relaxed text-[#888888]">{step.d}</p>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setCommunityScreen('bestDresserEntry')}
            className="w-full h-[56px] rounded-full text-white font-bold text-[16px] flex items-center justify-center shadow-lg active:scale-[0.98] transition-transform bg-gradient-to-br from-[#9B27AF] to-[#FF2D78]"
          >
            Enter Contest Now →
          </button>
        </div>
      </div>

      {/* Hall of Fame Teaser */}
      <div className="mt-10">
        <div className="px-5 flex justify-between items-center mb-4">
          <h3 className="font-bold text-[16px] text-[#111111]">Hall Of Fame 🏆</h3>
          <button onClick={() => setCommunityScreen('hallOfFame')} className="text-[13px] font-bold uppercase tracking-wider text-[#FF2D78]">
            View All
          </button>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-4 px-5 pb-6">
           {winners.slice(0, 3).map((w, i) => (
              <div key={`hall-of-fame-winner-${i}`} className="min-w-[150px] border border-[#EFEFEF] rounded-[24px] p-6 flex flex-col items-center bg-white shadow-sm">
                 <div className="relative">
                    <div className="w-[64px] h-[64px] rounded-full border-2 p-0.5 border-[#FFC107]">
                       <div className={`w-full h-full rounded-full bg-gradient-to-br ${w.color}`} />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 text-[20px]">👑</span>
                 </div>
                 <h4 className="font-bold text-[14px] mt-4 whitespace-nowrap text-[#111111]">{w.name}</h4>
                 <span className="text-[11px] mt-1 text-[#888888]">{w.month}</span>
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

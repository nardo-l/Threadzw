import React from 'react';
import { ArrowLeft, Trophy, Instagram, ChevronRight, Info } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../App';

export const BestDresserMainView: React.FC = () => {
  const t = useTheme();
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
    <div className="flex flex-col min-h-screen pb-[120px]" style={{ background: t.bg_primary }}>
      {/* Top Bar */}
      <div 
        className="px-5 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-30 border-b"
        style={{ background: `${t.bg_primary}CC`, borderColor: t.border_secondary }}
      >
        <button onClick={() => setCommunityScreen('hub')}>
          <ArrowLeft style={{ color: t.text_primary }} size={24} />
        </button>
        <h1 className="font-bold text-[18px]" style={{ color: t.text_primary }}>Best Dresser</h1>
        <Trophy style={{ color: t.amber }} size={22} fill={t.amber} />
      </div>

      {/* Hero: Current Round */}
      <div 
        className="mx-5 mt-4 rounded-[20px] border p-6 relative overflow-hidden"
        style={{ background: t.bg_card, borderColor: `${t.amber}33` }}
      >
        <div 
          className="absolute top-0 right-0 w-24 h-24 blur-3xl -mr-10 -mt-10" 
          style={{ background: `${t.amber}1A` }}
        />
        
        <div className="flex justify-between items-center relative z-10">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: t.amber }}>APRIL 2026</span>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: t.text_tertiary }}>
             <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.amber }} />
             3 days left
          </div>
        </div>

        <h2 className="font-black text-[28px] mt-2 relative z-10 tracking-tight" style={{ color: t.text_primary }}>Quarter Finals</h2>
        <p className="text-[14px] mt-1 relative z-10" style={{ color: t.text_secondary }}>Vote for the drippiest fits in ZW</p>
        
        {/* Progress */}
        <div className="mt-6 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-[11px] uppercase tracking-wider" style={{ color: t.text_primary }}>Round 2 of 4</span>
            <span className="text-[11px]" style={{ color: t.text_tertiary }}>78% Complete</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.bg_secondary }}>
             <div className="h-full" style={{ background: t.gradient, width: '78%' }} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t relative z-10" style={{ borderColor: `${t.amber}1A` }}>
           <div className="flex flex-col">
              <span className="font-bold text-[20px]" style={{ color: t.text_primary }}>12</span>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.text_tertiary }}>Nominees</span>
           </div>
           <div className="flex flex-col">
              <span className="font-bold text-[20px]" style={{ color: t.text_primary }}>3.2k</span>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.text_tertiary }}>Votes</span>
           </div>
           <div className="flex flex-col">
              <span className="font-bold text-[20px]" style={{ color: t.amber }}>$30</span>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.text_tertiary }}>Prize Pool</span>
           </div>
        </div>
      </div>

      {/* Nominees Grid */}
      <div className="mt-10 px-5">
        <h3 className="font-bold text-[16px] mb-4" style={{ color: t.text_primary }}>Top Nominees 💎</h3>
        <div className="grid grid-cols-2 gap-4">
           {nominees.map((n) => (
             <div key={n.id} className="relative aspect-[3/4] rounded-[24px] overflow-hidden group border" style={{ borderColor: t.border_secondary }}>
                <img 
                  src={n.img} 
                  alt={n.name} 
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                   <p className="text-white font-bold text-[14px] leading-tight">{n.name}</p>
                   <p className="text-white/60 text-[11px] mt-0.5">{n.handle}</p>
                   
                   <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                         <Star size={10} style={{ color: t.amber }} fill="currentColor" />
                         <span className="text-white font-bold text-[10px]">{n.votes}</span>
                      </div>
                      <div className="px-2 py-0.5 rounded-full border" style={{ background: `${t.accent}1A`, borderColor: `${t.accent}33` }}>
                         <span className="text-[9px] font-bold" style={{ color: t.accent }}>TOP 10</span>
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
          <h3 className="font-bold text-[16px]" style={{ color: t.text_primary }}>Live Matchups 🔥</h3>
          <button onClick={() => setCommunityScreen('bracket')} className="text-[13px] font-bold flex items-center gap-1" style={{ color: t.accent }}>
            See Full Bracket <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-4">
           {[1, 2].map(m => (
             <div key={m} className="border rounded-[20px] p-5" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
                <div className="flex items-center justify-between gap-4">
                   {/* P1 */}
                   <div className="flex flex-col items-center flex-1">
                      <div className="relative">
                        <div className="w-[64px] h-[64px] rounded-full border-2 flex items-center justify-center text-[28px] relative z-10" style={{ background: t.bg_secondary, borderColor: t.border_secondary }}>👤</div>
                        <div className="absolute inset-0 blur-lg" style={{ background: `${t.accent}33` }} />
                      </div>
                      <span className="font-bold text-[14px] mt-2.5" style={{ color: t.text_primary }}>Dwayne</span>
                      <span className="text-[11px]" style={{ color: t.text_tertiary }}>@dwaynex</span>
                   </div>
                   
                   {/* VS */}
                   <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full border flex items-center justify-center mb-1" style={{ borderColor: `${t.amber}33`, background: t.bg_primary }}>
                         <span className="font-black text-[12px]" style={{ color: t.amber }}>VS</span>
                      </div>
                      <div className="h-4 w-[1px]" style={{ background: t.border_secondary }} />
                   </div>

                   {/* P2 */}
                   <div className="flex flex-col items-center flex-1">
                      <div className="relative">
                        <div className="w-[64px] h-[64px] rounded-full border-2 flex items-center justify-center text-[28px] relative z-10" style={{ background: t.bg_secondary, borderColor: t.border_secondary }}>👤</div>
                      </div>
                      <span className="font-bold text-[14px] mt-2.5" style={{ color: t.text_primary }}>Simba</span>
                      <span className="text-[11px]" style={{ color: t.text_tertiary }}>@simbalion</span>
                   </div>
                </div>

                {/* Vote Indicator */}
                <div className="mt-6">
                   <div className="flex justify-between items-center mb-1.5 px-1">
                      <span className="font-black text-[16px]" style={{ color: t.accent }}>64%</span>
                      <span className="font-black text-[16px]" style={{ color: t.text_tertiary }}>36%</span>
                   </div>
                   <div className="h-1.5 rounded-full overflow-hidden flex" style={{ background: t.bg_secondary }}>
                      <div className="h-full" style={{ background: t.accent, width: '64%' }} />
                      <div className="h-full" style={{ background: t.border_subtle, width: '36%' }} />
                   </div>
                </div>

                <button 
                  className="mt-6 w-full h-[52px] rounded-full font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
                  style={{ background: t.text_primary, color: t.bg_primary }}
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
        <h3 className="font-bold text-[16px] mb-4" style={{ color: t.text_primary }}>How It Works 💡</h3>
        <div className="border rounded-[20px] p-6 space-y-6" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
          {[
            { n: 1, t: "Post your fit", d: "Post a high-quality photo of your outfit on Instagram." },
            { n: 2, t: "Tag @threadzw", d: "Make sure you tag our handle and use #ThreadBestDresser." },
            { n: 3, t: "Submit in-app", d: "Fill out the entry form with your post link to be reviewed." }
          ].map(step => (
            <div key={step.n} className="flex gap-4">
              <div className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0" style={{ background: `${t.accent}1A`, borderColor: `${t.accent}4D` }}>
                 <span className="font-bold text-[14px]" style={{ color: t.accent }}>{step.n}</span>
              </div>
              <div className="flex flex-col">
                 <h4 className="font-bold text-[15px]" style={{ color: t.text_primary }}>{step.t}</h4>
                 <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: t.text_secondary }}>{step.d}</p>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setCommunityScreen('bestDresserEntry')}
            className="w-full h-[56px] rounded-full text-white font-bold text-[16px] flex items-center justify-center shadow-lg active:scale-[0.98] transition-transform"
            style={{ background: t.gradient }}
          >
            Enter Contest Entry →
          </button>
        </div>
      </div>

      {/* Hall of Fame Teaser */}
      <div className="mt-10">
        <div className="px-5 flex justify-between items-center mb-4">
          <h3 className="font-bold text-[16px]" style={{ color: t.text_primary }}>Hall of Fame 🏆</h3>
          <button onClick={() => setCommunityScreen('hallOfFame')} className="text-[13px] font-bold uppercase tracking-wider" style={{ color: t.accent }}>
            View All
          </button>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-4 px-5 pb-4">
           {winners.slice(0, 3).map((w, i) => (
              <div key={i} className="min-w-[140px] border rounded-[20px] p-5 flex flex-col items-center" style={{ background: t.bg_card, borderColor: `${t.amber}33` }}>
                 <div className="relative">
                    <div className="w-[56px] h-[56px] rounded-full border-2 p-0.5" style={{ borderColor: t.amber }}>
                       <div className={`w-full h-full rounded-full bg-linear-to-br ${w.color}`} />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 text-[18px]">👑</span>
                 </div>
                 <h4 className="font-bold text-[13px] mt-3 whitespace-nowrap" style={{ color: t.text_primary }}>{w.name}</h4>
                 <span className="text-[11px] mt-0.5" style={{ color: t.text_tertiary }}>{w.month}</span>
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

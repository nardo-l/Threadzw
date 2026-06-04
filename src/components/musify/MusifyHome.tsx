import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface MusifyHomeProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  handleSearch: (val?: string) => void;
  onBack: () => void;
  musifyMode: 'native' | 'shell';
  setMusifyMode: (mode: 'native' | 'shell') => void;
  openMuzifyHome: () => void;
}

const FEATURED_ARTISTS = [
  'Burna Boy', 'Asake', 'Travis Scott', 'Drake', 'Bad Bunny',
  'Kendrick Lamar', 'Rema', 'Davido', 'Wizkid', 'Central Cee'
];

export const MusifyHome: React.FC<MusifyHomeProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  handleSearch, 
  onBack,
  musifyMode,
  setMusifyMode,
  openMuzifyHome
}) => {
  const [recentPlays, setRecentPlays] = useState<any[]>([]);
  const { session } = useAuth();

  useEffect(() => {
    const fetchRecent = async () => {
      if (!session?.user?.id) return;
      
      const { data } = await supabase
        .from('musify_sessions')
        .select('artist_name, artist_image, score_percentage')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) {
        // Unique by artist name
        const unique = data.filter((v, i, a) => a.findIndex(t => t.artist_name === v.artist_name) === i);
        setRecentPlays(unique.slice(0, 3));
      }
    };
    fetchRecent();
  }, [session]);

  return (
    <div className="flex-1 flex flex-col pt-4 overflow-y-auto no-scrollbar pb-10">
      {/* Top Bar */}
      <div className="px-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[#C6FF00] font-mono text-[18px] font-bold tracking-[-1px]">musify</span>
        </div>
      </div>

      {/* Hero */}
      <div className="mt-10 px-7 text-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            filter: [
              'drop-shadow(0 0 0px rgba(255,45,120,0))',
              'drop-shadow(0 0 20px rgba(255,45,120,0.6))',
              'drop-shadow(0 0 0px rgba(255,45,120,0))'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl inline-block"
        >
          🎵
        </motion.div>
        <h1 className="text-white font-[Impact] uppercase text-3xl mt-4 tracking-tighter leading-none italic">
          Know Your Music
        </h1>
        <p className="text-[#888] text-[15px] mt-2">
          Search an artist. Prove you're a real fan.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mt-8 px-6">
        <div className={`
          flex items-center h-14 bg-[#111] border-[1.5px] rounded-2xl px-4 transition-all
          ${searchQuery ? 'border-[#C6FF00] shadow-[0_0_0_3px_rgba(255,45,120,0.1)]' : 'border-[#222]'}
        `}>
          <Search size={18} className="text-[#C6FF00] mr-3" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(searchQuery);
              }
            }}
            placeholder="Search artist..."
            className="flex-1 bg-transparent text-white border-none outline-none text-base placeholder:text-[#444]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#555] ml-2">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Experience Selector */}
      <div className="mt-6 flex flex-col items-center">
        <div className="flex items-center justify-center gap-3 px-6">
          <button
            onClick={() => setMusifyMode('shell')}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-all border
              ${musifyMode === 'shell' 
                ? 'bg-gradient-to-r from-[#9B27AF] to-[#C6FF00] text-white border-transparent shadow-lg shadow-[#C6FF00]/20' 
                : 'bg-[#111] border-[#222] text-[#888]'}
            `}
          >
            <span>🎵</span>
            <span>Muzify</span>
          </button>

          <button
            onClick={() => setMusifyMode('native')}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-all border
              ${musifyMode === 'native' 
                ? 'bg-gradient-to-r from-[#9B27AF] to-[#C6FF00] text-white border-transparent shadow-lg shadow-[#C6FF00]/20' 
                : 'bg-[#111] border-[#222] text-[#888]'}
            `}
          >
            <span>⚡</span>
            <span>ThreadZW Quiz</span>
          </button>
        </div>
        
        <p className="text-[#555] text-[11px] mt-3 font-medium">
          {musifyMode === 'shell' 
            ? 'Muzify music quiz experience' 
            : 'YouTube clips · ThreadZW scores'}
        </p>
      </div>

      {/* Search Button */}
      <div className="mt-5 px-6">
        <button
          onClick={() => {
            console.log('🔍 Search button clicked, query:', searchQuery);
            handleSearch(searchQuery);
          }}
          disabled={!searchQuery || searchQuery.trim().length === 0}
          className={`
            w-full h-[52px] rounded-full flex items-center justify-center font-bold text-[15px] transition-all
            ${searchQuery.trim() 
              ? 'bg-gradient-to-r from-[#9B27AF] to-[#C6FF00] text-white' 
              : 'bg-[#1a1a1a] text-[#555]'}
          `}
        >
          {musifyMode === 'shell' ? 'Open on Muzify →' : 'Search →'}
        </button>

        {musifyMode === 'shell' && (
          <button
            onClick={openMuzifyHome}
            className="w-full mt-3 bg-[#111] border-[1.5px] border-[#C6FF00] rounded-[14px] p-4 flex items-center gap-3.5 group active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-full bg-linear-to-br from-[#9B27AF] to-[#C6FF00] flex items-center justify-center text-xl shadow-lg shadow-[#C6FF00]/20 flex-shrink-0">
              🎵
            </div>
            <div className="flex-1 text-left ml-0.5">
              <p className="text-white font-bold text-[15px]">Open Muzify</p>
              <p className="text-[#888] text-[12px] mt-0.5">Browse all artists & quizzes</p>
            </div>
            <div className="text-[#C6FF00] text-xl font-bold group-hover:translate-x-1 transition-transform">
              →
            </div>
          </button>
        )}
      </div>

      {/* Quick Play */}
      <div className="mt-12">
        <h3 className="px-7 text-[#888] text-[12px] uppercase tracking-[0.2em] mb-4 font-bold">Quick Play</h3>
        <div className="flex gap-3 overflow-x-auto px-6 no-scrollbar">
          {FEATURED_ARTISTS.map(artist => (
            <button
              key={artist}
              onClick={() => {
                setSearchQuery(artist);
                handleSearch(artist);
              }}
              className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-full py-2 px-4 whitespace-nowrap active:scale-95 transition-transform"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C6FF00] to-[#9B27AF] flex items-center justify-center text-white text-[13px] font-bold">
                {artist[0]}
              </div>
              <span className="text-white text-[13px] font-bold">{artist}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Plays */}
      {recentPlays.length > 0 && (
        <div className="mt-10">
          <h3 className="px-7 text-[#888] text-[12px] uppercase tracking-[0.2em] mb-4 font-bold">Recently Played</h3>
          <div className="px-5 flex flex-col gap-2">
            {recentPlays.map((item, idx) => (
              <button
                key={`recent-play-${idx}`}
                onClick={() => {
                  setSearchQuery(item.artist_name);
                  handleSearch(item.artist_name);
                }}
                className="w-full bg-[#111] border border-[#222] rounded-xl p-3 flex items-center group active:scale-[0.98] transition-transform"
              >
                <div className="w-11 h-11 rounded-full bg-[#222] overflow-hidden flex-shrink-0">
                  {item.artist_image ? (
                    <img src={item.artist_image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#C6FF00] font-bold text-lg">
                      {item.artist_name[0]}
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1 text-left">
                  <p className="text-white text-[14px] font-bold">{item.artist_name}</p>
                  <p className="text-[#888] text-[12px] mt-0.5">Best: {item.score_percentage}%</p>
                </div>
                <div className="text-[#C6FF00] text-[20px] font-bold group-hover:translate-x-1 transition-transform">
                  ›
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

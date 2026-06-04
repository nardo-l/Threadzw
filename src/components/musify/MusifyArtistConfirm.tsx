import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

interface MusifyArtistConfirmProps {
  artist: any;
  trackCount: number;
  difficulty: 'normal' | 'hard';
  setDifficulty: (diff: 'normal' | 'hard') => void;
  onStart: () => void;
  onCancel: () => void;
}

export const MusifyArtistConfirm: React.FC<MusifyArtistConfirmProps> = ({
  artist,
  trackCount,
  difficulty,
  setDifficulty,
  onStart,
  onCancel
}) => {
  return (
    <div className="flex-1 relative overflow-hidden flex flex-col overflow-y-auto scrollbar-hide">
      {/* Background with Blur */}
      <div 
        className="absolute inset-0 z-0 bg-center bg-cover scale-110 blur-2xl opacity-40 grayscale"
        style={{ backgroundImage: `url(${artist.image})` }}
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/80 to-transparent" />

      {/* Content wrapper for scrolling */}
      <div className="relative z-20 flex flex-col items-center min-h-full">
        {/* Top action */}
        <div className="w-full pt-4 px-6 flex items-center">
          <button 
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-white/10"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-10">
        {/* Artist Image Circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
          className="w-[100px] h-[100px] rounded-full border-[3px] border-[#C6FF00] overflow-hidden shadow-[0_0_40px_rgba(255,45,120,0.3)]"
        >
          <img src={artist.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </motion.div>

        <h2 className="mt-6 text-white text-3xl font-[Impact] tracking-tight text-center uppercase italic px-4 leading-none">
          {artist.name}
        </h2>
        
        <p className="mt-3 text-[#888] text-[14px]">10 songs · 5 second clips</p>

        <div className="mt-4 bg-[#111] border border-[#222] rounded-full py-1.5 px-4">
          <span className="text-[#888] text-[12px] font-bold"># {trackCount} tracks found</span>
        </div>

        {/* Difficulty Selector */}
        <div className="mt-10 flex items-center gap-3">
          <button
            onClick={() => setDifficulty('normal')}
            className={`
              px-6 py-2.5 rounded-full text-[13px] font-bold transition-all border
              ${difficulty === 'normal' 
                ? 'bg-gradient-to-r from-[#9B27AF] to-[#C6FF00] text-white border-transparent' 
                : 'bg-black/50 text-[#888] border-[#222]'}
            `}
          >
            Normal
          </button>
          <button
            onClick={() => setDifficulty('hard')}
            className={`
              px-6 py-2.5 rounded-full text-[13px] font-bold transition-all border flex items-center gap-2
              ${difficulty === 'hard' 
                ? 'bg-gradient-to-r from-[#9B27AF] to-[#C6FF00] text-white border-transparent' 
                : 'bg-black/50 text-[#888] border-[#222]'}
            `}
          >
            🔥 Hard Mode
          </button>
        </div>

        {difficulty === 'hard' && (
          <p className="mt-3 text-[#C6FF00] text-[11px] font-bold animate-pulse uppercase tracking-widest">
            Fast response required (5s window)
          </p>
        )}

        {/* Start Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onStart}
          className="mt-10 w-full max-w-[280px] h-14 rounded-full bg-gradient-to-r from-[#9B27AF] to-[#C6FF00] text-white font-[Arial Black] text-base shadow-[0_8px_30px_rgba(255,45,120,0.4)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          Start Quiz 🎵
        </motion.button>
      </div>
    </div>
  </div>
  );
};

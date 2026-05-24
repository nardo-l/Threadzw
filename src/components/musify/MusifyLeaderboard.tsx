import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Trophy, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MusifyLeaderboardProps {
  artistName: string;
  onBack: () => void;
}

export const MusifyLeaderboard: React.FC<MusifyLeaderboardProps> = ({ 
  artistName, 
  onBack 
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('musify_leaderboard')
        .select('*')
        .eq('artist_name', artistName)
        .order('best_percentage', { ascending: false })
        .order('max_streak', { ascending: false })
        .limit(20);
      
      if (data) setData(data);
      setLoading(false);
    };
    fetchLeaderboard();
  }, [artistName]);

  return (
    <div className="flex-1 flex flex-col pt-4 overflow-y-auto no-scrollbar pb-20 bg-black">
      {/* Top Bar */}
      <div className="px-6 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-white/60 text-[11px] uppercase tracking-widest font-bold">Leaderboard</h2>
          <h3 className="text-white text-[20px] font-[Impact] uppercase italic tracking-tighter truncate leading-none mt-0.5">
            {artistName}
          </h3>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <Trophy size={18} className="text-[#FF2D78] mb-1" />
          <span className="text-white font-mono text-[11px] font-bold">TOP 20</span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-2 border-[#FF2D78] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#444] text-xs font-bold uppercase tracking-widest">Fetching Champions...</p>
        </div>
      ) : data.length > 0 ? (
        <div className="mt-8 px-5 flex flex-col gap-2">
          {data.map((item, idx) => {
            const isMe = item.user_id === session?.user?.id;
            const rank = idx + 1;
            
            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id}
                className={`
                  flex items-center gap-3 p-3 rounded-2xl border transition-all
                  ${isMe ? 'bg-[#FF2D78]/10 border-[#FF2D78]/30 shadow-[0_4px_15px_rgba(255,45,120,0.1)]' : 'bg-[#111] border-[#222]'}
                `}
              >
                <div className={`
                  w-8 flex flex-col items-center justify-center text-sm font-black italic
                  ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-amber-600' : 'text-white/20'}
                `}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                </div>

                <div className="w-10 h-10 rounded-full bg-[#222] border-[1.5px] border-white/5 overflow-hidden flex-shrink-0">
                  {item.avatar_url ? (
                    <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#FF2D78] font-bold">
                      {item.display_name?.[0]?.toUpperCase() || 'A'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className={`text-[14px] font-bold truncate ${isMe ? 'text-[#FF2D78]' : 'text-white'}`}>
                      {item.display_name || 'Anonymous'}
                    </p>
                    {isMe && <span className="bg-[#FF2D78] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm flex-shrink-0">You</span>}
                  </div>
                  {item.max_streak > 3 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Flame size={10} className="text-orange-500 fill-orange-500" />
                      <span className="text-orange-500 text-[10px] font-black uppercase italic">{item.max_streak} Streak</span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className={`text-xl font-black italic italic-none ${isMe ? 'text-[#FF2D78]' : 'text-white'}`}>
                    {item.best_percentage}%
                  </p>
                  <p className="text-[#444] text-[10px] font-bold">BEST SCORE</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <p className="text-[#444] text-sm font-bold uppercase tracking-widest leading-relaxed">
            No champions yet.<br/>Be the first to claim the throne.
          </p>
        </div>
      )}
    </div>
  );
};

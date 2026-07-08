import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Users,
  Search
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { formatDistanceToNow, parseISO } from 'date-fns';

export const Followers: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { followers, shops } = useInventory();
  
  const shop = shops.find(s => s.id === id);
  const shopFollowers = followers[id || ''] || [];

  if (!shop) return null;

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-[#0d0d0d]">
      {/* Top Bar */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between max-w-[430px] mx-auto bg-[#0d0d0d]/80 border-[#222]"
      >
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#25D366]">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-pacifico text-white">Followers</h1>
        </div>
        <span 
          className="px-3 py-1 text-[10px] font-mono font-bold rounded-pill uppercase tracking-wider bg-[#25D366]/20 text-[#25D366]"
        >
          {shopFollowers.length}
        </span>
      </header>

      <main className="pt-24 px-6 flex flex-col gap-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" size={16} />
          <input 
            type="text"
            placeholder="Search followers..."
            className="w-full border rounded-pill py-3 pl-12 pr-4 text-sm focus:outline-none transition-all bg-[#111] border-[#222] text-white"
          />
        </div>

        {shopFollowers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[#111] text-[#555]">
              <Users size={40} />
            </div>
            <div>
              <h3 className="text-xl font-syne font-bold text-white">No followers yet</h3>
              <p className="text-sm font-sans mt-1 text-[#555]">Be the first to follow {shop.name}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {shopFollowers.map((follower, i) => (
              <motion.div 
                key={follower.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 py-2"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border bg-[#111] border-[#222]">
                  {follower.avatar}
                </div>
                <div className="flex-1 flex flex-col">
                  <h4 className="text-sm font-syne font-bold leading-tight text-white">{follower.name}</h4>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">{follower.handle}</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">
                  Followed {formatDistanceToNow(parseISO(follower.followedAt), { addSuffix: true })}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

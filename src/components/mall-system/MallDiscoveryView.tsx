import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Plus, ArrowRight, Share2, Users, Building, ChevronLeft, Map as MapIcon, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const MallDiscoveryView: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [selectedTown, setSelectedTown] = useState(localStorage.getItem('thread_selected_town') || 'Harare');
  const [malls, setMalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMalls = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('malls')
          .select('*, mall_shops(count)')
          .eq('town', selectedTown);
        
        if (data) setMalls(data);
      } catch (err) {
        console.error('Error fetching malls:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMalls();
  }, [selectedTown]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-sans select-none">
      {/* Editorial Header */}
      <header className="px-6 pt-12 pb-8 bg-white/50 backdrop-blur-xl sticky top-0 z-40 border-b border-border">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2 animate-pulse">Live Navigation</span>
            <h1 className="text-4xl font-syne font-black tracking-tighter text-soft-black">Malls & Hubs</h1>
          </div>
          <button 
            onClick={() => navigate('/create-mall')}
            className="w-14 h-14 rounded-full bg-soft-black text-white flex items-center justify-center shadow-heavy active:scale-90 transition-all"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Town Filter with Premium Styling */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6">
          {['Harare', 'Bulawayo', 'Mutare', 'Gweru'].map(town => (
            <button
              key={town}
              onClick={() => setSelectedTown(town)}
              className={`
                px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap
                ${selectedTown === town 
                  ? 'bg-soft-black border-soft-black text-white shadow-heavy' 
                  : 'bg-white border-border text-[#AAA] hover:text-soft-black'}
              `}
            >
              {town}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 pt-10">
        {/* Featured Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            <h2 className="font-syne font-black text-xl tracking-tighter text-soft-black">CURATED SPACES</h2>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#CCC] italic">High Density</span>
        </div>

        <div className="space-y-8">
          {loading ? (
            [1, 2].map(i => (
              <div key={`mall-pulse-${i}`} className="h-[400px] bg-warm-grey rounded-[40px] animate-pulse border border-border" />
            ))
          ) : malls.length > 0 ? (
            malls.map((mall, idx) => (
              <MallCard key={mall.id} mall={mall} index={idx} />
            ))
          ) : (
            <div className="bg-white rounded-[40px] p-12 py-20 flex flex-col items-center text-center border border-border shadow-premium">
              <div className="w-20 h-20 rounded-full bg-warm-grey flex items-center justify-center mb-6 shadow-inset">
                <Building size={32} className="text-[#DDD]" />
              </div>
              <h3 className="text-soft-black font-black text-2xl tracking-tighter mb-3">CITY EMPTY</h3>
              <p className="text-[#888] text-sm max-w-[200px] mb-10 leading-relaxed font-medium">
                There are no malls active in {selectedTown} yet. Start the movement.
              </p>
              <button 
                onClick={() => navigate('/create-mall')}
                className="h-14 px-10 bg-soft-black text-white rounded-full font-black text-sm tracking-widest uppercase shadow-heavy active:scale-95 transition-all"
              >
                Launch Hub
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const MallCard = ({ mall, index }: { mall: any; index: number }) => {
  const navigate = useNavigate();
  const shopCount = mall.mall_shops?.[0]?.count || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(`/mall/${mall.id}`)}
      className="bg-white rounded-[48px] overflow-hidden border border-border shadow-premium active:shadow-heavy active:scale-[0.98] transition-all group cursor-pointer relative"
    >
      {/* Banner with Immersive Treatment */}
      <div className="h-[280px] relative overflow-hidden">
        {mall.banner_url ? (
          <img 
            src={mall.banner_url} 
            className="w-full h-full object-cover transition-transform duration-1000 group-active:scale-110" 
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-muted-charcoal to-soft-black" />
        )}
        
        {/* Verification & Meta Overlay */}
        <div className="absolute top-6 left-6 right-6 flex items-start justify-between z-20">
          {mall.is_verified && (
            <div className="bg-white shadow-xl px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase text-soft-black tracking-widest">Verified Hub</span>
            </div>
          )}
          
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white">
            <Share2 size={18} />
          </div>
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-soft-black via-transparent to-transparent opacity-80" />
        
        {/* Text over Banner */}
        <div className="absolute bottom-8 left-8 right-8 z-10 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-primary" />
            <span className="text-[11px] font-black uppercase tracking-widest opacity-80">{shopCount} CREATORS ACTIVE</span>
          </div>
          <h3 className="text-3xl font-syne font-black tracking-tighter leading-tight drop-shadow-lg">{mall.name}</h3>
        </div>
      </div>

      <div className="p-8">
        <p className="text-[#888] text-sm mb-8 line-clamp-2 leading-relaxed font-medium">
          {mall.description || 'A curated collective of elite fashion brands and creators pushing Zimbabwean culture forward.'}
        </p>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <div className="flex items-center">
            <div className="flex -space-x-3 mr-4">
              {[1, 2, 3].map(i => (
                <div key={`occupant-pulse-${i}`} className="w-10 h-10 rounded-full border-2 border-white bg-warm-grey overflow-hidden shadow-sm flex items-center justify-center text-lg">
                  🏙️
                </div>
              ))}
              {shopCount > 3 && (
                <div className="w-10 h-10 rounded-full border-2 border-white bg-soft-black flex items-center justify-center text-white text-[10px] font-black">
                  +{shopCount - 3}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#AAA]">Occupancy</span>
              <span className="text-xs font-black text-soft-black">HIGH CAPACITY</span>
            </div>
          </div>
          
          <button className="h-12 w-12 rounded-full bg-warm-grey flex items-center justify-center text-soft-black shadow-premium group-active:translate-x-1 transition-transform">
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

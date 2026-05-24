import React, { useState } from 'react';
import { Search, Store, Users, MapPin, Check, ArrowLeft, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { SHOP_CATEGORIES, ZIMBABWE_TOWNS } from '../../constants';
import { motion, AnimatePresence } from 'motion/react';

export const ShopsView: React.FC = () => {
  const navigate = useNavigate();
  const { setBuyerFlowState, setCurrentShopId, following, toggleFollow, shops } = useInventory();
  const { profile } = useAuth();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTownPicker, setShowTownPicker] = useState(false);
  const [selectedTown, setSelectedTown] = useState(localStorage.getItem('thread_selected_town') || profile?.town || 'Harare');

  const categories = ["All", ...SHOP_CATEGORIES.map(c => c.label)];

  const filteredShops = shops.filter(shop => {
    const matchesFilter = filter === 'All' || shop.category === filter;
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          shop.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTown = !selectedTown || selectedTown === 'Zimbabwe' || shop.area === selectedTown;
    return matchesFilter && matchesSearch && matchesTown;
  });

  const handleShopTap = (id: string) => {
    navigate(`/shop/${id}`);
  };

  return (
    <div className="flex flex-col min-h-screen pb-[100px] bg-[#0A0A0A]">
      {/* Top Bar */}
      <div 
        className="px-5 py-4 flex flex-col gap-1 sticky top-0 backdrop-blur-md z-30 bg-black/80 border-b border-white/5"
      >
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-pacifico text-[28px] text-[#FF5FA2]">Shops</h1>
          <div className="ml-auto">
            <Search className="text-white" size={24} />
          </div>
        </div>
        <button 
          onClick={() => setShowTownPicker(true)}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ml-10 text-white/40"
        >
          <MapPin size={10} /> {selectedTown} <ChevronDown size={10} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="mx-5 mt-1 relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF5FA2]">
          <Search size={16} />
        </div>
        <input 
          type="text"
          placeholder="Search for shops..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 border border-white/10 rounded-full pl-11 pr-4 text-[14px] focus:outline-none transition-colors bg-white/5 text-white focus:border-[#FF5FA2]"
        />
      </div>

      {/* Affiliate Card */}
      <div 
        className="mx-5 mt-4 rounded-[16px] p-5 flex items-center justify-between bg-gradient-to-br from-[#9B27AF] to-[#FF5FA2] shadow-lg"
      >
        <div className="flex flex-col max-w-[190px]">
           <div className="w-11 h-11 rounded-[10px] bg-white/20 flex items-center justify-center mb-3">
              <Users className="text-white" size={24} />
           </div>
           <h3 className="text-white font-bold text-[15px] leading-tight">
             Open a shop for someone. Earn on every sale.
           </h3>
           <button 
             onClick={() => toast.info("Coming soon....", {
               style: { background: '#111', color: '#fff', border: `1px solid #222` }
             })}
             className="mt-3 w-fit h-[38px] bg-white rounded-full px-4 text-[13px] font-bold shadow-md transition-transform active:scale-95 text-[#FF5FA2]"
           >
              Start Earning →
           </button>
        </div>
        <div className="text-right">
           <span className="text-white/70 text-[11px] block">Per Sale</span>
           <span className="text-white text-[28px] font-bold block leading-none mt-1">15%</span>
           <span className="text-white/70 text-[11px] block mt-1">commission</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 px-5 mt-5">
        {categories.map(c => (
          <button 
            key={c}
            onClick={() => setFilter(c)}
            className={`h-[34px] px-4 rounded-full text-[12px] font-medium transition-all shrink-0 border ${filter === c ? 'bg-[#FF5FA2] border-[#FF5FA2] text-white shadow-md' : 'bg-transparent border-white/10 text-white/40'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Featured Shops Row */}
      <div className="mt-7">
        <h2 className="font-bold text-[15px] px-5 mb-3 flex items-center gap-2 text-white/60">
          Featured Shops This Week 🆕
        </h2>
        <div className="flex overflow-x-auto no-scrollbar gap-4 px-5 pb-4">
          {shops.slice(0, 5).map(shop => (
            <div 
              key={shop.id} 
              className="w-[152px] border border-white/5 rounded-[24px] p-4 flex flex-col items-center shrink-0 relative cursor-pointer bg-[#111111]"
              onClick={() => handleShopTap(shop.id)}
            >
              <div className="absolute top-3 right-3 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FF5FA2]">
                HOT
              </div>
              <div className="w-[64px] h-[64px] rounded-full border-2 p-0.5 mb-3 overflow-hidden border-[#FF5FA2]">
                {shop.logo_url ? (
                   <img src={shop.logo_url} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                   <div className="w-full h-full rounded-full flex items-center justify-center text-lg bg-linear-to-br from-[#9B27AF] to-[#FF5FA2] text-white">🏪</div>
                )}
              </div>
              <div className="flex items-center gap-1 w-full justify-center min-w-0">
                <span className="font-bold text-[13px] truncate text-white">{shop.name}</span>
                {shop.is_verified && (
                  <div className="bg-[#FF5FA2] rounded-full p-0.5 shrink-0">
                    <Check size={8} className="text-white stroke-[4]" />
                  </div>
                )}
              </div>
              <span className="text-[11px] mt-0.5 text-white/40">{shop.category}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFollow(shop.id); }}
                className={`mt-3 w-full h-8 rounded-full border transition-all text-[12px] font-bold flex items-center justify-center gap-1 ${following.includes(shop.id) ? 'bg-[#FF5FA2] border-[#FF5FA2] text-white shadow-md' : 'border-[#FF5FA2] text-[#FF5FA2]'}`}
              >
                {following.includes(shop.id) ? <><Check size={12} /> Following</> : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>


      {/* Town Picker Popup */}
      <AnimatePresence>
        {showTownPicker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTownPicker(false)}
              className="fixed inset-0 z-[100] backdrop-blur-sm bg-black/40"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[32px] p-8 max-h-[80vh] flex flex-col border-t border-[#EFEFEF] bg-white shadow-2xl"
            >
              <div className="w-12 h-1 rounded-full mx-auto mb-8 bg-[#EFEFEF]" />
              <h2 className="text-xl font-bold mb-6 text-[#111111]">Select Town</h2>
              <div className="overflow-y-auto no-scrollbar flex-1 space-y-2 pb-10">
                <button 
                  onClick={() => {
                    setSelectedTown('Zimbabwe');
                    localStorage.setItem('thread_selected_town', 'Zimbabwe');
                    setShowTownPicker(false);
                  }}
                  className={`w-full p-4 rounded-2xl text-left font-bold transition-all ${selectedTown === 'Zimbabwe' ? 'bg-[#FF2D78] text-white shadow-md' : 'bg-[#F5F5F5] text-[#888888]'}`}
                >
                  All Zimbabwe 🇿🇼
                </button>
                {ZIMBABWE_TOWNS.map(town => (
                  <button 
                    key={town}
                    onClick={() => {
                      setSelectedTown(town);
                      localStorage.setItem('thread_selected_town', town);
                      setShowTownPicker(false);
                    }}
                    className={`w-full p-4 rounded-2xl text-left font-bold transition-all ${selectedTown === town ? 'bg-[#FF2D78] text-white shadow-md' : 'bg-[#F5F5F5] text-[#888888]'}`}
                  >
                    {town}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* All Shops List */}
      <div className="mt-8 px-5">
        <h2 className="font-bold text-[15px] mb-3 text-white/60">All Shops</h2>
        <div className="flex flex-col gap-3">
          {filteredShops.map(shop => (
            <div 
              key={shop.id} 
              className="border border-white/5 rounded-[20px] p-4 flex items-start cursor-pointer transition-colors bg-[#111111] active:scale-[0.98]"
              onClick={() => handleShopTap(shop.id)}
            >
              <div className="w-[52px] h-[52px] rounded-full border-2 p-0.5 shrink-0 overflow-hidden border-[#FF5FA2]">
                 {shop.logo_url ? (
                   <img src={shop.logo_url} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   <div className="w-full h-full rounded-full flex items-center justify-center text-lg bg-linear-to-br from-[#9B27AF] to-[#FF5FA2] text-white">🏪</div>
                 )}
              </div>
              <div className="ml-3.5 flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <h3 className="font-bold text-[15px] truncate text-white">{shop.name}</h3>
                    {shop.is_verified && (
                      <div className="bg-[#FF5FA2] rounded-full p-0.5 shrink-0">
                        <Check size={8} className="text-white stroke-[4]" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFollow(shop.id); }}
                    className={`h-[30px] px-3.5 rounded-full border transition-all text-[10px] font-bold shrink-0 ${following.includes(shop.id) ? 'bg-[#FF5FA2] border-[#FF5FA2] text-white shadow-sm' : 'border-[#FF5FA2] text-[#FF5FA2]'}`}
                  >
                     {following.includes(shop.id) ? 'Following ✓' : 'Follow'}
                  </button>
                </div>
                <div className="text-[12px] text-white/40">{shop.category}</div>
                <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                   <span className="text-[11px] flex items-center gap-1 shrink-0 text-white/40">
                      📦 {shop.product_count} products
                   </span>
                   <span className="text-[11px] flex items-center gap-1 shrink-0 text-white/40">
                      👥 {shop.follower_count || 0}
                   </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-white/20">
                  <MapPin size={11} />
                  <p className="text-[11px] truncate">{shop.area}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

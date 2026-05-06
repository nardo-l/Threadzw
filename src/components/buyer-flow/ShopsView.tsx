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
    <div className="flex flex-col bg-black min-h-screen pb-[100px]">
      {/* Top Bar */}
      <div className="px-5 py-4 flex flex-col gap-1 sticky top-0 bg-black/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-pacifico text-[22px] text-[#FF2D78]">Shops</h1>
          <div className="ml-auto">
            <Search className="text-white" size={24} />
          </div>
        </div>
        <button 
          onClick={() => setShowTownPicker(true)}
          className="flex items-center gap-1 text-[10px] font-bold text-white/50 uppercase tracking-widest ml-10"
        >
          <MapPin size={10} /> {selectedTown} <ChevronDown size={10} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="mx-5 mt-1 relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF2D78]">
          <Search size={16} />
        </div>
        <input 
          type="text"
          placeholder="Search for shops..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 bg-[#111111] border border-[#222] rounded-full pl-11 pr-4 text-white text-[14px] focus:outline-none focus:border-[#FF2D78] transition-colors"
        />
      </div>

      {/* Affiliate Card */}
      <div className="mx-5 mt-4 rounded-[16px] bg-linear-to-br from-[#9B27AF] to-[#FF2D78] p-5 flex items-center justify-between">
        <div className="flex flex-col max-w-[190px]">
           <div className="w-11 h-11 rounded-[10px] bg-black/20 flex items-center justify-center mb-3">
             <Users className="text-white" size={24} />
           </div>
           <h3 className="text-white font-bold text-[15px] leading-tight">
             Open a shop for someone. Earn on every sale.
           </h3>
           <button 
             onClick={() => toast.info("Coming soon....", {
               style: { background: '#111', color: 'white', border: '1px solid #222' }
             })}
             className="mt-3 w-fit h-[38px] bg-white rounded-full px-4 text-[#FF2D78] text-[13px] font-bold shadow-lg transition-transform active:scale-95"
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
            className={`h-[34px] px-4 rounded-full text-[12px] font-medium transition-all shrink-0
              ${filter === c ? 'bg-linear-to-br from-[#9B27AF] to-[#FF2D78] text-white' : 'bg-[#111] border border-[#222] text-[#888]'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* New This Week */}
      <div className="mt-7">
        <h2 className="text-white font-bold text-[15px] px-5 mb-3 flex items-center gap-2">
          Featured Shops This Week 🆕
        </h2>
        <div className="flex overflow-x-auto no-scrollbar gap-3 px-5 pb-2">
          {shops.slice(0, 5).map(shop => (
            <div 
              key={shop.id} 
              className="w-[152px] bg-[#111111] border border-[#222] rounded-[14px] p-3.5 flex flex-col items-center shrink-0 relative"
              onClick={() => handleShopTap(shop.id)}
            >
              <div className="absolute top-2 right-2 bg-linear-to-br from-[#9B27AF] to-[#FF2D78] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                HOT
              </div>
              <div className="w-[52px] h-[52px] rounded-full border-2 border-[#FF2D78] p-0.5 mb-2.5 overflow-hidden">
                {shop.logo_url ? (
                   <img src={shop.logo_url} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                   <div className="w-full h-full rounded-full bg-linear-to-br from-[#1a1a1a] to-[#333] flex items-center justify-center text-lg">🏪</div>
                )}
              </div>
              <div className="flex items-center gap-1 w-full justify-center min-w-0">
                <span className="text-white font-bold text-[13px] truncate">{shop.name}</span>
                {shop.is_verified && (
                  <div className="bg-blue-500 rounded-full p-0.5 shrink-0">
                    <Check size={8} className="text-white stroke-[4]" />
                  </div>
                )}
              </div>
              <span className="text-[#888] text-[11px] mt-0.5">{shop.category}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFollow(shop.id); }}
                className={`mt-2.5 w-full h-8 rounded-full border transition-all text-[12px] font-bold flex items-center justify-center gap-1
                  ${following.includes(shop.id) ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] border-transparent text-white' : 'border-[#FF2D78] text-[#FF2D78]'}`}
              >
                {following.includes(shop.id) ? <><Check size={12} /> Following</> : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* All Shops List */}
      {/* Town Picker Popup */}
      <AnimatePresence>
        {showTownPicker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTownPicker(false)}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-[#0d0d0d] rounded-t-[32px] p-8 max-h-[80vh] flex flex-col border-t border-[#222]"
            >
              <div className="w-12 h-1 bg-[#333] rounded-full mx-auto mb-8" />
              <h2 className="text-white text-xl font-bold mb-6">Select Town</h2>
              <div className="overflow-y-auto no-scrollbar flex-1 space-y-2 pb-10">
                <button 
                  onClick={() => {
                    setSelectedTown('Zimbabwe');
                    localStorage.setItem('thread_selected_town', 'Zimbabwe');
                    setShowTownPicker(false);
                  }}
                  className={`w-full p-4 rounded-2xl text-left font-bold transition-all ${
                    selectedTown === 'Zimbabwe' ? 'bg-[#FF2D78] text-white' : 'bg-[#111] text-[#888]'
                  }`}
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
                    className={`w-full p-4 rounded-2xl text-left font-bold transition-all ${
                      selectedTown === town ? 'bg-[#FF2D78] text-white' : 'bg-[#111] text-[#888]'
                    }`}
                  >
                    {town}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <div className="mt-8 px-5">
        <h2 className="text-white font-bold text-[15px] mb-3">All Shops</h2>
        <div className="flex flex-col gap-2.5">
          {filteredShops.map(shop => (
            <div 
              key={shop.id} 
              className="bg-[#111] border border-[#222] rounded-[14px] p-4 flex items-start"
              onClick={() => handleShopTap(shop.id)}
            >
              <div className="w-[52px] h-[52px] rounded-full border-2 border-[#FF2D78] p-0.5 shrink-0 overflow-hidden">
                 {shop.logo_url ? (
                   <img src={shop.logo_url} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   <div className="w-full h-full rounded-full bg-linear-to-br from-[#1a1a1a] to-[#333] flex items-center justify-center text-lg">🏪</div>
                 )}
              </div>
              <div className="ml-3.5 flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <h3 className="text-white font-bold text-[15px] truncate">{shop.name}</h3>
                    {shop.is_verified && (
                      <div className="bg-blue-500 rounded-full p-0.5 shrink-0">
                        <Check size={8} className="text-white stroke-[4]" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFollow(shop.id); }}
                    className={`h-[30px] px-3.5 rounded-full border transition-all text-[10px] font-bold shrink-0
                      ${following.includes(shop.id) ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] border-transparent text-white' : 'border-[#FF2D78] text-[#FF2D78]'}`}
                  >
                     {following.includes(shop.id) ? 'Following ✓' : 'Follow'}
                  </button>
                </div>
                <div className="text-[#888] text-[12px]">{shop.category}</div>
                <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                   <span className="text-[#888] text-[12px] flex items-center gap-1 shrink-0">
                      📦 {shop.product_count} products
                   </span>
                   <span className="text-[#888] text-[12px] flex items-center gap-1 shrink-0">
                      👥 {shop.follower_count || 0}
                   </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <MapPin size={11} className="text-[#888]" />
                  <p className="text-[#888] text-[11px] truncate">{shop.area}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

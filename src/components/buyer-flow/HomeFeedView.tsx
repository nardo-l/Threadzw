import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Heart, Plus, Search, X, Users, ArrowRight, MapPin, ChevronDown, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { ZIMBABWE_TOWNS } from '../../constants';
import { supabase } from '../../lib/supabase';

const MUSIFY_URL = 'https://muzify.com/';

export const HomeFeedView: React.FC = () => {
  const navigate = useNavigate();
  const { 
    setBuyerFlowState, 
    setCurrentProductId, 
    savedProductIds, 
    toggleSave,
    markStoryAsSeen,
    storiesSeen,
    products,
    shops,
    unreadNotificationCount
  } = useInventory();

  const { user, profile } = useAuth();
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [showTownPicker, setShowTownPicker] = useState(false);
  const [selectedTown, setSelectedTown] = useState(localStorage.getItem('thread_selected_town') || profile?.town || 'Harare');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [communityCards, setCommunityCards] = useState<any[]>([]);

  useEffect(() => {
    const fetchCards = async () => {
      const { data } = await supabase.from('community_cards').select('*');
      if (data) setCommunityCards(data);
    };
    fetchCards();
  }, []);

  const getCardImage = (key: string) => {
    return communityCards.find(c => c.card_key === key)?.image_url;
  };

  const categories = ['All', 'Sneakers', 'Clothing', 'Thrift', 'Electronics', 'Accessories'];

  const filteredProducts = products.filter(p => {
    const shop = shops.find(s => s.id === p.shop_id);
    const matchesTown = !selectedTown || selectedTown === 'Zimbabwe' || shop?.area === selectedTown;
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesTown && matchesCategory;
  });

  const featuredProduct = filteredProducts.find(p => p.view_count > 0) || filteredProducts[0] || products[0];
  const featuredShop = shops.find(s => s.id === featuredProduct?.shop_id);

  const handleProductTap = (id: string) => {
    navigate(`/product/${id}`);
  };

  const openStory = (index: number) => {
    setActiveStoryIndex(index);
    setStoryViewerOpen(true);
    markStoryAsSeen(shops[index].id);
  };

  return (
    <div className="flex flex-col bg-black min-h-screen pb-[100px]">
      {/* Top Bar */}
      <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-30">
        <div className="flex flex-col">
          <h1 className="font-pacifico text-[22px] text-[#FF2D78]">thread</h1>
          <button 
            onClick={() => setShowTownPicker(true)}
            className="flex items-center gap-1 text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5"
          >
            <MapPin size={10} /> {selectedTown} <ChevronDown size={10} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/search')} className="text-white">
            <Search size={22} />
          </button>
          <div className="relative cursor-pointer" onClick={() => navigate('/notifications')}>
            <Bell className="text-white" size={24} />
            {unreadNotificationCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#FF2D78] rounded-full border-2 border-black flex items-center justify-center px-1">
                <span className="text-white text-[9px] font-bold">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 py-3 shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all border whitespace-nowrap ${
              selectedCategory === cat 
                ? 'bg-[#FF2D78] border-[#FF2D78] text-white shadow-lg shadow-[#FF2D78]/20' 
                : 'bg-[#1a1a1a] border-[#222] text-[#888]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stories Row */}
      <div className="flex overflow-x-auto no-scrollbar gap-4 px-5 py-2">
        {/* Your Story */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-[52px] h-[52px] rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#222]">
            <Plus className="text-[#FF2D78]" size={20} />
          </div>
          <span className="text-[#888888] text-[10px]">Your Story</span>
        </div>

        {/* Shop Stories */}
        {shops.slice(0, 8).map((shop, i) => (
          <div 
            key={shop.id} 
            className="flex flex-col items-center gap-1.5 shrink-0"
            onClick={() => openStory(i)}
          >
            <div className={`p-[2px] rounded-full transition-all ${storiesSeen[shop.id] ? 'border-2 border-[#333]' : 'border-2 border-[#FF2D78] shadow-[0_0_8px_rgba(255,45,120,0.3)]'}`}>
              <div className="w-[46px] h-[46px] rounded-full bg-[#1a1a1a] overflow-hidden">
                {shop.logo_url ? (
                  <img src={shop.logo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-[#FF2D78] to-[#9B27AF] flex items-center justify-center text-xs">🏪</div>
                )}
              </div>
            </div>
            <span className="text-[#888888] text-[10px] truncate max-w-[52px]">{shop.name}</span>
          </div>
        ))}
      </div>

      {/* You Might Like Section */}
      <div className="mt-4 mb-2">
        <div className="flex items-center gap-2 px-5 mb-3">
          <div className="w-5 h-5 rounded-full bg-linear-to-tr from-[#FF2D78] to-[#9C27B0] flex items-center justify-center">
            <Users size={10} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-[14px] uppercase tracking-wider font-syne">You might like</h2>
        </div>
        
        <div className="flex overflow-x-auto no-scrollbar gap-3 px-5 pb-2">
          {/* How Fly Card */}
          <motion.div 
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/quiz')}
            className="w-[240px] aspect-[4/3] rounded-[20px] overflow-hidden shrink-0 relative bg-[#111] border border-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <div className="absolute inset-0">
               {getCardImage('how_fly') ? (
                 <img src={getCardImage('how_fly')} className="w-full h-full object-cover blur-[2px] brightness-[0.5] scale-105" />
               ) : (
                 <div className="w-full h-full bg-linear-to-br from-[#1a0a2a] to-[#2a0a1a]" />
               )}
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-[15px]">How Fly Are You?</h3>
              <p className="text-white/70 text-[11px] mt-0.5">Discover your fashion persona</p>
            </div>
          </motion.div>

          {/* Musify Card */}
          <motion.div 
            whileTap={{ scale: 0.97 }}
            onClick={() => window.open(MUSIFY_URL, '_blank')}
            className="w-[240px] aspect-[4/3] rounded-[20px] overflow-hidden shrink-0 relative bg-[#111] border border-white/5 active:scale-95 transition-all cursor-pointer"
          >
             <div className="absolute inset-0">
               {getCardImage('musify') ? (
                 <img src={getCardImage('musify')} className="w-full h-full object-cover blur-[2px] brightness-[0.5] scale-105" />
               ) : (
                 <div className="w-full h-full bg-linear-to-br from-[#0a1a0a] to-[#0a0a1a]" />
               )}
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
               <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="bg-green-500/20 border border-green-500/30 rounded-full px-1.5 py-0.5">
                    <span className="text-green-500 text-[8px] font-bold">LIVE</span>
                  </div>
                  <Music size={12} className="text-white" />
               </div>
               <h3 className="text-white font-bold text-[15px]">Musify</h3>
               <p className="text-white/70 text-[11px] mt-0.5">Quick song quiz for your personality</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Featured Drop Banner */}
      {featuredProduct && (
        <div 
          className="mx-5 mt-3 rounded-[16px] bg-linear-to-br from-[#9B27AF] to-[#FF2D78] p-4 px-5 flex items-center justify-between"
          onClick={() => handleProductTap(featuredProduct.id)}
        >
          <div className="flex flex-col">
            <span className="text-white text-[10px] font-bold tracking-wider">FEATURED DROP 🔥</span>
            <h3 className="text-white font-bold text-[16px] mt-1.5 leading-tight">{featuredProduct.name}</h3>
            <span className="text-white font-bold text-[15px] mt-0.5">${featuredProduct.price}</span>
            <span className="text-white/80 text-[12px] mt-0.5">by {featuredShop?.name || 'Local Shop'}</span>
          </div>
          <div className="w-20 h-20 rounded-[12px] bg-black/20 overflow-hidden flex items-center justify-center text-[36px]">
            {featuredProduct.images[0] ? (
              <img src={featuredProduct.images[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : '👟'}
          </div>
        </div>
      )}

      {/* New In Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-white font-bold text-[16px]">New In</h2>
          <button className="text-[#FF2D78] text-[13px] font-medium">See All</button>
        </div>
        <div className="flex overflow-x-auto no-scrollbar gap-2 px-5 pb-4">
          {products.slice(0, 10).map(p => (
            <div 
              key={p.id} 
              className="w-[160px] bg-[#111111] border border-[#222] rounded-[14px] overflow-hidden shrink-0"
              onClick={() => handleProductTap(p.id)}
            >
              <div className="w-full h-[160px] bg-card relative flex items-center justify-center text-[48px] overflow-hidden">
                 {p.images[0] ? (
                   <img src={p.images[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : '👟'}
                 <button 
                  onClick={(e) => { e.stopPropagation(); toggleSave(p.id); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
                 >
                    <Heart size={14} className={savedProductIds.includes(p.id) ? 'fill-[#FF2D78] text-[#FF2D78]' : 'text-white'} />
                 </button>
              </div>
              <div className="p-2.5">
                <div className="text-white font-bold text-[13px] truncate">{p.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-[#FF2D78] font-bold text-[13px]">${p.price}</div>
                  <div className="text-[9px] font-bold text-[#444] uppercase tracking-tighter bg-white/5 px-1.5 py-0.5 rounded leading-none">{p.category}</div>
                </div>
                <div className="text-[#888] text-[11px] mt-1 truncate">{shops.find(s => s.id === p.shop_id)?.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shops to Follow */}
      <div className="mt-6">
        <h2 className="text-white font-bold text-[16px] px-5 mb-3">Shops to Follow</h2>
        <div className="flex overflow-x-auto no-scrollbar gap-3 px-5 pb-4">
          {shops.slice(0, 8).map(shop => (
            <div key={shop.id} className="w-[140px] bg-[#111111] border border-[#222] rounded-[14px] p-3.5 flex flex-col items-center shrink-0">
               <div className="w-12 h-12 rounded-full border-2 border-[#FF2D78] p-0.5 mb-2 overflow-hidden">
                 {shop.logo_url ? (
                   <img src={shop.logo_url} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   <div className="w-full h-full bg-linear-to-br from-[#FF2D78] to-[#9B27AF] flex items-center justify-center text-xs">🏪</div>
                 )}
               </div>
               <span className="text-white font-bold text-[13px] truncate w-full text-center">{shop.name}</span>
               <span className="text-[#888] text-[11px] mt-0.5 truncate w-full text-center">{shop.category}</span>
               <span className="text-[#888] text-[11px] mt-0.5">{shop.product_count} products</span>
               <button className="mt-2 w-full h-8 rounded-full border border-[#FF2D78] text-[#FF2D78] text-[12px] font-bold active:bg-[#FF2D7811]">
                 Follow
               </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz Promo */}
      <div 
        className="mx-5 mt-6 p-5 rounded-[16px] bg-linear-to-br from-[#9B27AF26] to-[#FF2D7826] border border-[#FF2D7840] flex justify-between items-center"
      >
        <div className="flex flex-col max-w-[180px]">
          <span className="text-[32px]">🔥</span>
          <h3 className="text-white font-bold text-[16px] mt-2">How Fly Are You?</h3>
          <p className="text-[#888] text-[12px] mt-1.5 leading-tight">Take the quiz. Share your result card to Instagram Stories.</p>
          <button 
            onClick={() => navigate('/quiz')}
            className="mt-3 w-fit h-9 rounded-full border border-[#FF2D78] px-4 text-[#FF2D78] text-[12px] font-bold hover:bg-[#FF2D7810] active:scale-95 transition-all"
          >
            Find Out →
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {["The Nonchalant 😐", "The Ghost 👻", "Life of the Party 🔥"].map(tag => (
            <div key={tag} className="bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1 text-[10px] text-white whitespace-nowrap">
              {tag}
            </div>
          ))}
        </div>
      </div>

      {/* Best Dresser Promo */}
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
      <div 
        className="mx-5 mt-6 p-5 bg-[#111111] border border-[#222] border-l-4 border-l-[#f59e0b] rounded-[16px] flex justify-between items-center"
      >
        <div className="flex flex-col">
          <span className="text-[28px]">🏆</span>
          <h3 className="text-white font-bold text-[15px] mt-2">Best Dresser of the Month</h3>
          <span className="text-[#888] text-[12px] mt-1">April 2026 — Quarter Finals</span>
          <button className="mt-3 w-fit h-9 rounded-full border border-[#f59e0b] px-4 text-[#f59e0b] text-[12px] font-bold opacity-50 cursor-not-allowed">
            See Bracket
          </button>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[#888] text-[10px] uppercase">Prize</span>
          <span className="text-[#f59e0b] text-[28px] font-bold">$30</span>
          <span className="text-[#888] text-[11px]">cash</span>
        </div>
      </div>

      {/* Musify Promo */}
      <div 
        onClick={() => window.open(MUSIFY_URL, '_blank')}
        className="mx-5 mt-6 mb-[120px] p-4 bg-[#111111] border border-[#222] border-l-4 border-l-[#1DB954] rounded-[14px] flex items-center cursor-pointer active:scale-[0.98] transition-all"
      >
        <div className="w-10 h-10 bg-[#1a1a1a] rounded-[10px] flex items-center justify-center text-[20px]">
          🎵
        </div>
        <div className="ml-3 flex-1 flex flex-col">
          <div className="bg-[#1DB954]/15 border border-[#1DB954]/30 rounded-full px-2 py-0.5 inline-flex items-center w-fit mb-1">
            <span className="text-[#1DB954] text-[9px] font-bold">LIVE NOW</span>
          </div>
          <span className="text-white text-[15px] font-bold">Musify</span>
          <span className="text-[#888] text-[12px] mt-0.5">Guess the song. Beat your friends.</span>
        </div>
        <ArrowRight className="text-white" size={18} />
      </div>

      {/* Story Viewer Component */}
      <AnimatePresence>
        {storyViewerOpen && (
          <div className="fixed inset-0 z-[100] bg-black">
            <StoryViewer 
               stories={shops} 
               initialIndex={activeStoryIndex}
               onClose={() => setStoryViewerOpen(false)}
               onProductView={(id) => handleProductTap(id)}
               onShopView={(id) => {
                 setStoryViewerOpen(false);
                 navigate(`/shop/${id}`);
               }}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StoryViewer: React.FC<{ 
  stories: any[], 
  initialIndex: number, 
  onClose: () => void,
  onProductView: (id: string) => void,
  onShopView: (id: string) => void
}> = ({ stories, initialIndex, onClose, onProductView, onShopView }) => {
  const [index, setIndex] = useState(initialIndex);
  const currentStory = stories[index];

  if (!currentStory) return null;

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Progress Bars */}
      <div className="absolute top-4 left-5 right-5 z-20 flex gap-1.5 h-1">
        {stories.slice(0, 8).map((_, i) => (
          <div key={i} className="flex-1 h-full bg-[#333] rounded-full overflow-hidden">
            {i < index && <div className="w-full h-full bg-[#FF2D78]" />}
            {i === index && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'linear' }}
                onAnimationComplete={() => {
                  if (index < Math.min(stories.length, 8) - 1) setIndex(index + 1);
                  else onClose();
                }}
                className="h-full bg-[#FF2D78]"
              />
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-5 right-5 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 overflow-hidden shrink-0">
             {currentStory.logo_url ? <img src={currentStory.logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-linear-to-br from-[#FF2D78] to-[#9B27AF]" />}
          </div>
          <div className="flex flex-col">
            <span className="text-white text-[13px] font-bold">{currentStory.name}</span>
            <span className="text-[#888] text-[11px]">2h ago</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1">
          <X className="text-white" size={24} />
        </button>
      </div>

      {/* Content */}
      <div 
        className="flex-1 w-full flex items-center justify-center p-4"
        onClick={(e) => {
          const { clientX, currentTarget } = e;
          const rect = currentTarget.getBoundingClientRect();
          if (clientX < rect.width / 2) {
             if (index > 0) setIndex(index - 1);
          } else {
             if (index < Math.min(stories.length, 8) - 1) setIndex(index + 1);
             else onClose();
          }
        }}
      >
        <div className="w-full h-full rounded-[20px] bg-linear-to-br from-[#1a1a1a] to-[#000] flex items-center justify-center flex-col overflow-hidden relative">
           <div className="text-[120px] opacity-10 blur-sm absolute">👟</div>
           <h2 className="text-white font-bold text-[32px] mt-4 relative z-10 text-center px-4 uppercase tracking-tighter">New Drop Exclusive</h2>
           <p className="text-white/60 text-center px-8 mt-4 relative z-10 line-clamp-3">{currentStory.description}</p>
        </div>
      </div>

      {/* Bottom Overlay */}
      <div className="absolute bottom-10 left-0 right-0 p-8 pt-20 bg-linear-to-t from-black via-black/60 to-transparent text-center">
        <div className="text-white font-bold text-[16px]">{currentStory.name}</div>
        <div className="text-[#FF2D78] font-bold text-[15px] mt-1">Tap to visit profile</div>
        <button 
          onClick={() => onShopView(currentStory.id)}
          className="mt-4 w-full h-[46px] rounded-full border border-white/20 text-white font-bold text-[14px]"
        >
          View Shop →
        </button>
      </div>
    </div>
  );
};

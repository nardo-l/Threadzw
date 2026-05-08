import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Heart, Plus, Search, X, Users, ArrowRight, MapPin, ChevronDown, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { ZIMBABWE_TOWNS } from '../../constants';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../App';

const MUSIFY_URL = 'https://muzify.com/';

export const HomeFeedView: React.FC = () => {
  const t = useTheme();
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
    <div className="flex flex-col min-h-screen pb-[100px]" style={{ background: t.bg_primary }}>
      {/* Top Bar (Mobile Only) */}
      <div 
        className="lg:hidden px-5 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-30 border-b"
        style={{ background: `${t.bg_primary}CC`, borderColor: t.border_secondary }}
      >
        <div className="flex flex-col">
          <h1 className="font-pacifico text-[22px]" style={{ color: t.accent }}>thread</h1>
          <button 
            onClick={() => setShowTownPicker(true)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mt-0.5"
            style={{ color: t.text_secondary }}
          >
            <MapPin size={10} /> {selectedTown} <ChevronDown size={10} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/search')} style={{ color: t.text_primary }}>
            <Search size={22} />
          </button>
          <div className="relative cursor-pointer" onClick={() => navigate('/notifications')}>
            <Bell style={{ color: t.text_primary }} size={24} />
            {unreadNotificationCount > 0 && (
              <div 
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center px-1"
                style={{ background: t.accent, borderColor: t.bg_primary }}
              >
                <span className="text-white text-[9px] font-bold">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Top Header (Integrated) */}
      <div className="hidden lg:flex px-8 py-10 items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: t.text_primary }}>Daily Discover</h2>
          <button 
            onClick={() => setShowTownPicker(true)}
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] mt-3 transition-colors"
            style={{ color: t.text_tertiary }}
          >
            <MapPin size={14} style={{ color: t.accent }} /> {selectedTown} <ChevronDown size={14} />
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="transition-colors cursor-pointer" size={24} style={{ color: t.text_tertiary }} onClick={() => navigate('/search')} />
          </div>
          <div className="relative cursor-pointer" onClick={() => navigate('/notifications')}>
            <Bell className="transition-colors" size={26} style={{ color: t.text_tertiary }} />
            {unreadNotificationCount > 0 && (
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{ background: t.accent, borderColor: t.bg_primary }}
              >
                <span className="text-white text-[10px] font-bold">{unreadNotificationCount}</span>
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
            className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all border whitespace-nowrap`}
            style={{ 
              backgroundColor: selectedCategory === cat ? t.accent : t.bg_card,
              borderColor: selectedCategory === cat ? t.accent : t.border_secondary,
              color: selectedCategory === cat ? '#fff' : t.text_secondary,
              boxShadow: selectedCategory === cat ? t.shadow : 'none'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stories Row */}
      <div className="flex overflow-x-auto no-scrollbar gap-4 px-5 py-2">
        {/* Your Story */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div 
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center border"
            style={{ background: t.bg_card, borderColor: t.border_secondary }}
          >
            <Plus style={{ color: t.accent }} size={20} />
          </div>
          <span style={{ color: t.text_tertiary }} className="text-[10px]">Your Story</span>
        </div>

        {/* Shop Stories */}
        {shops.slice(0, 8).map((shop, i) => (
          <div 
            key={shop.id} 
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
            onClick={() => openStory(i)}
          >
            <div 
              className={`p-[2px] rounded-full transition-all border-2`}
              style={{ 
                borderColor: storiesSeen[shop.id] ? t.border_subtle : t.accent,
                boxShadow: storiesSeen[shop.id] ? 'none' : `0 0 8px ${t.accent}4D`
              }}
            >
              <div className="w-[46px] h-[46px] rounded-full bg-linear-to-br from-gray-100 to-gray-200 overflow-hidden" style={{ background: t.bg_secondary }}>
                {shop.logo_url ? (
                  <img src={shop.logo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs" style={{ background: t.gradient }}>🏪</div>
                )}
              </div>
            </div>
            <span className="text-[10px] truncate max-w-[52px]" style={{ color: t.text_tertiary }}>{shop.name}</span>
          </div>
        ))}
      </div>

      {/* You Might Like Section */}
      <div className="mt-4 mb-2">
        <div className="flex items-center gap-2 px-5 mb-3">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: t.gradient }}>
            <Users size={10} className="text-white" />
          </div>
          <h2 className="font-bold text-[14px] uppercase tracking-wider font-syne" style={{ color: t.text_primary }}>You might like</h2>
        </div>
        
        <div className="flex overflow-x-auto no-scrollbar gap-3 px-5 pb-2">
          {/* How Fly Card */}
          <motion.div 
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/quiz')}
            className="w-[240px] aspect-[4/3] rounded-[20px] overflow-hidden shrink-0 relative border border-white/5 active:scale-95 transition-all cursor-pointer"
            style={{ background: t.bg_card }}
          >
            <div className="absolute inset-0">
               {getCardImage('how_fly') ? (
                 <img src={getCardImage('how_fly')} className="w-full h-full object-cover blur-[2px] brightness-[0.5] scale-105" />
               ) : (
                 <div className="w-full h-full bg-linear-to-br" style={{ background: t.gradient }} />
               )}
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 font-syne">
              <h3 className="text-white font-bold text-[15px]">How Fly Are You?</h3>
              <p className="text-white/70 text-[11px] mt-0.5">Discover your fashion persona</p>
            </div>
          </motion.div>

          {/* Musify Card */}
          <motion.div 
            whileTap={{ scale: 0.97 }}
            onClick={() => window.open(MUSIFY_URL, '_blank')}
            className="w-[240px] aspect-[4/3] rounded-[20px] overflow-hidden shrink-0 relative border border-white/5 active:scale-95 transition-all cursor-pointer"
            style={{ background: t.bg_card }}
          >
             <div className="absolute inset-0">
               {getCardImage('musify') ? (
                 <img src={getCardImage('musify')} className="w-full h-full object-cover blur-[2px] brightness-[0.5] scale-105" />
               ) : (
                 <div className="w-full h-full bg-linear-to-br from-indigo-900 to-black" />
               )}
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 font-syne">
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
          className="mx-5 mt-3 rounded-[16px] p-4 px-5 flex items-center justify-between cursor-pointer"
          style={{ background: t.gradient }}
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
        <div className="flex items-center justify-between px-5 mb-3 font-syne">
          <h2 className="font-bold text-[16px]" style={{ color: t.text_primary }}>New In</h2>
          <button style={{ color: t.accent }} className="text-[13px] font-medium">See All</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-6 px-5 pb-4 overflow-x-auto no-scrollbar flex-nowrap lg:flex-wrap lg:grid">
          {products.slice(0, 20).map(p => (
            <div 
              key={p.id} 
              className="w-[160px] lg:w-full border rounded-[14px] lg:rounded-[20px] overflow-hidden shrink-0 lg:shrink cursor-pointer transition-all active:scale-[0.98]"
              style={{ background: t.bg_card, borderColor: t.border_secondary }}
              onClick={() => handleProductTap(p.id)}
            >
              <div className="w-full h-[160px] relative flex items-center justify-center text-[48px] overflow-hidden" style={{ background: t.bg_secondary }}>
                 {p.images[0] ? (
                   <img src={p.images[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : '👟'}
                 <button 
                  onClick={(e) => { e.stopPropagation(); toggleSave(p.id); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center"
                  style={{ background: t.overlay }}
                 >
                    <Heart size={14} className={savedProductIds.includes(p.id) ? 'fill-current' : ''} style={{ color: savedProductIds.includes(p.id) ? t.accent : '#fff' }} />
                 </button>
              </div>
              <div className="p-2.5">
                <div className="font-bold text-[13px] truncate" style={{ color: t.text_primary }}>{p.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="font-bold text-[13px]" style={{ color: t.accent }}>${p.price}</div>
                  <div className="text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded leading-none" style={{ background: t.bg_secondary, color: t.text_tertiary }}>{p.category}</div>
                </div>
                <div className="text-[11px] mt-1 truncate" style={{ color: t.text_secondary }}>{shops.find(s => s.id === p.shop_id)?.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shops to Follow */}
      <div className="mt-8 lg:mt-12">
        <h2 className="font-bold text-[16px] lg:text-[20px] px-5 lg:px-8 mb-4 font-syne" style={{ color: t.text_primary }}>Shops to Follow</h2>
        <div className="flex lg:grid lg:grid-cols-4 xl:grid-cols-6 overflow-x-auto no-scrollbar gap-3 px-5 lg:px-8 pb-4">
          {shops.slice(0, 12).map(shop => (
            <div 
              key={shop.id} 
              className="w-[140px] lg:w-full border rounded-[14px] lg:rounded-[20px] p-4 flex flex-col items-center shrink-0 transition-colors group cursor-pointer"
              style={{ background: t.bg_card, borderColor: t.border_secondary }}
              onClick={() => navigate(`/shop/${shop.id}`)}
            >
               <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 p-0.5 mb-3 overflow-hidden transition-transform group-hover:scale-105" style={{ borderColor: t.accent }}>
                 {shop.logo_url ? (
                   <img src={shop.logo_url} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   <div className="w-full h-full rounded-full flex items-center justify-center text-xs" style={{ background: t.gradient }}>🏪</div>
                 )}
               </div>
               <span className="font-bold text-[14px] truncate w-full text-center" style={{ color: t.text_primary }}>{shop.name}</span>
               <span className="text-[11px] mt-0.5 truncate w-full text-center" style={{ color: t.text_secondary }}>{shop.category}</span>
               <span className="text-[11px] mt-2 font-medium" style={{ color: t.text_tertiary }}>{shop.product_count} products</span>
               <button 
                className="mt-4 w-full h-9 rounded-full border text-[12px] font-bold transition-all"
                style={{ background: t.bg_secondary, borderColor: t.border_secondary, color: t.text_primary }}
               >
                 Follow
               </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz Promo */}
      <div 
        className="mx-5 mt-6 p-5 rounded-[16px] border flex justify-between items-center"
        style={{ background: `${t.accent}1A`, borderColor: `${t.accent}40` }}
      >
        <div className="flex flex-col max-w-[180px] font-syne">
          <span className="text-[32px]">🔥</span>
          <h3 className="font-bold text-[16px] mt-2" style={{ color: t.text_primary }}>How Fly Are You?</h3>
          <p className="text-[12px] mt-1.5 leading-tight" style={{ color: t.text_secondary }}>Take the quiz. Share your result card to Instagram Stories.</p>
          <button 
            onClick={() => navigate('/quiz')}
            className="mt-3 w-fit h-9 rounded-full border px-4 text-[12px] font-bold transition-all active:scale-95"
            style={{ borderColor: t.accent, color: t.accent }}
          >
            Find Out →
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {["The Nonchalant 😐", "The Ghost 👻", "Life of the Party 🔥"].map(tag => (
            <div 
              key={tag} 
              className="backdrop-blur-md rounded-full px-2.5 py-1 text-[10px] whitespace-nowrap"
              style={{ background: t.overlay, color: '#fff' }}
            >
              {tag}
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
              className="fixed inset-0 z-[100] backdrop-blur-sm"
              style={{ background: t.overlay }}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[32px] p-8 max-h-[80vh] flex flex-col border-t"
              style={{ background: t.bg_elevated, borderColor: t.border_secondary }}
            >
              <div className="w-12 h-1 rounded-full mx-auto mb-8" style={{ background: t.border_subtle }} />
              <h2 className="text-xl font-bold mb-6 font-syne" style={{ color: t.text_primary }}>Select Town</h2>
              <div className="overflow-y-auto no-scrollbar flex-1 space-y-2 pb-10">
                <button 
                  onClick={() => {
                    setSelectedTown('Zimbabwe');
                    localStorage.setItem('thread_selected_town', 'Zimbabwe');
                    setShowTownPicker(false);
                  }}
                  className={`w-full p-4 rounded-2xl text-left font-bold transition-all`}
                  style={{ 
                    backgroundColor: selectedTown === 'Zimbabwe' ? t.accent : t.bg_secondary,
                    color: selectedTown === 'Zimbabwe' ? '#fff' : t.text_secondary
                  }}
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
                    className={`w-full p-4 rounded-2xl text-left font-bold transition-all`}
                    style={{ 
                      backgroundColor: selectedTown === town ? t.accent : t.bg_secondary,
                      color: selectedTown === town ? '#fff' : t.text_secondary
                    }}
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
        className="mx-5 mt-6 p-5 border border-l-4 rounded-[16px] flex justify-between items-center"
        style={{ background: t.bg_card, borderColor: t.border_secondary, borderLeftColor: t.amber }}
      >
        <div className="flex flex-col font-syne">
          <span className="text-[28px]">🏆</span>
          <h3 className="font-bold text-[15px] mt-2" style={{ color: t.text_primary }}>Best Dresser of the Month</h3>
          <span className="text-[12px] mt-1" style={{ color: t.text_tertiary }}>April 2026 — Quarter Finals</span>
          <button 
            className="mt-3 w-fit h-9 rounded-full border px-4 text-[12px] font-bold opacity-50 cursor-not-allowed"
            style={{ borderColor: t.amber, color: t.amber }}
          >
            See Bracket
          </button>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[10px] uppercase" style={{ color: t.text_tertiary }}>Prize</span>
          <span className="text-[28px] font-bold" style={{ color: t.amber }}>$30</span>
          <span className="text-[11px]" style={{ color: t.text_tertiary }}>cash</span>
        </div>
      </div>

      {/* Musify Promo */}
      <div 
        onClick={() => window.open(MUSIFY_URL, '_blank')}
        className="mx-5 mt-6 mb-[120px] p-4 border border-l-4 rounded-[14px] flex items-center cursor-pointer active:scale-[0.98] transition-all"
        style={{ background: t.bg_card, borderColor: t.border_secondary, borderLeftColor: '#1DB954' }}
      >
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[20px]" style={{ background: t.bg_secondary }}>
          🎵
        </div>
        <div className="ml-3 flex-1 flex flex-col font-syne">
          <div className="bg-[#1DB954]/15 border border-[#1DB954]/30 rounded-full px-2 py-0.5 inline-flex items-center w-fit mb-1">
            <span className="text-[#1DB954] text-[9px] font-bold">LIVE NOW</span>
          </div>
          <span className="text-[15px] font-bold" style={{ color: t.text_primary }}>Musify</span>
          <span className="text-[12px] mt-0.5" style={{ color: t.text_secondary }}>Guess the song. Beat your friends.</span>
        </div>
        <ArrowRight style={{ color: t.text_primary }} size={18} />
      </div>

      {/* Story Viewer Component */}
      <AnimatePresence>
        {storyViewerOpen && (
          <div className="fixed inset-0 z-[100]" style={{ background: t.bg_primary }}>
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
  const t = useTheme();
  const [index, setIndex] = useState(initialIndex);
  const currentStory = stories[index];

  if (!currentStory) return null;

  return (
    <div className="relative w-full h-full flex flex-col" style={{ background: t.bg_primary }}>
      {/* Progress Bars */}
      <div className="absolute top-4 left-5 right-5 z-20 flex gap-1.5 h-1">
        {stories.slice(0, 8).map((_, i) => (
          <div key={i} className="flex-1 h-full rounded-full overflow-hidden" style={{ background: t.border_subtle }}>
            {i < index && <div className="w-full h-full" style={{ background: t.accent }} />}
            {i === index && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'linear' }}
                onAnimationComplete={() => {
                  if (index < Math.min(stories.length, 8) - 1) setIndex(index + 1);
                  else onClose();
                }}
                className="h-full"
                style={{ background: t.accent }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-5 right-5 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full border overflow-hidden shrink-0" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
             {currentStory.logo_url ? <img src={currentStory.logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: t.gradient }} />}
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold" style={{ color: t.text_primary }}>{currentStory.name}</span>
            <span className="text-[11px]" style={{ color: t.text_tertiary }}>2h ago</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1" style={{ color: t.text_primary }}>
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div 
        className="flex-1 w-full flex items-center justify-center p-4 cursor-pointer"
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
        <div 
          className="w-full h-full rounded-[20px] flex items-center justify-center flex-col overflow-hidden relative"
          style={{ background: t.bg_card }}
        >
           <div className="text-[120px] opacity-10 blur-sm absolute">👟</div>
           <h2 className="font-bold text-[32px] mt-4 relative z-10 text-center px-4 uppercase tracking-tighter" style={{ color: t.text_primary }}>New Drop Exclusive</h2>
           <p className="text-center px-8 mt-4 relative z-10 line-clamp-3" style={{ color: t.text_secondary }}>{currentStory.description}</p>
        </div>
      </div>

      {/* Bottom Overlay */}
      <div 
        className="absolute bottom-10 left-0 right-0 p-8 pt-20 text-center"
        style={{ background: `linear-gradient(to top, ${t.bg_primary}, ${t.bg_primary}99, transparent)` }}
      >
        <div className="font-bold text-[16px]" style={{ color: t.text_primary }}>{currentStory.name}</div>
        <div className="font-bold text-[15px] mt-1" style={{ color: t.accent }}>Tap to visit profile</div>
        <button 
          onClick={() => onShopView(currentStory.id)}
          className="mt-4 w-full h-[46px] rounded-full border font-bold text-[14px]"
          style={{ borderColor: t.border_secondary, color: t.text_primary, background: t.bg_secondary }}
        >
          View Shop →
        </button>
      </div>
    </div>
  );
};

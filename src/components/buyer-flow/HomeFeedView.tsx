import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronDown, 
  ArrowRight, 
  MapPin, 
  Heart,
  Share2,
  ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// --- MOCK DATA FOR FITS ---
const MOCK_FITS = [
  {
    id: 'fit-1',
    name: 'Shadow Mode',
    author: 'zimboyfit',
    author_handle: 'zimboyfit',
    cover_image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1920',
    likes: '2.4K',
    media_urls: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1920'],
    tagged_items: [
      { id: '1', name: "Represent Owners' Club Hoodie", price: 160, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=687' },
      { id: '2', name: "Nike Dunk Low Retro", price: 130, image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=687' }
    ]
  },
  {
    id: 'fit-2',
    name: 'Harare Heat',
    author: 'sharon_styles',
    author_handle: 'sharon_styles',
    cover_image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1974',
    likes: '1.8K',
    media_urls: ['https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1974'],
    tagged_items: [
      { id: '3', name: "Vintage Oversized Tee", price: 45, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600' }
    ]
  }
];

export const HomeFeedView: React.FC = () => {
  const navigate = useNavigate();
  const { products, shops, refreshInventory, toggleLike, likedProductIds } = useInventory();
  const { profile } = useAuth();
  
  const [activeFit, setActiveFit] = useState<any>(null);
  const [filter, setFilter] = useState('All');
  const [communityFits, setCommunityFits] = useState<any[]>([]);
  const [loadingFits, setLoadingFits] = useState(true);

  const categories = ['All', 'New in', 'Streetwear', 'Sneakers', 'Vintage', 'Luxury', 'Dresses'];

  const filteredProducts = useMemo(() => {
    let result = products;
    if (filter !== 'All') {
      result = products.filter(p => p.category?.toLowerCase().includes(filter.toLowerCase()));
    }
    // Sort by newest
    return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [products, filter]);

  // Fetch Community Fits (Build A Fit posts)
  useEffect(() => {
    const fetchFits = async () => {
      try {
        const { data, error } = await supabase
          .from('fashion_posts')
          .select(`
            *,
            profiles:user_id (display_name, handle, avatar_url)
          `)
          .eq('post_type', 'build_a_fit')
          .order('created_at', { ascending: false })
          .limit(10);

        if (data) setCommunityFits(data);
      } catch (err) {
        console.error('Error fetching fits:', err);
      } finally {
        setLoadingFits(false);
      }
    };
    fetchFits();
  }, []);

  const featuredProduct = products[0]; 

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] font-sans pb-32">
      <main className="flex flex-col">
        {/* --- CATEGORY CHIPS --- */}
        <section className="px-5 py-4 overflow-x-auto no-scrollbar flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                filter === cat 
                  ? 'bg-[#FF5FA2] text-white border-[#FF5FA2]' 
                  : 'bg-[#1a1a1a] text-white/40 border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* --- STORIES ROW --- */}
        <section className="px-5 py-2 overflow-x-auto no-scrollbar flex gap-4 items-start">
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div 
              onClick={() => navigate('/shop-centre')}
              className="w-[72px] h-[72px] rounded-full p-[3px] relative bg-[#1a1a1a] border border-white/5 flex items-center justify-center group cursor-pointer"
            >
              <div className="w-[62px] h-[62px] rounded-full bg-white/5 flex items-center justify-center text-[28px]">
                🏪
              </div>
              <div className="absolute -bottom-1 right-0 w-6 h-6 bg-[#FF5FA2] rounded-full border-2 border-black flex items-center justify-center text-white">
                <Plus size={14} strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">Build Shop</span>
          </div>

          {shops.slice(0, 8).map((shop) => (
            <div key={shop.id} className="flex flex-col items-center gap-1.5 shrink-0">
               <div className="w-[72px] h-[72px] rounded-full p-[3px] bg-[#1a1a1a] border border-white/5 flex items-center justify-center cursor-pointer">
                  <div className="w-full h-full rounded-full border-2 border-[#FF5FA2] p-[2px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#1a1a1a]">
                      {shop.logo_url ? (
                        <img src={shop.logo_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[20px]">🏬</div>
                      )}
                    </div>
                  </div>
               </div>
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide truncate w-[72px] text-center">{shop.name}</span>
            </div>
          ))}
        </section>

        {/* --- YOU MIGHT LIKE SECTION --- */}
        <section className="mt-8 px-5">
           <h2 className="text-white font-bold text-[18px] mb-4">You Might Like</h2>
           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
              <div 
                onClick={() => navigate('/quiz')}
                className="w-[160px] shrink-0 snap-start active:scale-95 transition-transform"
              >
                 <div className="aspect-[4/5] rounded-[24px] overflow-hidden relative bg-[#1a1a1a] p-4 flex flex-col justify-end border border-white/5">
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center">
                       <span className="text-[14px]">🧠</span>
                    </div>
                    <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 hover:scale-110 transition-transform duration-700" />
                    <h3 className="text-white font-bold text-[15px] leading-tight relative z-10">How Fly Are You?</h3>
                 </div>
              </div>

              <div 
                onClick={() => navigate('/musify')}
                className="w-[160px] shrink-0 snap-start active:scale-95 transition-transform"
              >
                 <div className="aspect-[4/5] rounded-[24px] overflow-hidden relative bg-[#1a1a1a] p-4 flex flex-col justify-end border border-white/5">
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center">
                       <span className="text-[14px]">🎵</span>
                    </div>
                    <img src="https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 hover:scale-110 transition-transform duration-700" />
                    <h3 className="text-white font-bold text-[15px] leading-tight relative z-10">Musify Fashion</h3>
                 </div>
              </div>

              <div 
                onClick={() => navigate('/build-a-fit')}
                className="w-[160px] shrink-0 snap-start active:scale-95 transition-transform"
              >
                 <div className="aspect-[4/5] rounded-[24px] overflow-hidden relative bg-[#1a1a1a] p-4 flex flex-col justify-end border border-white/5">
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center">
                       <span className="text-[14px]">👕</span>
                    </div>
                    <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 hover:scale-110 transition-transform duration-700" />
                    <h3 className="text-white font-bold text-[15px] leading-tight relative z-10">Build Your Fit</h3>
                 </div>
              </div>
           </div>
        </section>

        {/* --- FEATURED DROP --- */}
        {featuredProduct && (
          <section className="mt-8 px-5">
             <div 
              onClick={() => navigate(`/product/${featuredProduct.id}`)}
              className="w-full rounded-[24px] overflow-hidden relative active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, #0A0A0A, #1A1A1A)' }}
             >
                <div className="flex flex-col p-6 pb-2">
                   <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[14px]">🔥</div>
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Featured Drop</span>
                   </div>
                   <h2 className="text-white font-bold text-[24px] leading-tight mb-1">{featuredProduct.name}</h2>
                   <p className="text-white/40 text-[13px]">Available now at {shops.find(s => s.id === featuredProduct.shop_id)?.name || 'Studio'}</p>
                </div>
                
                <div className="relative aspect-[4/3] -mt-4">
                   <img 
                    src={featuredProduct.images?.[0]} 
                    className="w-full h-full object-cover" 
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                </div>

                <div className="p-6 pt-4 flex items-center justify-between">
                   <span className="text-white font-bold text-[20px]">${featuredProduct.price}</span>
                   <button className="px-6 py-2 bg-white text-black rounded-full font-bold text-[12px] uppercase tracking-wide">Shop Now</button>
                </div>
             </div>
          </section>
        )}

        {/* --- COMMUNITY FITS SECTION --- */}
        <section className="mt-10 mb-6">
           <div className="px-5 flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-[18px]">Community Fits</h2>
              <button 
                onClick={() => navigate('/culture')}
                className="text-[#FF5FA2] text-[13px] font-bold"
              >
                View Hub →
              </button>
           </div>
           
           <div className="flex overflow-x-auto no-scrollbar gap-8 px-5 pb-6">
              {(communityFits.length > 0 ? communityFits : MOCK_FITS).map((fit, idx) => (
                <div 
                  key={fit.id || idx}
                  className="shrink-0 cursor-pointer active:scale-95 transition-transform"
                  onClick={() => setActiveFit(fit)}
                >
                  <StackedFitCard fit={fit} />
                </div>
              ))}
           </div>
        </section>

        {/* --- NEW IN SECTION --- */}
        <section className="px-5 mt-4">
           <h2 className="text-white font-bold text-[18px] mb-4">New In</h2>
           <div className="grid grid-cols-2 gap-4">
             {products.slice(0, 4).map((product) => (
               <SmallProductCard key={product.id} product={product} />
             ))}
           </div>
        </section>

        {/* --- SHOPS TO FOLLOW --- */}
        <section className="px-5 mt-10">
           <h2 className="text-white font-bold text-[18px] mb-4">Shops to Follow</h2>
           <div className="grid grid-cols-2 gap-4">
             {shops.slice(0, 4).map((shop) => (
               <ShopFollowCard key={shop.id} shop={shop} />
             ))}
           </div>
        </section>

        {/* --- HOW FLY ARE YOU CARD --- */}
        <section className="mt-12 px-5">
           <div 
            onClick={() => navigate('/quiz')}
            className="w-full aspect-[16/9] rounded-[24px] overflow-hidden relative bg-[#111111] p-6 flex flex-col justify-end active:scale-[0.98] transition-transform border border-white/5"
           >
              <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800" className="absolute inset-0 w-full h-full object-cover opacity-50" />
              <div className="relative z-10">
                 <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-2 block">STYLE PERSONALITY</span>
                 <h2 className="text-white font-bold text-[24px] leading-tight">How Fly Are You?</h2>
                 <p className="text-white/60 text-[13px] mt-1">Take the quiz and find your aesthetic</p>
              </div>
           </div>
        </section>

        {/* --- BEST DRESSER SECTION --- */}
        <section className="mt-12 px-5">
           <div 
            onClick={() => navigate('/best-dresser')}
            className="w-full rounded-[24px] overflow-hidden bg-[#111111] border border-white/5 p-8 flex flex-col items-center text-center active:scale-[0.98] transition-transform"
           >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-[32px] mb-4">🏆</div>
              <h2 className="text-white font-bold text-[22px]">Best Dresser Round 04</h2>
              <p className="text-white/40 text-[14px] mt-2 mb-6 max-w-[240px]">Think you've got it? Enter the competition and win big.</p>
              <button className="px-8 py-3 bg-[#FF5FA2] text-white rounded-full font-bold text-[14px] uppercase tracking-wide">Enter Competition</button>
           </div>
        </section>

        {/* --- SHOP PRODUCTS FEED --- */}
        <section className="px-5 mt-16 mb-12">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-white font-bold text-[22px]">Shop Products</h2>
             <div className="flex items-center gap-2 text-white/40">
                <MapPin size={14} />
                <span className="text-[12px] font-bold uppercase tracking-wider">{localStorage.getItem('thread_user_town') || 'Harare'}</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
             {filteredProducts.map((product) => (
                <ListingCard 
                  key={product.id} 
                  product={product} 
                />
             ))}
          </div>
          
          <div className="mt-12 flex flex-col items-center gap-4">
             <div className="w-10 h-10 rounded-full border-2 border-[#EFEFEF] border-t-[#FF2D78] animate-spin" />
             <p className="text-[#888888] text-[13px]">Loading more magic...</p>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {activeFit && (
          <FitDetailOverlay 
            fit={activeFit} 
            onClose={() => setActiveFit(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const StackedFitCard = ({ fit }: { fit: any }) => {
  const images = fit.media_urls || [fit.cover_image];
  const profile = fit.profiles || { display_name: fit.author, handle: fit.author_handle };

  return (
    <div className="relative w-[240px]">
      <div className="absolute -inset-1.5 translate-x-1.5 translate-y-1.5 bg-white border border-[#EFEFEF] rounded-[24px] scale-[0.98]" />
      <div className="absolute -inset-3 translate-x-3 translate-y-3 bg-white border border-[#EFEFEF] rounded-[24px] scale-[0.96]" />
      <div className="relative aspect-[3/4] rounded-[24px] overflow-hidden bg-white border border-[#EFEFEF] shadow-lg">
         <img src={images[0]} className="w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
         <div className="absolute bottom-4 left-4 right-4">
            <h4 className="text-white font-bold text-[16px] leading-tight mb-1 truncate">{fit.title || fit.name}</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 bg-white/10">
                   {profile.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" />}
                 </div>
                 <span className="text-white/80 text-[10px] font-bold truncate">@{profile.handle || 'user'}</span>
              </div>
              <div className="flex items-center gap-1 text-white">
                 <Heart size={10} className="fill-[#FF2D78] text-[#FF2D78]" />
                 <span className="text-[10px] font-bold">{fit.likes || '0'}</span>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const SmallProductCard = ({ product }: { product: any }) => {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/product/${product.id}`)} className="flex flex-col gap-2 active:opacity-70 transition-opacity">
      <div className="aspect-square rounded-[24px] overflow-hidden bg-white border border-[#EFEFEF]">
        <img src={product.images?.[0]} className="w-full h-full object-cover" />
      </div>
      <div>
        <h4 className="text-[13px] font-bold text-[#111111] truncate">{product.name}</h4>
        <p className="text-[#FF2D78] font-bold text-[13px]">${product.price}</p>
      </div>
    </div>
  );
};

const ShopFollowCard = ({ shop }: { shop: any }) => {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/shop/${shop.id}`)} className="bg-white rounded-[24px] p-4 border border-[#EFEFEF] flex flex-col items-center active:scale-[0.98] transition-transform">
      <div className="w-14 h-14 rounded-full overflow-hidden mb-3 border border-[#F5F5F5]">
        {shop.logo_url ? <img src={shop.logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#FFF0F5] flex items-center justify-center text-[24px]">🏬</div>}
      </div>
      <h4 className="text-[14px] font-bold text-[#111111] text-center truncate w-full">{shop.name}</h4>
      <p className="text-[10px] text-[#888888] uppercase tracking-widest font-bold mt-0.5">{shop.location || 'Harare'}</p>
      <button className="w-full mt-4 py-2 bg-[#F5F5F5] text-[#111111] rounded-full font-bold text-[11px] uppercase tracking-wider hover:bg-[#FF2D78] hover:text-white transition-colors">Follow</button>
    </div>
  );
};

const ListingCard = ({ product }: { product: any }) => {
  const navigate = useNavigate();
  const { toggleLike, likedProductIds, shops } = useInventory();
  const isLiked = likedProductIds.includes(product.id);
  const shop = shops.find(s => s.id === product.shop_id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col gap-2.5 active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="aspect-[4/5] rounded-[28px] overflow-hidden relative border border-[#EFEFEF] bg-white group shadow-sm">
        <img src={product.images?.[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <button 
          onClick={(e) => { e.stopPropagation(); toggleLike(product.id); }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center text-[#111111] border border-white/20 active:scale-90 transition-all z-10"
        >
          <Heart size={18} className={isLiked ? "fill-[#FF2D78] text-[#FF2D78]" : "text-white"} />
        </button>
        <div className="absolute top-4 left-4">
           {product.original_price && <div className="px-3 py-1 bg-[#FF2D78] text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Sale</div>}
        </div>
        <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
          <button className="w-full py-2.5 bg-white/90 backdrop-blur-sm text-[#111111] rounded-2xl font-bold text-[12px] uppercase tracking-wide shadow-xl">View Details</button>
        </div>
      </div>
      <div className="px-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h5 className="text-[#111111] font-bold text-[14px] truncate flex-1">{product.name}</h5>
          <span className="text-[#FF2D78] font-bold text-[14px]">${product.price}</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-60">
           <div className="w-4 h-4 rounded-full overflow-hidden bg-[#F5F5F5] border border-[#EFEFEF]">
             {shop?.logo_url && <img src={shop.logo_url} className="w-full h-full object-cover" />}
           </div>
           <span className="text-[11px] font-bold uppercase tracking-widest text-[#111111] truncate">{shop?.name || 'Shop'}</span>
        </div>
      </div>
    </motion.div>
  );
};

const FitDetailOverlay = ({ fit, onClose }: { fit: any, onClose: () => void }) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const images = fit.media_urls || [fit.cover_image];
  const items = fit.tagged_items || [];
  const profile = fit.profiles || { display_name: fit.author, handle: fit.author_handle };

  const slides = [
    { type: 'cover', image: images[0], title: fit.title || fit.name, subtitle: `by @${profile.handle}` },
    ...items.map((item: any) => ({ type: 'product', ...item }))
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden"
    >
      <header className="px-6 py-8 flex items-center justify-between absolute top-0 left-0 right-0 z-20">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white"><ChevronLeft size={24} /></button>
        <div className="flex items-center gap-3"><button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white"><Share2 size={20} /></button></div>
      </header>
      <div className="flex-1 relative">
         <AnimatePresence mode="wait">
           <motion.div key={activeIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full h-full relative">
             <img src={slides[activeIndex].image} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
             <div className="absolute bottom-24 left-8 right-8">
                {slides[activeIndex].type === 'cover' ? (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <h2 className="text-white font-bold text-4xl mb-2 italic tracking-tighter uppercase">{slides[activeIndex].title}</h2>
                    <div className="flex items-center gap-2 mb-6">
                       <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden bg-white/10">{profile.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" />}</div>
                       <span className="text-white/60 font-bold tracking-tight">{slides[activeIndex].subtitle}</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/10 backdrop-blur-xl p-6 rounded-[32px] border border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF2D78] mb-2 block">TAGGED ITEM</span>
                    <h3 className="text-white font-bold text-xl mb-1">{slides[activeIndex].name}</h3>
                    <p className="text-white/60 font-bold text-lg mb-6">${slides[activeIndex].price}</p>
                    <button onClick={() => navigate(`/product/${slides[activeIndex].id}`)} className="w-full h-14 bg-white text-[#111111] rounded-2xl font-bold text-sm flex items-center justify-center gap-2">View Product <ArrowRight size={18} /></button>
                  </motion.div>
                )}
             </div>
           </motion.div>
         </AnimatePresence>
         <div className="absolute inset-0 flex">
           <div className="w-1/2 h-full cursor-w-resize" onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))} />
           <div className="w-1/2 h-full cursor-e-resize" onClick={() => setActiveIndex(prev => Math.min(slides.length - 1, prev + 1))} />
         </div>
         <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1.5">
           {slides.map((_, i) => <div key={`slide-dot-${i}`} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-10 bg-white' : 'w-2 bg-white/20'}`} />)}
         </div>
      </div>
      <div className="h-24 bg-black flex items-center justify-center px-8"><button onClick={onClose} className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em]">Close Viewer</button></div>
    </motion.div>
  );
};

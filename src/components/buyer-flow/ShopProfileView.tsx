import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Share2, MapPin, Package, 
  Globe, MessageCircle, CheckCircle2, Zap,
  Instagram, Smartphone, Search, Clock, Info, 
  Check, X, ThumbsUp, ThumbsDown, Star, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useFollow } from '../../context/FollowContext';
import { Shop, Product } from '../../types';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useGlobalCategories } from '../../hooks/useGlobalCategories';

export const ShopProfileView: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Products' | 'About' | 'Reviews'>('Products');
  const [localFollowerAdjust, setLocalFollowerAdjust] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const { follow, unfollow, isFollowing } = useFollow();
  const { categories: globalCategories, loading: globalCategoriesLoading } = useGlobalCategories();

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());
  }, [products, selectedCategory]);

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      const cleanHandle = handle?.replace('@', '').toLowerCase();
      
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', cleanHandle)
        .eq('is_active', true)
        .single();
        
      if (error || !data) {
        setLoading(false);
        return;
      }
      
      setShop(data);
      
      // Increment view count
      await supabase.rpc('increment_shop_view_count', { shop_id: data.id });
      
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', data.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      setProducts(prodData || []);
      setLoading(false);
    };
    
    fetchShop();
  }, [handle]);

  const followingState = useMemo(() => {
    if (!shop) return false;
    return isFollowing(shop.id);
  }, [shop, isFollowing]);

  const followerCount = useMemo(() => {
    if (!shop) return 0;
    return Math.max(0, (shop.follower_count || 0) + localFollowerAdjust);
  }, [shop, localFollowerAdjust]);

  const handleFollowToggle = async () => {
    if (!shop) return;
    try {
      if (followingState) {
        await unfollow(shop.id);
        setLocalFollowerAdjust(p => p - 1);
        toast.success(`Unfollowed ${shop.name} ✓`);
      } else {
        await follow(shop.id);
        setLocalFollowerAdjust(p => p + 1);
        toast.success(`Following ${shop.name} ★`);
      }
    } catch (err) {
      toast.error('Could not update follow status');
    }
  };

  const shareShop = () => {
    if (!shop) return;
    navigator.clipboard.writeText(window.location.href);
    toast.success('Shop link copied to clipboard ✓');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-center p-6 pb-24">
        <div className="w-12 h-12 border-4 border-[#C6FF00] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-neutral-400 tracking-wide animate-pulse">Establishing Connection...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-center p-6 text-center gap-6">
        <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-[32px] flex items-center justify-center text-[#C6FF00]">
          <Package size={28} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold tracking-tight uppercase">Node Offline</h2>
          <p className="text-sm text-neutral-400 max-w-xs">This shop could not be retrieved from the network or has been deactivated.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="px-8 h-12 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-all active:scale-95 text-white"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white pb-32 font-sans selection:bg-[#C6FF00]/30">
      
      {/* Banner / Cover Header Image */}
      <div className="h-[260px] relative overflow-hidden group">
        {shop.banner_url ? (
          <img 
            src={shop.banner_url} 
            alt="Cover Banner" 
            className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-[#111] grid grid-cols-4 grid-rows-4 gap-4 p-4 opacity-50">
             {[...Array(16)].map((_, i) => (
                <div key={`cover-grid-cell-${i}`} className="border border-neutral-800/40 rounded-xl" />
             ))}
             <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="text-[12vw] font-black uppercase italic tracking-tighter text-neutral-800/10 select-none">{shop.name}</h2>
             </div>
          </div>
        )}
        
        {/* Soft elegant shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

        {/* Back and Share buttons */}
        <div className="absolute top-6 left-6 right-6 flex justify-between z-20">
          <button 
            onClick={() => navigate(-1)} 
            className="w-11 h-11 rounded-full bg-black/60 shadow-lg backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all hover:bg-black/80 active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Floating circular shop logo profile overlapping banner */}
        <div className="absolute -bottom-14 left-6 z-[30]">
          <div className="w-28 h-28 rounded-full border-4 border-[#000] bg-[#111] overflow-hidden shadow-xl flex items-center justify-center">
             {shop.logo_url || shop.avatar_url ? (
               <img 
                 src={shop.logo_url || shop.avatar_url} 
                 alt={shop.name}
                 className="w-full h-full object-cover"
                 referrerPolicy="no-referrer"
               />
             ) : (
               <span className="text-4xl font-extrabold italic tracking-tighter text-[#C6FF00] select-none">
                 {shop.name[0]?.toUpperCase()}
               </span>
             )}
          </div>
        </div>

        {/* Action button row (Share & Follow) right-aligned beneath banner */}
        <div className="absolute -bottom-14 right-6 z-[30] flex items-center gap-3">
          <button 
            onClick={shareShop}
            aria-label="Share shop"
            className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800/80 hover:bg-neutral-800 transition-all flex items-center justify-center text-neutral-350 cursor-pointer active:scale-95"
          >
            <Share2 size={16} />
          </button>

          <button 
            onClick={handleFollowToggle}
            className={`px-6 h-11 rounded-full font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center border-2 cursor-pointer ${
              followingState
                ? 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
                : 'bg-[#C6FF00]/5 border-[#C6FF00] text-[#C6FF00] hover:bg-[#C6FF00]/20'
            }`}
          >
            {followingState ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>

      {/* Main Info Section aligned exactly like User-provided image mockup */}
      <div className="px-6 pt-16 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-white leading-tight font-sans">
            {shop.name}
          </h1>
          <p className="text-sm text-neutral-400 font-medium tracking-tight">
            @{shop.slug} • {'Bulawayo'}
          </p>
        </div>

        {/* Categories/Location badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#C6FF00]/10 border border-[#C6FF00]/20 text-[#C6FF00] uppercase tracking-wide">
            {shop.category || 'streetwear'}
          </span>
          <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
            <MapPin size={12} className="text-neutral-500" />
            {'Bulawayo'}
          </span>
        </div>

        {/* Bio text descripton */}
        <p className="text-sm leading-relaxed text-neutral-300">
          {shop.description || 'This is an under dog clothing brand'}
        </p>

        {/* Metrics/Stats Card exactly like mockup */}
        <div className="grid grid-cols-2 bg-[#111111] border border-[#1E1E1E] rounded-2xl py-4 text-center mt-1">
          <div className="flex flex-col items-center justify-center border-r border-[#1E1E1E]">
            <span className="text-xl font-bold text-white tracking-tight">{followerCount}</span>
            <span className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase mt-1">Followers</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white tracking-tight">{products.length}</span>
            <span className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase mt-1">Products</span>
          </div>
        </div>

        {/* Business Physical Location Element */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-4 flex items-center gap-3">
          <MapPin size={18} className="text-[#C6FF00] flex-shrink-0" />
          <span className="text-sm font-semibold text-neutral-200">
            {'Bulawayo'}
          </span>
        </div>

        {/* Trading Hours Element */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-neutral-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-neutral-200">
              Mon-Sat: 8am – 6pm
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span className="text-sm font-semibold text-[#25D366]">
              Open
            </span>
          </div>
        </div>

        {/* Full-width premium hot emerald WhatsApp CTA button */}
        <a 
          href={`https://wa.me/${shop.whatsapp_number?.replace(/\D/g, '') || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.97] text-white font-extrabold text-sm uppercase tracking-wider h-[54px] rounded-full flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/15 transition-all cursor-pointer select-none"
        >
          <MessageCircle size={20} className="fill-white flex-shrink-0" />
          Chat on WhatsApp
        </a>
      </div>

      {/* Tabs Menu Navigation segment */}
      <div className="flex gap-8 border-b border-neutral-900 px-6 mt-10">
        {[
          { label: 'Products', icon: <Package size={15} /> },
          { label: 'About', icon: <Info size={15} /> }
        ].map(tab => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label as any)}
            className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === tab.label ? 'text-[#C6FF00]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.label && (
              <motion.div layoutId="shopProfileTabLine" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#C6FF00] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content areas according to tabs */}
      <div className="px-6 pt-6">
        {activeTab === 'Products' && (
          <div>
            {products.length > 0 && (
              <div className="mb-6">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold mb-3 block">Boutique Sections</span>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {/* All Card */}
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`relative w-28 h-16 rounded-xl overflow-hidden transition-all flex items-end p-2.5 border text-left flex-shrink-0 ${
                      selectedCategory === 'All' 
                        ? 'border-[#C6FF00] scale-105 shadow-md shadow-[#C6FF00]/10 font-bold' 
                        : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="absolute inset-0 bg-neutral-900 z-10 animate-fade-in" />
                    <div className="absolute inset-x-2.5 bottom-2 z-20">
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest ${selectedCategory === 'All' ? 'text-[#C6FF00]' : 'text-neutral-400'}`}>
                        All
                      </span>
                    </div>
                  </button>

                  {/* Dyn Categories Cards */}
                  {!globalCategoriesLoading && globalCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`relative w-28 h-16 rounded-xl overflow-hidden transition-all flex items-end p-2.5 border text-left flex-shrink-0 ${
                        selectedCategory === cat.name 
                          ? 'border-[#C6FF00] scale-105 shadow-md shadow-[#C6FF00]/10 font-bold' 
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="absolute inset-0 bg-black/60 z-10" />
                      {cat.cover_image_url && (
                        <img 
                          src={cat.cover_image_url} 
                          alt={cat.name} 
                          className="absolute inset-0 w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute inset-x-2.5 bottom-2 z-20">
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest leading-none ${selectedCategory === cat.name ? 'text-[#C6FF00]' : 'text-white'}`}>
                          {cat.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4 bg-[#111] border border-neutral-800/80 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-950 border border-neutral-800 text-neutral-600">
                  <Package size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-300">Catalog is empty</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-[240px]">This boutique hasn't registered list items yet.</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2.5 bg-[#111] border border-neutral-800/80 rounded-2xl p-6">
                <p className="text-sm font-bold text-neutral-300">No products</p>
                <p className="text-xs text-neutral-500 max-w-[200px]">There are no active items available under this section.</p>
                <button 
                  onClick={() => setSelectedCategory('All')}
                  className="mt-2 text-xs font-bold text-[#C6FF00] uppercase tracking-wider hover:underline cursor-pointer"
                >
                  View All &rarr;
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map(p => {
                  const isSoldOut = p.total_stock <= 0;
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => navigate(`/product/${p.id}`)}
                      className={`flex flex-col bg-[#111111] border border-neutral-850 rounded-[24px] overflow-hidden group active:scale-[0.98] transition-all cursor-pointer hover:border-neutral-700/60 relative ${isSoldOut ? 'opacity-60' : ''}`}
                    >
                      <div className="aspect-[4/5] bg-neutral-900 relative overflow-hidden">
                        {p.images?.[0] ? (
                          <img 
                            src={p.images[0]} 
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <Package size={32} />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
                          <span className="text-xs font-black text-[#C6FF00] italic">${p.price}</span>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col justify-between flex-1 gap-1">
                        <h4 className="font-extrabold text-xs text-neutral-100 group-hover:text-[#C6FF00] transition-colors truncate">{p.name}</h4>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-neutral-500 font-bold uppercase tracking-wider font-mono">
                          <span>{p.category || 'drip'}</span>
                          {p.total_stock > 0 ? (
                            <span className="text-emerald-500">In Stock</span>
                          ) : (
                            <span className="text-amber-500">Sold Out</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'About' && (
          <div className="flex flex-col gap-6 bg-[#111] border border-neutral-850 rounded-2xl p-6">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#C6FF00]">About the Brand</h3>
              <p className="text-sm leading-relaxed text-neutral-300">{shop.description || 'Welcome to our premium storefront node. We present selected bespoke wear with secure local protocols.'}</p>
            </div>

            <hr className="border-neutral-850" />

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Core Network Details</h3>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-1">
                <div>
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider block">Station Area</span>
                  <span className="text-sm font-medium text-neutral-200 mt-0.5 block">{'Bulawayo'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider block">Drip Stream</span>
                  <span className="text-sm font-medium text-neutral-200 mt-0.5 block">{shop.category || 'Streetwear'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider block">Instagram Account</span>
                  <span className="text-sm font-medium text-[#C6FF00] mt-0.5 block">@{shop.instagram || shop.slug}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider block">Operational Status</span>
                  <span className="text-sm font-medium text-emerald-400 mt-0.5 block">Open</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

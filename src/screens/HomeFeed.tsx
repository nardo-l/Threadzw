import React, { useState, useEffect, useMemo, memo } from 'react';
import { Search, ShoppingCart, Heart, ArrowRight, Trophy, Bell, Radio, Plus, Bookmark, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mapError } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { toast } from 'sonner';
import { getShopUrl } from '../utils/shopUrl';

import { Avatar } from '../components/Avatar';

// Reusable Skeleton Pulse
const Pulse = ({ className }: { className: string }) => {
  return (
    <div className={`animate-pulse ${className} bg-[#222222]`} />
  );
};

// Section Error Wrapper
const SectionError = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <div 
      onClick={onRetry}
      className="rounded-[14px] p-4 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all border bg-card border-white/5"
    >
      <span className="text-lg">⚠️</span>
      <p className="text-[12px] text-text-secondary">Could not load</p>
      <p className="text-[12px] text-primary font-bold">Tap to retry</p>
    </div>
  );
};

export const HomeFeed: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile, loading: authLoading } = useAuth();
  const { cart, toggleSave, stories: activeStories, setStoriesViewerOpen } = useInventory();
  
  const [refreshing, setRefreshing] = useState(false);
  const isGuest = !session;
  const [stories, setStories] = useState<any[]>([]);
  const [storiesLoading, setStoriesLoading ] = useState(true);
  const [storiesError, setStoriesError] = useState<string | null>(null);
  const [viewedStories, setViewedStories] = useState<string[]>([]);

  useEffect(() => {
    // Sync viewed stories from localStorage
    const stored = localStorage.getItem('thread_viewed_stories');
    const today = new Date().toDateString();
    const lastClear = localStorage.getItem('thread_viewed_stories_date');
    
    if (lastClear !== today) {
      localStorage.removeItem('thread_viewed_stories');
      localStorage.setItem('thread_viewed_stories_date', today);
      setViewedStories([]);
    } else if (stored) {
      setViewedStories(JSON.parse(stored));
    }
  }, []);

  const fetchStories = async () => {
    try {
      setStoriesLoading(true);
      setStoriesError(null);
      
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select(`
          id, name, handle, logo_url, follower_count
        `)
        .eq('is_live', true)
        .order('follower_count', { ascending: false })
        .limit(15);
      
      if (shopsError) throw shopsError;
      if (!shops) return;

      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const shopsWithStoryStatus = await Promise.all(
        shops.map(async (shop) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shop.id)
            .eq('is_published', true)
            .gte('created_at', cutoff);
          
          return {
            ...shop,
            hasStory: (count || 0) > 0
          };
        })
      );

      const sorted = [
        ...shopsWithStoryStatus.filter(s => s.hasStory),
        ...shopsWithStoryStatus.filter(s => !s.hasStory)
      ];

      setStories(sorted);
    } catch (err: any) {
      console.error('Stories error:', err);
      setStoriesError(mapError(err));
    } finally {
      setStoriesLoading(false);
    }
  };

  // CONNECTION 2 - Featured Drop
  const [featured, setFeatured] = useState<any>(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState<string | null>(null);

  const fetchFeaturedDrop = async () => {
    try {
      setFeaturedLoading(true);
      setFeaturedError(null);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, price, images, created_at,
          shops(id, name, handle)
        `)
        .eq('is_published', true)
        .eq('status', 'active')
        .eq('shops.is_live', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setFeatured(data);
    } catch (err: any) {
      console.error('Featured error:', err);
      setFeaturedError(mapError(err));
    } finally {
      setFeaturedLoading(false);
    }
  };

  // CONNECTION 3 - New In
  const [newIn, setNewIn] = useState<any[]>([]);
  const [newInLoading, setNewInLoading] = useState(true);
  const [newInError, setNewInError] = useState<string | null>(null);

  const fetchNewIn = async () => {
    try {
      setNewInLoading(true);
      setNewInError(null);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, price, images, total_stock, save_count, created_at,
          shops(id, name, handle)
        `)
        .eq('is_published', true)
        .eq('status', 'active')
        .eq('shops.is_live', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;

      // If auth, check saves
      if (session?.user?.id) {
        const productIds = data.map(p => p.id);
        const { data: saves } = await supabase
          .from('saves')
          .select('product_id')
          .eq('user_id', session.user.id)
          .in('product_id', productIds);
        
        const saveSet = new Set(saves?.map(s => s.product_id));
        setNewIn(data.map(p => ({ ...p, is_saved_by_user: saveSet.has(p.id) ? 1 : 0 })));
      } else {
        setNewIn(data.map(p => ({ ...p, is_saved_by_user: 0 })));
      }
    } catch (err: any) {
      console.error('New In error:', err);
      setNewInError(mapError(err));
    } finally {
      setNewInLoading(false);
    }
  };

  // CONNECTION 4 - Shops to Follow
  const [shopsToFollow, setShopsToFollow] = useState<any[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [shopsError, setShopsError] = useState<string | null>(null);

  const fetchShopsToFollow = async () => {
    try {
      setShopsLoading(true);
      setShopsError(null);
      
      let query = supabase
        .from('shops')
        .select('id, name, handle, logo_url, category, follower_count, is_live')
        .eq('is_live', true);

      if (session?.user?.id) {
        const { data: followed } = await supabase
          .from('follows')
          .select('shop_id')
          .eq('follower_id', session.user.id);
        
        const followedIds = followed?.map(f => f.shop_id) || [];
        if (followedIds.length > 0) {
          query = query.not('id', 'in', `(${followedIds.join(',')})`);
        }
      }

      const { data, error } = await query
        .order('follower_count', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      setShopsToFollow(data || []);
    } catch (err: any) {
      console.error('Shops to Follow error:', err);
      setShopsError(mapError(err));
    } finally {
      setShopsLoading(false);
    }
  };

  // CONNECTION 5 - Best Dresser
  const [bestDresser, setBestDresser] = useState<any>({ nominee_count: 0, highest_votes: 0 });
  const [bestDresserLoading, setBestDresserLoading] = useState(true);

  const fetchBestDresserInfo = async () => {
    try {
      setBestDresserLoading(true);
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const { data, error } = await supabase
        .from('best_dresser_entries')
        .select('vote_count')
        .eq('month', month)
        .eq('year', year)
        .in('status', ['approved', 'winner', 'eliminated']);
      
      if (error) throw error;
      
      const count = data?.length || 0;
      const highest = data?.reduce((max, entry) => Math.max(max, entry.vote_count || 0), 0) || 0;
      
      setBestDresser({ nominee_count: count, highest_votes: highest });
    } catch (err) {
      console.error('Best Dresser error:', err);
    } finally {
      setBestDresserLoading(false);
    }
  };

  // CONNECTION 6 - Notifications
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!session?.user?.id) return;
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('read', false);
    
    setUnreadCount(count || 0);
  };

  useEffect(() => {
    if (session?.user?.id) {
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        }, () => {
          fetchUnreadCount();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const fetchAll = async () => {
    if (!session && !isGuest) return;
    // FETCH IN PARALLEL - FIX 2 IMPROVEMENT
    await Promise.all([
      fetchStories(),
      fetchFeaturedDrop(),
      fetchNewIn(),
      fetchShopsToFollow(),
      fetchBestDresserInfo(),
      fetchUnreadCount()
    ]);
  };

  useEffect(() => {
    fetchAll();
  }, [session]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const handleSaveToggle = async (product: any) => {
    if (isGuest) {
      // Show login prompt (handled by layout or navigate)
      navigate('/auth');
      return;
    }

    const isSaved = product.is_saved_by_user > 0;
    
    // Optimistic UI
    setNewIn(prev => prev.map(p => 
      p.id === product.id 
        ? { ...p, is_saved_by_user: isSaved ? 0 : 1, save_count: isSaved ? (p.save_count - 1) : (p.save_count + 1) } 
        : p
    ));

    try {
      toggleSave(product.id);
    } catch (err) {
      // Revert
      setNewIn(prev => prev.map(p => 
        p.id === product.id 
          ? { ...p, is_saved_by_user: isSaved ? 1 : 0, save_count: isSaved ? (p.save_count + 1) : (p.save_count - 1) } 
          : p
      ));
      toast.error(isSaved ? "Could not remove. Try again." : "Could not save product. Try again.", {
        style: { background: '#ef4444', color: 'white' }
      });
    }
  };

  const handleFollow = async (shop: any) => {
    if (isGuest) {
      navigate('/auth');
      return;
    }

    // Optimistic UI
    setShopsToFollow(prev => prev.filter(s => s.id !== shop.id));
    
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: session.user.id, shop_id: shop.id });
      if (error) throw error;
      
      // Since they follow it now, it should move to stories next refresh, 
      // but we removed it from current list optimistically.
      fetchStories(); // Refetch stories to show new follow
    } catch (err) {
      // Revert (add back to list)
      setShopsToFollow(prev => [shop, ...prev].sort((a, b) => b.follower_count - a.follower_count));
      toast.error("Could not follow shop. Try again.");
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#ef44441a] text-[#ef4444]">Out of Stock</span>;
    if (stock <= 3) return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#f59e0b1a] text-[#f59e0b]">Only {stock} left</span>;
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#22c55e1a] text-[#22c55e]">In Stock</span>;
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K followers`;
    return `${count} followers`;
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background">
      {/* Top Bar */}
      <header 
        className="sticky top-0 backdrop-blur-md z-40 px-6 py-4 flex justify-between items-center border-b bg-background/50 border-white/5"
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">
              Hello, 
            </h1>
            {authLoading ? (
              <Pulse className="w-[120px] h-[16px] rounded-full" />
            ) : (
              <span className="text-xl font-bold text-white">
                {profile?.display_name?.split(' ')[0] || "Entrepreneur"}
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold mt-0.5 text-primary italic">ThreadZW Hub</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/notifications')}
            className="p-2.5 rounded-xl relative active:scale-[0.98] transition-all bg-card text-white border border-white/5"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span 
                className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 animate-pulse bg-primary border-background" 
              />
            )}
          </button>
        </div>
      </header>

      {/* Pull to Refresh Spinner placeholder */}
      {refreshing && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
          <div 
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-primary" 
          />
        </div>
      )}

      <div className="flex flex-col gap-8 py-6 px-6">
        {/* Prominent Search Bar */}
        <div 
          onClick={() => navigate('/search')}
          className="relative border border-white/5 rounded-2xl py-4 pl-12 pr-6 cursor-pointer bg-card"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
          <span className="text-text-secondary text-[14px]">Search stores and items...</span>
        </div>

        {/* 1. Stories Row */}
        <div className="section-container">
          {storiesLoading ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {Array.from({ length: 6 }).map((_, i) => (
                <Pulse key={`story-pulse-${i}`} className="w-16 h-16 rounded-full flex-shrink-0" />
              ))}
            </div>
          ) : storiesError ? (
            <SectionError onRetry={fetchStories} />
          ) : (
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {stories.length === 0 ? (
                <div className="flex flex-col items-center gap-2 flex-shrink-0 opacity-50 px-4">
                  <div className="w-16 h-16 rounded-full border border-[#1a1a1a] bg-[#0a0a0a]" />
                  <span className="text-[10px] font-mono text-[#555555]">Loading...</span>
                </div>
              ) : (
                stories.map(item => (
                  <StoryItem 
                    key={item.id} 
                    item={item} 
                    viewedStories={viewedStories}
                    onView={(id) => {
                      const updated = [...viewedStories, id];
                      setViewedStories(updated);
                      localStorage.setItem('thread_viewed_stories', JSON.stringify(updated));
                    }}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Create Your Shop Button - WITH BLURRED BG (Fix 5) */}
        <BuildShopBanner />

        {/* 2. Featured Drop Banner */}
        <div className="section-container">
          {featuredLoading ? (
            <Pulse className="w-full h-44 rounded-[24px]" />
          ) : featuredError ? (
            <SectionError onRetry={fetchFeaturedDrop} />
          ) : featured && (
            <div 
              onClick={() => navigate(`/product/${featured.id}`)}
              className="relative w-full h-44 rounded-[24px] overflow-hidden group cursor-pointer border border-white/5"
            >
              <ImageWithFallback 
                src={featured.images?.[0]} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                <div>
                  <span className="text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest bg-primary">Featured Business</span>
                  <h3 className="text-white text-xl font-bold mt-2 leading-tight">{featured.name}</h3>
                  <p className="text-white/60 text-xs mt-0.5">by {featured.shops?.name}</p>
                </div>
                <div className="text-primary text-xl font-bold font-syne">${featured.price}</div>
              </div>
            </div>
          )}
        </div>

        {/* 3. New In Section */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold tracking-tight text-white">Latest from Malls</h2>
            <button className="text-primary text-[12px] font-bold" onClick={() => navigate('/search')}>See All</button>
          </div>
          {newInLoading ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`new-in-skeleton-${i}`} className="w-[160px] flex-shrink-0 flex flex-col gap-3">
                  <Pulse className="w-full aspect-[4/5] rounded-[20px]" />
                  <div className="space-y-2">
                    <Pulse className="w-2/3 h-3 rounded-full" />
                    <Pulse className="w-full h-4 rounded-full" />
                    <Pulse className="w-1/3 h-4 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : newInError ? (
            <SectionError onRetry={fetchNewIn} />
          ) : newIn.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
              {newIn.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onSave={handleSaveToggle}
                  getStockBadge={getStockBadge}
                />
              ))}
            </div>
          ) : (
            <div className="col-span-full">
              {/* Fallback to EmptyFeedDiscovery if no products */}
              <div className="rounded-[24px] p-8 text-center border bg-card border-white/5">
                <p className="font-bold opacity-80 mb-4 text-white">ThreadZW is building up.</p>
                <button 
                  onClick={() => navigate('/shops')}
                  className="w-full py-3 text-black rounded-xl font-bold text-sm bg-primary shadow-xl shadow-primary/20"
                >
                  Explore Malls
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Shops to Follow */}
        {shopsToFollow.length > 0 && !shopsLoading && (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold tracking-tight text-white">Shops to Follow</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
              {shopsToFollow.map(shop => (
                <ShopCard 
                  key={shop.id} 
                  shop={shop} 
                  onFollow={handleFollow}
                  formatFollowers={formatFollowers}
                />
              ))}
            </div>
          </div>
        )}
        {shopsLoading && (
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {Array.from({ length: 4 }).map((_, i) => (
              <Pulse key={`shop-pulse-${i}`} className="w-[180px] h-[220px] rounded-[24px] flex-shrink-0" />
            ))}
          </div>
        )}

        {/* 5. How Fly Are You Card -> Business Quiz */}
        <div 
          onClick={() => navigate('/quiz')}
          className="relative rounded-[28px] p-8 flex flex-col items-center text-center gap-4 overflow-hidden shadow-2xl group cursor-pointer border border-primary/20 bg-card"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-3xl rounded-full -mr-24 -mt-12 group-hover:scale-125 transition-transform duration-700" />
          <h2 className="text-3xl font-syne font-black text-white italic">Business IQ Tool</h2>
          <p className="text-text-secondary text-sm max-w-[220px] leading-relaxed">Discover your brand type and unlock growth insights.</p>
          <button 
            className="mt-2 bg-primary font-bold px-8 py-3 rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl font-syne text-black"
          >
            Take the Quiz <ArrowRight size={18} />
          </button>
        </div>

        {/* 6. Best Dresser Card -> Top Store */}
        <div 
          onClick={() => navigate('/best-dresser')}
          className="border border-white/5 rounded-[28px] p-6 flex items-center gap-5 group transition-all cursor-pointer bg-card shadow-heavy"
        >
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-primary"
          >
            <Trophy size={28} className="text-black" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-syne font-bold text-white uppercase tracking-tighter">Gold Star Seller</h3>
            <p className="text-[10px] font-mono tracking-widest uppercase mt-1 text-primary">
              {bestDresser.nominee_count === 0 
                ? 'Join the ranking' 
                : `${bestDresser.nominee_count} stores competing`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-bold font-syne tracking-tight text-white">Award</span>
            <ArrowRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MEMOIZED COMPONENTS (FIX 2) ---

const StoryItem = memo(({ item, viewedStories, onView }: { item: any; viewedStories: string[]; onView: (id: string) => void }) => {
  const navigate = useNavigate();
  const { setStoriesViewerOpen } = useInventory();
  const isViewed = viewedStories.includes(item.id);

  return (
    <button 
      onClick={() => {
        if (item.hasStory) {
          setStoriesViewerOpen(true, item.id);
          if (!isViewed) onView(item.id);
        } else {
          const path = getShopUrl(item.slug || item.handle, item.id);
          console.log("[HOME FEED SYSTEM] Circle click, navigating to:", path);
          if (path) {
            navigate(path);
          } else {
            console.warn("[HOME FEED SYSTEM] Broken link prevented: slug/handle/id missing on", item);
            toast.error("Unable to load store storefront!");
          }
        }
      }}
      className="flex flex-col items-center gap-3 flex-shrink-0 group"
    >
      <div 
        className={`w-20 h-20 rounded-2xl p-[2px] transition-all duration-500 ${item.hasStory && !isViewed ? 'bg-primary' : 'bg-white/5 border border-white/5'}`}
        style={item.hasStory && !isViewed ? { boxShadow: '0 0 15px rgba(198,255,0,0.3)' } : {}}
      >
        <Avatar 
          url={item.logo_url || item.avatar_url} 
          size={74}
          className="rounded-2xl border-[3px] border-background transition-transform group-active:scale-95 duration-200"
        />
      </div>
      <span className="text-[11px] font-bold w-20 text-center leading-tight truncate text-text-secondary tracking-tight group-hover:text-primary transition-colors">
        {item.name}
      </span>
    </button>
  );
});

const ProductCard = memo(({ product, onSave, getStockBadge }: { product: any; onSave: (p: any) => void; getStockBadge: (s: number) => React.ReactNode }) => {
  const navigate = useNavigate();
  const isSaved = product.is_saved_by_user > 0;

  return (
    <div 
      onClick={() => navigate(`/product/${product.id}`)}
      className="w-[160px] flex-shrink-0 flex flex-col gap-3 group cursor-pointer"
    >
      <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden">
        <ImageWithFallback 
          src={product.images?.[0]} 
          className="w-full h-full object-cover"
        />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSave(product);
          }}
          className="absolute top-3 right-3 p-2.5 rounded-xl backdrop-blur-md transition-all active:scale-90 bg-black/40 hover:bg-black/60 border border-white/10"
          style={{ color: isSaved ? '#25D366' : 'white' }}
        >
          <Heart size={14} fill={isSaved ? '#25D366' : 'none'} />
        </button>
        <div className="absolute bottom-3 left-3">
          {getStockBadge(product.total_stock)}
        </div>
      </div>
      <div className="flex flex-col px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] truncate text-white/20">STORE</p>
        <h4 className="text-[15px] font-bold truncate mt-1 text-white tracking-tight">{product.name}</h4>
        <div className="flex justify-between items-center mt-2">
          <span className="font-bold font-syne text-primary text-[16px]">${product.price}</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-bold text-white/40">
            <Bookmark size={10} />
            {product.save_count || 0}
          </div>
        </div>
      </div>
    </div>
  );
});

const ShopCard = memo(({ shop, onFollow, formatFollowers }: { shop: any; onFollow: (s: any) => void; formatFollowers: (c: number) => string }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => {
        const path = getShopUrl(shop.slug || shop.handle, shop.id);
        console.log("[HOME FEED SYSTEM] ShopCard clicked, navigating to storefront path:", path);
        if (path) {
          navigate(path);
        } else {
          console.warn("[HOME FEED SYSTEM] Broken link prevented: slug/handle/id missing on highlighted shop", shop);
          toast.error("Unable to load store storefront!");
        }
      }}
      className="w-[200px] flex-shrink-0 border border-white/5 rounded-[32px] p-6 flex flex-col items-center text-center gap-4 cursor-pointer transition-all hover:bg-white/5 bg-card shadow-heavy group"
    >
      <div className="relative p-1.5 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent">
        <Avatar 
          url={shop.logo_url || shop.avatar_url} 
          size={72}
          className="rounded-2xl border-[3px] border-background transition-transform group-hover:scale-105"
        />
      </div>
      <div>
        <h4 className="font-bold text-[16px] truncate w-full text-white tracking-tight">{shop.name}</h4>
        <p className="text-[10px] uppercase font-black tracking-[0.2em] mt-1 text-white/20">{shop.category || 'Retailer'}</p>
      </div>
      <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5">
        <span className="text-[10px] font-bold text-white/40">{formatFollowers(shop.follower_count)}</span>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onFollow(shop);
        }}
        className="w-full py-3 rounded-xl border border-primary text-primary text-xs font-bold transition-all hover:bg-primary hover:text-black active:scale-95"
      >
        Follow Business
      </button>
    </div>
  );
});

const BuildShopBanner = () => {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranding = async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'shop_banner_image_url').single();
      if (data) setImageUrl(data.value);
    };
    fetchBranding();
  }, []);

  return (
    <div 
      onClick={() => navigate('/seller-onboarding')}
      className="relative w-full h-40 rounded-[32px] overflow-hidden group cursor-pointer border border-primary/30 shadow-[0_0_30px_#25D36633] active:scale-[0.98] transition-all bg-card"
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.3] group-hover:scale-110 transition-transform duration-1000"
          alt=""
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#111] to-black" />
      )}
      <div className="absolute inset-0 bg-linear-to-r from-black via-black/40 to-transparent" />
      
      <div className="absolute inset-0 flex items-center px-10 z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-black text-[16px] shadow-lg shadow-primary/40 text-black">🏪</div>
            <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Business Program</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tighter">Your Store, Our Magic.</h3>
          <p className="text-white/60 text-[13px] mt-1.5 max-w-[200px] leading-tight">Get your professional WhatsApp store live in 48 hours.</p>
          <div className="mt-4 flex items-center gap-2 text-primary font-bold text-sm">
            Build Now <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
          </div>
        </div>
      </div>

      {/* Glowing border animation */}
      <div className="absolute inset-0 rounded-[32px] border border-primary/20 group-hover:border-primary/50 transition-colors" />
    </div>
  );
};

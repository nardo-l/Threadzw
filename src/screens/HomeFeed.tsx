import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Heart, ArrowRight, Trophy, Bell, Radio, Plus, Bookmark, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mapError } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { toast } from 'sonner';
import { useTheme } from '../App';

import { Avatar } from '../components/Avatar';

// Reusable Skeleton Pulse
const Pulse = ({ className }: { className: string }) => {
  const t = useTheme();
  return (
    <div className={`animate-pulse ${className}`} style={{ background: t.border_primary }} />
  );
};

// Section Error Wrapper
const SectionError = ({ onRetry }: { onRetry: () => void }) => {
  const t = useTheme();
  return (
    <div 
      onClick={onRetry}
      className="rounded-[14px] p-4 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all border"
      style={{ background: t.bg_card, borderColor: t.border_primary }}
    >
      <span className="text-lg">⚠️</span>
      <p style={{ color: t.text_secondary, fontSize: '12px' }}>Could not load</p>
      <p style={{ color: t.accent, fontSize: '12px', fontWeight: 'bold' }}>Tap to retry</p>
    </div>
  );
};

export const HomeFeed: React.FC = () => {
  const t = useTheme();
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
          id, name, handle, avatar_url, follower_count
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
        .select('id, name, handle, avatar_url, category, follower_count, is_live')
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
        style: { background: t.red, color: 'white' }
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
    if (stock === 0) return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: t.red_bg, color: t.red }}>Out of Stock</span>;
    if (stock <= 3) return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: t.amber_bg, color: t.amber }}>Only {stock} left</span>;
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: t.green_bg, color: t.green }}>In Stock</span>;
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K followers`;
    return `${count} followers`;
  };

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: t.bg_primary }}>
      {/* Top Bar */}
      <header 
        className="sticky top-0 backdrop-blur-md z-40 px-6 py-4 flex justify-between items-center border-b"
        style={{ background: `${t.bg_primary}80`, borderColor: t.border_secondary }}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold" style={{ color: t.text_primary }}>
              Welcome, 
            </h1>
            {authLoading ? (
              <Pulse className="w-[120px] h-[16px] rounded-full" />
            ) : (
              <span className="text-xl font-bold" style={{ color: t.text_primary }}>
                {profile?.display_name?.split(' ')[0] || "Champ"}
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold mt-0.5" style={{ color: t.accent }}>Explore the closet</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/notifications')}
            className="p-2.5 rounded-full relative active:scale-95 transition-transform"
            style={{ background: t.bg_card_2, color: t.text_primary }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span 
                className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 animate-pulse" 
                style={{ background: t.accent, borderColor: t.bg_primary }}
              />
            )}
          </button>
          <button 
            onClick={() => navigate('/enquiries')}
            className="p-2.5 rounded-full relative active:scale-95 transition-transform"
            style={{ background: t.bg_card_2, color: t.text_primary }}
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold flex items-center justify-center rounded-full border-2"
                style={{ background: t.accent, color: 'white', borderColor: t.bg_primary }}
              >
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Pull to Refresh Spinner placeholder */}
      {refreshing && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
          <div 
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" 
            style={{ borderColor: t.accent }}
          />
        </div>
      )}

      <div className="flex flex-col gap-8 py-6 px-6">
        {/* Prominent Search Bar */}
        <div 
          onClick={() => navigate('/search')}
          className="relative border rounded-[18px] py-4 pl-12 pr-6 cursor-pointer transition-colors"
          style={{ background: t.bg_card, borderColor: t.border_primary }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.accent }} size={20} />
          <span style={{ color: t.text_secondary, fontSize: '14px' }}>Search for drip...</span>
        </div>

        {/* 1. Stories Row */}
        <div className="section-container">
          {storiesLoading ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {Array.from({ length: 6 }).map((_, i) => (
                <Pulse key={i} className="w-16 h-16 rounded-full flex-shrink-0" />
              ))}
            </div>
          ) : storiesError ? (
            <SectionError onRetry={fetchStories} />
          ) : (
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {stories.length === 0 ? (
                <div className="flex flex-col items-center gap-2 flex-shrink-0 opacity-50 px-4">
                  <div className="w-16 h-16 rounded-full border" style={{ background: t.bg_secondary, borderColor: t.border_secondary }} />
                  <span className="text-[10px] font-mono" style={{ color: t.text_tertiary }}>Loading...</span>
                </div>
              ) : (
                stories.map(item => {
                  const isViewed = viewedStories.includes(item.id);
                  const ringColorStyle = item.hasStory 
                    ? (isViewed ? { borderColor: t.border_secondary } : { background: t.gradient, boxShadow: t.shadow })
                    : { borderColor: t.border_subtle };

                  return (
                    <button 
                      key={item.id} 
                      onClick={() => {
                        if (item.hasStory) {
                          setStoriesViewerOpen(true, item.id);
                          if (!isViewed) {
                            const updated = [...viewedStories, item.id];
                            setViewedStories(updated);
                            localStorage.setItem('thread_viewed_stories', JSON.stringify(updated));
                          }
                        } else {
                          navigate(`/shop/${item.id}`);
                        }
                      }}
                      className="flex flex-col items-center gap-2 flex-shrink-0"
                    >
                      <div 
                        className={`w-16 h-16 rounded-full p-[2.5px] transition-all ${item.hasStory && !isViewed ? '' : 'border'}`}
                        style={item.hasStory && !isViewed ? { background: t.gradient } : { borderColor: t.border_subtle }}
                      >
                        <Avatar 
                          url={item.avatar_url} 
                          size={60}
                          className="border-2"
                          style={{ borderColor: t.bg_primary }}
                        />
                      </div>
                      <span className="text-[10px] font-mono w-16 text-center leading-tight truncate" style={{ color: t.text_primary }}>
                        {item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 2. Featured Drop Banner */}
        <div className="section-container">
          {featuredLoading ? (
            <Pulse className="w-full h-44 rounded-[24px]" />
          ) : featuredError ? (
            <SectionError onRetry={fetchFeaturedDrop} />
          ) : featured && (
            <div 
              onClick={() => navigate(`/product/${featured.id}`)}
              className="relative w-full h-44 rounded-[24px] overflow-hidden group cursor-pointer"
            >
              <ImageWithFallback 
                src={featured.images?.[0]} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                <div>
                  <span className="text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest" style={{ background: t.accent }}>Featured Drop</span>
                  <h3 className="text-white text-xl font-bold mt-2 leading-tight">{featured.name}</h3>
                  <p className="text-white/60 text-xs mt-0.5">by {featured.shops?.name}</p>
                </div>
                <div className="text-white text-xl font-bold font-syne">${featured.price}</div>
              </div>
            </div>
          )}
        </div>

        {/* 3. New In Section */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold tracking-tight" style={{ color: t.text_primary }}>New In</h2>
            <button style={{ color: t.accent, fontSize: '12px', fontWeight: 'bold' }} onClick={() => navigate('/search')}>See All</button>
          </div>
          {newInLoading ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[160px] flex-shrink-0 flex flex-col gap-3">
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
              {newIn.map(product => {
                const isSaved = product.is_saved_by_user > 0;
                return (
                  <div 
                    key={product.id} 
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
                          handleSaveToggle(product);
                        }}
                        className="absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-colors"
                        style={{ background: `${t.bg_primary}66`, color: isSaved ? t.accent : 'white' }}
                      >
                        <Heart size={14} fill={isSaved ? t.accent : 'none'} />
                      </button>
                      <div className="absolute bottom-3 left-3">
                        {getStockBadge(product.total_stock)}
                      </div>
                    </div>
                    <div className="flex flex-col px-1">
                      <p className="text-[10px] font-mono uppercase tracking-wider truncate" style={{ color: t.text_secondary }}>{product.shops?.name}</p>
                      <h4 className="text-sm font-bold truncate mt-0.5" style={{ color: t.text_primary }}>{product.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="font-bold font-syne" style={{ color: t.accent }}>${product.price}</span>
                        <div className="flex items-center gap-1 text-[10px]" style={{ color: t.text_tertiary }}>
                          <Bookmark size={10} />
                          {product.save_count || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="col-span-full">
              {/* Fallback to EmptyFeedDiscovery if no products */}
              <div className="rounded-[24px] p-8 text-center border" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
                <p className="font-bold opacity-80 mb-4" style={{ color: t.text_primary }}>Thread ZW is starting up.</p>
                <button 
                  onClick={() => navigate('/shops')}
                  className="w-full py-3 text-white rounded-full font-bold text-sm shadow-lg"
                  style={{ background: t.accent, boxShadow: t.shadow }}
                >
                  Browse Shops
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Shops to Follow */}
        {shopsToFollow.length > 0 && !shopsLoading && (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold tracking-tight" style={{ color: t.text_primary }}>Shops to Follow</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
          {shopsToFollow.map(shop => (
                <div 
                  key={shop.id}
                  onClick={() => navigate(`/shop/${shop.id}`)}
                  className="w-[180px] flex-shrink-0 border rounded-[24px] p-5 flex flex-col items-center text-center gap-3 cursor-pointer transition-colors"
                  style={{ background: t.bg_card, borderColor: t.border_primary, boxShadow: t.shadow }}
                >
                  <Avatar 
                    url={shop.avatar_url} 
                    size={64}
                    style={{ background: t.bg_secondary }}
                  />
                  <div>
                    <h4 className="font-bold truncate w-full" style={{ color: t.text_primary }}>{shop.name}</h4>
                    <p className="text-[10px] uppercase font-mono tracking-widest mt-0.5" style={{ color: t.text_secondary }}>{shop.category || 'Boutique'}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full" style={{ background: t.bg_secondary }}>
                    <span className="text-[10px]" style={{ color: t.text_secondary }}>{formatFollowers(shop.follower_count)}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow(shop);
                    }}
                    className="w-full py-2.5 rounded-full border text-xs font-bold transition-all"
                    style={{ borderColor: t.accent, color: t.accent }}
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {shopsLoading && (
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {Array.from({ length: 4 }).map((_, i) => (
              <Pulse key={i} className="w-[180px] h-[220px] rounded-[24px] flex-shrink-0" />
            ))}
          </div>
        )}

        {/* 5. How Fly Are You Card */}
        <div 
          onClick={() => navigate('/quiz')}
          className="relative rounded-[28px] p-8 flex flex-col items-center text-center gap-4 overflow-hidden shadow-2xl group cursor-pointer"
          style={{ background: t.gradient, boxShadow: t.shadow }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full -mr-24 -mt-12 group-hover:scale-125 transition-transform duration-700" />
          <h2 className="text-4xl font-pacifico text-white shadow-sm">How Fly Are You?</h2>
          <p className="text-white/80 text-sm max-w-[200px] leading-relaxed">Discover your fashion personality in 10 questions.</p>
          <button 
            className="mt-2 bg-white font-bold px-8 py-3 rounded-full flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl font-syne"
            style={{ color: t.accent }}
          >
            Find Out <ArrowRight size={18} />
          </button>
        </div>

        {/* 6. Best Dresser Card */}
        <div 
          onClick={() => navigate('/best-dresser')}
          className="border rounded-[28px] p-6 flex items-center gap-5 group transition-all cursor-pointer"
          style={{ background: t.bg_card, borderColor: t.border_primary, boxShadow: t.shadow }}
        >
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
          >
            <Trophy size={28} className="text-black" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-pacifico" style={{ color: t.text_primary }}>Best Dresser</h3>
            <p className="text-[10px] font-mono tracking-widest uppercase mt-1" style={{ color: t.text_secondary }}>
              {bestDresser.nominee_count === 0 
                ? 'Be the first to enter' 
                : `${bestDresser.nominee_count} nominees competing`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-bold font-syne tracking-tight" style={{ color: t.text_primary }}>$30</span>
            <ArrowRight size={18} style={{ color: t.accent }} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

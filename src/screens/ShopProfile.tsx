import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Star, MapPin, ShoppingBag, Info, MessageSquare, Heart, Bookmark, Clock, Navigation, MessageCircle, Ship, Check, X, ThumbsUp, ThumbsDown, Send, Radio, Edit2, Trash2, Share2, Link } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import { useAuth } from '../context/AuthContext';
import { useInventory, Review } from '../context/InventoryContext';
import { useShopProfile } from '../hooks/useShopProfile';
import { useFollow } from '../context/FollowContext';
import { ProductCardShimmer, ShopCardShimmer } from '../components/ui/Shimmer';
import { ScreenError } from '../components/ui/ScreenError';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { ShareSheet } from '../components/ShareSheet';

import { Avatar } from '../components/Avatar';

export const ShopProfile: React.FC = () => {
  const t = useTheme();
  const { id: shopHandle } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    userData,
    likedProductIds, 
    savedProductIds, 
    toggleLike, 
    toggleSave, 
    isShopOpen,
    reviews: allReviews,
    addReview,
    voteReview,
    addSellerResponse,
    followers: allFollowers,
    deleteProduct
  } = useInventory();

  const { shop, products, loading, error, refetch } = useShopProfile(shopHandle);

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" forever?`)) return;
    try {
      const success = await deleteProduct(id);
      if (success) {
        toast.success('Product deleted ✓');
        refetch();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (err) {
      toast.error('Error deleting product');
    }
  };

  const { follow, unfollow, isFollowing: checkIsFollowing } = useFollow();

  const [activeTab, setActiveTab] = useState<'Products' | 'About' | 'Reviews'>('Products');
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  
  const isFollowing = shop ? checkIsFollowing(shop.id) : false;
  const shopReviews = shop ? allReviews[shop.id] || [] : [];
  const shopFollowers = shop ? allFollowers[shop.id] || [] : [];
  const isOpen = shop ? isShopOpen(shop.name) : false;

  if (loading) {
    return (
      <div className="flex flex-col pb-32 gap-6" style={{ background: t.bg_primary }}>
        <div className="h-48 shimmer-bg" style={{ background: t.bg_secondary }} />
        <div className="px-6 -mt-10">
          <div className="w-24 h-24 rounded-full border-4 shimmer-bg" style={{ background: t.bg_secondary, borderColor: t.bg_primary }} />
        </div>
        <div className="px-6 space-y-4">
          <div className="h-8 w-1/2 rounded-lg shimmer-bg" style={{ background: t.bg_secondary }} />
          <div className="h-4 w-1/3 rounded-lg shimmer-bg" style={{ background: t.bg_secondary }} />
        </div>
        <div className="grid grid-cols-2 gap-4 px-6">
          {Array.from({ length: 4 }).map((_, i) => <ProductCardShimmer key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: t.bg_primary }}>
        <header className="p-6">
          <button onClick={() => navigate(-1)} className="p-3 rounded-full" style={{ background: t.bg_card, color: t.text_primary }}>
            <ArrowLeft size={24} />
          </button>
        </header>
        <ScreenError 
          icon={<Radio size={32} />}
          heading="Shop not found"
          body={error || "We couldn't find the shop you're looking for."}
          onRetry={refetch}
        />
      </div>
    );
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hi, I'm interested in your products on Thread ZW`);
    window.open(`https://wa.me/${shop.whatsappNumber}?text=${message}`, '_blank');
  };

  const trackShareEvent = async () => {
    if (!shop?.id) return;
    try {
      await supabase.rpc('increment_shop_shares', { p_shop_id: shop.id });
    } catch (err) {
      console.error('Share tracking error:', err);
    }
  };

  const handleShareShopProfile = async () => {
    if (!shop) return;
    const link = 'https://threadzw.vercel.app/shop/@' + shop.handle.toLowerCase();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shop.name + ' on Zimbabwe ThreadZW',
          text: `Check out ${shop.name} on Zimbabwe ThreadZW 🧵`,
          url: link
        });
        trackShareEvent();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setShowShareSheet(true);
        }
      }
    } else {
      setShowShareSheet(true);
    }
  };

  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayName = days[now.getDay()];

  const getStockStatus = (variants: any[]) => {
    const total = variants.reduce((acc, v) => acc + v.quantity, 0);
    if (total >= 10) return { color: 'bg-green-500', text: 'In Stock' };
    if (total >= 3) return { color: 'bg-amber-500', text: `Only ${total} left` };
    if (total >= 1) return { color: 'bg-red-500 animate-pulse', text: `Last ${total}!` };
    return { color: 'bg-muted', text: 'Sold Out' };
  };

  return (
    <div className="flex flex-col pb-32" style={{ background: t.bg_primary }}>
      {/* Cover & Avatar */}
      <div className={`h-48 relative ${!shop.banner_url ? '' : ''}`} style={{ background: !shop.banner_url ? `linear-gradient(135deg, ${t.accent}, ${t.bg_secondary})` : t.bg_secondary }}>
        {shop.banner_url && (
          <img 
            src={shop.banner_url || undefined} 
            alt="Banner" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 p-3 rounded-full backdrop-blur-md border z-10"
          style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
        >
          <ArrowLeft size={24} />
        </button>

        <button 
          onClick={handleShareShopProfile}
          className="absolute top-6 right-6 w-11 h-11 rounded-full backdrop-blur-md border z-10 flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
        >
          <Share2 size={20} />
        </button>
        <div className="absolute -bottom-10 left-6">
          <Avatar 
            url={shop.logo_url} 
            size={96} 
            className="border-4 shadow-xl"
            style={{ borderColor: t.bg_primary }}
          />
        </div>
      </div>

      {/* Shop Info */}
      <div className="p-6 pt-14 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-pacifico" style={{ color: t.text_primary }}>{shop.name}</h1>
              <div className="p-1 rounded-full" style={{ background: `${t.accent}1A`, color: t.accent }}>
                <Check size={12} strokeWidth={4} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1" style={{ color: t.text_tertiary }}>
              <MapPin size={12} />
              <span className="text-[10px] font-mono uppercase tracking-widest">{shop.area}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (isFollowing) {
                unfollow(shop.id);
              } else {
                follow(shop.id);
                toast.success(`${shop.name} added to your feed ✓`);
              }
            }}
            className={`px-8 py-3 rounded-pill font-bold text-sm transition-all border-2`}
            style={{
              background: isFollowing ? 'transparent' : t.accent,
              borderColor: t.accent,
              color: isFollowing ? t.accent : 'white',
              boxShadow: isFollowing ? 'none' : t.shadow
            }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        <div className="flex gap-8 border-b" style={{ borderColor: t.border_secondary }}>
          {[
            { label: 'Products', icon: <ShoppingBag size={16} /> },
            { label: 'About', icon: <Info size={16} /> },
            { label: 'Reviews', icon: <MessageSquare size={16} /> },
          ].map(tab => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label as any)}
              className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2`}
              style={{ color: activeTab === tab.label ? t.accent : t.text_tertiary }}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.label && (
                <motion.div layoutId="shopTab" className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full" style={{ background: t.accent }} />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'Products' && (
          <div className="grid grid-cols-2 gap-4">
            {products.map(product => {
              const stock = getStockStatus(product.variants || []);
              const isSoldOut = stock.text === 'Sold Out';
              const isLiked = likedProductIds.includes(product.id);
              const isSaved = savedProductIds.includes(product.id);
              const isOwner = user?.id === shop.owner_id;

              return (
                <div 
                  key={product.id} 
                  onClick={() => navigate(`/product/${product.id}`)}
                  className={`rounded-card overflow-hidden border-t group cursor-pointer relative transition-all ${isSoldOut ? 'opacity-50 grayscale' : ''}`}
                  style={{ background: t.bg_card, borderColor: `${t.accent}1A` }}
                >
                  <div className="h-40 relative flex items-center justify-center text-5xl overflow-hidden" style={{ background: t.bg_secondary }}>
                    <div className="absolute inset-0 shimmer-bg opacity-50" style={{ background: t.bg_secondary }} />
                    {product.images?.[0] ? (
                      <img src={product.images[0] || undefined} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      '📦'
                    )}
                    
                    <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                      {isOwner && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/edit-product/${product.id}`);
                            }}
                            className="p-1.5 rounded-full backdrop-blur-md border border-white/10 bg-black/40 text-white hover:bg-primary transition-all"
                            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product.id, product.name);
                            }}
                            className="p-1.5 rounded-full backdrop-blur-md border border-white/10 bg-black/40 text-white hover:bg-red-500 transition-all"
                            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(product.id);
                        }}
                        className={`p-1.5 rounded-full backdrop-blur-md border transition-all`}
                        style={{ 
                          backgroundColor: isLiked ? t.accent : 'rgba(0,0,0,0.4)',
                          borderColor: isLiked ? t.accent : 'rgba(255,255,255,0.1)',
                          color: 'white'
                        }}
                      >
                        <Heart size={12} fill={isLiked ? 'currentColor' : 'none'} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSave(product.id);
                        }}
                        className={`p-1.5 rounded-full backdrop-blur-md border transition-all`}
                        style={{ 
                          backgroundColor: isSaved ? t.accent : 'rgba(0,0,0,0.4)',
                          borderColor: isSaved ? t.accent : 'rgba(255,255,255,0.1)',
                          color: 'white'
                        }}
                      >
                        <Bookmark size={12} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full`} style={{ background: stock.color.includes('green') ? t.green : stock.color.includes('amber') ? t.amber : t.red }} />
                      <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: t.text_tertiary }}>{stock.text}</span>
                    </div>
                    <h4 className="text-xs font-bold truncate" style={{ color: t.text_primary }}>{product.name}</h4>
                    <span className="font-syne font-bold text-sm" style={{ color: t.accent }}>${product.price}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'About' && (
          <div className="flex flex-col gap-6">
            {/* Location Card */}
            <div className="rounded-card p-6 border flex flex-col gap-6" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${t.accent}1A`, color: t.accent }}>
                    <MapPin size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h4 className="font-syne font-bold text-lg leading-none mb-1" style={{ color: t.text_primary }}>{shop.area}</h4>
                    <p className="text-sm font-sans" style={{ color: t.text_secondary }}>{shop.landmark}</p>
                  </div>
                </div>
                <div 
                  className={`px-3 py-1.5 rounded-pill text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-2`}
                  style={{ background: isOpen ? t.green_bg : t.red_bg, color: isOpen ? t.green : t.red }}
                >
                  <div className={`w-1.5 h-1.5 rounded-full`} style={{ background: isOpen ? t.green : t.red }} />
                  {isOpen ? 'Open Now' : 'Closed'}
                </div>
              </div>

              {!shop.is_online_only ? (
                <div className="flex flex-col gap-6">
                  {/* Directions Card */}
                  <div className="rounded-xl p-5 border flex flex-col gap-3" style={{ background: t.bg_secondary, borderColor: t.border_secondary }}>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} fill="currentColor" style={{ color: t.accent }} />
                      <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.accent }}>How to get there</span>
                    </div>
                    <p className="text-sm font-sans leading-relaxed" style={{ color: t.text_primary }}>
                      {shop.directions}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-1" style={{ color: t.text_tertiary }}>
                      <Clock size={14} />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Trading Hours</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {shop.trading_hours && Object.entries(shop.trading_hours).map(([day, hours]: [string, any]) => (
                        <div 
                          key={day} 
                          className={`flex justify-between items-center text-xs p-2.5 rounded-lg border`}
                          style={{ 
                            background: day === todayName ? `${t.accent}1A` : t.bg_secondary,
                            borderColor: day === todayName ? `${t.accent}33` : 'transparent'
                          }}
                        >
                          <span className={`font-mono ${day === todayName ? 'font-bold' : ''}`} style={{ color: day === todayName ? t.accent : t.text_tertiary }}>{day}</span>
                          <span className={day === todayName ? 'font-bold' : ''} style={{ color: day === todayName ? t.text_primary : t.text_tertiary }}>
                            {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleWhatsApp}
                    className="w-full py-4 text-white rounded-pill text-sm font-bold flex items-center justify-center gap-2"
                    style={{ background: t.accent, boxShadow: t.shadow }}
                  >
                    <MessageCircle size={18} /> WhatsApp Shop
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl p-5 border flex flex-col gap-2" style={{ background: t.bg_secondary, borderColor: t.border_secondary }}>
                    <div className="flex items-center gap-2" style={{ color: t.accent }}>
                      <Ship size={18} />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Ships Nationwide</span>
                    </div>
                    <p className="text-sm font-sans leading-relaxed" style={{ color: t.text_primary }}>
                      {shop.delivery_info || 'Fast delivery across Zimbabwe via Swift or local courier.'}
                    </p>
                  </div>
                  <button 
                    onClick={handleWhatsApp}
                    className="w-full py-4 text-white rounded-pill text-sm font-bold flex items-center justify-center gap-2"
                    style={{ background: t.accent, boxShadow: t.shadow }}
                  >
                    <MessageCircle size={18} /> WhatsApp Shop
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Description</h3>
              <p className="text-sm leading-relaxed" style={{ color: t.text_secondary }}>
                {shop.description || "Zimbabwe's premier destination for authentic drip."}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Categories</h3>
              <div className="flex flex-wrap gap-2">
                {shop.categories?.map((cat: string) => (
                  <span key={cat} className="px-4 py-2 border rounded-pill text-[10px] font-bold uppercase tracking-widest" style={{ background: t.bg_secondary, borderColor: t.border_secondary, color: t.text_primary }}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Contact</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm" style={{ color: t.text_primary }}>
                  <div className="p-2 rounded-lg" style={{ background: t.bg_card, color: t.accent }}><MessageSquare size={16} /></div>
                  <span>Chat with Seller</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <button 
                    onClick={() => navigate(`/shop/${shop.id}/followers`)}
                    className="flex items-center gap-3 text-sm transition-colors"
                    style={{ color: t.text_primary }}
                  >
                    <div className="p-2 rounded-lg" style={{ background: t.bg_card, color: t.bg_secondary }}><Star size={16} /></div>
                    <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>{shopFollowers.length} followers</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Reviews' && (
          <ReviewsTab 
            shopId={shop.id}
            shopName={shop.name}
            reviews={shopReviews}
            onWriteReview={() => {
              setIsWriteReviewOpen(true);
            }}
            onVote={(reviewId, vote) => {
              voteReview(shop.id, reviewId, vote);
            }}
            onReply={(reviewId, text) => {
              addSellerResponse(shop.id, reviewId, text);
            }}
          />
        )}
      </div>

      <AnimatePresence>
        {isWriteReviewOpen && (
          <WriteReviewSheet 
            shopName={shop.name}
            onClose={() => setIsWriteReviewOpen(false)}
            onSubmit={(rating, text) => {
              addReview(shop.id, {
                shopId: shop.id,
                userName: 'You', 
                userHandle: '@you',
                rating,
                text,
                isVerified: false
              });
              setIsWriteReviewOpen(false);
              toast.success('Review posted ✓');
            }}
          />
        )}
      </AnimatePresence>

      <ShareSheet 
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        shop={shop}
        onTrackShare={trackShareEvent}
      />
    </div>
  );
};

// --- Sub-components ---

const ReviewsTab: React.FC<{ 
  shopId: string;
  shopName: string;
  reviews: Review[]; 
  onWriteReview: () => void;
  onVote: (reviewId: string, vote: 'helpful' | 'unhelpful') => void;
  onReply: (reviewId: string, text: string) => void;
}> = ({ shopId, shopName, reviews, onWriteReview, onVote, onReply }) => {
  const t = useTheme();
  const [sortBy, setSortBy] = useState<'Recent' | 'Highest' | 'Lowest'>('Recent');

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (sortBy === 'Recent') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === 'Highest') return b.rating - a.rating;
      return a.rating - b.rating;
    });
  }, [reviews, sortBy]);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const breakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Rating Summary Card */}
      <div className="rounded-card p-6 border flex flex-col gap-6" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-syne font-bold" style={{ color: t.amber }}>{averageRating}</span>
              <span className="text-sm font-sans" style={{ color: t.text_tertiary }}>/ 5.0</span>
            </div>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star 
                  key={s} 
                  size={14} 
                  className={s <= Math.round(Number(averageRating)) ? 'fill-current' : ''} 
                  style={{ color: s <= Math.round(Number(averageRating)) ? t.amber : t.text_tertiary }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest mt-2" style={{ color: t.text_tertiary }}>({reviews.length} reviews)</span>
          </div>
          <button 
            onClick={onWriteReview}
            className="px-6 py-3 text-white font-sans font-bold rounded-button transition-all"
            style={{ background: t.accent, boxShadow: t.shadow }}
          >
            Write a Review
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {breakdown.map(b => (
            <div key={b.star} className="flex items-center gap-3">
              <span className="text-[10px] font-mono w-4" style={{ color: t.text_tertiary }}>{b.star}★</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: t.bg_secondary }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${b.percentage}%` }}
                  className="h-full"
                  style={{ background: t.accent }}
                />
              </div>
              <span className="text-[10px] font-mono w-4 text-right" style={{ color: t.text_tertiary }}>{b.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sort Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(['Recent', 'Highest', 'Lowest'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`px-5 py-2 rounded-pill text-[10px] font-mono uppercase tracking-widest transition-all border`}
            style={{ 
              background: sortBy === s ? t.accent : t.bg_card,
              borderColor: sortBy === s ? t.accent : t.border_secondary,
              color: sortBy === s ? 'white' : t.text_tertiary
            }}
          >
            {s === 'Recent' ? 'Most Recent' : s === 'Highest' ? 'Highest Rated' : 'Lowest Rated'}
          </button>
        ))}
      </div>

      {/* Review Cards List */}
      <div className="flex flex-col gap-4">
        {sortedReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: t.bg_card, color: t.text_tertiary }}>
              <MessageSquare size={32} />
            </div>
            <div>
              <h3 className="text-lg font-syne font-bold" style={{ color: t.text_primary }}>No reviews yet</h3>
              <p className="text-xs font-sans mt-1" style={{ color: t.text_tertiary }}>Be the first to share your experience</p>
            </div>
            <button 
              onClick={onWriteReview}
              className="px-6 py-3 font-sans font-bold rounded-button border"
              style={{ background: `${t.accent}1A`, color: t.accent, borderColor: `${t.accent}4D` }}
            >
              Write a Review
            </button>
          </div>
        ) : (
          sortedReviews.map(r => (
            <ReviewCard key={r.id} review={r} shopName={shopName} onVote={onVote} onReply={onReply} />
          ))
        )}
      </div>
    </div>
  );
};

const ReviewCard: React.FC<{ 
  review: Review; 
  shopName: string;
  onVote: (reviewId: string, vote: 'helpful' | 'unhelpful') => void;
  onReply: (reviewId: string, text: string) => void;
}> = ({ review, shopName, onVote, onReply }) => {
  const t = useTheme();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  return (
    <div className="rounded-card p-5 border flex flex-col gap-4" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Avatar 
            url={null} 
            size={40}
            className="from-primary/20 to-purple/20"
          />
          <div className="flex flex-col">
            <h4 className="text-sm font-syne font-bold leading-tight" style={{ color: t.text_primary }}>{review.userName}</h4>
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>{review.userHandle}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star 
                key={s} 
                size={10} 
                className={s <= review.rating ? 'fill-current' : ''} 
                style={{ color: s <= review.rating ? t.amber : t.border_secondary }}
              />
            ))}
          </div>
          <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>
            {formatDistanceToNow(parseISO(review.timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {review.isVerified && (
          <span className="w-fit px-2 py-0.5 text-[8px] font-mono font-bold rounded-pill uppercase tracking-wider" style={{ background: t.green_bg, color: t.green }}>
            Visited in person
          </span>
        )}
        <p className="text-sm font-sans leading-relaxed" style={{ color: t.text_secondary }}>
          {review.text}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-sans" style={{ color: t.text_tertiary }}>Was this helpful?</span>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onVote(review.id, 'helpful')}
              className={`flex items-center gap-1.5 text-[10px] font-mono transition-colors`}
              style={{ color: review.userVote === 'helpful' ? t.accent : t.text_tertiary }}
            >
              <ThumbsUp size={12} fill={review.userVote === 'helpful' ? 'currentColor' : 'none'} />
              {review.helpfulCount}
            </button>
            <button 
              onClick={() => onVote(review.id, 'unhelpful')}
              className={`flex items-center gap-1.5 text-[10px] font-mono transition-colors`}
              style={{ color: review.userVote === 'unhelpful' ? t.accent : t.text_tertiary }}
            >
              <ThumbsDown size={12} fill={review.userVote === 'unhelpful' ? 'currentColor' : 'none'} />
              {review.unhelpfulCount}
            </button>
          </div>
        </div>
        <button 
          onClick={() => setIsReplying(!isReplying)}
          className="text-[10px] font-mono uppercase tracking-widest transition-colors"
          style={{ color: t.text_tertiary }}
        >
          Reply
        </button>
      </div>

      {/* Seller Response */}
      {review.sellerResponse && (
        <div className="mt-2 pl-4 border-l-2 flex flex-col gap-2" style={{ borderColor: t.accent }}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.accent }}>Response from {shopName}</span>
            <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>
              {formatDistanceToNow(parseISO(review.sellerResponse.timestamp), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm font-sans italic leading-relaxed" style={{ color: t.text_secondary }}>
            "{review.sellerResponse.text}"
          </p>
        </div>
      )}

      {/* Reply Input */}
      <AnimatePresence>
        {isReplying && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex flex-col gap-3">
              <textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your response..."
                className="w-full border rounded-xl p-4 text-sm focus:outline-none transition-all resize-none h-24"
                style={{ background: t.bg_primary, borderColor: t.border_secondary, color: t.text_primary }}
              />
              <button 
                onClick={() => {
                  onReply(review.id, replyText);
                  setReplyText('');
                  setIsReplying(false);
                }}
                disabled={!replyText.trim()}
                className="w-full py-3 text-white font-sans font-bold rounded-button disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: t.accent }}
              >
                <Send size={16} />
                Post Reply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const WriteReviewSheet: React.FC<{ 
  shopName: string; 
  onClose: () => void; 
  onSubmit: (rating: number, text: string) => void;
}> = ({ shopName, onClose, onSubmit }) => {
  const t = useTheme();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const labels = ['', 'Terrible', 'Poor', 'OK', 'Good', 'Excellent'];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] backdrop-blur-sm flex items-end justify-center"
      style={{ background: t.overlay }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-[430px] rounded-t-[32px] p-8 flex flex-col gap-8 shadow-2xl border-t"
        style={{ background: t.bg_primary, borderColor: t.border_secondary }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 rounded-full mx-auto mb-2" style={{ background: t.border_subtle }} />
        
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-syne font-bold" style={{ color: t.text_primary }}>Write a Review</h2>
            <span className="text-sm font-sans" style={{ color: t.text_secondary }}>{shopName}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ background: t.bg_card, color: t.text_tertiary }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button 
                key={s} 
                onClick={() => setRating(s)}
                className="transition-all active:scale-90"
              >
                <Star 
                  size={40} 
                  className={s <= rating ? 'fill-current' : ''} 
                  style={{ color: s <= rating ? t.amber : t.border_secondary }}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          <span className="text-lg font-syne font-bold h-6" style={{ color: t.amber }}>{labels[rating]}</span>
        </div>

        <div className="flex flex-col gap-2 relative">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 300))}
            placeholder="Tell others about your experience with this shop..."
            className="w-full border rounded-2xl p-5 text-sm focus:outline-none transition-all resize-none h-40"
            style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_primary }}
          />
          <span className="absolute bottom-4 right-4 text-[10px] font-mono" style={{ color: t.text_tertiary }}>
            {text.length}/300
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-center" style={{ color: t.text_tertiary }}>Posting as You (@you)</span>
          <button 
            onClick={() => onSubmit(rating, text)}
            disabled={rating === 0 || !text.trim()}
            className="w-full py-4 text-white font-sans font-bold rounded-button disabled:opacity-50 disabled:shadow-none active:scale-[0.98] transition-all"
            style={{ background: t.accent, boxShadow: rating === 0 || !text.trim() ? 'none' : t.shadow }}
          >
            Submit Review
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Star, MapPin, ShoppingBag, Info, MessageSquare, 
  Clock, Navigation, MessageCircle, Check, X, ThumbsUp, 
  ThumbsDown, Send, Edit2, Share2, StarHalf 
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useInventory, Review } from '../context/InventoryContext';
import { useShopProfile } from '../hooks/useShopProfile';
import { useFollow } from '../context/FollowContext';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { ShareSheet } from '../components/ShareSheet';
import { Avatar } from '../components/Avatar';

export const ShopProfile: React.FC = () => {
  const { id: shopHandle } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    reviews: allReviews,
    addReview,
    voteReview,
    addSellerResponse,
    isShopOpen,
    deleteProduct
  } = useInventory();

  const { shop, products, loading, error, refetch } = useShopProfile(shopHandle);
  const { follow, unfollow, isFollowing } = useFollow();

  const [activeTab, setActiveTab] = useState<'Products' | 'About' | 'Reviews'>('Products');
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [localFollowerAdjust, setLocalFollowerAdjust] = useState(0);

  const getStockStatus = (products: any[]) => {
    const total = products.reduce((acc, p) => acc + (p.total_stock || 0), 0);
    if (total > 50) return 'OVERFLOW';
    if (total > 10) return 'OPTIMAL';
    if (total > 0) return 'CRITICAL';
    return 'DORMANT';
  };

  const isOwner = useMemo(() => {
    if (!user || !shop) return false;
    return user.id === shop.owner_id;
  }, [user, shop]);

  const shopReviews = useMemo(() => {
    return shop?.id ? allReviews[shop.id] || [] : [];
  }, [shop?.id, allReviews]);

  // Compute followers
  const followingState = useMemo(() => {
    if (!shop) return false;
    return isFollowing(shop.id);
  }, [shop, isFollowing]);

  const followerCount = useMemo(() => {
    if (!shop) return 0;
    return Math.max(0, (shop.follower_count || 0) + localFollowerAdjust);
  }, [shop, localFollowerAdjust]);

  const averageRating = useMemo(() => {
    if (shopReviews.length === 0) return '4.9'; // Fallback to mockup rating
    const sum = shopReviews.reduce((acc: number, r: Review) => acc + r.rating, 0);
    return (sum / shopReviews.length).toFixed(1);
  }, [shopReviews]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error('Connect your profile to follow!');
      return;
    }
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
      toast.error('Could not complete follow protocol');
    }
  };

  const trackShareEvent = () => {
    toast.success('Drip Node Signal Broadcasted ✓');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-center p-6 pb-24">
        <div className="w-12 h-12 border-4 border-[#FF2D78] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-neutral-400 tracking-wide">Loading Shop Profile...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-center p-6 text-center gap-6">
        <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-[#FF2D78]">
          <ShoppingBag size={28} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold tracking-tight">Shop Offline</h2>
          <p className="text-sm text-neutral-400 max-w-xs">{error || "This node could not be loaded."}</p>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-sm font-semibold hover:bg-neutral-800 transition-all active:scale-95"
        >
          Go Back
        </button>
      </div>
    );
  }

  const shopOpenState = typeof isShopOpen === 'function' ? isShopOpen(shop) : true;

  return (
    <div className="flex flex-col pb-48 bg-[#0B0B0B] text-white min-h-screen">
      
      {/* Banner & Cover */}
      <div className="h-[260px] relative overflow-hidden group">
        {shop.banner_url ? (
          <img 
            src={shop.banner_url} 
            alt="Banner" 
            className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-neutral-950 grid grid-cols-4 grid-rows-4 gap-4 p-4 opacity-50">
             {[...Array(16)].map((_, i) => (
                <div key={`banner-grid-cell-${i}`} className="border border-neutral-800/40 rounded-xl" />
             ))}
             <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="text-[12vw] font-black uppercase italic tracking-tighter text-neutral-800/10 select-none">{shop.name}</h2>
             </div>
          </div>
        )}
        
        {/* Soft shadow overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Back navigation button overlay */}
        <div className="absolute top-6 left-6 z-20">
          <button 
            onClick={() => navigate(-1)} 
            className="w-11 h-11 rounded-full bg-black/60 shadow-lg backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all hover:bg-black/80 active:scale-95"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Floating circular profile logo overlapping banner */}
        <div className="absolute -bottom-14 left-6 z-[30]">
          <div className="w-28 h-28 rounded-full border-4 border-[#0B0B0B] bg-[#111] overflow-hidden shadow-xl flex items-center justify-center">
             <Avatar 
               url={shop.logo_url} 
               size={112} 
               className="w-full h-full rounded-full object-cover"
               ring={false}
             />
          </div>
        </div>

        {/* Follow & Share Row Right-aligned under the banner line */}
        <div className="absolute -bottom-14 right-6 z-[30] flex items-center gap-3">
          {/* Share Button */}
          <button 
            onClick={() => setShowShareSheet(true)}
            className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-all flex items-center justify-center text-neutral-300"
          >
            <Share2 size={16} />
          </button>

          {/* Follow Button pills */}
          <button 
            onClick={handleFollowToggle}
            className={`px-6 h-11 rounded-full font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center border-2 ${
              followingState
                ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800/80'
                : 'bg-[#FF2D78]/10 border-[#FF2D78] text-[#FF2D78] hover:bg-[#FF2D78]/20'
            }`}
          >
            {followingState ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>

      {/* Shop Info Container matching the wireframe */}
      <div className="px-6 pt-16 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          {/* Shop Name */}
          <h1 className="text-3xl font-black tracking-tight text-white leading-tight font-sans">
            {shop.name}
          </h1>
          {/* Handle */}
          <p className="text-sm text-neutral-400 font-medium">
            @{shop.handle} • {shop.location || shop.area || 'Bulawayo'}
          </p>
        </div>

        {/* Category & Location badging row */}
        <div className="flex flex-wrap items-center gap-2">
          {shop.categories && shop.categories.length > 0 ? (
            shop.categories.slice(0, 2).map((cat: string) => (
              <span 
                key={cat} 
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#FF2D78]/10 border border-[#FF2D78]/25 text-[#FF2D78]"
              >
                {cat.toLowerCase()}
              </span>
            ))
          ) : (
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#FF2D78]/10 border border-[#FF2D78]/25 text-[#FF2D78]">
              streetwear
            </span>
          )}

          <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-neutral-900 border border-neutral-800/60 text-neutral-300 flex items-center gap-1.5">
            <MapPin size={12} className="text-neutral-500" />
            {shop.location || shop.area || 'Bulawayo'}
          </span>
        </div>

        {/* Bio description block */}
        <p className="text-sm leading-relaxed text-neutral-300">
          {shop.description || 'This is an under dog clothing brand'}
        </p>

        {/* 3-Column Stats Grid cards */}
        <div className="grid grid-cols-3 bg-[#111111] border border-[#1E1E1E] rounded-2xl py-4 text-center mt-1">
          <div className="flex flex-col items-center justify-center border-r border-[#1E1E1E]">
            <span className="text-xl font-bold text-white tracking-tight">{followerCount}</span>
            <span className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase mt-1">Followers</span>
          </div>
          <div className="flex flex-col items-center justify-center border-r border-[#1E1E1E]">
            <span className="text-xl font-bold text-white tracking-tight">{products.length}</span>
            <span className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase mt-1">Products</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white tracking-tight">{averageRating}</span>
            <span className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase mt-1">Rating</span>
          </div>
        </div>

        {/* Physical Address Block */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-4 flex items-center gap-3">
          <MapPin size={18} className="text-[#FF2D78] flex-shrink-0" />
          <span className="text-sm font-semibold text-neutral-200">
            {shop.location || shop.area || 'Bulawayo'}
          </span>
        </div>

        {/* Daily business hours and Open indicator */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-neutral-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-neutral-200">
              {shop.trading_hours || 'Mon–Sat: 8am – 6pm'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${shopOpenState ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-sm font-semibold ${shopOpenState ? 'text-emerald-400' : 'text-red-400'}`}>
              {shopOpenState ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        {/* Floating large full-width hot green WhatsApp contact button */}
        <a 
          href={`https://wa.me/${shop.whatsapp?.replace(/\D/g, '') || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-extrabold text-sm uppercase tracking-wider h-[52px] rounded-full flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/15 transition-all cursor-pointer select-none"
        >
          <MessageCircle size={20} className="fill-white flex-shrink-0" />
          Chat on WhatsApp
        </a>

        {/* Admin actions if owned */}
        {isOwner && (
          <button 
            onClick={() => navigate('/shop-centre')}
            className="w-full h-11 bg-[#FF2D78] hover:bg-[#E02669] text-white font-bold text-xs uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF2D78]/10"
          >
            <Edit2 size={14} />
            Manage Shop (Admin Centre)
          </button>
        )}
      </div>

      {/* Tabs Navigation Segment */}
      <div className="flex gap-8 border-b border-neutral-800 px-6 mt-8">
        {[
          { label: 'Products', icon: <ShoppingBag size={15} /> },
          { label: 'About', icon: <Info size={15} /> },
          { label: 'Reviews', icon: <MessageSquare size={15} /> },
        ].map(tab => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label as any)}
            className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === tab.label ? 'text-[#FF2D78]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.label && (
              <motion.div layoutId="shopTabLine" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#FF2D78] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Main tab content section */}
      <div className="px-6 pt-6">
        {activeTab === 'Products' && (
          <div>
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4 bg-[#111] border border-neutral-800/80 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-900 border border-neutral-800 text-neutral-600">
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-300">No products uploaded</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-[240px]">This clothing brand hasn't registered catalog items yet.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {products.map(product => {
                  const stock = getStockStatus([product]);
                  const isSoldOut = stock === 'DORMANT' || product.status === 'out_of_stock' || product.total_stock <= 0;

                  return (
                    <div 
                      key={product.id} 
                      onClick={() => navigate(`/product/${product.id}`)}
                      className={`flex flex-col bg-[#111] border border-neutral-800/80 rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:border-neutral-700/80 relative ${isSoldOut ? 'opacity-50' : ''}`}
                    >
                      <div className="aspect-[4/5] relative bg-neutral-900 overflow-hidden">
                        {product.images?.[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-700">
                            <ShoppingBag size={32} />
                          </div>
                        )}
                        
                        <div className="absolute top-3 right-3 z-10 font-bold text-[9px] uppercase tracking-wide">
                          {isSoldOut ? (
                            <div className="bg-[#151515]/95 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded">Sold Out</div>
                          ) : (
                            <div className="bg-[#FF2D78] text-white px-2 py-0.5 rounded">Available</div>
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 flex flex-col justify-between flex-1 gap-1">
                        <h4 className="text-sm font-semibold tracking-tight text-neutral-100 group-hover:text-[#FF2D78] transition-colors truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-white">${product.price}</span>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                            {product.category || 'drip'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Reviews' && (
          <ReviewsTab 
            shopId={shop.id}
            shopName={shop.name}
            reviews={shopReviews}
            activeRating={averageRating}
            onWriteReview={() => setIsWriteReviewOpen(true)}
            onVote={(reviewId, vote) => voteReview(shop.id, reviewId, vote)}
            onReply={(reviewId, text) => addSellerResponse(shop.id, reviewId, text)}
          />
        )}

        {activeTab === 'About' && (
          <div className="flex flex-col gap-6 bg-[#111] border border-neutral-800 rounded-2xl p-6">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF2D78]">About the Brand</h3>
              <p className="text-sm leading-relaxed text-neutral-300">{shop.description || 'No business description provided yet.'}</p>
            </div>

            <hr className="border-neutral-800" />

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Business Details</h3>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-1">
                <div>
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider block">Location (Area)</span>
                  <span className="text-sm font-medium text-neutral-200 mt-0.5 block">{shop.location || shop.area || 'Bulawayo'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider block">Online Only?</span>
                  <span className="text-sm font-medium text-neutral-200 mt-0.5 block">{shop.online_only ? 'Yes, Digital Station' : 'No, Physical Station'}</span>
                </div>
                {shop.landmark && (
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider block">Landmark</span>
                    <span className="text-sm font-medium text-neutral-200 mt-0.5 block">{shop.landmark}</span>
                  </div>
                )}
                {shop.directions && (
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider block">Directions</span>
                    <span className="text-sm font-medium text-neutral-200 mt-0.5 block">{shop.directions}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider block">Trading times</span>
                  <span className="text-sm font-medium text-neutral-200 mt-0.5 block">{shop.trading_hours || 'Mon-Sat: 8am - 6pm'}</span>
                </div>
                {shop.delivery_info && (
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider block">Delivery protocol</span>
                    <span className="text-sm font-medium text-neutral-300 mt-1 block leading-relaxed">{shop.delivery_info}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Dialog Layer */}
      <AnimatePresence>
        {isWriteReviewOpen && (
          <WriteReviewSheet 
            shopName={shop.name}
            onClose={() => setIsWriteReviewOpen(false)}
            onSubmit={(rating, text) => {
              addReview(shop.id, {
                shopId: shop.id,
                userName: 'Human Client', 
                userHandle: '@guest',
                rating,
                text,
                isVerified: false
              });
              setIsWriteReviewOpen(false);
              toast.success('Validation protocol logged successfully ✓');
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

// --- Sub-components (Re-styled for modern dark UI) ---

const ReviewsTab: React.FC<{ 
  shopId: string;
  shopName: string;
  reviews: Review[]; 
  activeRating: string;
  onWriteReview: () => void;
  onVote: (reviewId: string, vote: 'helpful' | 'unhelpful') => void;
  onReply: (reviewId: string, text: string) => void;
}> = ({ shopId, shopName, reviews, activeRating, onWriteReview, onVote, onReply }) => {
  const [sortBy, setSortBy] = useState<'Recent' | 'Highest' | 'Lowest'>('Recent');

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (sortBy === 'Recent') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === 'Highest') return b.rating - a.rating;
      return a.rating - b.rating;
    });
  }, [reviews, sortBy]);

  const breakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Rating Card */}
      <div className="bg-[#111] border border-neutral-800 rounded-3xl p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2.5">
              <span className="text-5xl font-black italic tracking-tighter text-white">{activeRating}</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">VERIFIED RATING</span>
            </div>
            
            <div className="flex gap-1 mt-3">
              {[1, 2, 3, 4, 5].map(s => (
                <Star 
                  key={s} 
                  size={16} 
                  className={s <= Math.round(Number(activeRating)) ? 'fill-[#FF2D78] text-[#FF2D78]' : 'text-neutral-800'} 
                  strokeWidth={2.5}
                />
              ))}
            </div>
            
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mt-2.5">
              Active ledger entries: {reviews.length}
            </p>
          </div>

          <button 
            onClick={onWriteReview}
            className="px-5 h-11 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            LOG REVIEW
            <Send size={13} className="rotate-[-45deg]" />
          </button>
        </div>

        {/* Stars metrics breakdown bars */}
        <div className="flex flex-col gap-2">
          {breakdown.map(b => (
            <div key={b.star} className="flex items-center gap-4 group text-xs text-neutral-400">
              <span className="font-bold w-6 transition-colors group-hover:text-neutral-200">{b.star} ★</span>
              <div className="flex-1 h-3 rounded bg-neutral-950 border border-neutral-900 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${b.percentage}%` }}
                  className={`h-full border-r-2 border-neutral-900 transition-colors ${b.star >= 4 ? 'bg-[#FF2D78]' : 'bg-neutral-600'}`}
                />
              </div>
              <span className="font-semibold text-right text-[10px] w-12">{b.count} logs</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sorting panel */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
        {(['Recent', 'Highest', 'Lowest'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`px-4 h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
              sortBy === s 
                ? 'bg-[#FF2D78] border-[#FF2D78] text-white' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {s === 'Recent' && <Clock size={12} />}
            {s === 'Highest' && <ThumbsUp size={12} />}
            {s === 'Lowest' && <ThumbsDown size={12} />}
            {s}
          </button>
        ))}
      </div>

      {/* Review Cards list */}
      <div className="flex flex-col gap-4">
        {sortedReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4 bg-[#111] border border-neutral-800/80 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-900 border border-neutral-800 text-neutral-600">
              <MessageSquare size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-300">Archive empty</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-[240px]">Be the first client to provide a verifiably logged protocol.</p>
            </div>
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
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  return (
    <div className="bg-[#111] border border-neutral-800 p-5 rounded-3xl flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-neutral-800 bg-[#151515] overflow-hidden flex items-center justify-center">
             <Avatar 
               url={null} 
               size={40}
               className="w-full h-full object-cover"
               ring={false}
             />
          </div>
          <div className="flex flex-col">
            <h4 className="text-xs font-bold text-neutral-200">{review.userName || 'Client Protocol'}</h4>
            <span className="text-[10px] text-neutral-500 font-bold mt-0.5">{review.userHandle || '@guest'}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star 
                key={s} 
                size={11} 
                className={s <= review.rating ? 'fill-[#FF2D78] text-[#FF2D78]' : 'text-neutral-850'} 
                strokeWidth={2}
              />
            ))}
          </div>
          <span className="text-[9px] text-neutral-500 italic block font-mono">
            {formatDistanceToNow(parseISO(review.timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="pl-2 border-l-2 border-[#FF2D78]/40">
        <p className="text-xs text-neutral-300 leading-relaxed italic">
          "{review.text}"
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-neutral-850 pt-3 mt-1 text-xs">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onVote(review.id, 'helpful')}
            className={`flex items-center gap-1.5 transition-all text-[11px] font-medium hover:text-white ${review.userVote === 'helpful' ? 'text-emerald-400' : 'text-neutral-500'}`}
          >
            <ThumbsUp size={13} fill={review.userVote === 'helpful' ? 'currentColor' : 'none'} />
            {review.helpfulCount || 0}
          </button>
          <button 
            onClick={() => onVote(review.id, 'unhelpful')}
            className={`flex items-center gap-1.5 transition-all text-[11px] font-medium hover:text-white ${review.userVote === 'unhelpful' ? 'text-red-400' : 'text-neutral-500'}`}
          >
            <ThumbsDown size={13} fill={review.userVote === 'unhelpful' ? 'currentColor' : 'none'} />
            {review.unhelpfulCount || 0}
          </button>
        </div>
        
        <button 
          onClick={() => setIsReplying(!isReplying)}
          className={`px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wider ${isReplying ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'text-neutral-400 hover:text-white'}`}
        >
          {isReplying ? 'Aborted' : 'Reply'}
        </button>
      </div>

      {/* Official Business Response if any */}
      {review.sellerResponse && (
        <div className="mt-2 p-3.5 bg-neutral-950 border border-neutral-800/80 rounded-2xl flex flex-col gap-2 relative">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF2D78]">
            Brand response from: <span className="text-white">{shopName}</span>
          </span>
          <p className="text-xs text-neutral-400 leading-relaxed italic mt-0.5">
            "{review.sellerResponse.text}"
          </p>
        </div>
      )}

      {/* Inline Reply Dialog box if active */}
      <AnimatePresence>
        {isReplying && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-2">
              <textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Declare official brand response terminal..."
                className="w-full bg-[#0B0B0B] border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-[#FF2D78] transition-all resize-none h-24"
              />
              <button 
                onClick={() => {
                  onReply(review.id, replyText);
                  setReplyText('');
                  setIsReplying(false);
                }}
                disabled={!replyText.trim()}
                className="w-full h-9 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-bold text-xs uppercase tracking-wide rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5"
              >
                <Send size={12} />
                TRANSMIT REPLY
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
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const labels = ['', 'FATAL ERROR', 'POOR PROTOCOL', 'ACCEPTED', 'STRONG DRIFT', 'PEAK FIDELITY'];

  return (
    <>
      {/* Dimmed backdrop overlay */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] backdrop-blur-md bg-black/60"
        onClick={onClose}
      />
      <motion.div 
        initial={{ y: '100%', x: '-50%' }}
        animate={{ y: 0, x: '-50%' }}
        exit={{ y: '100%', x: '-50%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[201] rounded-t-[44px] border-x border-t border-neutral-800 bg-[#111] p-6 pb-12 flex flex-col gap-6 max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 rounded-full mx-auto bg-neutral-800" />
        
        <div className="flex justify-between items-start mt-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF2D78]">Client Ledger Entry</span>
            <h2 className="text-xl font-extrabold text-white leading-none">Log Validation</h2>
            <p className="text-[11px] text-neutral-400 mt-1">FOR BRAND: <span className="text-neutral-100 font-bold uppercase">{shopName}</span></p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white active:scale-90 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Rating input block */}
        <div className="flex flex-col items-center gap-5 bg-neutral-950 border border-neutral-850 p-6 rounded-2xl">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button 
                key={s} 
                onClick={() => setRating(s)}
                className="transition-all active:scale-90 cursor-pointer"
              >
                <Star 
                  size={32} 
                  className={s <= rating ? 'fill-[#FF2D78] text-[#FF2D78]' : 'text-neutral-800'} 
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
             <span className="text-[9px] font-extrabold text-neutral-500 uppercase tracking-widest">Selected Rating Rating Description</span>
             <span className="text-sm font-bold text-white uppercase tracking-wider">{labels[rating] || 'AWAITING SELECTION'}</span>
          </div>
        </div>

        {/* Text payload container */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block pl-1">Opinion transmission</label>
          <div className="relative">
             <textarea 
               value={text || ''}
               onChange={(e) => setText(e.target.value.slice(0, 300))}
               placeholder="Briefly state your direct customer satisfaction or brand observation protocols..."
               className="w-full bg-neutral-950 border border-neutral-850 rounded-2xl p-4 text-xs text-white placeholder-neutral-600 outline-none focus:border-[#FF2D78] focus:bg-neutral-950 transition-all resize-none h-32 leading-relaxed"
             />
             <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{text.length || 0} / 300</span>
             </div>
          </div>
        </div>

        {/* Action submit button */}
        <div className="flex flex-col gap-4 mt-2">
          <button 
            onClick={() => onSubmit(rating, text)}
            disabled={rating === 0 || !text.trim()}
            className="w-full h-12 bg-[#FF2D78] hover:bg-[#E02669] active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-full disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF2D78]/15 cursor-pointer mt-1"
          >
            TRANSMIT LEDGER RECORD
            <Check size={14} />
          </button>
        </div>
      </motion.div>
    </>
  );
};

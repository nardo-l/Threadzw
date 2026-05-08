import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Share2, 
  MapPin, 
  Clock, 
  Star, 
  X, 
  MessageCircle,
  Check,
  ChevronRight,
  Heart
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../App';
import { useInventory, Review } from '../context/InventoryContext';
import { isShopOpen } from '../lib/utils';

import { Avatar } from '../components/Avatar';

const IMAGE_PLACEHOLDERS = [
  'bg-gradient-to-br from-[#FF2D78] to-[#9B27AF]',
  'bg-[#1a1a1a]',
  'bg-[#2a1a2a]',
  'bg-[#111111]',
  'bg-[#1a1a2a]',
  'bg-[#0a0a0a]'
];

const DUMMY_SIZES = [
  { id: 'uk7', label: 'UK7', stock: 'in-stock' },
  { id: 'uk8', label: 'UK8', stock: 'in-stock' },
  { id: 'uk9', label: 'UK9', stock: 'low' },
  { id: 'uk10', label: 'UK10', stock: 'out' },
  { id: 'uk11', label: 'UK11', stock: 'in-stock' }
];

export const ProductDetail: React.FC = () => {
  const t = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const { 
    addRecentlyViewed, 
    products, 
    shops, 
    toggleLike, 
    toggleSave, 
    likedProductIds, 
    savedProductIds, 
    addToCart, 
    createOrder,
    increaseViewCount,
    increaseShopViewCount,
    reviews
  } = useInventory();
  
  const product = products.find(p => p.id === id);
  const shop = shops.find(s => s.id === product?.shop_id);
  const shopReviews = useMemo(() => (shop?.id ? reviews[shop.id] || [] : []), [shop?.id, reviews]);
  const averageRating = useMemo(() => {
    if (shopReviews.length === 0) return 5.0;
    const sum = shopReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / shopReviews.length).toFixed(1);
  }, [shopReviews]);
  const openStatus = { isOpen: true, text: 'Open' };

  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const isWishlisted = savedProductIds.includes(product?.id || '');
  const isLiked = likedProductIds.includes(product?.id || '');
  
  const [isLikeSheetOpen, setIsLikeSheetOpen] = useState(false);
  const [showToast, setShowToast] = useState<{ show: boolean, type: 'success' | 'removed' | 'error', message: string }>({
    show: false,
    type: 'success',
    message: ''
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (id) {
      addRecentlyViewed(id);
      increaseViewCount(id);
    }
  }, [id, increaseViewCount, addRecentlyViewed]);

  useEffect(() => {
    if (shop?.id) {
      increaseShopViewCount(shop.id);
    }
  }, [shop?.id, increaseShopViewCount]);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8" style={{ background: t.bg_primary }}>
        <h1 className="text-xl font-bold mb-4" style={{ color: t.text_primary }}>Product not found</h1>
        <button onClick={() => navigate(-1)} className="font-bold" style={{ color: t.accent }}>Go Back</button>
      </div>
    );
  }

  const triggerToast = (type: 'success' | 'removed' | 'error', message: string) => {
    setShowToast({ show: true, type, message });
    setTimeout(() => {
      setShowToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const onToggleWishlist = () => {
    toggleSave(product.id);
  };

  const handleAddToCart = () => {
    if (!selectedSizeId) {
      triggerToast('error', 'Select a size first');
      return;
    }
    
    addToCart({
      productId: product.id,
      shopId: product.shop_id,
      name: product.name,
      size: selectedSizeId,
      quantity: 1,
      price: product.price,
      imageEmoji: product.images?.[0] || '👟',
      shopName: shop?.name || 'Unknown Shop'
    });
    
    triggerToast('success', 'Added to enquiries');
    setIsLikeSheetOpen(false);
  };

  const handleLikeClick = () => {
    setIsLikeSheetOpen(true);
  };

  const handleWhatsApp = async () => {
    const size = product.sizes.find(s => s.size === selectedSizeId)?.size;
    
    // Record order in Supabase
    if (shop) {
      await createOrder(shop.id, [{
        productId: product.id,
        shopId: product.shop_id,
        name: product.name,
        size: size || 'Unknown',
        quantity: 1,
        price: product.price,
        imageEmoji: product.images?.[0] || '👟',
        shopName: shop.name
      }], product.price);
    }

    const baseMessage = `Hi! I saw your ${product.name} on Thread ZW and I'm interested.`;
    const message = size ? `${baseMessage} Is it still available in ${size}?` : baseMessage;
    const url = `https://wa.me/${shop?.whatsapp?.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImage < (product.images.length - 1)) {
        setCurrentImage(prev => prev + 1);
      } else if (diff < 0 && currentImage > 0) {
        setCurrentImage(prev => prev - 1);
      }
    }
    touchStartX.current = null;
  };

  return (
    <div className="flex flex-col min-h-screen relative font-sans" style={{ background: t.bg_primary }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast.show && (
          <motion.div 
            initial={{ y: -100, x: '-50%', opacity: 0 }}
            animate={{ y: 20, x: '-50%', opacity: 1 }}
            exit={{ y: -100, x: '-50%', opacity: 0 }}
            className={`fixed top-0 left-1/2 z-[100] px-6 py-2.5 rounded-full whitespace-nowrap shadow-2xl border text-sm font-medium`}
            style={{ 
              background: showToast.type === 'success' ? t.green : showToast.type === 'error' ? t.red : t.bg_secondary,
              color: 'white',
              borderColor: 'rgba(255,255,255,0.1)'
            }}
          >
            {showToast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="fixed top-[env(safe-area-inset-top,20px)] left-4 right-4 z-40 flex justify-between items-center pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full pointer-events-auto active:scale-95 transition-transform"
          style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }}
        >
          <ArrowLeft size={22} />
        </button>
        <button 
          className="w-9 h-9 flex items-center justify-center backdrop-blur-md rounded-full pointer-events-auto active:scale-95 transition-transform"
          style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }}
        >
          <Share2 size={18} />
        </button>
      </header>

      {/* Image Carousel */}
      <div 
        className="relative w-full h-[380px] overflow-hidden"
        style={{ background: t.bg_secondary }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentImage * 100}%)` }}
        >
          {product.images.length > 0 ? product.images.map((img, i) => (
            <div key={i} className="w-full h-full flex-shrink-0">
               <img src={img || undefined} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          )) : (
            <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
              <span className="text-8xl opacity-20">👟</span>
            </div>
          )}
        </div>

        {/* Counter Overlay */}
        {product.images.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm pointer-events-none">
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
              {currentImage + 1} / {product.images.length}
            </span>
          </div>
        )}

        {/* Dot Indicators */}
        {product.images.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-2 pointer-events-auto">
            {product.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentImage ? 'bg-white w-2 h-2' : 'bg-white/30 w-1.5 h-1.5'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info Section */}
      <div className="p-5 flex flex-col">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-xl font-bold leading-tight" style={{ color: t.text_primary }}>{product.name}</h1>
          <span className="text-[22px] font-bold" style={{ color: t.accent }}>${product.price}</span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          {/* Category Badge */}
          <div className="px-2.5 py-1 rounded-full border flex items-center" style={{ background: t.bg_secondary, borderColor: t.border_primary }}>
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.text_secondary }}>{product.category}</span>
          </div>

          {/* Condition Badge */}
          <div className="px-2.5 py-1 rounded-full border flex items-center" style={{ background: t.green_bg, borderColor: t.green }}>
            <span className="text-[11px] font-bold" style={{ color: t.green }}>Verified</span>
          </div>

          {/* Stock Badge */}
          <div className="px-2.5 py-1 rounded-full border flex items-center gap-1.5" style={{ background: product.total_stock > 0 ? t.green_bg : t.red_bg, borderColor: product.total_stock > 0 ? t.green : t.red }}>
            <div className={`w-1.5 h-1.5 rounded-full ${product.total_stock > 0 ? '' : 'bg-red-500'}`} style={{ background: product.total_stock > 0 ? t.green : t.red }} />
            <span className={`text-[11px] font-medium`} style={{ color: product.total_stock > 0 ? t.green : t.red }}>
              {product.total_stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>

        {/* Sizes Section */}
        {product.sizes.length > 0 && (
          <div className="mt-8">
            <p className="text-sm font-bold mb-3" style={{ color: t.text_primary }}>Sizes Available</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map(size => {
                const isOut = size.quantity === 0;
                const isLow = size.quantity > 0 && size.quantity < 3;
                const isSelected = selectedSizeId === size.size;

                return (
                  <button
                    key={size.size}
                    disabled={isOut}
                    onClick={() => setSelectedSizeId(size.size)}
                    className={`
                      px-4 py-2 rounded-full font-bold text-[13px] border transition-all
                    `}
                    style={{
                      background: isSelected ? t.accent : isOut ? t.bg_secondary : t.bg_card,
                      color: isSelected ? 'white' : isOut ? t.text_tertiary : t.text_primary,
                      borderColor: isSelected ? t.accent : isOut ? t.border_secondary : t.border_primary,
                      textDecoration: isOut ? 'line-through' : 'none',
                      opacity: isOut ? 0.5 : 1,
                      boxShadow: isSelected ? t.shadow : 'none'
                    }}
                  >
                    {size.size}
                    {isLow && !isSelected && <span className="ml-1 text-[10px] font-mono" style={{ color: t.amber }}>!</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="h-px w-full my-6" style={{ background: t.border_secondary }} />

        {/* Shop Row */}
        {shop && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar 
                    url={shop.avatar_url || shop.logo_url} 
                    size={44}
                    className="border"
                    style={{ borderColor: t.border_secondary }}
                  />
                  {shop.is_verified && (
                    <div 
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{ background: t.accent, borderColor: t.bg_primary }}
                    >
                      <Check size={8} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold" style={{ color: t.text_primary }}>{shop.name}</span>
                    {shop.is_verified && (
                      <div className="bg-blue-500 rounded-full p-0.5 shrink-0">
                        <Check size={8} className="text-white stroke-[4]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[12px]" style={{ color: t.text_tertiary }}>{shop.category}</span>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/shop/${shop.id}`)}
                className="px-3.5 py-2 rounded-full border text-[12px] font-bold transition-colors"
                style={{ borderColor: t.accent, color: t.accent }}
              >
                Visit Shop
              </button>
            </div>
            <div className="h-px w-full my-6" style={{ background: t.border_secondary }} />
          </>
        )}

        {/* Description Section */}
        <div>
          <h2 className="text-sm font-bold mb-2.5" style={{ color: t.text_primary }}>About This Product</h2>
          <p className="text-sm leading-[1.6]" style={{ color: t.text_secondary }}>
            {product.description || 'No description provided for this drip.'}
          </p>
        </div>

        <div className="h-px w-full my-6" style={{ background: t.border_secondary }} />

        {/* Find The Shop Section */}
        {shop && (
          <div>
            <h2 className="text-sm font-bold mb-3" style={{ color: t.text_primary }}>Find The Shop</h2>
            <div 
              className="border rounded-[12px] p-4 flex flex-col gap-3"
              style={{ background: t.bg_card, borderColor: t.border_primary }}
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} style={{ color: t.accent }} />
                <span className="text-[13px] font-bold" style={{ color: t.text_primary }}>{shop.location || shop.area}</span>
              </div>
              <p className="text-[13px] leading-[1.6]" style={{ color: t.text_secondary }}>
                {shop.landmark || 'No landmark provided'} {shop.directions ? `• ${shop.directions}` : ''}
              </p>
              <div className="flex items-center gap-2">
                <Clock size={16} style={{ color: t.accent }} />
                <div className="flex flex-col">
                  <span className="text-[12px]" style={{ color: t.text_tertiary }}>{shop.trading_hours || 'Mon–Sat: 8am – 6pm'}</span>
                  <span className={`text-[11px] font-bold mt-0.5`} style={{ color: openStatus.isOpen ? t.green : t.amber }}>
                     {openStatus.text}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-px w-full my-6" style={{ background: t.border_secondary }} />
          </div>
        )}

        {/* Reviews Section */}
        <div className="flex flex-col pb-[200px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold" style={{ color: t.text_primary }}>Reviews</h2>
            <div className="flex items-center gap-1.5">
              <Star size={14} className="fill-current" style={{ color: t.accent }} />
              <span className="text-[14px] font-bold" style={{ color: t.text_primary }}>{averageRating}</span>
              <span className="text-[12px]" style={{ color: t.text_tertiary }}>( {shopReviews.length} )</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {shopReviews.length > 0 ? shopReviews.slice(0, 3).map(item => (
              <div 
                key={item.id} 
                className="rounded-[12px] p-3.5 border"
                style={{ background: t.bg_card, borderColor: t.border_secondary }}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar 
                      url={null} 
                      size={32}
                      className="border"
                      style={{ borderColor: t.border_secondary }}
                    />
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold" style={{ color: t.text_primary }}>{item.userName}</span>
                      <span className="text-[10px]" style={{ color: t.text_tertiary }}>@{item.userHandle}</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={10} 
                        className={i < item.rating ? "fill-current" : ""} 
                        style={{ color: i < item.rating ? t.accent : t.border_secondary }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[13px] leading-normal" style={{ color: t.text_secondary }}>{item.text}</p>
                <span className="text-[11px] mt-2 block" style={{ color: t.text_tertiary }}>{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
            )) : (
              <div 
                className="rounded-[12px] p-8 border text-center"
                style={{ background: t.bg_card, borderColor: t.border_secondary }}
              >
                <p className="text-sm" style={{ color: t.text_tertiary }}>No reviews yet for this shop.</p>
              </div>
            )}
          </div>

          {shopReviews.length > 3 && (
            <button className="text-[13px] font-bold mt-4 self-center active:underline" style={{ color: t.accent }}>
              See All Reviews
            </button>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 border-t px-5 pt-4 pb-[env(safe-area-inset-bottom,32px)] lg:max-w-none mx-auto"
        style={{ 
          background: t.bg_primary, 
          borderColor: t.border_primary,
          boxShadow: t.shadow 
        }}
      >
        <div className="flex gap-3 max-w-[800px] mx-auto">
          <button 
            onClick={handleLikeClick}
            className="flex-1 h-[56px] rounded-full text-white font-bold text-[16px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{ 
              background: `linear-gradient(135deg, ${t.accent}, ${t.accent_dark})`,
              boxShadow: t.shadow
            }}
          >
            I Like It
          </button>
          <button 
            onClick={onToggleWishlist}
            className={`w-[56px] h-[56px] rounded-full border-2 font-bold text-[15px] flex items-center justify-center transition-all`}
            style={{ 
              borderColor: t.accent,
              background: isWishlisted ? `${t.accent}26` : 'transparent',
              color: t.accent
            }}
          >
            <Heart size={20} className={isWishlisted ? 'fill-current' : ''} />
          </button>
          <button 
            onClick={handleWhatsApp}
            className="w-[56px] h-[56px] rounded-full text-white flex items-center justify-center active:scale-[0.98] transition-all"
            style={{ background: '#25D366' }}
          >
            <MessageCircle size={22} fill="white" />
          </button>
        </div>
      </div>

      {/* I Like It Bottom Sheet */}
      <AnimatePresence>
        {isLikeSheetOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLikeSheetOpen(false)}
              className="fixed inset-0 z-[60]"
              style={{ background: t.overlay }}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[20px] pb-10 lg:max-w-[500px] mx-auto max-h-[85vh] overflow-y-auto no-scrollbar border-t shadow-2xl"
              style={{ background: t.bg_primary, borderColor: t.border_primary }}
            >
              <div className="p-6">
                {/* Drag Handle */}
                <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: t.border_subtle }} />

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-[64px] h-[64px] rounded-[12px] overflow-hidden border" style={{ background: t.bg_secondary, borderColor: t.border_secondary }}>
                       {product.images[0] ? <img src={product.images[0] || undefined} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full" style={{ background: t.accent }} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-[17px] font-bold truncate leading-tight" style={{ color: t.text_primary }}>{product.name}</h3>
                      <p className="text-[17px] font-bold mt-0.5" style={{ color: t.accent }}>${product.price}</p>
                      <span className="text-[12px] font-medium mt-1" style={{ color: t.text_tertiary }}>Shop: {shop?.name}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsLikeSheetOpen(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-full shrink-0"
                    style={{ background: t.bg_secondary, color: t.text_tertiary }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Visit Section */}
                  <div className="border rounded-[20px] p-5" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[14px] font-black uppercase tracking-widest" style={{ color: t.text_primary }}>Visit Shop in Person</h3>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full`} style={{ background: openStatus.isOpen ? t.green : t.amber }} />
                        <span className={`text-[11px] font-bold uppercase tracking-wider`} style={{ color: openStatus.isOpen ? t.green : t.amber }}>
                          {openStatus.isOpen ? 'Open Now' : 'Closed'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="shrink-0 mt-0.5" style={{ color: t.accent }} />
                        <div>
                          <p className="text-[15px] font-bold leading-tight" style={{ color: t.text_primary }}>{shop?.location || shop?.area}</p>
                          <p className="text-[13px] mt-1" style={{ color: t.text_secondary }}>{shop?.landmark}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Clock size={16} className="shrink-0 mt-0.5" style={{ color: t.text_tertiary }} />
                        <p className="text-[13px]" style={{ color: t.text_secondary }}>{shop?.trading_hours || 'Mon–Sat: 8am – 6pm'}</p>
                      </div>

                      {shop?.directions && (
                        <div className="pt-3 border-t" style={{ borderColor: t.border_secondary }}>
                           <p className="text-[12px] italic leading-relaxed" style={{ color: t.text_tertiary }}>"{shop?.directions}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp Section */}
                  <div className="border rounded-[20px] p-5" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
                    <h3 className="text-[14px] font-black uppercase tracking-widest mb-4" style={{ color: t.text_primary }}>Direct Contact</h3>
                    <button 
                      onClick={handleWhatsApp}
                      className="w-full h-[60px] bg-[#25D366] rounded-full text-white font-black text-[15px] flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-[0_10px_20px_-10px_rgba(37,211,102,0.4)]"
                    >
                      <MessageCircle size={22} fill="white" />
                      Chat on WhatsApp
                    </button>
                    <p className="text-[11px] text-center mt-3 font-medium" style={{ color: t.text_tertiary }}>
                      {selectedSizeId ? `Enquiring for Size ${selectedSizeId}` : 'Size not selected yet'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 px-4 text-center">
                  <p className="text-[12px] font-medium leading-relaxed" style={{ color: t.text_tertiary }}>
                    Thread ZW connects you directly to sellers.<br />We don't take payments.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

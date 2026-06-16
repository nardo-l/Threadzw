import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Share2, MessageCircle, 
  Check, Zap, Package, ShoppingBag,
  ChevronRight, Shield, Sparkles, Star, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { resolveImageUrl, ShopLogo } from '../components/ui/ShopImage';
import { getShopUrl } from '../utils/shopUrl';

interface SizeVariant {
  size: string;
  quantity: number;
}

interface Shop {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  whatsapp: string | null;
  description: string | null;
}

interface Product {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  description: string | null;
  category: string;
  images: string[];
  sizes: SizeVariant[];
  total_stock: number;
  is_published: boolean;
  is_featured: boolean;
  status: string;
  collection: string | null;
  created_at: string;
  shops: Shop;
}

export const ProductDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Swipe gesture variables
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*, shops(*)')
          .eq('id', id)
          .single();
        
        if (error || !data) {
          return;
        }
        
        setProduct(data);
        setShop(data.shops);

        if (data.sizes && Array.isArray(data.sizes) && data.sizes.length === 1) {
          setSelectedSize(data.sizes[0].size);
        }
        
        // Increment view (fire and forget, safety catch)
        try {
          await supabase.rpc('increment_product_view_count', { product_id: id });
        } catch (rpcErr) {
          console.warn("View counter increment error:", rpcErr);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    toast.success('link copied to clipboard! share with friends.');
  };

  const handleWhatsApp = () => {
    if (!product || !shop) return;
    if (!selectedSize && product.sizes?.length > 0) {
      toast.error('please select a size first');
      return;
    }
    const cleanPhone = (shop.whatsapp || '').replace(/[^0-9]/g, '') || '263';
    const message = `hi! I saw your ${product.name} on threadzw and I'm interested. ${selectedSize ? `Is it available in size ${selectedSize}?` : ''}`;
    const url = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Swiping functions for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !product?.images) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentImage < product.images.length - 1) {
      setCurrentImage(prev => prev + 1);
    } else if (isRightSwipe && currentImage > 0) {
      setCurrentImage(prev => prev - 1);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-6 gap-3">
        <div className="w-10 h-10 border-3 border-[#f72585] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-widest text-[#f72585] uppercase animate-pulse">loading artifact...</span>
      </div>
    );
  }

  if (!product || !shop) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-white/[0.04] rounded-full flex items-center justify-center text-zinc-500 mb-6 border border-white/10">
          <AlertCircle size={28} />
        </div>
        <h1 className="text-xl font-bold tracking-tight uppercase">item not found</h1>
        <p className="text-zinc-500 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
          this catalog entry has been archived or removed from the storefront.
        </p>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-6 px-6 py-3 bg-white/[0.04] border border-white/15 hover:border-white/30 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all"
        >
          back to shop page
        </button>
      </div>
    );
  }

  const isSoldOut = product.total_stock === 0 || product.status === 'sold_out';
  const hasMultipleImages = product.images && product.images.length > 1;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pb-36 font-sans relative overflow-x-hidden selection:bg-[#f72585]/20 select-none">
      
      {/* Dynamic atmospheric ambient glow pulled from active product image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute top-[-5%] left-[-10%] w-[120%] h-[40%] opacity-20 blur-[130px] scale-125 transition-all duration-1000 ease-out"
          style={{
            backgroundImage: `url(${product.images?.[currentImage] || 'https://via.placeholder.com/600x800'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute top-[35%] inset-x-0 bottom-0 bg-gradient-to-b from-transparent via-[#0d0d0d]/90 to-[#0d0d0d]" />
      </div>

      {/* FLOATING ACTION BAR CONTROLS (Floating headers that do not disrupt image viewing context) */}
      <header className="fixed top-0 left-0 right-0 h-20 z-50 flex justify-between items-center px-6 pointer-events-none">
        <button 
          onClick={() => navigate(-1)} 
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto active:scale-90 hover:bg-black/60 transition-all cursor-pointer"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <button 
          onClick={handleShare}
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto active:scale-90 hover:bg-black/60 transition-all cursor-pointer"
        >
          <Share2 size={16} strokeWidth={2.5} />
        </button>
      </header>

      {/* PRODUCT CONTENT WORKSPACE */}
      <div className="max-w-md mx-auto relative z-10">
        
        {/* 1. EDGE-TO-EDGE SWIPEABLE IMAGE BLOCKS */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-[70vh] bg-[#121215] overflow-hidden rounded-b-[28px] focus:outline-none"
        >
          <AnimatePresence mode="wait">
            {(() => {
              const imageUrl = resolveImageUrl(product.images?.[currentImage]);
              const getSafeBusterValue = (updatedAt: any): string => {
                if (!updatedAt) return '1';
                const dateObj = new Date(updatedAt);
                const time = dateObj.getTime();
                return isNaN(time) ? '1' : String(time);
              };
              const srcWithBust = (imageUrl && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:') && !imageUrl.includes('unsplash.com'))
                ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${getSafeBusterValue((product as any)?.updated_at || (product as any)?.created_at)}`
                : imageUrl || 'https://via.placeholder.com/600x800';

              return (
                <motion.img 
                  key={currentImage}
                  src={srcWithBust} 
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                />
              );
            })()}
          </AnimatePresence>

          {/* Sold out overlay tag */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
              <span className="border border-red-500 text-red-500 rounded font-mono font-extrabold text-[11px] tracking-[0.2em] uppercase px-4 py-1.5 rotate-[-5deg] shadow-lg">
                sold out
              </span>
            </div>
          )}

          {/* Indicators on image dots */}
          {hasMultipleImages && (
            <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2 z-20">
              {product.images.map((_, i) => (
                <button 
                  key={`indicator-${i}`} 
                  onClick={() => setCurrentImage(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === currentImage ? 'w-7 bg-[#f72585]' : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`} 
                />
              ))}
            </div>
          )}

          {/* Tiny navigational swipe tip */}
          {hasMultipleImages && (
            <div className="absolute right-4 bottom-5 text-[8.5px] font-mono uppercase tracking-widest text-white/40 pointer-events-none select-none">
              Swipe
            </div>
          )}
        </div>

        {/* 2. SPECIFICATION COPY & INFO PANELS */}
        <div className="px-6 pt-8 space-y-8">
          
          {/* Tags layer & brand logo link */}
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-5">
            <div className="flex flex-wrap gap-2">
              {product.is_featured && (
                <span className="bg-[#f72585]/10 text-[#f72585] border border-[#f72585]/20 text-[9px] font-mono font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
                  best seller
                </span>
              )}
              {isSoldOut ? (
                <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-mono font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
                  out of stock
                </span>
              ) : (
                <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-mono font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
                  ready to ship
                </span>
              )}
              {product.collection && (
                <span className="bg-white/5 text-zinc-400 border border-white/10 text-[9px] font-mono font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full truncate max-w-[120px]">
                  {product.collection.toLowerCase()}
                </span>
              )}
            </div>

            {/* View store brand */}
            <div 
              onClick={() => {
                const activeSlug = (shop as any).slug || shop.handle;
                const path = getShopUrl(activeSlug);
                console.log("[PRODUCT DETAIL ROUTING] Brand line click: navigating to store path:", path);
                if (path) {
                  navigate(path);
                } else {
                  console.warn("[PRODUCT DETAIL ROUTING] Broken link prevented: slug/handle missing on", shop);
                  toast.error("Unable to load store storefront!");
                }
              }} 
              className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-white cursor-pointer select-none"
            >
              <span className="lowercase font-bold">@{shop.handle}</span>
              <ChevronRight size={10} className="text-zinc-600" />
            </div>
          </div>

          {/* Product Editorial Titles */}
          <div className="space-y-3.5">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-white italic font-sans antialiased">
              {product.name}
            </h1>
            
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold text-[#f72585] tracking-tight">
                ${product.price}
              </span>
              <span className="text-[10px] font-mono font-extrabold tracking-widest text-zinc-600 uppercase">
                USD Local Delivery
              </span>
            </div>
          </div>

          {/* Visual Archetype selector: Sizes with pink outlines */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-0.5">
                <h3 className="text-zinc-400 text-[10px] font-bold tracking-[0.25em] uppercase font-mono">
                  select size archetype
                </h3>
                {selectedSize && (
                  <span className="text-[#f72585] text-[10px] font-bold font-mono tracking-wide uppercase">
                    size {selectedSize} chosen
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-2.5">
                {product.sizes.map((s) => {
                  const isSelected = selectedSize === s.size;
                  const isOut = s.quantity === 0 || isSoldOut;
                  return (
                    <button 
                      key={s.size}
                      disabled={isOut}
                      onClick={() => setSelectedSize(s.size)}
                      className={`h-14 rounded-2xl border flex flex-col items-center justify-center font-bold font-mono text-[14px] uppercase select-none cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-[#f72585] border-[#f72585] text-white shadow-[0_4px_20px_rgba(247,37,133,0.3)] scale-[1.02]' 
                          : isOut 
                            ? 'bg-white/[0.01] border-white/5 text-zinc-700 cursor-not-allowed line-through' 
                            : 'bg-white/[0.03] border-white/10 text-zinc-200 hover:border-white/30'
                      }`}
                    >
                      <span>{s.size}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manifesto product note */}
          <div className="space-y-3">
            <h3 className="text-zinc-500 text-[10px] font-bold tracking-[0.25em] uppercase font-mono">
              specifications & details
            </h3>
            <p className="text-sm font-medium text-zinc-400 leading-relaxed font-sans mt-2 whitespace-pre-line">
              {product.description || 'a unique apparel piece curated specifically for high-end streetwear. crafted with meticulous attention to tailoring, visual silhouette, and durable local production protocols.'}
            </p>
          </div>

          {/* Micro structural verification nodes */}
          <div className="grid grid-cols-2 gap-3.5 pt-4">
            <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-[20px] flex gap-3 items-start select-none">
              <Shield size={16} className="text-[#f72585] shrink-0 mt-0.5" />
              <div>
                <h5 className="text-[10px] font-bold font-mono uppercase tracking-wide text-zinc-200">authentic node</h5>
                <p className="text-[9px] text-zinc-500 leading-normal mt-0.5">verified local brand drop on threadzw registry.</p>
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-[20px] flex gap-3 items-start select-none">
              <Package size={16} className="text-[#f72585] shrink-0 mt-0.5" />
              <div>
                <h5 className="text-[10px] font-bold font-mono uppercase tracking-wide text-zinc-200">delivery speed</h5>
                <p className="text-[9px] text-zinc-500 leading-normal mt-0.5">instant response and secure courier arrangement.</p>
              </div>
            </div>
          </div>

          {/* Brand profile link block card */}
          <div 
            onClick={() => {
              const activeSlug = (shop as any).slug || shop.handle;
              const path = getShopUrl(activeSlug);
              console.log("[PRODUCT DETAIL ROUTING] Brand card click: navigating to store path:", path);
              if (path) {
                navigate(path);
              } else {
                console.warn("[PRODUCT DETAIL ROUTING] Broken link prevented: slug/handle missing on", shop);
                toast.error("Unable to load store storefront!");
              }
            }}
            className="p-5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-[28px] flex items-center justify-between group cursor-pointer transition-all duration-300"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0d0d0d] border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-bold text-[#C6FF00]">
                <ShopLogo 
                  shop={shop}
                  name={shop.name}
                  url={shop.avatar_url}
                  size={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white mb-0.5">{shop.name}</h4>
                <p className="text-zinc-500 text-[10.5px] font-mono leading-none lowercase">@{shop.handle}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-zinc-600 group-hover:translate-x-1 group-hover:text-white transition-all" />
          </div>

        </div>
      </div>

      {/* PERSISTENT BUY BAR - Full width Neon Green WhatsApp CTA */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-t border-white/5 px-6 py-4 pb-safe max-w-lg mx-auto">
        <button 
          onClick={handleWhatsApp}
          disabled={isSoldOut}
          className={`w-full h-14 bg-[#C6FF00] hover:bg-[#b5e600] text-black rounded-2xl flex items-center justify-center gap-2.5 font-bold uppercase text-[13px] tracking-widest transition-transform active:scale-[0.98] cursor-pointer shadow-[0_12px_40px_rgba(198,255,0,0.25)] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none disabled:cursor-not-allowed`}
        >
          <span>{isSoldOut ? 'sold out' : 'order on whatsapp'}</span>
          <MessageCircle size={15} className="fill-black" />
        </button>
      </footer>

    </div>
  );
};

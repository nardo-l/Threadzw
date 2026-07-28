// src/components/storefront/StorefrontProductDetail.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, MessageCircle, ArrowLeft, ZoomIn, ZoomOut, Heart, HelpCircle, X, Compass, Truck, Map, MapPin, Star, Camera, Image, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { ProductImage, ShopLogo } from '../ui/ShopImage';
import { parseShopConfig } from '../../utils/configHelper';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { trackPurchaseIntent, createMerchantNotification, trackWhatsAppClick, trackProductView, trackMapOpen } from '../../lib/analytics';

// Helper to safely insert orders even if some columns don't exist on remote table yet
async function safeInsertOrder(orderPayload: any) {
  let payload = { ...orderPayload };
  const maxRetries = 10;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.from('orders').insert([payload]).select();
      if (!error) {
        return { data, error: null };
      }
      
      const errMsg = error.message || '';
      const match = errMsg.match(/column "([^"]+)" of relation "orders" does not exist/) || 
                    errMsg.match(/column "([^"]+)" does not exist/);
      if (match && match[1]) {
        const missingCol = match[1];
        console.warn(`Column '${missingCol}' does not exist on 'orders' table. Stripping and retrying.`);
        delete payload[missingCol];
      } else {
        console.error("Database insert error:", error);
        return { data: null, error };
      }
    } catch (err: any) {
      console.error("Exception during insert:", err);
      return { data: null, error: err };
    }
  }
  return { data: null, error: new Error("Too many retries stripping columns") };
}



interface StorefrontProductDetailProps {
  product: any;
  shop: any;
  allProducts: any[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: any, size: string, color: string) => void;
  onNavigateToPage: (page: any, params?: any) => void;
  onBack: () => void;
}

export const StorefrontProductDetail: React.FC<StorefrontProductDetailProps> = ({
  product,
  shop,
  allProducts,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onNavigateToPage,
  onBack
}) => {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [zoomMode, setZoomMode] = useState(false);
  const [showBuySheet, setShowBuySheet] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomStartDist, setZoomStartDist] = useState(0);

  const shopConfig = useMemo(() => {
    if (!shop?.description) return {};
    const { config } = parseShopConfig(shop.description);
    return config;
  }, [shop?.description]);

  const handleZoomTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setZoomStartDist(dist);
    }
  };

  const handleZoomTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && zoomStartDist > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / zoomStartDist;
      setZoomScale(Math.min(Math.max(1, factor), 3));
    }
  };

  const handleZoomTouchEnd = () => {
    setZoomStartDist(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeImgIdx < images.length - 1) {
      setActiveImgIdx(prev => prev + 1);
    }
    if (isRightSwipe && activeImgIdx > 0) {
      setActiveImgIdx(prev => prev - 1);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Parse images
  const images = useMemo(() => {
    if (Array.isArray(product?.images)) return product.images;
    if (product?.images) return [product.images];
    return [];
  }, [product]);

  // Parse sizes
  const sizesList = useMemo<string[]>(() => {
    if (!product?.sizes) return ['S', 'M', 'L', 'XL'];
    if (Array.isArray(product.sizes)) {
      const parsed = product.sizes.map((s: any) => typeof s === 'string' ? s : s?.size || s?.size_label || s).filter(Boolean);
      return Array.from(new Set(parsed)) as string[];
    }
    return ['S', 'M', 'L', 'XL'];
  }, [product]);

  // Parse colors
  const coloursList = useMemo<string[]>(() => {
    const list = product?.colours || product?.colors;
    if (Array.isArray(list)) {
      return list.map((c: any) => typeof c === 'string' ? c.trim() : '').filter(Boolean);
    }
    return [];
  }, [product]);

  const isSoldOut = useMemo(() => {
    return product?.status === 'sold_out' || product?.total_stock <= 0;
  }, [product]);

  // Check size inventory availability
  const isSizeOutOfStock = (sz: string) => {
    if (isSoldOut) return true;
    if (Array.isArray(product?.sizes)) {
      const sizeObj = product.sizes.find((s: any) => {
        const repr = typeof s === 'string' ? s : s?.size || s?.size_label;
        return repr === sz;
      });
      if (sizeObj && typeof sizeObj === 'object') {
        return (sizeObj.quantity ?? 0) <= 0;
      }
    }
    return false;
  };

  // Set default selection
  useEffect(() => {
    if (sizesList.length > 0) {
      const firstInStock = sizesList.find(sz => !isSizeOutOfStock(sz));
      setSelectedSize(firstInStock || sizesList[0]);
    }
    if (coloursList.length > 0) {
      setSelectedColor(coloursList[0]);
    } else {
      setSelectedColor('');
    }
    setActiveImgIdx(0);
  }, [product, sizesList, coloursList]);

  // Track product_view on mount or product change
  useEffect(() => {
    if (shop?.id && product?.id) {
      trackProductView(shop.id, product.id, product.name);
    }
  }, [shop?.id, product?.id, product?.name]);

  // Related products
  const relatedProducts = useMemo(() => {
    return allProducts
      .filter((p: any) => p.id !== product.id && (p.category === product.category || p.category_id === product.category_id))
      .slice(0, 4);
  }, [allProducts, product]);

  const isFavorited = wishlist.includes(product.id);

  // WhatsApp helper
  const handleWhatsAppSeller = async () => {
    const customerId = localStorage.getItem('boutique_customer_id') || 'cust_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('boutique_customer_id', customerId);

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const prefix = shop.name ? shop.name.substring(0, 3).toUpperCase() : 'TZW';
    const orderRef = `#${prefix}-${randomId}`;

    // Log professional purchase intent event and notify
    await trackPurchaseIntent(
      shop.id, 
      product.id, 
      product.name, 
      product.price, 
      'whatsapp',
      selectedSize || 'M',
      selectedColor || 'Black'
    );

    await trackWhatsAppClick(shop.id, product.id, product.name);
    
    await createMerchantNotification(
      shop.owner_id,
      "new_whatsapp_intent",
      "New WhatsApp Buyer Intent! 💬",
      `Someone showed interest in "${product.name}" ($${product.price}) and clicked Order on WhatsApp. Check your buyer intents log.`,
      { order_reference: orderRef, product_id: product.id, total_price: product.price }
    );

    const whatsappNum = shop.whatsapp_number || shop.whatsapp || shop.phone || '+263771234567';
    let clean = whatsappNum.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '263' + clean.substring(1);
    } else if (clean.length === 9 && (clean.startsWith('77') || clean.startsWith('71') || clean.startsWith('73') || clean.startsWith('78'))) {
      clean = '263' + clean;
    }
    const textMsg = `Hi *${shop.name}*, I want to order *${product.name}* (Size: ${selectedSize || 'M'}, Qty: 1) for $${product.price} USD.\n\nMy session ID is ${customerId}. Reference: ${orderRef}.`;
    const whatsappUrl = `https://wa.me/${clean}?text=${encodeURIComponent(textMsg)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Add To Cart handler
  const handleAddToCart = () => {
    if (isSoldOut) return;
    onAddToCart(product, selectedSize, selectedColor);
  };

  // Buy Now handler
  const handleBuyNow = async () => {
    if (isSoldOut) return;
    setShowBuySheet(true);

    if (shop?.id) {
      await trackMapOpen(shop.id);
    }

    const customerId = localStorage.getItem('boutique_customer_id') || 'cust_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('boutique_customer_id', customerId);

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const prefix = shop.name ? shop.name.substring(0, 3).toUpperCase() : 'TZW';
    const orderRef = `#${prefix}-${randomId}`;

    // Log professional purchase intent event and notify
    await trackPurchaseIntent(
      shop.id, 
      product.id, 
      product.name, 
      product.price, 
      'buy_now',
      selectedSize || 'M',
      selectedColor || 'Black'
    );
    
    await createMerchantNotification(
      shop.owner_id,
      "new_purchase_intent",
      "New Boutique Visit Interest! 🏪",
      `Someone pressed Buy Now for "${product.name}" ($${product.price}) and opened your shop directions. They are planning a visit!`,
      { order_reference: orderRef, product_id: product.id, total_price: product.price }
    );
  };

  return (
    <div className="space-y-6 px-5 pb-44 select-none text-left bg-white min-h-screen pt-4 font-sans">
      {/* Back Header Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 bg-zinc-50 border border-zinc-150 rounded-full hover:bg-zinc-100 text-zinc-600 flex items-center justify-center cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 font-sans">Product Details</span>
        <button
          onClick={() => onToggleWishlist(product.id)}
          className="p-2 bg-zinc-50 border border-zinc-150 rounded-full hover:bg-zinc-100 text-zinc-600 flex items-center justify-center cursor-pointer transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`} />
        </button>
      </div>

      {/* ----------------- 1. IMAGE GALLERY ----------------- */}
      <div className="space-y-3 relative">
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setZoomMode(true)}
          className="h-[60vh] md:h-[65vh] w-full relative overflow-hidden rounded-3xl bg-zinc-50 border border-zinc-150 shadow-sm cursor-pointer group"
        >
          <ProductImage product={product} shop={shop} index={activeImgIdx} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102" />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs text-zinc-700 p-2 rounded-full shadow-md border border-zinc-100 opacity-80 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4" />
          </div>

          {/* Floating numeric page indicator */}
          {images.length > 1 && (
            <div className="absolute top-4 right-14 bg-black/60 backdrop-blur-md text-white text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-full shadow-sm border border-white/10 select-none">
              {activeImgIdx + 1} / {images.length}
            </div>
          )}

          {product.original_price && product.original_price > product.price && (
            <span className="absolute top-4 left-4 bg-green-600 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
              Sale -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
            </span>
          )}

          {isSoldOut && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-3xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 border border-red-200 px-3 py-1.5 bg-white/95 rounded-xl shadow-xs">
                SOLD OUT
              </span>
            </div>
          )}

          {/* Floated Image Indicator Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-xs rounded-full">
              {images.map((_: any, idx: number) => (
                <button
                  key={`gallery-dot-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIdx(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    activeImgIdx === idx ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ----------------- 2. METADATA ----------------- */}
      <div className="space-y-1.5 text-left">
        <span className="text-[10px] uppercase tracking-wider text-green-600 font-bold block font-sans">
          {product.category || 'Curated releases'}
        </span>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 leading-tight font-sans">
          {product.name}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-zinc-900 font-sans">${product.price} USD</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-sm text-zinc-400 line-through font-sans">${product.original_price}</span>
          )}
        </div>

        {/* Stock Status Indicator */}
        <div className="pt-1">
          {isSoldOut ? (
            <span className="text-[9px] font-bold uppercase tracking-wider font-sans text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
              ● Out of Stock
            </span>
          ) : (
            <span className="text-[9px] font-bold uppercase tracking-wider font-sans text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
              ● In Stock & Ready to Ship
            </span>
          )}
        </div>
      </div>

      {/* ----------------- 3. CUSTOM SIZE SELECTOR ----------------- */}
      {sizesList.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block font-sans">Select Size</span>
            <button 
              onClick={() => toast.info("Sizing runs true-to-size. Oversized garments are labeled.")}
              className="text-[10px] uppercase font-bold text-zinc-500 hover:text-green-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              Size Guide <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizesList.map((sz: string, idx: number) => {
              const isOutOf = isSizeOutOfStock(sz);
              return (
                <button
                  key={`sz-select-${sz}-${idx}`}
                  disabled={isOutOf}
                  onClick={() => setSelectedSize(sz)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-sans border transition-all cursor-pointer ${
                    selectedSize === sz 
                      ? 'bg-green-600 text-white border-green-600 shadow-sm' 
                      : isOutOf
                        ? 'bg-zinc-100 text-zinc-350 border-zinc-100 line-through cursor-not-allowed opacity-50'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- 4. CUSTOM COLOR SELECTOR ----------------- */}
      {coloursList.length > 0 && (
        <div className="space-y-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block font-sans">Select Color</span>
          <div className="flex flex-wrap gap-2">
            {coloursList.map((col: string, idx: number) => (
              <button
                key={`col-select-${col}-${idx}`}
                onClick={() => setSelectedColor(col)}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-sans border transition-all cursor-pointer ${
                  selectedColor === col
                    ? 'bg-green-500/10 text-green-700 border-green-300'
                    : 'bg-white text-zinc-750 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- 5. GARMENT DESCRIPTION ----------------- */}
      {product.description && (
        <div className="border-t border-zinc-100 pt-4 space-y-2 text-left">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block font-sans">Garment Description</span>
          <p className="text-zinc-600 text-xs leading-relaxed font-sans font-medium whitespace-pre-line">
            {product.description}
          </p>
        </div>
      )}

      {/* ----------------- 6. CURATED RELATED PRODUCTS ----------------- */}
      {relatedProducts.length > 0 && (
        <div className="pt-6 border-t border-zinc-100 space-y-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-bold font-sans text-left">You May Also Like</span>
          <div className="grid grid-cols-2 gap-4">
            {relatedProducts.map((rel, idx) => (
              <div
                key={`related-${rel.id || idx}`}
                onClick={() => onNavigateToPage('product', { productId: rel.id })}
                className="bg-white border border-zinc-150 rounded-2xl overflow-hidden cursor-pointer hover:border-zinc-300 transition-all flex flex-col justify-between shadow-2xs"
              >
                <div className="aspect-[3/4] bg-zinc-50 overflow-hidden">
                  <ProductImage product={rel} shop={shop} index={0} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 text-left">
                  <h4 className="text-[11px] font-bold text-zinc-800 truncate font-sans">{rel.name}</h4>
                  <span className="text-xs font-bold text-zinc-900 block font-sans">${rel.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ----------------- 7. INTERACTIVE ACTION PANEL ----------------- */}
      {/* Docked beautifully at bottom-20 right above floating bottom navigation */}
      <div className="fixed bottom-20 left-4 right-4 p-3 bg-white/95 backdrop-blur-md border border-zinc-150 shadow-lg rounded-2xl z-45 max-w-[480px] mx-auto flex gap-2">
        <button
          onClick={handleWhatsAppSeller}
          className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          title="WhatsApp Seller"
        >
          <MessageCircle className="w-5 h-5 text-green-600 fill-green-100" />
        </button>

        <button
          disabled={isSoldOut}
          onClick={handleAddToCart}
          className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
            isSoldOut
              ? 'bg-zinc-100 border-zinc-100 text-zinc-400 line-through cursor-not-allowed'
              : 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Add to Cart
        </button>

        <button
          disabled={isSoldOut}
          onClick={handleBuyNow}
          className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer ${
            isSoldOut
              ? 'bg-zinc-100 text-zinc-450 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-2xs'
          }`}
        >
          Buy Now
        </button>
      </div>

      {/* ----------------- ZOOM MODAL OVERLAY ----------------- */}
      <AnimatePresence>
        {zoomMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-between p-6 select-none backdrop-blur-md"
            onTouchStart={(e) => {
              handleZoomTouchStart(e);
              if (e.touches.length === 1) {
                setTouchStart(e.touches[0].clientX);
              }
            }}
            onTouchMove={(e) => {
              handleZoomTouchMove(e);
              if (e.touches.length === 1) {
                setTouchEnd(e.touches[0].clientX);
              }
            }}
            onTouchEnd={() => {
              handleZoomTouchEnd();
              if (touchStart && touchEnd && zoomScale === 1) {
                const distance = touchStart - touchEnd;
                if (distance > 50 && activeImgIdx < images.length - 1) {
                  setActiveImgIdx(prev => prev + 1);
                } else if (distance < -50 && activeImgIdx > 0) {
                  setActiveImgIdx(prev => prev - 1);
                }
              }
              setTouchStart(null);
              setTouchEnd(null);
            }}
          >
            {/* Fullscreen Header */}
            <div className="w-full flex items-center justify-between z-[110]">
              <div className="bg-white/10 backdrop-blur-md text-white text-xs font-mono font-bold px-3 py-1.5 rounded-full border border-white/10">
                Image {activeImgIdx + 1} of {images.length}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale(1);
                  setZoomMode(false);
                }}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer border border-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Img Canvas Container */}
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden relative">
              <div 
                className="transition-transform duration-200 ease-out"
                style={{ transform: `scale(${zoomScale})` }}
              >
                <ProductImage 
                  product={product} 
                  shop={shop} 
                  index={activeImgIdx} 
                  className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl" 
                />
              </div>
            </div>

            {/* Zoom Controls Overlay Toolbar */}
            <div className="w-full flex justify-center items-center gap-3 z-[110] pb-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale(prev => Math.max(1, prev - 0.5));
                }}
                disabled={zoomScale <= 1}
                className="p-3 bg-white/15 hover:bg-white/25 disabled:opacity-40 rounded-full text-white border border-white/10 transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale(1);
                }}
                disabled={zoomScale === 1}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 disabled:opacity-40 rounded-full text-white border border-white/10 text-xs font-mono uppercase tracking-wider transition-all"
              >
                Reset Zoom
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale(prev => Math.min(3, prev + 0.5));
                }}
                disabled={zoomScale >= 3}
                className="p-3 bg-white/15 hover:bg-white/25 disabled:opacity-40 rounded-full text-white border border-white/10 transition-all"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy Now Premium Bottom Sheet */}
      <AnimatePresence>
        {showBuySheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBuySheet(false)}
              className="fixed inset-0 bg-black/40 z-[90] backdrop-blur-3xs"
            />
            {/* Slide-up Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white rounded-t-3xl shadow-2xl border-t border-zinc-100 z-[95] overflow-hidden max-h-[85vh] flex flex-col font-sans text-zinc-900"
            >
              {/* Header handle bar */}
              <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto my-3" />
              
              <div className="px-6 pb-8 overflow-y-auto space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold font-sans text-zinc-900">How to Order</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Secure your piece directly from {shop?.name}</p>
                  </div>
                  <button 
                    onClick={() => setShowBuySheet(false)}
                    className="p-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full border border-zinc-150 text-zinc-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Shop Card */}
                <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-200 overflow-hidden border border-zinc-200 shrink-0">
                      <ShopLogo shop={shop} size="100%" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-zinc-900">{shop?.name}</h4>
                        <span className="inline-flex items-center justify-center bg-blue-500 text-white rounded-full p-0.5 shrink-0" style={{ width: '14px', height: '14px' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Verified Merchant</p>
                    </div>
                  </div>

                  {/* Delivery & Pickup options with dynamic status chips */}
                  <div className="space-y-3 pt-3 border-t border-zinc-200/60 text-xs">
                    <h5 className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Delivery & Collection Options</h5>
                    
                    <div className="flex flex-wrap gap-2">
                      {/* Store Pickup */}
                      <div className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all ${
                        (shopConfig?.pickup_available || shop?.pickup_available)
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-zinc-50 border-zinc-150 text-zinc-400 line-through opacity-60'
                      }`}>
                        <span>🏪</span>
                        <span className="font-medium">Store Pickup: {(shopConfig?.pickup_available || shop?.pickup_available) ? (shopConfig?.pickup_label || 'Available') : 'Not Available'}</span>
                      </div>

                      {/* Harare Delivery */}
                      <div className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all ${
                        shopConfig?.harare_delivery
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                          : 'bg-zinc-50 border-zinc-150 text-zinc-400 line-through opacity-60'
                      }`}>
                        <span>📍</span>
                        <span className="font-medium">Harare: {shopConfig?.harare_delivery || 'Not Configured'}</span>
                      </div>

                      {/* Nationwide Courier */}
                      <div className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all ${
                        shopConfig?.nationwide_courier
                          ? 'bg-violet-50 border-violet-200 text-violet-800'
                          : 'bg-zinc-50 border-zinc-150 text-zinc-400 line-through opacity-60'
                      }`}>
                        <span>🚚</span>
                        <span className="font-medium">Nationwide: {shopConfig?.nationwide_courier || 'Not Configured'}</span>
                      </div>

                      {/* International Shipping */}
                      <div className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all ${
                        shopConfig?.international_shipping
                          ? 'bg-pink-50 border-pink-200 text-pink-800'
                          : 'bg-zinc-50 border-zinc-150 text-zinc-400 line-through opacity-60'
                      }`}>
                        <span>🌐</span>
                        <span className="font-medium">International: {shopConfig?.international_shipping || 'Not Available'}</span>
                      </div>
                    </div>

                    {/* How to Find Us block */}
                    {!shop?.online_only && (
                      <div className="pt-3 border-t border-zinc-200/40 space-y-2">
                        <div className="flex items-center gap-1.5 text-zinc-800 font-bold uppercase tracking-wider text-[10px] font-mono">
                          <span>🧭</span>
                          <span>How to Find Us</span>
                        </div>
                        
                        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3.5 text-left w-full">
                          {/* 📍 Address */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm shrink-0">📍</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Address</span>
                              <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shopConfig?.shop_address || shop?.shop_address || shop?.location || 'Bulawayo CBD'}</span>
                            </div>
                          </div>

                          {/* 📍 Building */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm shrink-0">📍</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Building</span>
                              <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shopConfig?.building_name || shop?.building_name || 'HnS Building'}</span>
                            </div>
                          </div>

                          {/* 🏢 Floor */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm shrink-0">🏢</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Floor</span>
                              <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shopConfig?.floor || shop?.floor || 'First Floor'}</span>
                            </div>
                          </div>

                          {/* 🚪 Shop Number */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm shrink-0">🚪</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Shop Number</span>
                              <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shopConfig?.shop_number || shop?.shop_number || '23'}</span>
                            </div>
                          </div>

                          {/* 📌 Landmark */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm shrink-0">📌</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Landmark</span>
                              <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shopConfig?.landmark || shop?.landmark || 'Opposite City Hall'}</span>
                            </div>
                          </div>

                          {/* 🧭 Directions (Most prominent) */}
                          <div className="bg-white border-2 border-green-200/80 rounded-xl p-3 shadow-xs mt-3 flex items-start gap-3">
                            <span className="text-base shrink-0 mt-0.5">🧭</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-extrabold text-green-700 uppercase tracking-wider block font-mono">Directions</span>
                              <p className="text-xs font-bold text-zinc-950 font-sans mt-0.5 leading-relaxed break-words whitespace-pre-wrap">
                                {shopConfig?.directions || shop?.directions || 'Enter through the main entrance of HnS Building, go to the first floor, Shop 23, directly opposite the Game Arena.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Custom Notes / Promo Alert */}
                    {shopConfig?.custom_notes && (
                      <div className="pt-2.5 border-t border-zinc-200/40 space-y-1">
                        <div className="flex items-center gap-1 text-zinc-500 font-bold uppercase tracking-wider text-[10px] font-mono">
                          <span>🔔</span>
                          <span>Boutique Announcement</span>
                        </div>
                        <p className="text-zinc-700 font-semibold font-sans text-xs bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl">
                          {shopConfig.custom_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Options list */}
                <div className="space-y-3 pt-2">
                  {/* WhatsApp Shop Option */}
                  <button
                    onClick={() => {
                      handleWhatsAppSeller();
                      setShowBuySheet(false);
                    }}
                    className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors text-sm uppercase tracking-wider cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 fill-white/15" /> WhatsApp Shop (Order Now)
                  </button>



                  {/* Add to Cart Option */}
                  <button
                    onClick={() => {
                      handleAddToCart();
                      setShowBuySheet(false);
                    }}
                    className="w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-zinc-600" /> Add to Cart & Checkout Later
                  </button>

                  {/* Close / Continue Shopping Option */}
                  <button
                    onClick={() => setShowBuySheet(false)}
                    className="w-full py-3.5 text-center text-zinc-500 hover:text-zinc-800 font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

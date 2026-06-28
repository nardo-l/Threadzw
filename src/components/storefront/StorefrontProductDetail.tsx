// src/components/storefront/StorefrontProductDetail.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, MessageCircle, ArrowLeft, ZoomIn, Heart, Check, HelpCircle, X } from 'lucide-react';
import { ProductImage } from '../ui/ShopImage';
import { toast } from 'sonner';

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

  // Related products carousel
  const relatedProducts = useMemo(() => {
    return allProducts
      .filter((p: any) => p.id !== product.id && (p.category === product.category || p.category_id === product.category_id))
      .slice(0, 4);
  }, [allProducts, product]);

  const isFavorited = wishlist.includes(product.id);

  // WhatsApp helper
  const handleWhatsAppSeller = () => {
    const whatsappNum = shop.whatsapp || shop.whatsapp_number || shop.phone || '+263771234567';
    let clean = whatsappNum.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '263' + clean.substring(1);
    } else if (clean.length === 9 && (clean.startsWith('77') || clean.startsWith('71') || clean.startsWith('73') || clean.startsWith('78'))) {
      clean = '263' + clean;
    }
    const textMsg = `Hi ${shop.name}, I'm interested in ordering the *${product.name}*:\n- Size: ${selectedSize || 'Default'}\n- Color: ${selectedColor || 'Default'}\n- Price: $${product.price} USD.\nIs it available?`;
    const whatsappUrl = `https://wa.me/${clean}?text=${encodeURIComponent(textMsg)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Add To Cart handler
  const handleAddToCart = () => {
    if (isSoldOut) return;
    onAddToCart(product, selectedSize, selectedColor);
  };

  // Buy Now handler
  const handleBuyNow = () => {
    if (isSoldOut) return;
    onAddToCart(product, selectedSize, selectedColor);
    onNavigateToPage('checkout');
  };

  return (
    <div className="space-y-6 px-5 pb-24 select-none text-left">
      {/* Back Header Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 bg-neutral-900 border border-neutral-800 rounded-full hover:border-neutral-700 text-white flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6FF00] font-mono">Product View</span>
        <button
          onClick={() => onToggleWishlist(product.id)}
          className="p-2 bg-neutral-900 border border-neutral-800 rounded-full hover:border-neutral-700 text-white flex items-center justify-center cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-[#C6FF00] text-[#C6FF00]' : 'text-neutral-400'}`} />
        </button>
      </div>

      {/* ----------------- 1. IMAGE GALLERY ----------------- */}
      <div className="space-y-3 relative">
        <div 
          onClick={() => setZoomMode(true)}
          className="aspect-[3/4] rounded-[24px] overflow-hidden bg-neutral-950 border border-neutral-800 relative cursor-pointer group"
        >
          <ProductImage product={product} index={activeImgIdx} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102" />
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white p-2.5 rounded-full border border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4" />
          </div>

          {product.original_price && product.original_price > product.price && (
            <span className="absolute top-4 left-4 bg-red-600 border border-white/10 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
              -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}% Drop
            </span>
          )}

          {isSoldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500 font-mono border border-red-500/30 px-3 py-1.5 bg-black/50 rounded-xl">
                SOLD OUT
              </span>
            </div>
          )}
        </div>

        {/* Thumbnail Selector Dots / Buttons */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5">
            {images.map((_: any, idx: number) => (
              <button
                key={`gallery-dot-${idx}`}
                onClick={() => setActiveImgIdx(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeImgIdx === idx ? 'bg-[#C6FF00] w-4' : 'bg-neutral-800'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ----------------- 2. METADATA ----------------- */}
      <div className="space-y-1.5">
        <span className="text-[9px] uppercase font-mono tracking-widest text-[#C6FF00] font-bold block">
          {product.category || 'Curated releases'}
        </span>
        <h2 className="font-syne text-xl font-black uppercase tracking-tight text-white leading-tight">
          {product.name}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-white font-mono">${product.price} USD</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-sm text-neutral-600 line-through font-mono">${product.original_price}</span>
          )}
        </div>

        {/* Stock Status Indicator */}
        <div className="pt-1">
          {isSoldOut ? (
            <span className="text-[8px] font-bold uppercase tracking-wider font-mono text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
              ● Out of Stock
            </span>
          ) : (
            <span className="text-[8px] font-bold uppercase tracking-wider font-mono text-[#C6FF00] bg-[#C6FF00]/10 border border-[#C6FF00]/20 px-2.5 py-1 rounded-full">
              ● In Stock & Ready to dispatch
            </span>
          )}
        </div>
      </div>

      {/* ----------------- 3. CUSTOM SIZE SELECTOR ----------------- */}
      {sizesList.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 block">Select size:</span>
            <button 
              onClick={() => toast.info("Sizing is True-to-size. Oversized garments are labeled.")}
              className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
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
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                    selectedSize === sz 
                      ? 'bg-[#C6FF00] text-black border-[#C6FF00]' 
                      : isOutOf
                        ? 'bg-neutral-900 text-neutral-600 border-neutral-900 opacity-40 line-through cursor-not-allowed'
                        : 'bg-neutral-900 text-neutral-200 border-neutral-800 hover:border-neutral-600'
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
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 block">Select color:</span>
          <div className="flex flex-wrap gap-2">
            {coloursList.map((col: string, idx: number) => (
              <button
                key={`col-select-${col}-${idx}`}
                onClick={() => setSelectedColor(col)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold font-mono border transition-all cursor-pointer ${
                  selectedColor === col
                    ? 'bg-[#C6FF00]/15 text-[#C6FF00] border-[#C6FF00]'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-600'
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
        <div className="border-t border-neutral-900 pt-4 space-y-2">
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-550 block">Garment Narrative</span>
          <p className="text-neutral-300 text-xs leading-relaxed font-sans whitespace-pre-line">
            {product.description}
          </p>
        </div>
      )}

      {/* ----------------- 6. CURATED RELATED PRODUCTS ----------------- */}
      {relatedProducts.length > 0 && (
        <div className="pt-6 border-t border-neutral-900 space-y-4">
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 block font-bold">Similar drops in {product.category || 'Releases'}</span>
          <div className="grid grid-cols-2 gap-4">
            {relatedProducts.map((rel, idx) => (
              <div
                key={`related-${rel.id || idx}`}
                onClick={() => onNavigateToPage('product', { productId: rel.id })}
                className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl overflow-hidden cursor-pointer hover:border-neutral-700 transition-all flex flex-col justify-between"
              >
                <div className="aspect-[3/4] bg-neutral-950">
                  <ProductImage product={rel} index={0} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 text-left">
                  <h4 className="text-[11px] font-bold uppercase truncate text-neutral-200">{rel.name}</h4>
                  <span className="text-xs font-black text-[#C6FF00] font-mono">${rel.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- 7. INTERACTIVE ACTION PANEL ----------------- */}
      <div className="fixed bottom-14 left-0 right-0 p-4 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-neutral-900 z-40 max-w-[480px] mx-auto flex gap-2">
        <button
          onClick={handleWhatsAppSeller}
          className="p-3.5 bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
          title="WhatsApp Seller"
        >
          <MessageCircle className="w-5 h-5 text-emerald-400 fill-current" />
        </button>

        <button
          disabled={isSoldOut}
          onClick={handleAddToCart}
          className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 border transition-all cursor-pointer ${
            isSoldOut
              ? 'bg-neutral-900/50 border-neutral-900 text-neutral-600 line-through cursor-not-allowed'
              : 'bg-neutral-900 border-neutral-800 text-white hover:border-neutral-600'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Add to Cart
        </button>

        <button
          disabled={isSoldOut}
          onClick={handleBuyNow}
          className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
            isSoldOut
              ? 'bg-neutral-900/50 text-neutral-600 cursor-not-allowed'
              : 'bg-[#C6FF00] text-black font-black hover:opacity-95 shadow-lg shadow-[#C6FF00]/10'
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
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setZoomMode(false)}
          >
            <button
              onClick={() => setZoomMode(false)}
              className="absolute top-6 right-6 p-2 bg-neutral-900 rounded-full border border-neutral-800 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-w-lg max-h-[80vh] w-full h-full rounded-2xl overflow-hidden">
              <ProductImage product={product} index={activeImgIdx} className="w-full h-full object-contain scale-110" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

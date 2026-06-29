// src/components/storefront/StorefrontProductDetail.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, MessageCircle, ArrowLeft, ZoomIn, Heart, HelpCircle, X } from 'lucide-react';
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

  // Related products
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
          onClick={() => setZoomMode(true)}
          className="aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-150 relative cursor-pointer group shadow-sm"
        >
          <ProductImage product={product} shop={shop} index={activeImgIdx} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102" />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs text-zinc-700 p-2 rounded-full shadow-md border border-zinc-100 opacity-80 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4" />
          </div>

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
        </div>

        {/* Thumbnail Selector Dots / Buttons */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5">
            {images.map((_: any, idx: number) => (
              <button
                key={`gallery-dot-${idx}`}
                onClick={() => setActiveImgIdx(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  activeImgIdx === idx ? 'bg-green-600 w-4' : 'bg-zinc-200'
                }`}
              />
            ))}
          </div>
        )}
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
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-xs"
            onClick={() => setZoomMode(false)}
          >
            <button
              onClick={() => setZoomMode(false)}
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-w-lg max-h-[80vh] w-full h-full rounded-2xl overflow-hidden">
              <ProductImage product={product} shop={shop} index={activeImgIdx} className="w-full h-full object-contain scale-102" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

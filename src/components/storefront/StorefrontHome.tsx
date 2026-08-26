// src/components/storefront/StorefrontHome.tsx
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MessageCircle, Heart, Sparkles, Grid, Share2 } from 'lucide-react';
import { ProductImage, ShopLogo, ShopBanner } from '../ui/ShopImage';
import { parseShopConfig } from '../../utils/configHelper';
import { trackWhatsAppClick } from '../../lib/analytics';

interface StorefrontHomeProps {
  shop: any;
  products: any[];
  categories: any[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onNavigateToPage: (page: any, params?: any) => void;
  onAddToCartDirectly: (product: any) => void;
  onShareShop?: () => void;
}

export const StorefrontHome: React.FC<StorefrontHomeProps> = ({
  shop,
  products,
  wishlist,
  onToggleWishlist,
  onNavigateToPage,
  onShareShop,
}) => {
  // Parse merchant settings
  const shopConfig = useMemo(() => {
    if (!shop?.description) return {};
    const { config } = parseShopConfig(shop.description);
    return config;
  }, [shop?.description]);

  // Dynamic location text based on priority order: Landmark -> Area -> Location -> City
  const dynamicLocationText = useMemo(() => {
    const isMock = shop?.id?.startsWith('shop-');
    
    const filterHarare = (val: string | null | undefined) => {
      if (!val) return null;
      if (isMock && val.toLowerCase().includes('harare')) return null;
      return val;
    };

    const landmark = filterHarare(shopConfig?.landmark?.trim() || shop?.landmark?.trim());
    const area = filterHarare(shopConfig?.suburb?.trim() || shop?.suburb?.trim() || shop?.area?.trim());
    const location = filterHarare(shop?.location?.trim());
    const city = filterHarare(shopConfig?.city?.trim() || shop?.city?.trim());

    if (landmark) {
      return `Located in ${landmark}`;
    }
    if (area) {
      return `Located in ${area}`;
    }
    if (location) {
      return `Located in ${location}`;
    }
    if (city) {
      return `Located in ${city}`;
    }
    return '';
  }, [shop, shopConfig]);

  // Filter out unpublished products
  const visibleProducts = useMemo(() => {
    return products.filter(p => p.is_published !== false);
  }, [products]);

  // Highlights Carousel Info matching redesign specifications
  const highlightCards = useMemo(() => {
    const cards: { icon: string; title: string; desc: string; bg: string; visible: boolean }[] = [];

    // 1. Location Card
    if (dynamicLocationText) {
      cards.push({
        icon: '📍',
        title: 'Store Location',
        desc: dynamicLocationText,
        bg: 'bg-violet-50/70 text-violet-950 border-violet-100/40',
        visible: true,
      });
    }

    // 2. Nationwide Delivery Card
    const hasDelivery = shopConfig?.nationwide_courier || shopConfig?.delivery_info || shop?.delivery_info;
    if (hasDelivery) {
      const courierText = shopConfig?.nationwide_courier 
        ? `Courier service: ${shopConfig.nationwide_courier}`
        : (shopConfig?.delivery_info || shop?.delivery_info || '');
      
      cards.push({
        icon: '🚚',
        title: 'Nationwide Delivery',
        desc: courierText,
        bg: 'bg-indigo-50/70 text-indigo-950 border-indigo-100/40',
        visible: true,
      });
    }

    // 3. Business Highlights Card
    if (shopConfig?.business_highlights) {
      cards.push({
        icon: '⭐',
        title: 'Business Highlights',
        desc: shopConfig.business_highlights,
        bg: 'bg-amber-50/70 text-amber-950 border-amber-100/40',
        visible: true,
      });
    }

    // 4. Physical Store / Store Pickup Available Card
    const isPickupAvailable = shopConfig?.pickup_available || shop?.pickup_available;
    if (isPickupAvailable) {
      cards.push({
        icon: '🏪',
        title: 'Store Pickup Available',
        desc: shopConfig?.pickup_label || 'In-store pickup is fully supported.',
        bg: 'bg-emerald-50/70 text-emerald-950 border-emerald-100/40',
        visible: true,
      });
    }

    // 5. Response Time Card
    if (shopConfig?.response_time) {
      cards.push({
        icon: '💬',
        title: 'Active Support',
        desc: shopConfig.response_time,
        bg: 'bg-teal-50/70 text-teal-950 border-teal-100/40',
        visible: true,
      });
    }

    return cards.filter(c => c.visible);
  }, [shop, shopConfig, dynamicLocationText]);

  return (
    <div className="space-y-10 pb-16 select-none bg-white">
      {/* ----------------- 1. HERO COVER SECTION (COZY BOUTIQUE CONCEPT) ----------------- */}
      <div id="home-hero-header" className="relative bg-white pb-6 border-b border-zinc-100">
        <div className="relative h-44 w-full overflow-hidden">
          <ShopBanner shop={shop} height="100%" className="w-full h-full object-cover scale-100" />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Brand identity overlapping hero */}
        <div className="flex flex-col items-center -mt-12 relative z-10 px-4">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-sm bg-zinc-50 overflow-hidden">
            <ShopLogo shop={shop} size="100%" className="w-full h-full rounded-full object-cover" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-zinc-900 mt-3 font-sans">
            {shop.name}
          </h1>
          

          
          <p className="text-[10px] font-bold store-accent-text mt-2 tracking-wider uppercase font-sans flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            {shop.city || 'Zimbabwe'} Store Link
          </p>

          {shop.description && (
            <p className="text-xs text-zinc-500 max-w-xs text-center mt-2.5 leading-relaxed font-sans px-4">
              {shop.description}
            </p>
          )}

          {/* Action Call-to-Actions */}
          <div className="flex flex-col gap-2.5 mt-5 w-full max-w-[290px]">
            <div className="flex gap-2.5 w-full">
              <button
                onClick={() => onNavigateToPage('shop')}
                className="flex-grow py-2.5 store-accent-bg  text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                Browse Catalog <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {(shop.whatsapp_number || shop.whatsapp) && (
                <a
                  href={`https://wa.me/${(shop.whatsapp_number || shop.whatsapp).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    console.log("TRACK START", { shopId: shop?.id, eventType: 'whatsapp_click' });
                    trackWhatsAppClick(shop.id);
                  }}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center border border-zinc-200/30 text-center"
                >
                  Message Us
                </a>
              )}
            </div>

            {onShareShop && (
              <button
                onClick={onShareShop}
                className="w-full py-2.5 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs rounded-xl border border-zinc-200/60 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-zinc-500" /> Share Shop Link
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ----------------- 2. SHOP HIGHLIGHT CARDS (DYNAMIC DIRECTIVES) ----------------- */}
      <div id="home-highlight-cards" className="space-y-3">
        <div className="px-5 space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider store-accent-text font-sans">Featured Info</span>
          <h3 className="text-base font-bold text-zinc-900">Why Shop With Us</h3>
        </div>

        {/* Swipeable Horizontal Scroll Container */}
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory px-5">
          {highlightCards.map((card, idx) => (
            <motion.div
              key={`card-${idx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className={`snap-center shrink-0 w-[240px] p-5 rounded-2xl border ${card.bg} flex flex-col gap-2 shadow-md hover:scale-[1.01] transition-all relative select-none`}
            >
              <span className="text-3xl filter drop-shadow-xs mb-1 block">{card.icon}</span>
              <h4 className="font-bold text-sm tracking-tight text-zinc-900">{card.title}</h4>
              <p className="text-[11px] leading-relaxed text-zinc-600 font-sans">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ----------------- 3. INSTAGRAM-STYLE PRODUCTS SECTION ----------------- */}
      <div id="home-products-section" className="px-5 space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider store-accent-text font-sans">Available Drops</span>
            <h3 className="text-base font-bold text-zinc-900">Active Products</h3>
          </div>
          <button 
            onClick={() => onNavigateToPage('shop')}
            className="text-xs font-semibold store-accent-text store-accent-hover-text flex items-center gap-1 cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5" /> View All
          </button>
        </div>

        {visibleProducts.length === 0 ? (
          <div className="py-12 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-xs">No active catalog items available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {visibleProducts.slice(0, 12).map((p, pIdx) => {
              const isWishlisted = wishlist.includes(p.id);
              const isSoldOut = p.status === 'sold_out' || p.total_stock <= 0;
              return (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + pIdx * 0.03, duration: 0.35 }}
                  onClick={() => onNavigateToPage('product', { productId: p.id })}
                  className="group flex flex-col bg-white border border-zinc-150/70 rounded-2xl p-1.5 shadow-xs hover:shadow-sm transition-all relative cursor-pointer"
                >
                  {/* Heart Button Overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(p.id);
                    }}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-xs hover:bg-white text-zinc-700 hover:text-rose-500 shadow-xs transition-colors cursor-pointer"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-zinc-600'}`} />
                  </button>

                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-zinc-50 relative">
                    <ProductImage product={p} shop={shop} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {p.compare_at_price && p.compare_at_price > p.price && (
                      <span className="absolute bottom-2 left-2 bg-red-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md">
                        SALE
                      </span>
                    )}
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex items-center justify-center">
                        <span className="text-[9px] font-bold tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md shadow-2xs">
                          SOLD OUT
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-1.5 flex flex-col flex-1 justify-between select-none">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                        {p.category || 'Apparel'}
                      </span>
                      <h4 className="font-semibold text-xs text-zinc-800 line-clamp-1 group-store-accent-hover-text transition-colors">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-2 text-left">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-zinc-900">${p.price}</span>
                        {p.compare_at_price && p.compare_at_price > p.price && (
                          <span className="text-[10px] text-zinc-400 line-through">${p.compare_at_price}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToPage('product', { productId: p.id });
                        }}
                        className="mt-2.5 w-full py-2 store-accent-bg text-white rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer text-center"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" /> Choose options
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

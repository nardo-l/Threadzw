// src/components/storefront/StorefrontHome.tsx
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Star, ShoppingBag, MessageCircle, ChevronRight, MapPin } from 'lucide-react';
import { ProductImage, ShopLogo, ShopBanner } from '../ui/ShopImage';

interface StorefrontHomeProps {
  shop: any;
  products: any[];
  categories: any[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onNavigateToPage: (page: any, params?: any) => void;
  onAddToCartDirectly: (product: any) => void;
}

export const StorefrontHome: React.FC<StorefrontHomeProps> = ({
  shop,
  products,
  categories,
  wishlist,
  onToggleWishlist,
  onNavigateToPage,
  onAddToCartDirectly
}) => {
  // New Arrivals (Latest 4 products)
  const newArrivals = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 4);
  }, [products]);

  // Best Sellers (Featured or first 4 products)
  const bestSellers = useMemo(() => {
    return products.filter(p => p.is_featured).slice(0, 4);
  }, [products]);

  // If there are no featured products, use first 4 products as best sellers
  const displayedBestSellers = bestSellers.length > 0 ? bestSellers : products.slice(2, 6);

  // Featured Products (All remaining/published products)
  const featuredProducts = useMemo(() => {
    return products.slice(0, 6);
  }, [products]);

  // Render dummy reviews based on shop id or general aesthetic
  const mockReviews = [
    { id: 1, name: 'Tinashe M.', text: 'Absolutely love the weight of the heavy cotton tee. Easily rivals international fashion labels.', rating: 5, item: 'Heavyweight Drop Tee' },
    { id: 2, name: 'Sihle N.', text: 'Fast delivery to Harare. The hoodie fit is perfectly oversized and comfortable. Highly recommended!', rating: 5, item: 'Classic Oversized Hoodie' },
    { id: 3, name: 'Kundai Z.', text: 'The attention to packaging details is sublime. Pure luxury feeling from unboxing to wearing.', rating: 5, item: 'Premium Street Socks' }
  ];

  return (
    <div className="space-y-12 pb-16 select-none">
      {/* ----------------- 1. HERO BANNER ----------------- */}
      <div id="home-hero-banner" className="relative h-[480px] w-full overflow-hidden">
        {/* Large Featured background image */}
        <div className="absolute inset-0 z-0 bg-neutral-950">
          <ShopBanner shop={shop} height="100%" className="w-full h-full object-cover scale-105 filter brightness-75 transition-all duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        </div>

        {/* Brand identity overlaid on hero */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-6 flex flex-col items-center text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-20 h-20 rounded-full border border-[#C6FF00] p-0.5 bg-black/90 shadow-2xl flex items-center justify-center overflow-hidden"
          >
            <ShopLogo shop={shop} size="100%" className="w-full h-full rounded-full object-cover" />
          </motion.div>

          <div className="space-y-1">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="font-syne text-3xl font-black uppercase tracking-tight text-white leading-none"
            >
              {shop.name}
            </motion.h1>
            <motion.p 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-xs uppercase font-mono tracking-widest text-[#C6FF00]"
            >
              {shop.city || 'Bulawayo, Zimbabwe'}
            </motion.p>
          </div>

          <motion.p 
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xs text-neutral-300 max-w-sm line-clamp-2"
          >
            {shop.description || 'Elevated street culture & premium designer drops. Constructed in Bulawayo.'}
          </motion.p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            onClick={() => onNavigateToPage('shop')}
            className="px-8 py-4 bg-[#C6FF00] text-black text-xs font-black uppercase tracking-[0.2em] rounded-full hover:opacity-90 shadow-xl shadow-[#C6FF00]/10 flex items-center gap-2 cursor-pointer"
          >
            Shop Collection <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* ----------------- 2. CURATED CATEGORIES LIST ----------------- */}
      <div id="home-categories" className="px-5">
        <div className="flex justify-between items-end mb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6FF00] font-mono">Curated Drops</span>
            <h3 className="font-syne text-xl font-black uppercase tracking-tight text-white mt-1">Categories</h3>
          </div>
          <button 
            onClick={() => onNavigateToPage('categories')} 
            className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x select-none">
          {categories.map((cat, idx) => (
            <div 
              key={`cat-bubble-${cat.id || idx}`}
              onClick={() => onNavigateToPage('shop', { category: cat.name })}
              className="flex flex-col items-center space-y-2 cursor-pointer shrink-0 snap-center group"
            >
              <div className="w-16 h-16 rounded-full border border-neutral-800 bg-neutral-900 overflow-hidden flex items-center justify-center p-0.5 group-hover:border-[#C6FF00] transition-colors">
                <div className="w-full h-full rounded-full bg-neutral-950 overflow-hidden flex items-center justify-center">
                  {cat.cover_image_url ? (
                    <img src={cat.cover_image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <span className="font-mono text-xs text-neutral-500">{cat.name.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 group-hover:text-white transition-colors">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ----------------- 3. NEW ARRIVALS ----------------- */}
      <div id="home-new-arrivals" className="px-5">
        <div className="flex justify-between items-end mb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6FF00] font-mono">Just Dropped</span>
            <h3 className="font-syne text-xl font-black uppercase tracking-tight text-white mt-1">New Arrivals</h3>
          </div>
          <button 
            onClick={() => onNavigateToPage('shop', { sort: 'newest' })} 
            className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            Explore <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {newArrivals.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 text-xs font-mono uppercase border border-dashed border-neutral-800 rounded-2xl">
            No active drops listed
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {newArrivals.map((p, idx) => (
              <motion.div
                key={`new-arr-${p.id || idx}`}
                onClick={() => onNavigateToPage('product', { productId: p.id })}
                className="group cursor-pointer flex flex-col justify-between bg-neutral-900/40 border border-neutral-800/60 hover:border-[#C6FF00]/40 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <div className="aspect-[3/4] bg-neutral-950 w-full overflow-hidden relative">
                  <ProductImage product={p} index={0} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {p.original_price && p.original_price > p.price && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                      Drop
                    </div>
                  )}
                </div>
                <div className="p-3.5 space-y-1 text-left">
                  <p className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">{p.category}</p>
                  <h4 className="text-xs font-bold uppercase truncate text-neutral-200 group-hover:text-white transition-colors">{p.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#C6FF00] font-mono">${p.price}</span>
                    {p.original_price && p.original_price > p.price && (
                      <span className="text-[10px] text-neutral-600 line-through font-mono">${p.original_price}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ----------------- 4. BEST SELLERS ----------------- */}
      <div id="home-best-sellers" className="px-5">
        <div className="mb-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6FF00] font-mono">Highly Coveted</span>
          <h3 className="font-syne text-xl font-black uppercase tracking-tight text-white mt-1">Best Sellers</h3>
        </div>

        {displayedBestSellers.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 text-xs font-mono uppercase border border-dashed border-neutral-800 rounded-2xl">
            No items marked featured
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x select-none">
            {displayedBestSellers.map((p, idx) => (
              <div
                key={`best-sel-${p.id || idx}`}
                onClick={() => onNavigateToPage('product', { productId: p.id })}
                className="w-40 shrink-0 snap-center group cursor-pointer flex flex-col justify-between bg-neutral-900/30 border border-neutral-800/40 hover:border-[#C6FF00]/30 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <div className="aspect-[3/4] bg-neutral-950 w-full overflow-hidden relative">
                  <ProductImage product={p} index={0} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3 text-left">
                  <h4 className="text-[11px] font-bold uppercase truncate text-neutral-200 group-hover:text-white transition-colors">{p.name}</h4>
                  <span className="text-xs font-black text-[#C6FF00] font-mono">${p.price}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ----------------- 5. FEATURED PRODUCTS GRID ----------------- */}
      <div id="home-featured" className="px-5">
        <div className="flex justify-between items-end mb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6FF00] font-mono">Season Catalog</span>
            <h3 className="font-syne text-xl font-black uppercase tracking-tight text-white mt-1">Featured Products</h3>
          </div>
          <button 
            onClick={() => onNavigateToPage('shop')} 
            className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            Catalog <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-xs font-mono uppercase">
            No catalog items found
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {featuredProducts.map((p, idx) => (
              <motion.div
                key={`featured-${p.id || idx}`}
                onClick={() => onNavigateToPage('product', { productId: p.id })}
                className="group cursor-pointer flex flex-col justify-between bg-neutral-900/40 border border-neutral-800/60 hover:border-[#C6FF00]/40 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <div className="aspect-[3/4] bg-neutral-950 w-full overflow-hidden relative">
                  <ProductImage product={p} index={0} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3.5 space-y-1 text-left">
                  <p className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">{p.category}</p>
                  <h4 className="text-xs font-bold uppercase truncate text-neutral-200 group-hover:text-white transition-colors">{p.name}</h4>
                  <span className="text-xs font-black text-[#C6FF00] font-mono">${p.price}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ----------------- 6. CUSTOMER REVIEWS ----------------- */}
      <div id="home-reviews" className="px-5">
        <div className="mb-5 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6FF00] font-mono">Boutique Reviews</span>
          <h3 className="font-syne text-xl font-black uppercase tracking-tight text-white mt-1">Customer Reviews</h3>
        </div>

        <div className="space-y-4">
          {mockReviews.map((rev) => (
            <div 
              key={`rev-${rev.id}`}
              className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4 space-y-2 text-left"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-[#C6FF00] tracking-wider">{rev.name}</span>
                <div className="flex items-center text-yellow-500 gap-0.5">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed italic">
                "{rev.text}"
              </p>
              <div className="text-[9px] font-mono text-neutral-550 uppercase tracking-widest pt-1">
                Verified Buyer - {rev.item}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ----------------- 7. ABOUT BRAND ----------------- */}
      <div id="home-about" className="px-5">
        <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-[24px] p-6 text-center space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C6FF00] font-mono">Our Identity</span>
          <h3 className="font-syne text-xl font-black uppercase tracking-tight text-white">{shop.name} Story</h3>
          
          <p className="text-xs text-neutral-300 leading-relaxed">
            {shop.description || 'Constructed with meticulous attention to tailoring, graphic identity, and high-fashion aesthetics. ThreadZW boutique represents a cultural movement designed in Bulawayo to challenge international luxury standards.'}
          </p>

          <div className="flex items-center justify-center gap-2 pt-2 text-[10px] uppercase font-bold font-mono tracking-widest text-neutral-400">
            <span className="flex items-center gap-1.5 text-[#C6FF00]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF00] inline-block animate-pulse" />
              Store Live
            </span>
            <span>●</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#C6FF00]" />
              {shop.city || 'Bulawayo'}
            </span>
          </div>

          <button
            onClick={() => onNavigateToPage('about')}
            className="mt-2 px-6 py-3 bg-neutral-950 text-white border border-neutral-800 text-[9px] font-extrabold uppercase tracking-widest rounded-xl hover:bg-[#C6FF00] hover:text-black hover:border-transparent transition-all cursor-pointer"
          >
            Brand Story
          </button>
        </div>
      </div>

      {/* ----------------- 8. CONTACT CTA ----------------- */}
      <div id="home-contact-cta" className="px-5">
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-[24px] p-6 text-center space-y-4">
          <h4 className="font-syne text-lg font-black uppercase text-white tracking-tight">Need instant assistance?</h4>
          <p className="text-xs text-neutral-400">
            Have questions about sizes, upcoming releases, or custom orders? Reach our fashion representative directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`https://wa.me/${(shop.whatsapp_number || shop.whatsapp || '').replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3.5 bg-[#C6FF00] text-black text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-lg shadow-[#C6FF00]/10 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp Agent
            </a>
            <button
              onClick={() => onNavigateToPage('contact')}
              className="flex-1 py-3.5 bg-neutral-950 border border-neutral-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-neutral-900 cursor-pointer"
            >
              Contact Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

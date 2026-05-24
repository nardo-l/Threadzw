import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useFollow } from '../context/FollowContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface PublicShopPageProps {
  handle: string;
}

export const PublicShopPage: React.FC<PublicShopPageProps> = ({ handle }) => {
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Modal / Detail view states
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Collections and search search states
  const [activeCollection, setActiveCollection] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Wishlist local storage persistence
  const [savedProducts, setSavedProducts] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('wishlist') || '[]');
    } catch {
      return [];
    }
  });

  const { user } = useAuth();

  const toggleSave = (product: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSavedProducts(prev => {
      const isSaved = prev.includes(product.id);
      let updated;
      if (isSaved) {
        updated = prev.filter(id => id !== product.id);
      } else {
        updated = [...prev, product.id];
      }
      localStorage.setItem('wishlist', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    fetchShop();
    return () => {
      document.title = 'ThreadZW';
    };
  }, [handle]);

  const fetchShop = async () => {
    setLoading(true);
    try {
      const { data: shopData, error } = await supabase
        .from('shops')
        .select('*')
        .eq('handle', handle)
        .single();

      if (error || !shopData) {
        setNotFound(true);
        return;
      }

      setShop(shopData);
      document.title = shopData.name + ' — ThreadZW';

      // Load products that are published and not deleted
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .eq('is_published', true)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      setProducts(productsData || []);

      // Increment view count silently
      supabase
        .from('shops')
        .update({
          view_count: (shopData.view_count || 0) + 1
        })
        .eq('id', shopData.id)
        .then(() => {});

    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const shopIsOffline =
    shop && (
      !shop.is_live ||
      shop.subscription_status === 'expired'
    );

  const isOpenNow = () => {
    if (shop?.trading_hours) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const now = new Date();
      const currentDayName = days[now.getDay()];
      const hourVal = now.getHours();
      const minVal = now.getMinutes();
      const currentMinutesIndex = hourVal * 60 + minVal;

      const dayConfig = shop.trading_hours.find((h: any) => h.day === currentDayName);
      if (dayConfig && dayConfig.isOpen) {
        const [oH, oM] = dayConfig.openTime.split(':').map(Number);
        const [cH, cM] = dayConfig.closeTime.split(':').map(Number);
        const startTarget = oH * 60 + oM;
        const endTarget = cH * 60 + cM;
        return currentMinutesIndex >= startTarget && currentMinutesIndex < endTarget;
      }
    }
    // Fallback standard trading hours
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    if (day === 0) return false; // Closed Sun
    return hour >= 8 && hour < 18;
  };

  const openNow = isOpenNow();

  const formatWA = (num: string) => {
    if (!num) return '263776223144';
    const d = num.replace(/\D/g, '');
    if (d.startsWith('263')) return d;
    if (d.startsWith('0')) return '263' + d.slice(1);
    return '263' + d;
  };

  const handleWhatsApp = (product?: any) => {
    const phone = formatWA(shop?.whatsapp);
    const msg = product
      ? `Hi ${shop?.name}! I saw this on ThreadZW:\n\n👕 *${product.name}*\n💰 $${product.price}\n\nIs it available?`
      : `Hi ${shop?.name}! I discovered your shop on ThreadZW. Can you help me with an order? 👋`;

    window.open(
      'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg),
      '_blank'
    );
  };

  const handleVisitShop = () => {
    if (shop?.google_maps_url) {
      window.open(shop.google_maps_url, '_blank');
      return;
    }

    const address = [
      shop?.landmark || shop?.physical_address,
      shop?.suburb,
      shop?.city || shop?.town,
      'Zimbabwe'
    ].filter(Boolean).join(', ');

    window.open(
      'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address),
      '_blank'
    );
  };

  const handleShare = () => {
    const url = 'https://threadzw.vercel.app/shop/@' + handle;
    if (navigator.share) {
      navigator.share({
        title: shop?.name,
        text: 'Check out ' + shop?.name + ' on ThreadZW',
        url
      });
    } else {
      navigator.clipboard.writeText(url);
      const el = document.createElement('div');
      el.innerText = 'Link copied! ✓';
      el.style.cssText = `
        position:fixed;
        bottom:100px;
        left:50%;
        transform:translateX(-50%);
        background:#0A0A0A;
        color:#fff;
        padding:12px 24px;
        border-radius:999px;
        font-size:13px;
        font-weight:700;
        z-index:9999;
        font-family:Inter, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'https://threadzw.vercel.app';
    }
  };

  // Build Collections from product entries
  const collections = [
    'All',
    ...Array.from(
      new Set(
        products
          .map(p => p.collection?.trim())
          .filter(Boolean)
      )
    )
  ];

  // Filtering products
  const filteredProducts = products.filter(p => {
    const matchSearch =
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCollection =
      activeCollection === 'All' ||
      !activeCollection ||
      p.collection === activeCollection;

    return matchSearch && matchCollection;
  });

  const featuredProducts = products.filter(p => p.is_featured === true);

  // Staggered columns logic
  const leftCol = filteredProducts.filter((_, i) => i % 2 === 0);
  const rightCol = filteredProducts.filter((_, i) => i % 2 !== 0);

  // 🏪 LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{
          width: 28,
          height: 28,
          border: '2px solid #E8E8E8',
          borderTop: '2px solid #0A0A0A',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span className="text-zinc-400 text-sm font-medium mt-4 tracking-wide font-mono">
          @{handle}
        </span>
      </div>
    );
  }

  // 🏪 NOT FOUND STATE
  if (notFound || !shop) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-[#0A0A0A] font-black text-6xl tracking-tighter mb-4">404</h1>
        <h2 className="text-[#0A0A0A] font-black text-2xl tracking-tight uppercase">Shop not found</h2>
        <p className="text-zinc-500 font-medium text-sm mt-2 max-w-xs leading-relaxed">
          @{handle} doesn't exist.
        </p>
        <a
          href="https://threadzw.vercel.app"
          className="text-[#0A0A0A] font-bold underline mt-6 text-sm tracking-wide"
        >
          Discover ThreadZW
        </a>
      </div>
    );
  }

  // 🔒 OFFLINE STATE
  if (shopIsOffline) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-[#0A0A0A] font-black text-3xl tracking-tight uppercase leading-none">
          {shop.name}
        </h1>
        <div className="flex items-center gap-2 justify-center mt-3">
          <div className="w-2.5 h-2.5 bg-[#E53935] rounded-full animate-pulse" />
          <span className="text-zinc-500 text-sm font-bold tracking-wide">
            Currently unavailable
          </span>
        </div>
        <p className="text-zinc-500 font-medium text-sm mt-5 leading-relaxed max-w-xs">
          This shop is temporarily offline. Check back soon or contact us directly.
        </p>
        {shop.whatsapp && (
          <button
            onClick={() => handleWhatsApp()}
            className="w-full max-w-xs mt-8 h-14 bg-[#25D366] rounded-xl flex items-center justify-center gap-2.5 text-white font-bold text-[15px] shadow-lg shadow-green-500/20 active:scale-95 transition-transform"
          >
            <span>💬</span>
            <span>Message on WhatsApp</span>
          </button>
        )}
      </div>
    );
  }

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setActiveImageIdx(0);
    setQuantity(1);
    setSelectedSize(product.sizes?.[0] ? (typeof product.sizes[0] === 'string' ? product.sizes[0] : product.sizes[0].size) : '');
  };

  const handleOrderWhatsApp = () => {
    if (!selectedProduct) return;
    const phone = formatWA(shop?.whatsapp);
    const sizeText = selectedSize ? `\nSize: ${selectedSize}` : '';
    const msg =
      `Hi ${shop?.name}! I want to order from ThreadZW:\n\n` +
      `👕 *${selectedProduct.name}*\n` +
      `💰 $${selectedProduct.price}` +
      sizeText +
      `\nQty: ${quantity}\n\nIs this available?`;

    window.open(
      'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg),
      '_blank'
    );
  };

  const heroImage = shop.banner_url || (featuredProducts?.[0]?.images?.[0] || products?.[0]?.images?.[0] || '');

  return (
    <div className="min-h-screen bg-zinc-50 flex justify-center selection:bg-zinc-200">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-xl flex flex-col relative text-[#0A0A0A] overflow-x-hidden font-sans pb-16">
        
        {/* 1. HERO SECTION */}
        <div className="w-full h-[85vh] min-h-[520px] relative overflow-hidden flex-shrink-0">
          {heroImage ? (
            <img
              src={heroImage}
              className="w-full h-full object-cover object-top"
              alt={`${shop.name} Hero`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-[#0A0A0A] flex flex-col items-center justify-center">
              <span className="text-zinc-800 text-6xl select-none">✦</span>
              <span className="text-zinc-600 text-xs font-mono tracking-widest uppercase mt-4">PREMIUM DROP</span>
            </div>
          )}

          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent via-50% to-black/90 pointer-events-none" />

          {/* Navigation Controls */}
          <button
            onClick={handleBack}
            className="absolute top-5 left-4 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-lg font-medium transition-all active:scale-90"
            aria-label="Go Back"
          >
            ←
          </button>

          <button
            onClick={handleShare}
            className="absolute top-5 right-4 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-[16px] transition-all active:scale-90"
            aria-label="Share Storefront"
          >
            ↗
          </button>

          {/* Hero Content inside gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-7 flex flex-col">
            {shop.avatar_url || shop.logo_url ? (
              <img
                src={shop.avatar_url || shop.logo_url}
                className="w-[52px] h-[52px] rounded-full border-2 border-white/30 object-cover mb-3.5"
                alt={`${shop.name} Logo`}
                referrerPolicy="no-referrer"
              />
            ) : null}

            <h1 className="text-white text-[40px] font-black tracking-[-1.5px] leading-none uppercase">
              {shop.name}
            </h1>

            {shop.tagline ? (
              <p className="text-white/70 text-[15px] font-normal leading-relaxed mt-1.5 max-w-[90%]">
                {shop.tagline}
              </p>
            ) : shop.description ? (
              <p className="text-white/70 text-[14px] font-normal leading-relaxed mt-1.5 max-w-[90%] line-clamp-2">
                {shop.description}
              </p>
            ) : null}

            {/* Badges/Pills Row */}
            <div className="flex flex-wrap gap-2.5 mt-4">
              <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[13px] font-medium tracking-wide">
                {shop.category || 'Fashion'}
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[13px] font-medium tracking-wide">
                📍 {shop.city || shop.suburb || shop.town || 'Harare'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. TWO MAIN CTAs SECTION */}
        <div className="p-4 flex gap-3 bg-white">
          <button
            onClick={() => handleWhatsApp()}
            className="flex-1 h-[58px] rounded-xl bg-[#25D366] text-white flex flex-col items-center justify-center leading-none transition-transform active:scale-95 shadow-[0_4px_16px_rgba(37,211,102,0.3)]"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xl">💬</span>
              <span className="text-[15px] font-bold">Order on WhatsApp</span>
            </div>
          </button>

          <button
            onClick={handleVisitShop}
            className="flex-1 h-[58px] rounded-xl bg-[#0A0A0A] text-white flex flex-col items-center justify-center leading-none transition-transform active:scale-95"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[18px]">📍</span>
              <span className="text-[15px] font-bold">Visit Shop</span>
            </div>
          </button>
        </div>

        {/* 3. ANNOUNCEMENT BAR */}
        {shop.pickup_available && (
          <div className="w-full bg-[#0A0A0A] py-2.5 px-5 flex items-center justify-center gap-2">
            <span className="text-sm select-none">📦</span>
            <span className="text-white text-[13px] font-medium leading-none">
              {shop.pickup_label || `Pickup available in ${shop.city || shop.town || 'Harare'}`}
            </span>
          </div>
        )}

        {/* 4. COLLECTIONS BAR */}
        {collections.length > 0 && (
          <div className="pt-8 pb-4 bg-white">
            <div className="px-4 mb-4 flex justify-between items-center">
              <span className="text-[#0A0A0A] font-black text-[13px] tracking-[2px] uppercase">
                Collections
              </span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto px-4 no-scrollbar">
              {collections.map(colName => {
                const isActive = activeCollection === colName;
                const countOfItems = colName === 'All'
                  ? products.length
                  : products.filter(p => p.collection === colName).length;

                return (
                  <button
                    key={colName}
                    onClick={() => setActiveCollection(colName)}
                    className={`h-[40px] px-5 rounded-full flex items-center leading-none flex-shrink-0 transition-all select-none ${
                      isActive ? 'bg-[#0A0A0A] text-white font-bold' : 'bg-[#F5F5F5] text-[#0A0A0A] font-medium'
                    }`}
                  >
                    <span className="text-sm">{colName}</span>
                    <span className={`text-[12px] ml-1.5 font-bold ${isActive ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
                      ({countOfItems})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. SEARCH BAR (Minimalist) */}
        <div className="px-4 pb-2 bg-white">
          <div className="h-11 rounded-xl bg-[#F5F5F5] flex items-center px-3.5 gap-2.5">
            <span className="text-[#9E9E9E] text-[16px] select-none">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 h-full bg-transparent border-none outline-none text-[#0A0A0A] text-[15px] placeholder:text-[#9E9E9E]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-zinc-400 p-1 text-[13px] font-bold">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 6. FEATURED DROP */}
        {featuredProducts.length > 0 && (
          <div className="bg-[#F5F5F5] py-8 px-4 mt-4">
            <div className="mb-1 text-[#0A0A0A] font-bold text-[11px] tracking-[3px] uppercase">
              NEW DROP
            </div>
            <h2 className="text-[#0A0A0A] font-black text-3xl tracking-[-1px] mb-5">
              Latest arrivals
            </h2>

            {/* horizontal snap scroll for multiple featured drops */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
              {featuredProducts.map(featured => {
                const sizesLeft = featured.sizes?.map((sz: any) => typeof sz === 'string' ? sz : sz.size) || [];
                const discountRatio = featured.compare_price ? Math.round(((featured.compare_price - featured.price) / featured.compare_price) * 100) : 0;

                return (
                  <div
                    key={featured.id}
                    onClick={() => handleProductClick(featured)}
                    className="w-[85vw] max-w-[360px] flex-shrink-0 snap-start cursor-pointer bg-white"
                  >
                    <div className="w-full h-[420px] bg-zinc-100 relative overflow-hidden">
                      {featured.images?.[0] ? (
                        <img
                          src={featured.images[0]}
                          className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                          alt={featured.name}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#0A0A0A] flex items-center justify-center">
                          <span className="text-white text-[80px] font-black leading-none uppercase select-none">
                            {shop.name.charAt(0)}
                          </span>
                        </div>
                      )}

                      {/* Sale Badge */}
                      {featured.compare_price > featured.price && (
                        <div className="absolute top-2.5 left-2.5 bg-[#E53935] text-white text-[11px] font-bold px-2.5 py-1 tracking-wider uppercase">
                          -{discountRatio}% OFF
                        </div>
                      )}
                    </div>

                    <div className="pt-4 pb-3 bg-white px-1">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col flex-1 pl-1">
                          <h4 className="text-[#0A0A0A] font-bold text-[18px] tracking-[-0.3px] leading-tight line-clamp-1">
                            {featured.name}
                          </h4>
                          {sizesLeft.length > 0 && (
                            <p className="text-[#6B6B6B] text-[12px] font-normal leading-none mt-2">
                              {sizesLeft.slice(0, 5).join(' · ')}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end pr-1">
                          <span className="text-[#0A0A0A] font-black text-xl leading-none">
                            ${featured.price}
                          </span>
                          {featured.compare_price && (
                            <span className="text-[#9E9E9E] text-sm font-medium line-through mt-1">
                              ${featured.compare_price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. PRODUCT CATALOGUE GRID */}
        <div className="py-8 px-4 bg-white">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[#0A0A0A] font-black text-2xl tracking-[-0.5px]">
              {activeCollection === 'All' ? 'All Products' : activeCollection}
            </h3>
            <span className="text-[#6B6B6B] font-medium text-sm">
              {filteredProducts.length} pieces
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[#0A0A0A] font-extrabold text-lg tracking-tight">No products found</p>
              <p className="text-[#6B6B6B] text-sm mt-1">Check back soon for new drops.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 items-start">
              {/* Left Column (tall images, e.g. 220px) */}
              <div className="flex flex-col gap-6">
                {leftCol.map(p => {
                  const sizesStr = p.sizes?.map((s: any) => typeof s === 'string' ? s : s.size).slice(0, 4).join(' · ') || '';
                  const hasSale = p.compare_price && p.compare_price > p.price;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleProductClick(p)}
                      className="cursor-pointer group flex flex-col"
                    >
                      <div className="h-[220px] bg-[#F5F5F5] overflow-hidden relative">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            alt={p.name}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-[#CDCDCD]">
                            <span className="text-3xl select-none">👕</span>
                          </div>
                        )}

                        {hasSale && (
                          <span className="absolute top-2.5 left-2.5 bg-[#E53935] text-white font-bold text-[11px] px-2.5 py-1 tracking-wider uppercase">
                            SALE
                          </span>
                        )}

                        {p.is_featured && p.is_featured === true && (
                          <span className="absolute top-2.5 right-2.5 bg-[#0A0A0A] text-white font-bold text-[11px] px-2.5 py-1 tracking-wider uppercase">
                            NEW
                          </span>
                        )}
                      </div>

                      <div className="pt-3 flex flex-col">
                        <h4 className="text-[#0A0A0A] font-bold text-[14px] leading-snug tracking-[-0.2px] line-clamp-2">
                          {p.name}
                        </h4>

                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-[#0A0A0A] font-black text-[15px]">
                            ${p.price}
                          </span>
                          {hasSale && (
                            <span className="text-[#9E9E9E] font-medium text-xs line-through">
                              ${p.compare_price}
                            </span>
                          )}
                        </div>

                        {sizesStr && (
                          <div className="text-[#6B6B6B] text-[12px] mt-1 tracking-normal font-normal">
                            {sizesStr}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column (offset 32px down) */}
              <div className="flex flex-col gap-6 mt-8">
                {rightCol.map(p => {
                  const sizesStr = p.sizes?.map((s: any) => typeof s === 'string' ? s : s.size).slice(0, 4).join(' · ') || '';
                  const hasSale = p.compare_price && p.compare_price > p.price;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleProductClick(p)}
                      className="cursor-pointer group flex flex-col"
                    >
                      <div className="h-[180px] bg-[#F5F5F5] overflow-hidden relative">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            alt={p.name}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-[#CDCDCD]">
                            <span className="text-3xl select-none">👕</span>
                          </div>
                        )}

                        {hasSale && (
                          <span className="absolute top-2.5 left-2.5 bg-[#E53935] text-white font-bold text-[11px] px-2.5 py-1 tracking-wider uppercase">
                            SALE
                          </span>
                        )}

                        {p.is_featured && p.is_featured === true && (
                          <span className="absolute top-2.5 right-2.5 bg-[#0A0A0A] text-white font-bold text-[11px] px-2.5 py-1 tracking-wider uppercase">
                            NEW
                          </span>
                        )}
                      </div>

                      <div className="pt-3 flex flex-col">
                        <h4 className="text-[#0A0A0A] font-bold text-[14px] leading-snug tracking-[-0.2px] line-clamp-2">
                          {p.name}
                        </h4>

                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-[#0A0A0A] font-black text-[15px]">
                            ${p.price}
                          </span>
                          {hasSale && (
                            <span className="text-[#9E9E9E] font-medium text-xs line-through">
                              ${p.compare_price}
                            </span>
                          )}
                        </div>

                        {sizesStr && (
                          <div className="text-[#6B6B6B] text-[12px] mt-1 tracking-normal font-normal">
                            {sizesStr}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 8. TRUST SECTION */}
        <div className="bg-[#F5F5F5] py-8 px-4 mt-6">
          <div className="text-[#0A0A0A] font-bold text-[11px] tracking-[3px] uppercase mb-5">
            FIND US
          </div>

          <div className="flex flex-col gap-2.5">
            {/* PICKUP CARD */}
            {shop.pickup_available && (
              <div className="bg-white rounded-xl p-4.5 flex gap-4 items-center">
                <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-xl">
                  📦
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-[#6B6B6B] text-[11px] uppercase tracking-wider font-bold mb-0.5">
                    PICKUP
                  </span>
                  <span className="text-[#0A0A0A] font-black text-[15px] leading-tight">
                    {shop.pickup_label || `Available in ${shop.city || shop.suburb || 'Harare'}`}
                  </span>
                  <span className="text-zinc-400 text-[13px] font-medium mt-0.5">
                    Collect your order in person
                  </span>
                </div>
              </div>
            )}

            {/* LOCATION CARD */}
            {(shop.town || shop.city || shop.suburb) && (
              <div
                onClick={handleVisitShop}
                className="bg-white rounded-xl p-4.5 flex gap-4 items-center cursor-pointer transition-transform duration-150 active:scale-98"
              >
                <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-xl">
                  📍
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-[#6B6B6B] text-[11px] uppercase tracking-wider font-bold mb-0.5">
                    LOCATION
                  </span>
                  <span className="text-[#0A0A0A] font-black text-[15px] leading-tight">
                    {[shop.suburb, shop.city || shop.town].filter(Boolean).join(', ')}
                  </span>
                  <span className="text-zinc-400 text-[13px] font-medium mt-0.5">
                    {shop.physical_address || 'Zimbabwe'}
                  </span>
                </div>
                <span className="text-xl text-zinc-400">→</span>
              </div>
            )}

            {/* TRADING HOURS CARD */}
            <div className="bg-white rounded-xl p-4.5 flex gap-4 items-center">
              <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-xl">
                🕐
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-[#6B6B6B] text-[11px] uppercase tracking-wider font-bold mb-0.5">
                  HOURS
                </span>
                <span className="text-[#0A0A0A] font-black text-[15px] leading-tight">
                  {shop.hours_open || 'Mon-Sat: 8am – 6pm'}
                </span>
                <span className="text-zinc-400 text-[13px] font-medium mt-0.5 flex items-center gap-1.5">
                  {openNow ? (
                    <>
                      <span>Open now</span>
                      <span className="w-2.5 h-2.5 bg-[#22C55E] rounded-full inline-block" />
                    </>
                  ) : (
                    <>
                      <span>Closed</span>
                      <span className="w-2.5 h-2.5 bg-[#E53935] rounded-full inline-block" />
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* WHATSAPP CARD */}
            {shop.whatsapp && (
              <div
                onClick={() => handleWhatsApp()}
                className="bg-white rounded-xl p-4.5 flex gap-4 items-center cursor-pointer transition-transform duration-150 active:scale-98"
              >
                <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-xl">
                  💬
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-[#6B6B6B] text-[11px] uppercase tracking-wider font-bold mb-0.5">
                    WHATSAPP
                  </span>
                  <span className="text-[#0A0A0A] font-black text-[15px] leading-tight">
                    {shop.whatsapp}
                  </span>
                  <span className="text-zinc-400 text-[13px] font-medium mt-0.5">
                    Tap to send a message
                  </span>
                </div>
                <span className="text-xl text-zinc-400">→</span>
              </div>
            )}

            {/* INSTAGRAM CARD */}
            {shop.instagram_url && (
              <div
                onClick={() => {
                  const ins = (shop.instagram_url || '').replace('@', '');
                  const cleanInsta = ins.startsWith('http') ? ins : `https://instagram.com/${ins}`;
                  window.open(cleanInsta, '_blank');
                }}
                className="bg-white rounded-xl p-4.5 flex gap-4 items-center cursor-pointer transition-transform duration-150 active:scale-98"
              >
                <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-xl">
                  📸
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-[#6B6B6B] text-[11px] uppercase tracking-wider font-bold mb-0.5">
                    INSTAGRAM
                  </span>
                  <span className="text-[#0A0A0A] font-black text-[15px] leading-tight">
                    @{shop.instagram_url.split('/').pop().replace('@', '')}
                  </span>
                  <span className="text-zinc-400 text-[13px] font-medium mt-0.5">
                    Follow for new drops
                  </span>
                </div>
                <span className="text-xl text-zinc-400">→</span>
              </div>
            )}
          </div>

          {/* TWO PRIMARY CONTEXT ACTIONS AT BASE OF TRUST */}
          <div className="mt-5 space-y-2.5">
            <button
              onClick={() => handleWhatsApp()}
              className="w-full h-13.5 rounded-xl bg-[#25D366] text-white font-bold flex items-center justify-center gap-2.5 transition-transform active:scale-98 shadow-[0_4px_16px_rgba(37,211,102,0.25)]"
            >
              <span className="text-xl select-none">💬</span>
              <span>Chat on WhatsApp</span>
            </button>

            <button
              onClick={handleVisitShop}
              className="w-full h-12.5 rounded-xl bg-white border-1.5 border-[#E8E8E8] text-[#0A0A0A] font-bold flex items-center justify-center gap-2.5 transition-transform active:scale-98"
            >
              <span className="text-[17px] select-none">📍</span>
              <span>Get Directions</span>
            </button>
          </div>
        </div>

        {/* 9. BRAND FOOTER */}
        <div className="bg-[#0A0A0A] py-8 px-5 flex flex-col text-slate-100 mt-auto">
          <h2 className="text-white font-black text-3xl tracking-[-1px] uppercase">
            {shop.name}
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed mt-2.5 max-w-[260px]">
            {shop.tagline || shop.description || 'Curated premium quality drops on ThreadZW.'}
          </p>
          
          <div className="flex items-center gap-1.5 mt-8 border-t border-zinc-900 pt-7">
            <span className="text-zinc-600 text-xs font-normal">Built on</span>
            <a
              href="https://threadzw.vercel.app"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://threadzw.vercel.app';
              }}
              className="text-zinc-400 text-xs font-bold underline cursor-pointer"
            >
              ThreadZW
            </a>
          </div>
        </div>

        {/* 10. PRODUCT DETAIL BOTTOM SHEET */}
        <AnimatePresence>
          {selectedProduct && (
            <>
              {/* BACKDROP OVERLAY */}
              <motion.div
                key="detail-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProduct(null)}
                className="fixed inset-0 bg-black z-[200]"
              />

              {/* SHEET SLIDEUP CONTAINER */}
              <motion.div
                key="detail-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed bottom-0 left-0 right-0 max-h-[92vh] bg-white rounded-t-2xl z-[201] overflow-y-auto w-full max-w-[430px] mx-auto flex flex-col shadow-[0_-8px_32px_rgba(0,0,0,0.15)] select-none cursor-default"
              >
                {/* Close Handle element */}
                <div
                  onClick={() => setSelectedProduct(null)}
                  className="w-10 h-1 bg-[#E8E8E8] rounded-full mx-auto mt-3 mb-2 cursor-pointer"
                />

                {/* Main Product Image Carousel */}
                <div className="w-full h-[360px] bg-[#F5F5F5] relative overflow-hidden flex-shrink-0">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={selectedProduct.images[activeImageIdx]}
                      className="w-full h-full object-cover"
                      alt={selectedProduct.name}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                      <span className="text-6xl select-none">📦</span>
                    </div>
                  )}

                  {/* Dot Indicators for Images carousel */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/10 backdrop-blur-md py-1.5 px-3 rounded-full">
                      {selectedProduct.images.map((_: any, idx: number) => {
                        const isCarouselActive = idx === activeImageIdx;
                        return (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIdx(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              isCarouselActive ? 'bg-[#0A0A0A]' : 'bg-black/20'
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Horizontal swipe navigation buttons for images list */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-3 pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx(prev => prev > 0 ? prev - 1 : selectedProduct.images.length - 1);
                        }}
                        className="w-8 h-8 rounded-full bg-white/80 border border-zinc-200/50 flex items-center justify-center text-lg font-black pointer-events-auto active:scale-90 shadow-sm"
                        aria-label="Previous image"
                      >
                        ‹
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx(prev => prev < selectedProduct.images.length - 1 ? prev + 1 : 0);
                        }}
                        className="w-8 h-8 rounded-full bg-white/80 border border-zinc-200/50 flex items-center justify-center text-lg font-black pointer-events-auto active:scale-90 shadow-sm"
                        aria-label="Next image"
                      >
                        ›
                      </button>
                    </div>
                  )}

                  {/* Absolute positioning close Button */}
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md border border-zinc-200/50 flex items-center justify-center text-[#0A0A0A] font-bold text-sm shadow-sm transition-all active:scale-90"
                    aria-label="Close"
                  >
                    ✕
                  </button>

                  {/* Save wishlist Indicator Button */}
                  <button
                    onClick={(e) => toggleSave(selectedProduct, e)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md border border-zinc-200/50 flex items-center justify-center shadow-sm transition-all active:scale-90"
                    aria-label="Save to wishlist"
                  >
                    {savedProducts.includes(selectedProduct.id) ? (
                      <span className="text-[#E53935] text-lg leading-none">♥</span>
                    ) : (
                      <span className="text-zinc-300 text-lg leading-none">♡</span>
                    )}
                  </button>
                </div>

                {/* Swipe image thumbnails bar if multi images */}
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-1.5 no-scrollbar bg-white">
                    {selectedProduct.images.map((img: string, i: number) => {
                      const isFocused = i === activeImageIdx;
                      return (
                        <div
                          key={i}
                          onClick={() => setActiveImageIdx(i)}
                          className={`w-14 h-14 bg-zinc-100 flex-shrink-0 border-2 overflow-hidden cursor-pointer ${
                            isFocused ? 'border-[#0A0A0A]' : 'border-transparent'
                          }`}
                        >
                          <img src={img} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Details Meta panel */}
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[#6B6B6B] text-[11px] font-black uppercase tracking-[2px] mb-2 leading-none">
                    {shop.name}
                  </span>

                  <h3 className="text-[#0A0A0A] font-black text-2xl tracking-[-0.5px] leading-tight">
                    {selectedProduct.name}
                  </h3>

                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[#0A0A0A] font-black text-2xl leading-none">
                      ${selectedProduct.price}
                    </span>
                    {selectedProduct.compare_price && (
                      <>
                        <span className="text-[#9E9E9E] font-medium text-[16px] line-through">
                          ${selectedProduct.compare_price}
                        </span>
                        <span className="bg-[#E53935] text-white text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase">
                          SALE
                        </span>
                      </>
                    )}
                  </div>

                  <div className="h-px bg-[#E8E8E8] w-full my-5" />

                  {/* Size variants list mapping */}
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div className="flex flex-col mb-5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[#0A0A0A] font-bold text-[12px] uppercase tracking-[1.5px] leading-none">
                          SIZE
                        </span>
                        <span className="text-[#6B6B6B] text-xs font-medium underline cursor-pointer">
                          Size guide
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.sizes.map((sz: any, i: number) => {
                          const sizeStr = typeof sz === 'string' ? sz : sz.size;
                          const qty = typeof sz === 'string' ? 1 : sz.quantity;
                          const isSelectedSize = selectedSize === sizeStr;
                          const isOutOfStock = qty <= 0;

                          return (
                            <button
                              key={i}
                              disabled={isOutOfStock}
                              onClick={() => setSelectedSize(sizeStr)}
                              className={`h-11 min-w-[52px] px-2.5 flex items-center justify-center font-bold text-sm transition-all border ${
                                isSelectedSize
                                  ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                                  : isOutOfStock
                                  ? 'bg-[#F5F5F5] border-[#E8E8E8] text-zinc-300 cursor-not-allowed border-dashed'
                                  : 'bg-white border-[#E8E8E8] text-[#0A0A0A]'
                              }`}
                            >
                              {sizeStr}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Description area */}
                  {selectedProduct.description && (
                    <div className="flex flex-col mb-5">
                      <span className="text-[#0A0A0A] font-bold text-[12px] uppercase tracking-[1.5px] mb-2.5">
                        DESCRIPTION
                      </span>
                      <p className="text-[#6B6B6B] text-sm leading-relaxed whitespace-pre-wrap font-normal">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}

                  {/* Double Sticky Base Button Area */}
                  <div className="border-t border-[#E8E8E8] bg-white pt-5 pb-6 mt-auto">
                    <button
                      onClick={handleOrderWhatsApp}
                      className="w-full h-14 bg-[#25D366] text-white font-bold text-[17px] flex items-center justify-center gap-2.5 transition-transform active:scale-[0.98] shadow-[0_4px_20px_rgba(37,211,102,0.3)] rounded-xl"
                    >
                      <span className="text-xl">💬</span>
                      <span>Order on WhatsApp</span>
                    </button>

                    <button
                      onClick={handleVisitShop}
                      className="w-full h-12.5 bg-white border-1.5 border-[#0A0A0A] text-[#0A0A0A] font-bold text-[15px] flex items-center justify-center gap-2 mt-2.5 transition-transform active:scale-[0.98] rounded-xl"
                    >
                      <span>📍</span>
                      <span>Visit Shop to Buy</span>
                    </button>
                  </div>

                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

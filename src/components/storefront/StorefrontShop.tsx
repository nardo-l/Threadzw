// src/components/storefront/StorefrontShop.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowUpDown, Check, ShoppingBag, MessageCircle } from 'lucide-react';
import { ProductImage } from '../ui/ShopImage';

interface StorefrontShopProps {
  shop: any;
  products: any[];
  categories: any[];
  onNavigateToPage: (page: any, params?: any) => void;
  initialCategory?: string;
  initialSort?: string;
}

export const StorefrontShop: React.FC<StorefrontShopProps> = ({
  shop,
  products,
  categories,
  onNavigateToPage,
  initialCategory = 'all',
  initialSort = 'newest'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  // Infinite Scroll States
  const [visibleCount, setVisibleCount] = useState(8);
  const [loadingMore, setLoadingMore] = useState(false);

  // Sync with initial props
  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setSortBy(initialSort);
  }, [initialSort]);

  // List of Sort Options
  const sortOptions = [
    { value: 'newest', label: 'Newest Releases' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'best-selling', label: 'Popularity' }
  ];

  // Process & Filter Products
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.is_published !== false);

    // 1. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    // 2. Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(p => 
        p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 3. Sort products
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'best-selling') {
      result.sort((a, b) => {
        const featA = a.is_featured ? 1 : 0;
        const featB = b.is_featured ? 1 : 0;
        return featB - featA;
      });
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Simulate Infinite Scroll Trigger
  const handleLoadMore = () => {
    if (visibleCount >= filteredProducts.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 8);
      setLoadingMore(false);
    }, 600);
  };

  const hasMore = visibleCount < filteredProducts.length;

  return (
    <div className="space-y-6 px-4 pb-20 select-none text-left bg-white min-h-screen">
      {/* ----------------- SHOP HEADER & SEARCH ----------------- */}
      <div className="space-y-1.5 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider store-accent-text font-sans">
          Boutique Catalog
        </span>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
          Shop Products
        </h2>
      </div>

      {/* Modern Live Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(8); // reset when searching
          }}
          placeholder="Search items, categories, descriptions..."
          className="w-full text-xs font-medium bg-zinc-50 border border-zinc-200/60 focus:store-accent-border focus:bg-white focus:ring-1 store-accent-ring outline-none rounded-xl pl-10 pr-8 py-2.5 text-zinc-900 placeholder-zinc-400 transition-colors font-sans"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* ----------------- STICKY FILTERS & SORT ROW ----------------- */}
      <div className="sticky top-[52px] z-20 bg-white/95 backdrop-blur-md py-2.5 border-b border-zinc-100 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
        {/* Category horizontal filters */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-grow">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setVisibleCount(8);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'store-accent-bg text-white store-accent-border shadow-xs'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            All
          </button>
          {categories.map((cat, i) => (
            <button
              key={`cat-filter-${cat.id || i}`}
              onClick={() => {
                setSelectedCategory(cat.name);
                setVisibleCount(8);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 cursor-pointer ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'store-accent-bg text-white store-accent-border shadow-xs'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort Trigger */}
        <div className="relative shrink-0 pr-1">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort
          </button>

          <AnimatePresence>
            {showSortDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-1.5 w-44 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-50 p-1"
                >
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setVisibleCount(8);
                        setShowSortDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50 store-accent-hover-text flex items-center justify-between transition-colors"
                    >
                      {opt.label}
                      {sortBy === opt.value && <Check className="w-3.5 h-3.5 store-accent-text" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ----------------- PRODUCTS GRID ----------------- */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center text-zinc-400 space-y-3">
          <ShoppingBag className="w-10 h-10 mx-auto text-zinc-300 animate-pulse" />
          <p className="text-xs font-medium">No active apparel matches your selection.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3.5">
            {filteredProducts.slice(0, visibleCount).map((p, idx) => {
              const hasDiscount = (p.compare_at_price || p.original_price) > p.price;
              const originalPriceVal = p.compare_at_price || p.original_price;
              const isSoldOut = p.status === 'sold_out' || p.total_stock <= 0;
              
              return (
                <motion.div
                  layout
                  whileTap={{ scale: 0.98 }}
                  key={`shop-item-${p.id || idx}`}
                  onClick={() => onNavigateToPage('product', { productId: p.id })}
                  className="group cursor-pointer flex flex-col bg-white border border-zinc-150/80 rounded-2xl p-1.5 shadow-2xs hover:shadow-xs transition-all duration-250 relative"
                >
                  <div className="aspect-[4/5] bg-zinc-50 w-full rounded-xl overflow-hidden relative">
                    <ProductImage product={p} shop={shop} index={0} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
                    
                    {hasDiscount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm">
                        -{Math.round(((originalPriceVal - p.price) / originalPriceVal) * 100)}%
                      </div>
                    )}
                    
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex items-center justify-center">
                        <span className="text-[9px] font-bold tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md shadow-2xs">
                          SOLD OUT
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-1.5 flex flex-col flex-1 justify-between text-left select-none">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                        {p.category || 'Apparel'}
                      </span>
                      <h4 className="font-semibold text-xs text-zinc-800 line-clamp-1 group-store-accent-hover-text transition-colors">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-2.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-zinc-900">${p.price}</span>
                        {hasDiscount && (
                          <span className="text-[10px] text-zinc-400 line-through">${originalPriceVal}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToPage('product', { productId: p.id });
                        }}
                        className="mt-2 w-full py-2 store-accent-bg text-white rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors duration-200 flex items-center justify-center gap-1 cursor-pointer text-center"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" /> Choose options
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ----------------- INFINITE SCROLL / LOAD MORE ----------------- */}
          {hasMore && (
            <div className="flex flex-col items-center justify-center pt-4">
              {loadingMore ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold store-accent-text tracking-wide animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-zinc-200 border-t-green-600 rounded-full animate-spin" />
                  Loading Drops...
                </div>
              ) : (
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl hover:bg-zinc-100 transition-all cursor-pointer"
                >
                  Load More Products
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// src/components/storefront/StorefrontShop.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Check, ArrowUpDown, Grid, ShoppingBag } from 'lucide-react';
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
  const [visibleCount, setVisibleCount] = useState(6);
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
    { value: 'newest', label: 'Newest drops' },
    { value: 'price-asc', label: 'Price: Low → High' },
    { value: 'price-desc', label: 'Price: High → Low' },
    { value: 'best-selling', label: 'Best Selling' }
  ];

  // Process & Filter Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

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
      setVisibleCount(prev => prev + 6);
      setLoadingMore(false);
    }, 800);
  };

  const hasMore = visibleCount < filteredProducts.length;

  return (
    <div className="space-y-6 px-5 pb-16 select-none text-left">
      {/* ----------------- SHOP HEADER & SEARCH ----------------- */}
      <div className="space-y-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C6FF00] font-mono">Boutique Collection</span>
        <h2 className="font-syne text-2xl font-black uppercase tracking-tight text-white">Shop Drops</h2>
      </div>

      {/* Modern Live Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(6); // reset infinite scroll when searching
          }}
          placeholder="Search items, hoodies, collections..."
          className="w-full text-xs font-bold uppercase font-mono bg-neutral-900 border border-neutral-800 focus:border-[#C6FF00] outline-none rounded-full pl-11 pr-5 py-3.5 text-white placeholder-neutral-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* ----------------- FILTERS & SORT ROW ----------------- */}
      <div className="flex items-center justify-between gap-4 border-b border-neutral-900 pb-3">
        {/* Category horizontal filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-grow">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setVisibleCount(6);
            }}
            className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#C6FF00] text-black border-[#C6FF00]'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            All
          </button>
          {categories.map((cat, i) => (
            <button
              key={`cat-filter-${cat.id || i}`}
              onClick={() => {
                setSelectedCategory(cat.name);
                setVisibleCount(6);
              }}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all shrink-0 cursor-pointer ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-[#C6FF00] text-black border-[#C6FF00]'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort Trigger */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
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
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50 p-1"
                >
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setVisibleCount(6);
                        setShowSortDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center justify-between"
                    >
                      {opt.label}
                      {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-[#C6FF00]" />}
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
        <div className="py-20 text-center text-neutral-500 space-y-3">
          <ShoppingBag className="w-12 h-12 mx-auto text-neutral-800 animate-pulse" />
          <p className="text-xs font-mono uppercase tracking-widest">No garments match selection</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.slice(0, visibleCount).map((p, idx) => (
              <motion.div
                layout
                whileTap={{ scale: 0.98 }}
                key={`shop-item-${p.id || idx}`}
                onClick={() => onNavigateToPage('product', { productId: p.id })}
                className="group cursor-pointer flex flex-col justify-between bg-neutral-900/30 border border-neutral-800/50 hover:border-[#C6FF00]/30 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <div className="aspect-[3/4] bg-neutral-950 w-full overflow-hidden relative">
                  <ProductImage product={p} index={0} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                  
                  {p.original_price && p.original_price > p.price && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                      -{Math.round(((p.original_price - p.price) / p.original_price) * 100)}%
                    </div>
                  )}
                  
                  {(p.status === 'sold_out' || p.total_stock <= 0) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500 font-mono border border-red-500/30 px-2 py-1 bg-black/40 rounded">
                        SOLD OUT
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-3.5 space-y-1 text-left border-t border-neutral-900">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#C6FF00] block">{p.category}</span>
                  <h4 className="text-xs font-bold uppercase truncate text-neutral-200 group-hover:text-white transition-colors">{p.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white font-mono">${p.price}</span>
                    {p.original_price && p.original_price > p.price && (
                      <span className="text-[10px] text-neutral-600 line-through font-mono">${p.original_price}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ----------------- INFINITE SCROLL / LOAD MORE ----------------- */}
          {hasMore && (
            <div className="flex flex-col items-center justify-center pt-2">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-[10px] uppercase font-mono text-[#C6FF00] tracking-widest animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-neutral-800 border-t-[#C6FF00] rounded-full animate-spin" />
                  Loading More Releases...
                </div>
              ) : (
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-3 bg-neutral-900 border border-neutral-800 text-[10px] font-extrabold uppercase tracking-widest rounded-xl text-neutral-300 hover:text-white hover:border-neutral-700 transition-all cursor-pointer"
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

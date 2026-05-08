import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search as SearchIcon, 
  X, 
  Clock, 
  ArrowRight, 
  Heart, 
  Bookmark, 
  SlidersHorizontal,
  ChevronDown,
  Radio
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import { useSearch } from '../hooks/useSearch';
import { ScreenError } from '../components/ui/ScreenError';
import { ProductCardShimmer } from '../components/ui/Shimmer';

import { PRODUCT_CATEGORIES } from '../constants';

// --- Types ---
interface Filters {
  category: string[];
  minPrice: string;
  maxPrice: string;
  condition: string[];
  area: string;
  inStockOnly: boolean;
}

const TRENDING = ['Air Force 1', 'Vintage Denim', 'Jordan 1', 'Samsung A55', 'Cargo Pants', 'Timberland', 'Essentials Tee', 'Gold Chain'];

export const Search: React.FC = () => {
  const t = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Products' | 'Shops'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : ['Jordan 1', 'Samsung', 'Vintage'];
  });

  const [filters, setFilters] = useState<Filters>({
    category: [],
    minPrice: '',
    maxPrice: '',
    condition: [],
    area: 'All',
    inStockOnly: false
  });

  const { results, loading, error, refetch, toggleLike, toggleSave } = useSearch(isSubmitted ? query : '', {
    category: filters.category,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    condition: filters.condition,
    area: filters.area !== 'All' ? filters.area : undefined,
    inStockOnly: filters.inStockOnly
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    setQuery(term);
    setIsSubmitted(true);
    setIsTyping(false);
    if (!recentSearches.includes(term)) {
      setRecentSearches(prev => [term, ...prev].slice(0, 6));
    }
  };

  const clearRecent = () => setRecentSearches([]);
  const removeRecent = (term: string) => setRecentSearches(prev => prev.filter(t => t !== term));

  const suggestions = useMemo(() => {
    if (!query || isSubmitted) return [];
    const lower = query.toLowerCase();
    // In a real app, we might fetch suggestions from the backend
    return TRENDING.filter(t => t.toLowerCase().includes(lower)).slice(0, 5);
  }, [query, isSubmitted]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category.length > 0) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.condition.length > 0) count++;
    if (filters.area !== 'All') count++;
    if (filters.inStockOnly) count++;
    return count;
  }, [filters]);

  return (
    <div className="flex flex-col min-h-screen pb-20" style={{ background: t.bg_primary }}>
      {/* Top Bar */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b max-w-[430px] mx-auto"
        style={{ background: `${t.bg_primary}CC`, borderColor: t.border_secondary }}
      >
        <div className="p-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.accent }} size={18} />
            <input 
              ref={inputRef}
              type="text"
              placeholder="Search products, shops, brands..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsTyping(true);
                setIsSubmitted(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              className="w-full border rounded-pill py-3 pl-12 pr-10 text-sm focus:outline-none transition-all"
              style={{ 
                background: t.bg_input, 
                borderColor: t.border_primary, 
                color: t.text_primary,
                boxShadow: t.shadow
              }}
            />
            {query && (
              <button 
                onClick={() => {
                  setQuery('');
                  setIsTyping(false);
                  setIsSubmitted(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: t.text_tertiary }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="text-sm font-sans font-medium"
            style={{ color: t.accent }}
          >
            Cancel
          </button>
        </div>

        {/* Filter Bar (Results State) */}
        {isSubmitted && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3">
            <FilterPill label="All" active={activeTab === 'All'} onClick={() => setActiveTab('All')} />
            <FilterPill label="Products" active={activeTab === 'Products'} onClick={() => setActiveTab('Products')} />
            <FilterPill label="Shops" active={activeTab === 'Shops'} onClick={() => setActiveTab('Shops')} />
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border rounded-pill text-xs font-mono relative"
              style={{ background: t.bg_card, borderColor: t.border_primary, color: t.text_primary }}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-4 h-4 text-[10px] flex items-center justify-center rounded-full border"
                  style={{ background: t.accent, color: 'white', borderColor: t.bg_primary }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        )}
      </header>

      <main className="pt-24 px-6 flex flex-col gap-8">
        {/* Default State */}
        {!query && !isSubmitted && (
          <>
            {recentSearches.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: t.accent }}>Recent</span>
                  <button onClick={clearRecent} className="text-[10px] font-mono uppercase" style={{ color: t.accent }}>Clear all</button>
                </div>
                <div className="flex flex-col">
                  {recentSearches.map(term => (
                    <div key={term} className="flex items-center justify-between py-3 border-b group" style={{ borderColor: t.border_secondary }}>
                      <button 
                        onClick={() => handleSearch(term)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <Clock size={16} style={{ color: t.text_tertiary }} />
                        <span className="text-sm font-sans" style={{ color: t.text_primary }}>{term}</span>
                      </button>
                      <button onClick={() => removeRecent(term)} className="p-1" style={{ color: t.text_tertiary }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: t.accent }}>Trending 🔥</span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6">
                {TRENDING.map((term, i) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className={`px-5 py-2 rounded-pill text-xs font-mono whitespace-nowrap transition-all border`}
                    style={{
                      background: i < 3 ? t.accent : t.bg_card,
                      color: i < 3 ? 'white' : t.text_secondary,
                      borderColor: i < 3 ? t.accent : t.border_primary
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Typing State (Suggestions) */}
        {isTyping && suggestions.length > 0 && (
          <div className="flex flex-col">
            {suggestions.map(term => {
              const lowerQuery = query.toLowerCase();
              const index = term.toLowerCase().indexOf(lowerQuery);
              const before = term.substring(0, index);
              const match = term.substring(index, index + query.length);
              const after = term.substring(index + query.length);

              return (
                <div key={term} className="flex items-center justify-between py-4 border-b" style={{ borderColor: t.border_secondary }}>
                  <button 
                    onClick={() => handleSearch(term)}
                    className="flex items-center gap-4 flex-1 text-left"
                  >
                    <SearchIcon size={16} style={{ color: t.text_tertiary }} />
                    <span className="text-sm font-sans" style={{ color: t.text_primary }}>
                      {before}
                      <span className="font-bold" style={{ color: t.accent }}>{match}</span>
                      {after}
                    </span>
                  </button>
                  <button onClick={() => setQuery(term)} style={{ color: t.text_tertiary }}>
                    <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Results State */}
        {isSubmitted && (
          <div className="flex flex-col gap-8">
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <ProductCardShimmer key={i} />)}
              </div>
            ) : error ? (
              <ScreenError 
                icon={<Radio size={32} />}
                heading="Search Error"
                body={error}
                onRetry={refetch}
              />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-sans" style={{ color: t.text_secondary }}>
                    {activeTab === 'All' ? results.products.length + results.shops.length : activeTab === 'Products' ? results.products.length : results.shops.length} results for '{query}'
                  </span>
                </div>

                {/* No Results */}
                {results.products.length === 0 && results.shops.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                    <div className="relative">
                      <SearchIcon size={64} className="opacity-20" style={{ color: t.text_tertiary }} />
                      <X size={24} className="absolute top-0 right-0" style={{ color: t.accent }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-syne font-bold" style={{ color: t.accent }}>'{query}'</h3>
                      <p className="text-lg font-syne font-bold mt-1" style={{ color: t.text_primary }}>No results found</p>
                      <p className="text-sm font-sans mt-2" style={{ color: t.text_secondary }}>Try a different search or browse by category</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 w-full mt-6">
                      {['All', 'Sneakers', 'Clothing', 'Thrift', 'Electronics', 'Accessories'].map(cat => (
                        <button 
                          key={cat} 
                          className="py-3 border rounded-xl text-[10px] font-mono uppercase tracking-wider"
                          style={{ background: t.bg_card, borderColor: t.border_primary, color: t.text_primary }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <button 
                      className="mt-4 w-full py-4 bg-transparent border font-bold rounded-button"
                      style={{ borderColor: t.border_primary, color: t.text_primary }}
                    >
                      Browse All Products
                    </button>
                  </div>
                )}

                {/* Products Grid */}
                {(activeTab === 'All' || activeTab === 'Products') && results.products.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: t.accent }}>Products</span>
                    <div className="grid grid-cols-2 gap-4">
                      {results.products.map(p => (
                        <ProductCard 
                          key={p.id} 
                          product={p} 
                          isLiked={p.isLiked}
                          isSaved={p.isSaved}
                          onLike={() => toggleLike(p.id)}
                          onSave={() => toggleSave(p.id)}
                          onClick={() => navigate(`/product/${p.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Shops List */}
                {(activeTab === 'All' || activeTab === 'Shops') && results.shops.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: t.accent }}>Shops</span>
                    <div className="flex flex-col gap-3">
                      {results.shops.map(s => (
                        <ShopCard key={s.id} shop={s} onClick={() => navigate(`/shop/${s.handle}`)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Filter Bottom Sheet */}
      <AnimatePresence>
        {isFilterOpen && (
          <FilterSheet 
            filters={filters} 
            onClose={() => setIsFilterOpen(false)} 
            onApply={(f) => {
              setFilters(f);
              setIsFilterOpen(false);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-components ---

const FilterPill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => {
  const t = useTheme();
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-6 py-2 rounded-pill text-xs font-mono transition-all border`}
      style={{
        background: active ? t.accent : t.bg_card,
        borderColor: active ? t.accent : t.border_primary,
        color: active ? 'white' : t.text_secondary
      }}
    >
      {label}
    </button>
  );
};

const ProductCard: React.FC<{ 
  product: any; 
  isLiked: boolean; 
  isSaved: boolean; 
  onLike: () => void; 
  onSave: () => void;
  onClick: () => void;
}> = ({ product, isLiked, isSaved, onLike, onSave, onClick }) => {
  const t = useTheme();
  const getStockInfo = (variants: any[]) => {
    const stock = variants?.reduce((acc, v) => acc + v.quantity, 0) || 0;
    if (stock >= 10) return { color: t.green, text: 'In Stock', bg: t.green_bg };
    if (stock > 2) return { color: t.amber, text: `Only ${stock} left`, bg: t.amber_bg };
    if (stock > 0) return { color: t.red, text: `Last ${stock}!`, bg: t.red_bg };
    return { color: t.text_tertiary, text: 'Sold Out', bg: t.bg_secondary };
  };
  const stockInfo = getStockInfo(product.variants);

  return (
    <div 
      onClick={onClick} 
      className="rounded-card overflow-hidden border group cursor-pointer relative"
      style={{ background: t.bg_card, borderColor: t.border_primary, boxShadow: t.shadow }}
    >
      <div className="h-40 relative flex items-center justify-center text-5xl overflow-hidden" style={{ background: t.bg_secondary }}>
        {product.images?.[0] ? (
          <img src={product.images[0] || undefined} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          '👟'
        )}
        {product.badge && (
          <span 
            className="absolute top-2 left-2 text-[8px] font-mono font-bold px-2 py-1 rounded-pill"
            style={{ background: t.accent, color: 'white' }}
          >
            {product.badge}
          </span>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className={`p-1.5 rounded-full backdrop-blur-md border transition-all`}
            style={{ 
              background: isLiked ? t.accent : `${t.bg_primary}66`, 
              color: isLiked ? 'white' : 'white',
              borderColor: isLiked ? t.accent : 'rgba(255,255,255,0.1)'
            }}
          >
            <Heart size={12} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            className={`p-1.5 rounded-full backdrop-blur-md border transition-all`}
            style={{ 
              background: isSaved ? t.accent : `${t.bg_primary}66`, 
              color: isSaved ? 'white' : 'white',
              borderColor: isSaved ? t.accent : 'rgba(255,255,255,0.1)'
            }}
          >
            <Bookmark size={12} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: t.text_tertiary }}>{product.shop_name}</span>
        <h4 className="text-xs font-bold truncate" style={{ color: t.text_primary }}>{product.name}</h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-syne font-bold" style={{ color: t.accent }}>${product.price}</span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: stockInfo.bg }}>
            <div className={`w-1.5 h-1.5 rounded-full ${stockInfo.text.includes('Last') ? 'animate-pulse' : ''}`} style={{ background: stockInfo.color }} />
            <span className="text-[8px] font-mono uppercase font-bold" style={{ color: stockInfo.color }}>{stockInfo.text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShopCard: React.FC<{ shop: any; onClick: () => void }> = ({ shop, onClick }) => {
  const t = useTheme();
  return (
    <div 
      onClick={onClick} 
      className="p-4 rounded-card border flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all"
      style={{ background: t.bg_card, borderColor: t.border_primary, boxShadow: t.shadow }}
    >
      <div className="w-14 h-14 rounded-2xl border flex items-center justify-center text-3xl overflow-hidden" style={{ background: t.bg_secondary, borderColor: t.border_primary }}>
        {shop.avatar_url ? (
          <img src={shop.avatar_url || undefined} alt={shop.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          '🏪'
        )}
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <h4 className="text-lg font-syne font-bold leading-none" style={{ color: t.text_primary }}>{shop.name}</h4>
        <div className="flex items-center gap-2 text-[10px] font-sans" style={{ color: t.text_secondary }}>
          <span>{shop.product_count || 0} products</span>
          <span>•</span>
          <span className="flex items-center gap-0.5" style={{ color: t.accent }}>⭐ {shop.rating || 5.0}</span>
          <span>•</span>
          <span>{shop.area}</span>
        </div>
        <div className="flex gap-1.5 mt-1">
          {shop.categories?.map((c: string) => (
            <span key={c} className="px-2 py-0.5 rounded-pill text-[8px] font-mono uppercase tracking-wider" style={{ background: t.bg_secondary, color: t.text_tertiary }}>{c}</span>
          ))}
        </div>
      </div>
      <ArrowRight size={18} style={{ color: t.text_tertiary }} />
    </div>
  );
};

const FilterSheet: React.FC<{ filters: Filters; onClose: () => void; onApply: (f: Filters) => void }> = ({ filters: initial, onClose, onApply }) => {
  const t = useTheme();
  const [local, setLocal] = useState<Filters>(initial);
  const conditions = ['New', 'Like New', 'Good', 'Fair'];
  const areas = ['All', 'Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Masvingo', 'Victoria Falls'];

  const toggleCategory = (cat: string) => {
    setLocal(prev => ({
      ...prev,
      category: prev.category.includes(cat) ? prev.category.filter(c => c !== cat) : [...prev.category, cat]
    }));
  };

  const toggleCondition = (cond: string) => {
    setLocal(prev => ({
      ...prev,
      condition: prev.condition.includes(cond) ? prev.condition.filter(c => c !== cond) : [...prev.condition, cond]
    }));
  };

  const activeCount = useMemo(() => {
    let count = 0;
    if (local.category.length > 0) count++;
    if (local.minPrice || local.maxPrice) count++;
    if (local.condition.length > 0) count++;
    if (local.area !== 'All') count++;
    if (local.inStockOnly) count++;
    return count;
  }, [local]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center backdrop-blur-sm"
      style={{ background: t.overlay }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-[430px] rounded-t-[32px] p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto no-scrollbar border-t"
        style={{ background: t.bg_primary, borderColor: t.border_primary }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 rounded-full mx-auto mb-2" style={{ background: t.border_subtle }} />
        
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-syne font-bold" style={{ color: t.text_primary }}>Filter Results</h2>
          <button onClick={onClose} className="p-2 rounded-full" style={{ background: t.bg_card, color: t.text_secondary }}><X size={20} /></button>
        </div>

        <div className="flex flex-col gap-8">
          {/* Category */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Category</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 -mx-8 px-8">
              {PRODUCT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.label)}
                  className={`px-6 py-2.5 rounded-pill border text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2`}
                  style={{
                    background: local.category.includes(cat.label) ? t.accent : t.bg_card,
                    borderColor: local.category.includes(cat.label) ? t.accent : t.border_primary,
                    color: local.category.includes(cat.label) ? 'white' : t.text_primary
                  }}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Price Range</label>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: t.text_tertiary }}>$</span>
                <input 
                  type="number"
                  placeholder="Min"
                  value={local.minPrice}
                  onChange={(e) => setLocal(prev => ({ ...prev, minPrice: e.target.value }))}
                  className="w-full border rounded-xl py-3 pl-7 pr-3 text-sm focus:outline-none transition-all"
                  style={{ background: t.bg_input, borderColor: t.border_primary, color: t.text_primary }}
                />
              </div>
              <div className="w-4 h-[1px]" style={{ background: t.border_secondary }} />
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: t.text_tertiary }}>$</span>
                <input 
                  type="number"
                  placeholder="Max"
                  value={local.maxPrice}
                  onChange={(e) => setLocal(prev => ({ ...prev, maxPrice: e.target.value }))}
                  className="w-full border rounded-xl py-3 pl-7 pr-3 text-sm focus:outline-none transition-all"
                  style={{ background: t.bg_input, borderColor: t.border_primary, color: t.text_primary }}
                />
              </div>
            </div>
          </div>

          {/* Condition */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Condition</label>
            <div className="flex flex-wrap gap-2">
              {conditions.map(cond => (
                <button
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  className={`px-4 py-2 rounded-pill border text-[10px] font-bold transition-all`}
                  style={{
                    background: local.condition.includes(cond) ? t.accent : t.bg_card,
                    borderColor: local.condition.includes(cond) ? t.accent : t.border_primary,
                    color: local.condition.includes(cond) ? 'white' : t.text_primary
                  }}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Area */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Area</label>
            <div className="relative">
              <select 
                value={local.area}
                onChange={(e) => setLocal(prev => ({ ...prev, area: e.target.value }))}
                className="w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-all appearance-none"
                style={{ background: t.bg_input, borderColor: t.border_primary, color: t.text_primary }}
              >
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.text_tertiary }} size={16} />
            </div>
          </div>

          {/* Stock Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-sans" style={{ color: t.text_primary }}>In Stock Only</label>
            <button 
              onClick={() => setLocal(prev => ({ ...prev, inStockOnly: !prev.inStockOnly }))}
              className={`w-12 h-6 rounded-full transition-all relative border`}
              style={{ 
                background: local.inStockOnly ? t.accent : t.bg_card,
                borderColor: local.inStockOnly ? t.accent : t.border_primary
              }}
            >
              <div 
                className={`absolute top-1 w-4 h-4 rounded-full transition-all ${local.inStockOnly ? 'left-7' : 'left-1'}`} 
                style={{ background: local.inStockOnly ? 'white' : t.text_tertiary }}
              />
            </button>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button 
              onClick={() => onApply(local)}
              className="w-full py-4 text-white font-syne font-bold rounded-button shadow-xl active:scale-[0.98] transition-all"
              style={{ background: t.accent, boxShadow: t.shadow }}
            >
              Apply {activeCount > 0 ? `(${activeCount} filters)` : ''}
            </button>
            <button 
              onClick={() => setLocal({ category: [], minPrice: '', maxPrice: '', condition: [], area: 'All', inStockOnly: false })}
              className="text-sm font-mono uppercase tracking-widest transition-colors"
              style={{ color: t.text_tertiary }}
            >
              Reset All
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

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
  TrendingUp,
  Sparkles,
  Zap,
  Check,
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import { useInventory } from '../context/InventoryContext';
import { Avatar } from '../components/Avatar';

// --- Types ---
interface Filters {
  category: string[];
  minPrice: string;
  maxPrice: string;
  condition: string[];
  area: string;
  inStockOnly: boolean;
}

const TRENDING_KEYWORDS = ['Jordan 1', 'Vintage Denim', 'Samsung A55', 'Essential Tees', 'Nike Tech', 'Cargo Shorts'];

const COLLECTIONS = [
  { id: '1', title: 'Winter Essentials', subtitle: 'The Heat for the Cold', image: 'https://images.unsplash.com/photo-1544022613-e87ce7526ed1?auto=format&fit=crop&q=80&w=600' },
  { id: '2', title: 'Vintage Vault', subtitle: '90s Harare Aesthetic', image: 'https://images.unsplash.com/photo-1551488586-052faf148203?auto=format&fit=crop&q=80&w=600' },
  { id: '3', title: 'Sneaker Head', subtitle: 'Authentic Kicks Only', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=600' },
];

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const { shops, products, toggleLike, toggleSave, likedProductIds, savedProductIds } = useInventory();
  
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Products' | 'Shops'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : ['Jordan 4', 'Vintage', 'Nike'];
  });

  const [filters, setFilters] = useState<Filters>({
    category: [],
    minPrice: '',
    maxPrice: '',
    condition: [],
    area: 'All',
    inStockOnly: false
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    setQuery(term);
    setIsSubmitted(true);
    setIsTyping(false);
    if (!recentSearches.includes(term.trim())) {
      setRecentSearches(prev => [term.trim(), ...prev].slice(0, 6));
    }
  };

  const clearRecent = () => setRecentSearches([]);

  const filteredProducts = useMemo(() => {
    if (!isSubmitted || !query) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      p.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [isSubmitted, query, products]);

  const filteredShops = useMemo(() => {
    if (!isSubmitted || !query) return [];
    return shops.filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase()) || 
      s.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [isSubmitted, query, shops]);

  const topShops = useMemo(() => shops.slice(0, 5), [shops]);

  const ACCENT_COLOR = '#C6FF00';

  return (
    <div className="flex flex-col min-h-screen pb-40 bg-[#0A0A0A] font-sans select-none">
      {/* Search Header */}
      <header className="sticky top-0 z-50 pt-12 pb-6 px-6 bg-black/80 backdrop-blur-3xl border-b border-white/5">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
             <div className="flex-1 relative">
                <SearchIcon size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#888888]" strokeWidth={2.5} />
                <input 
                  ref={inputRef}
                  type="text"
                  placeholder="Items, shops, entrepreneurs..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsTyping(e.target.value.length > 0);
                    setIsSubmitted(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                  className="w-full h-16 bg-[#111111] border border-white/5 rounded-[24px] pl-16 pr-12 text-[15px] font-bold text-white placeholder:text-[#555555] focus:bg-[#111111] focus:shadow-xl focus:border-[#C6FF00]/20 outline-none transition-all"
                />
                {query && (
                  <button 
                    onClick={() => { setQuery(''); setIsTyping(false); setIsSubmitted(false); }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-[#888888]"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                )}
             </div>
             {isSubmitted && (
                <button 
                  onClick={() => setIsFilterOpen(true)}
                  className="w-16 h-16 rounded-[24px] border border-white/5 flex items-center justify-center bg-[#111111] shadow-xl text-white active:scale-95 transition-all"
                >
                   <SlidersHorizontal size={22} strokeWidth={2.5} />
                </button>
             )}
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-6 px-6">
            {['All', 'Retail', 'Tech', 'Services', 'Agriculture', 'Real Estate'].map((tab, idx) => {
              const active = activeTab === (tab === 'All' ? 'All' : tab as any);
              return (
                <button 
                  key={`tab-${tab}-${idx}`}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border
                    ${active ? 'bg-[#C6FF00] text-black border-[#C6FF00] shadow-lg shadow-[#C6FF00]/20' : 'bg-[#111111] text-[#555555] border-white/5'}
                  `}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 mt-8">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div 
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-12"
            >
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <section className="px-6">
                  <div className="flex justify-between items-center mb-6 px-1">
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#555555]">Terminal Logs</h3>
                    <button onClick={clearRecent} className="text-[10px] font-black uppercase tracking-widest text-[#C6FF00]">Purge</button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6">
                    {recentSearches.map((term, idx) => (
                      <button 
                         key={`recent-${term}-${idx}`}
                        onClick={() => handleSearch(term)}
                        className="bg-[#111111] border border-white/5 px-6 py-3.5 rounded-[20px] flex items-center gap-3 shadow-sm active:scale-95 transition-all"
                      >
                         <Clock size={16} className="text-[#333333]" />
                         <span className="text-sm font-bold text-white">{term}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Curated Collections */}
              <section className="flex flex-col gap-6">
                 <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#555555] px-7">Global Sourcing</h3>
                 <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-6">
                    {COLLECTIONS.map(col => (
                      <div key={col.id} className="min-w-[280px] aspect-[4/5] relative rounded-[40px] overflow-hidden group shadow-md">
                         <img 
                           src={col.image} 
                           alt={col.title} 
                           className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70" 
                           referrerPolicy="no-referrer"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-10 flex flex-col justify-end">
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">{col.subtitle}</span>
                            <h4 className="text-[28px] font-bold text-white leading-tight">{col.title}</h4>
                            <div className="mt-6 w-12 h-12 border border-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-xl transition-all group-hover:bg-[#C6FF00] group-hover:text-black group-hover:border-[#C6FF00]">
                               <ArrowUpRight size={22} />
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </section>

              {/* Trending Grid */}
              <section className="px-6">
                 <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#555555] mb-6 px-1">Economy Trends</h3>
                 <div className="grid grid-cols-2 gap-3.5">
                    {TRENDING_KEYWORDS.map((term, idx) => (
                      <button 
                        key={`trending-${term}-${idx}`}
                        onClick={() => handleSearch(term)}
                        className="h-28 bg-[#111111] rounded-[32px] border border-white/5 shadow-sm flex flex-col justify-center px-8 relative overflow-hidden group active:scale-[0.98] transition-all"
                      >
                         <TrendingUp className="absolute -top-3 -right-3 text-[#C6FF00] opacity-[0.03] rotate-12" size={80} />
                         <span className="text-[15px] font-bold text-white truncate z-10">{term}</span>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-[#C6FF00] mt-1.5 z-10 flex items-center gap-1.5">
                            Active Pulse <Zap size={10} fill="currentColor" />
                         </span>
                      </button>
                    ))}
                 </div>
              </section>

              {/* Top Shops */}
              <section className="px-6">
                 <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#555555] mb-8 px-1">Verified Partners</h3>
                 <div className="flex flex-col gap-4">
                    {topShops.map(shop => (
                      <div 
                        key={shop.id}
                        onClick={() => navigate(`/shop/${shop.id}`)}
                        className="bg-[#111111] border border-white/5 rounded-[32px] p-5 flex items-center gap-5 shadow-sm active:scale-[0.98] transition-all"
                      >
                         <div className="relative">
                            <Avatar url={shop.avatar_url || shop.logo_url} size={72} className="border border-white/5" />
                            {shop.is_verified && (
                               <div className="absolute -bottom-1 -right-1 bg-[#C6FF00] text-black p-1.5 rounded-full border-4 border-black shadow-sm">
                                  <Check size={10} strokeWidth={4} />
                               </div>
                            )}
                         </div>
                         <div className="flex-1 flex flex-col gap-1 min-w-0">
                            <h4 className="font-bold text-[17px] text-white tracking-tight truncate">{shop.name}</h4>
                            <div className="flex items-center gap-2">
                               <span className="text-[11px] font-bold uppercase tracking-widest text-[#555555]">{shop.category}</span>
                               <span className="text-[11px] text-[#333333]">•</span>
                               <div className="flex items-center gap-1">
                                  <Star size={12} className="text-[#C6FF00] fill-[#C6FF00]" />
                                  <span className="text-[11px] font-bold text-white">4.9</span>
                                </div>
                            </div>
                         </div>
                         <div className="w-12 h-12 border border-white/5 rounded-full flex items-center justify-center text-white shadow-sm">
                            <ArrowRight size={20} />
                         </div>
                      </div>
                    ))}
                 </div>
              </section>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 flex flex-col gap-12"
            >
               {/* Result Stats */}
               <div className="flex items-center justify-between px-1">
                  <div className="flex flex-col">
                    <h3 className="text-3xl font-bold text-white tracking-tight leading-tight mb-2 capitalize">"{query}"</h3>
                    <span className="text-[12px] font-bold uppercase tracking-widest text-[#555555]">
                      {filteredProducts.length + filteredShops.length} match nodes identified
                    </span>
                  </div>
               </div>

               {/* Products Results */}
               {filteredProducts.length > 0 && (
                  <div className="flex flex-col gap-6">
                     <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#555555] px-1">Market Units</h4>
                     <div className="grid grid-cols-2 gap-4">
                        {filteredProducts.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => navigate(`/product/${p.id}`)}
                            className="bg-[#111111] border border-white/5 rounded-[32px] overflow-hidden shadow-sm group active:scale-[0.98] transition-all"
                          >
                             <div className="aspect-[4/5] bg-[#1a1a1a] relative overflow-hidden">
                                <img 
                                  src={p.images?.[0]} 
                                  alt={p.name} 
                                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80" 
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleLike(p.id); }}
                                  className={`absolute top-4 right-4 w-11 h-11 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all shadow-lg
                                    ${likedProductIds.includes(p.id) ? 'bg-[#C6FF00] text-black border-transparent' : 'bg-black/40 text-white border-white/10'}
                                  `}
                                >
                                  <Heart size={18} fill={likedProductIds.includes(p.id) ? "currentColor" : "none"} strokeWidth={2.5} />
                                </button>
                             </div>
                             <div className="p-5 flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#555555]">{p.category}</span>
                                <h5 className="font-bold text-white text-[15px] truncate leading-tight">{p.name}</h5>
                                <div className="flex items-center justify-between mt-1">
                                   <span className="text-[20px] font-black text-[#C6FF00]">${p.price}</span>
                                   <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                                      <ArrowRight size={14} className="text-[#555555]" />
                                   </div>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* Shops Results */}
               {filteredShops.length > 0 && (
                  <div className="flex flex-col gap-6">
                     <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#555555] px-1">Business Entities</h4>
                     <div className="flex flex-col gap-3.5">
                        {filteredShops.map(shop => (
                           <div 
                             key={shop.id}
                             onClick={() => navigate(`/shop/${shop.id}`)}
                             className="flex items-center gap-5 bg-[#111111] border border-white/5 p-5 rounded-[32px] shadow-sm active:scale-[0.98] transition-all"
                           >
                              <div className="relative">
                                 <Avatar url={shop.avatar_url || shop.logo_url} size={64} className="border border-white/5" />
                                 {shop.is_verified && (
                                    <div className="absolute -bottom-1 -right-1 bg-[#C6FF00] text-black p-1 rounded-full border-2 border-black">
                                       <Check size={8} strokeWidth={4} />
                                    </div>
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h5 className="font-bold text-[17px] text-white truncate">{shop.name}</h5>
                                 <span className="text-[11px] font-bold uppercase tracking-widest text-[#555555]">{shop.town}</span>
                              </div>
                              <div className="w-10 h-10 border border-white/5 rounded-full flex items-center justify-center text-[#555555]">
                                 <ArrowRight size={18} />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* No Results Fallback */}
               {filteredProducts.length === 0 && filteredShops.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-28 text-center px-8">
                     <div className="w-24 h-24 rounded-full bg-[#111111] shadow-sm flex items-center justify-center mb-8">
                        <SearchIcon size={40} className="text-[#333333]" />
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-3">Void Response for "{query}"</h3>
                     <p className="text-[#555555] text-[15px] leading-relaxed max-w-[280px] mx-auto">
                        No entities or units matches this query. Expand search parameters.
                     </p>
                     <button 
                       onClick={() => { setQuery(''); setIsSubmitted(false); }}
                       className="mt-10 h-14 px-8 bg-[#C6FF00] rounded-full text-black font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-[#C6FF00]/20"
                     >
                       Reboot Discovery
                     </button>
                  </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Filter Bottom Sheet */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
               onClick={() => setIsFilterOpen(false)}
            />
            <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed bottom-0 left-0 right-0 z-[110] bg-[#111111] rounded-t-[48px] p-10 pb-16 max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl border-t border-white/5"
            >
               <div className="w-16 h-1.5 rounded-full mx-auto mb-12 bg-[#1a1a1a]" />
               <h2 className="text-2xl font-bold text-white mb-12 tracking-tight">System Refinement</h2>
               
               <div className="space-y-12">
                  <div className="flex flex-col gap-6">
                     <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#555555]">Business Hubs</h4>
                     <div className="flex flex-wrap gap-2.5">
                        {['Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Masvingo'].map((t, idx) => (
                           <button key={`town-${t}-${idx}`} className="px-7 py-3.5 rounded-full border border-white/5 text-[13px] font-bold text-[#555555] active:bg-[#C6FF00] active:text-black active:border-[#C6FF00] transition-all">
                              {t}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex flex-col gap-6">
                     <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#555555]">Sector Categories</h4>
                     <div className="grid grid-cols-2 gap-3.5">
                        {['Retail', 'Technology', 'Services', 'Logistics'].map((c, idx) => (
                           <button key={`cat-${c}-${idx}`} className="h-20 flex flex-col items-center justify-center rounded-[24px] border border-white/5 text-[13px] font-bold text-white active:bg-[#C6FF00]/5 active:border-[#C6FF00] transition-all bg-[#1a1a1a]">
                              {c}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex flex-col gap-6 pt-4">
                     <button 
                        onClick={() => setIsFilterOpen(false)}
                        className="w-full h-16 bg-[#C6FF00] text-black rounded-full font-black uppercase tracking-widest text-[16px] shadow-xl shadow-[#C6FF00]/20 active:scale-[0.98] transition-all"
                     >
                        Confirm Parameters
                     </button>
                     <button 
                        onClick={() => setIsFilterOpen(false)}
                        className="w-full text-center text-[#555555] text-[14px] font-black uppercase tracking-widest"
                     >
                        Reset System
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

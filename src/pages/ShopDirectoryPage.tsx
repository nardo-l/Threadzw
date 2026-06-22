// src/pages/ShopDirectoryPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Store, 
  Search as SearchIcon, 
  ArrowRight, 
  Zap, 
  ShoppingBag, 
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface ShopRecord {
  id: string;
  name: string;
  handle: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  product_count: number;
  is_live: boolean;
  is_verified: boolean;
  created_at: string;
}

export const ShopDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<ShopRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchShops = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      console.log('[ShopDirectory] Querying published stores from Supabase...');
      const { data, error: queryError } = await supabase
        .from('shops')
        .select(`
          id,
          name,
          handle,
          slug,
          description,
          logo_url,
          banner_url,
          product_count,
          is_live,
          is_verified,
          created_at
        `)
        .eq('is_live', true)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      console.log('[ShopDirectory] Query success. Found published shops:', data?.length || 0);
      setShops(data || []);
    } catch (err: any) {
      console.error('[ShopDirectory] Error loading public directory:', err);
      setError(err?.message || 'Failed to fetch directory. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchShops(true);
  };

  // Filter based on search query
  const filteredShops = shops.filter(shop => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return true;
    return (
      shop.name.toLowerCase().includes(term) ||
      (shop.description || '').toLowerCase().includes(term) ||
      shop.handle.toLowerCase().includes(term) ||
      (shop.slug || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between selection:bg-[#C6FF00] selection:text-black font-sans">
      {/* Top Header Navigation */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-xl font-black tracking-tighter text-white">
              ThreadZW<span className="text-[#C6FF00]">.</span>
            </span>
            <span className="bg-[#C6FF00]/10 border border-[#C6FF00]/20 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded text-[#C6FF00]">
              Marketplace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-semibold uppercase tracking-[1px] hover:text-[#C6FF00] text-zinc-400 transition-colors"
            >
              Seller Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-8">
        {/* Banner Hero */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-white/5 py-1 px-3 rounded-full text-xs text-zinc-400 font-semibold uppercase tracking-wider">
            <Zap size={12} className="text-[#C6FF00]" />
            <span>Zimbabwe's Independent Fashion</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-white">
                Discover local brands<span className="text-[#C6FF00]">.</span>
              </h1>
              <p className="text-sm md:text-base text-zinc-400 mt-2 max-w-xl font-medium">
                Sartorial excellence from Harare to Bulawayo. Explore streetwear, luxury garments, sneaker sellers, and thrift boutiques.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-805 border border-white/5 text-xs font-bold rounded-lg text-zinc-300 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={`text-[#C6FF00] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Directory</span>
            </button>
          </div>
        </section>

        {/* Search & Tool belt */}
        <section className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search stores by brand name, description, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#09090b] text-white border border-white/5 rounded-lg focus:outline-none focus:border-[#C6FF00]/40 text-sm transition-all text-ellipsis"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto self-stretch">
            <div className="bg-[#09090b] border border-white/5 px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 flex items-center gap-2 flex-grow sm:flex-grow-0 justify-center">
              <SlidersHorizontal size={12} className="text-zinc-500" />
              <span>{filteredShops.length} Brand{filteredShops.length !== 1 ? 's' : ''} Listed</span>
            </div>
          </div>
        </section>

        {/* Directory States */}
        {loading ? (
          /* Loading State */
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 border-3 border-zinc-800 rounded-full" />
              <div className="absolute inset-0 border-3 border-t-[#C6FF00] rounded-full animate-spin" />
            </div>
            <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
              Loading ThreadZW Brands...
            </p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="py-16 px-6 bg-red-950/20 border border-red-500/20 rounded-2xl max-w-xl mx-auto text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-910/10 rounded-full flex items-center justify-center text-red-500">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-md font-bold text-white">Oops! Something went wrong</h3>
              <p className="text-xs text-zinc-400 font-medium">{error}</p>
            </div>
            <button
              onClick={() => fetchShops()}
              className="px-4 py-2 bg-white text-black text-xs font-black rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Retry Load
            </button>
          </div>
        ) : filteredShops.length === 0 ? (
          /* No Stores Yet */
          <div className="py-20 border border-dashed border-white/5 rounded-2xl text-center max-w-lg mx-auto p-6 space-y-4 bg-zinc-900/10">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
              <Store size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-md font-bold text-white">
                {searchQuery ? 'No matching stores' : 'No Stores Yet'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {searchQuery 
                  ? `We couldn't find any brands matching "${searchQuery}". Try searching for another keyword.`
                  : 'Be the first to open a store! Launch your own independent clothing boutique on ThreadZW instantly.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => navigate('/signup')}
                className="px-5 py-2.5 bg-[#C6FF00] hover:bg-[#b5e600] active:scale-95 text-black text-xs font-extrabold rounded-lg transition-all"
              >
                Launch Your Shop
              </button>
            )}
          </div>
        ) : (
          /* Stores Found */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredShops.map((shop) => (
              <div 
                key={shop.id}
                onClick={() => navigate(`/shop/${shop.id}`)}
                className="group relative bg-[#121214]/60 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-[#C6FF00]/25 hover:bg-[#121214]/80 active:scale-[0.99] transition-all duration-300 cursor-pointer overflow-hidden shadow-md shadow-black/10"
              >
                {/* Visual Accent Hover Border */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#C6FF00]/5 rounded-full blur-2xl group-hover:bg-[#C6FF00]/10 transition-colors" />

                <div className="space-y-4">
                  {/* Top: Logo + Brand Title Row */}
                  <div className="flex items-start gap-4">
                    {shop.logo_url ? (
                      <img 
                        src={shop.logo_url} 
                        alt={`${shop.name} logo`}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl bg-zinc-900 border border-white/10 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center flex-shrink-0 text-zinc-500">
                        <Store size={24} />
                      </div>
                    )}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-lg font-black tracking-tight leading-snug text-white group-hover:text-[#C6FF00] transition-colors truncate">
                          {shop.name}
                        </h2>
                        {shop.is_verified && (
                          <span className="bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-[8px] font-black uppercase text-[#C6FF00] px-1 px-1.5 rounded-full tracking-wider flex-shrink-0">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-bold tracking-wide">
                        @{shop.handle || 'brand'}
                      </p>
                    </div>
                  </div>

                  {/* Mid: Description */}
                  <p className="text-xs text-zinc-400 font-medium line-clamp-2 leading-relaxed">
                    {shop.description || 'No description provided by seller. Visit the storefront page to browse garments and make purchases.'}
                  </p>
                </div>

                {/* Bottom: CountBadge and Button Details */}
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-5">
                  <div className="inline-flex items-center gap-1.5 text-zinc-500 font-semibold text-xs">
                    <ShoppingBag size={13} className="text-[#C6FF00]/60" />
                    <span className="text-zinc-400 font-mono text-[11px] font-bold">
                      {shop.product_count || 0}
                    </span>
                    <span>Garment{shop.product_count !== 1 ? 's' : ''}</span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-black text-[#C6FF00]/80 group-hover:text-[#C6FF00] tracking-wide transition-colors">
                    Visit Store
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-white/5 bg-black/40 py-8 text-center text-zinc-600 text-[11px] font-semibold tracking-wider uppercase">
        <p>© {new Date().getFullYear()} ThreadZW. Constructed in Harare 🇿🇼 All Rights Reserved.</p>
      </footer>
    </div>
  );
};

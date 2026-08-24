import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search as SearchIcon, ArrowLeft, Package, X, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';

interface SearchResultProduct {
  id: string;
  name: string;
  price: number;
  total_stock: number;
}

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<SearchResultProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (shopError || !shopData) return;

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, total_stock')
          .eq('shop_id', shopData.id)
          .order('created_at', { ascending: false });
        if (productsError) throw productsError;
        setProducts((productsData || []) as SearchResultProduct[]);
      } catch (error) {
        console.error('Error loading product search data:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return products.filter(product => product.name.toLowerCase().includes(normalizedQuery));
  }, [products, query]);

  return (
    <div className="min-h-screen bg-[#070709] text-white pb-32 font-sans overflow-x-hidden">
      <div className="px-5 pt-8 pb-5 border-b border-white/[0.02] sticky top-0 bg-[#070709]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 shrink-0" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search your products..."
              className="w-full h-11 bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-10 text-sm text-white focus:outline-none focus:border-[#C6FF00] focus:bg-white/[0.05] transition-all placeholder-zinc-500"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 text-zinc-400 rounded-lg" aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#C6FF00]" />
            <p className="text-zinc-500 text-xs font-mono font-bold uppercase tracking-wider mt-3">Loading products...</p>
          </div>
        ) : !query.trim() ? (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Search your catalog</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">Search product names in your Threadzw clothing shop.</p>
            <div className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#C6FF00]/10 text-[#C6FF00] flex items-center justify-center"><Package size={15} /></div>
              <div><span className="text-xs font-bold text-white block">Products</span><span className="text-[10px] text-zinc-500">Search names and catalog items</span></div>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white/[0.01] border border-dashed border-white/5 py-16 px-6 text-center rounded-3xl flex flex-col items-center">
            <AlertCircle size={24} className="text-zinc-500 mb-3" />
            <h3 className="font-extrabold text-sm text-white">No products found</h3>
            <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">We could not find a product matching <span className="text-[#C6FF00] font-mono">“{query}”</span>.</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fadeIn">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#C6FF00] px-1 flex items-center gap-1.5"><Package size={14} /> Products ({filteredProducts.length})</h3>
            <div className="bg-[#111115] border border-white/[0.05] rounded-xl overflow-hidden divide-y divide-white/[0.03]">
              {filteredProducts.map(product => (
                <button key={product.id} onClick={() => navigate('/inventory')} className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="min-w-0"><span className="text-xs font-bold text-white block truncate">{product.name}</span><span className="text-[10px] text-zinc-500 font-mono mt-1 block">Stock: {product.total_stock} items • ${Number(product.price).toFixed(2)}</span></div>
                  <ChevronRight size={14} className="text-zinc-600" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
};

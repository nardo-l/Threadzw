import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Search as SearchIcon, ArrowLeft, Package, ShoppingBag, 
  Tag, X, ChevronRight, AlertCircle, Loader2 
} from 'lucide-react';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';

interface SearchResultProduct {
  id: string;
  name: string;
  price: number;
  total_stock: number;
}

interface SearchResultOrder {
  id: string;
  product_name: string;
  order_reference: string;
  sale_price: number;
  created_at: string;
  status: string;
}

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<SearchResultProduct[]>([]);
  const [orders, setOrders] = useState<SearchResultOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchSourceData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch user shop
        const { data: shopData } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        if (shopData) {
          // Fetch products
          const { data: productsData } = await supabase
            .from('products')
            .select('id, name, price, total_stock')
            .eq('shop_id', shopData.id);

          if (productsData) setProducts(productsData as SearchResultProduct[]);

          // Fetch orders
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, product_name, order_reference, sale_price, created_at, status')
            .eq('shop_id', shopData.id);

          if (ordersData) setOrders(ordersData as SearchResultOrder[]);
        }
      } catch (err) {
        console.error('Error loading search database:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchSourceData();
  }, []);

  // Filter products and orders based on query
  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    return products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [products, query]);

  const filteredOrders = useMemo(() => {
    if (!query.trim()) return [];
    return orders.filter(o => 
      o.product_name.toLowerCase().includes(query.toLowerCase()) || 
      o.order_reference?.toLowerCase().includes(query.toLowerCase())
    );
  }, [orders, query]);

  const hasResults = filteredProducts.length > 0 || filteredOrders.length > 0;

  return (
    <div className="min-h-screen bg-[#070709] text-white pb-32 font-sans overflow-x-hidden">
      
      {/* STICKY SEARCH HEADER */}
      <div className="px-5 pt-8 pb-5 border-b border-white/[0.02] sticky top-0 bg-[#070709]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 shrink-0">
            <ArrowLeft size={18} />
          </button>
          
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, orders, references..."
              className="w-full h-11 bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-10 text-sm text-white focus:outline-none focus:border-[#25D366] focus:bg-white/[0.05] transition-all placeholder-zinc-500"
              autoFocus
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 text-zinc-400 rounded-lg"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
            <p className="text-zinc-500 text-xs font-mono font-bold uppercase tracking-wider mt-3">Indexing directory...</p>
          </div>
        ) : !query.trim() ? (
          /* Search suggestion suggestions */
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Search Guidelines</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Enter names, tags, or references to perform a live fuzzy match index filter across.
              </p>
            </div>

            <div className="space-y-2">
              <div className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/10 flex items-center justify-center">
                  <Package size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Products</span>
                  <span className="text-[10px] text-zinc-500">Query names and categories</span>
                </div>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/10 flex items-center justify-center">
                  <ShoppingBag size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Orders</span>
                  <span className="text-[10px] text-zinc-500">Query buyer references (e.g. #TZW-0422)</span>
                </div>
              </div>
            </div>
          </div>
        ) : !hasResults ? (
          /* Empty Search results state */
          <div className="bg-white/[0.01] border border-dashed border-white/5 py-16 px-6 text-center rounded-3xl flex flex-col items-center">
            <AlertCircle size={24} className="text-zinc-500 mb-3" />
            <h3 className="font-extrabold text-sm text-white">No query matches</h3>
            <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
              We couldn't find any listings or order logs matching <span className="text-[#25D366] font-mono">"{query}"</span> in your store node.
            </p>
          </div>
        ) : (
          /* Results list container */
          <div className="space-y-6 animate-fadeIn">
            {/* MATCHING PRODUCTS */}
            {filteredProducts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#25D366] px-1 flex items-center gap-1.5">
                  <Package size={14} />
                  Products ({filteredProducts.length})
                </h3>
                
                <div className="bg-[#111115] border border-white/[0.05] rounded-xl overflow-hidden divide-y divide-white/[0.03]">
                  {filteredProducts.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => navigate('/inventory')}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] active:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                          Stock: {p.total_stock} items • ${Number(p.price).toFixed(2)}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-zinc-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MATCHING ORDERS */}
            {filteredOrders.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 px-1 flex items-center gap-1.5">
                  <ShoppingBag size={14} />
                  Orders ({filteredOrders.length})
                </h3>

                <div className="bg-[#111115] border border-white/[0.05] rounded-xl overflow-hidden divide-y divide-white/[0.03]">
                  {filteredOrders.map(o => (
                    <div 
                      key={o.id}
                      onClick={() => navigate('/sales')}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] active:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono leading-none bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-black border border-white/5">
                            {o.order_reference || '#TZW-SALE'}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${o.status === 'completed' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
                        </div>
                        <span className="text-xs font-bold text-white block mt-1.5 truncate">{o.product_name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                          Value: ${Number(o.sale_price).toFixed(2)} • {o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-zinc-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavBar />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Edit2, 
  MoreVertical, 
  ShoppingBag, 
  Eye, 
  Heart, 
  Bookmark,
  Filter,
  Package,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { Shimmer } from '../components/ui/Shimmer';
import { ScreenError } from '../components/ui/ScreenError';
import { EmptyState } from '../components/ui/EmptyState';

export const MyProducts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deleteProduct } = useInventory();
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'sold_out'>('all');

  useEffect(() => {
    fetchMyProducts();
  }, [user]);

  const handleDelete = async (productId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const success = await deleteProduct(productId);
      if (success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        showToast('Product deleted', 'success');
      } else {
        showToast('Failed to delete product', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error deleting product', 'error');
    }
  };

  const fetchMyProducts = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Ensure shop is loaded
      let shopData = null;
      try {
        const { data } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (data) shopData = data;
      } catch (e) {
        console.warn("MyProducts query failed for shop database query:", e);
      }

      if (!shopData) {
        const cached = localStorage.getItem(`shop_${user.id}`) || localStorage.getItem('threadzw_shop');
        if (cached) {
          try {
            shopData = JSON.parse(cached);
          } catch (_) {}
        }
      }

      if (!shopData) {
        shopData = { id: 'local-shop-' + user.id };
      }

      // 2. Fetch products by shop_id instead of owner_id
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Could not load your products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Shimmer className="w-10 h-10 rounded-full" />
          <Shimmer className="w-40 h-8 rounded-md" />
        </div>
        <Shimmer className="w-full h-14 rounded-pill" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={`product-shimmer-${i}`} className="space-y-2">
              <Shimmer className="aspect-square rounded-card" />
              <Shimmer className="w-3/4 h-4 rounded-md" />
              <Shimmer className="w-1/2 h-4 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ScreenError 
        icon={<AlertCircle size={32} />}
        heading="Couldn't load products"
        body={error}
        onRetry={fetchMyProducts}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 bg-cream/80 backdrop-blur-md z-40 px-6 py-8 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-charcoal/50 hover:text-charcoal transition-all">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-4xl md:text-5xl font-display font-black uppercase italic tracking-tighter leading-none">
               the <span className="text-pink">vault</span>
            </h1>
          </div>
          <p className="italic-accent text-lg mt-1">Inventory Management Protocol</p>
        </div>
        <button 
          onClick={() => navigate('/new-listing')}
          className="w-14 h-14 rounded-full bg-charcoal text-cream flex items-center justify-center shadow-[6px_6px_0_#C6FF00] hover:translate-y-[-2px] transition-all active:scale-95"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </div>

      <div className="px-6 space-y-8">
        {/* Search & Filter */}
        <div className="flex flex-col gap-6">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Query catalog..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-charcoal rounded-[24px] py-5 pl-16 pr-8 text-charcoal placeholder:text-charcoal/20 focus:shadow-[8px_8px_0_#F4A6C1] transition-all outline-none italic font-display font-black text-xl uppercase tracking-tighter"
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-charcoal/30 group-focus-within:text-pink transition-colors" size={24} />
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {(['all', 'active', 'paused', 'sold_out'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                  filter === f ? 'bg-charcoal text-white border-charcoal shadow-[4px_4px_0_#C6FF00]' : 'bg-transparent border-charcoal/10 text-charcoal/40'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
              const totalStock = product.sizes?.reduce((acc: number, s: any) => acc + s.quantity, 0) || 0;
              const isSoldOut = product.status === 'sold_out' || totalStock === 0;

              return (
                <div 
                  key={product.id}
                  className={`bg-white rounded-[32px] overflow-hidden border-2 border-charcoal group relative transition-all shadow-[8px_8px_0_rgba(0,0,0,0.05)] hover:shadow-[12px_12px_0_#F4A6C1] hover:translate-y-[-4px] ${isSoldOut ? 'grayscale' : ''}`}
                >
                  <div className="aspect-square bg-cream relative flex items-center justify-center text-4xl overflow-hidden border-b-2 border-charcoal">
                    {product.images?.[0] ? (
                      <img src={product.images[0] || undefined} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Package size={48} className="text-charcoal/10" />
                    )}
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <div className={`oval-sticker !text-[8.5px] border-none !shadow-none ${
                        product.status === 'active' ? '!bg-lime !text-charcoal' : 
                        product.status === 'paused' ? '!bg-amber-100 !text-amber-700' : '!bg-pink !text-charcoal'
                      }`}>
                         {product.status}
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-charcoal/80 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <button 
                        onClick={() => navigate(`/edit-product/${product.id}`)}
                        className="w-12 h-12 rounded-full bg-cream text-charcoal flex items-center justify-center shadow-[4px_4px_0_#C6FF00] active:scale-95 transition-all"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id, product.name);
                        }}
                        className="w-12 h-12 rounded-full bg-pink text-charcoal flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] active:scale-95 transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-3">
                    <div>
                      <h4 className="text-xl font-display font-black uppercase italic tracking-tighter truncate leading-none">{product.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-display font-black text-pink italic tracking-tighter leading-none">${product.price}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-charcoal/30 italic">{totalStock} in base</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t-2 border-charcoal/5">
                      <div className="flex items-center gap-4 text-charcoal/20">
                        <div className="flex items-center gap-1.5">
                          <Eye size={12} />
                          <span className="text-[10px] font-black">{product.view_count || 0}</span>
                        </div>
                      </div>
                      <button className="text-charcoal/20 hover:text-charcoal transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-32 h-32 rounded-[40px] bg-white border-2 border-charcoal flex items-center justify-center text-7xl mb-8 shadow-[12px_12px_0_#F4A6C1] -rotate-3">
                📦
            </div>
            <h3 className="text-4xl font-display font-black uppercase italic tracking-tighter leading-none mb-4">Zero Units Found</h3>
            <p className="italic-accent text-2xl text-charcoal/40 mb-10 max-w-sm">
              The vault is currently void. Initialize your first listing unit.
            </p>
            <button 
              onClick={() => navigate('/new-listing')}
              className="h-16 px-12 bg-charcoal text-cream rounded-full font-black uppercase tracking-widest italic shadow-[8px_8px_0_#C6FF00] active:scale-95 transition-all"
            >
              Add Product Listing <Plus size={20} className="inline ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

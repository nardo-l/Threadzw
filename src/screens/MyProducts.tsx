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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('owner_id', user.id)
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
            <div key={i} className="space-y-2">
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
    <div className="min-h-screen bg-background pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-40 px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-white transition-all">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-pacifico text-primary">My Products</h1>
        </div>
        <button 
          onClick={() => navigate('/new-listing')}
          className="p-2 rounded-full bg-primary/10 text-primary"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Search & Filter */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search your products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border-none rounded-pill py-4 pl-14 pr-6 text-white placeholder:text-muted focus:ring-2 focus:ring-primary transition-all outline-none"
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {(['all', 'active', 'paused', 'sold_out'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-pill text-[10px] font-mono uppercase tracking-widest transition-all whitespace-nowrap ${
                  filter === f ? 'bg-primary text-white' : 'bg-card border border-white/10 text-muted'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(product => {
              const totalStock = product.sizes?.reduce((acc: number, s: any) => acc + s.quantity, 0) || 0;
              const isSoldOut = product.status === 'sold_out' || totalStock === 0;

              return (
                <div 
                  key={product.id}
                  className={`bg-card rounded-card overflow-hidden border border-white/5 group relative transition-all ${isSoldOut ? 'opacity-60' : ''}`}
                >
                  <div className="aspect-square bg-black relative flex items-center justify-center text-4xl overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0] || undefined} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      '📦'
                    )}
                    
                    <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                      <div className={`w-fit px-2 py-0.5 rounded-pill text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md ${
                        product.status === 'active' ? 'bg-green-500/20 text-green-500' : 
                        product.status === 'paused' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${
                          product.status === 'active' ? 'bg-green-500' : 
                          product.status === 'paused' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        {product.status}
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`/edit-product/${product.id}`)}
                        className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-primary transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id, product.name);
                        }}
                        className="p-2 rounded-full bg-black/60 backdrop-blur-md text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <div>
                      <h4 className="text-xs font-bold truncate text-white">{product.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-primary font-syne font-bold text-sm">${product.price}</span>
                        <span className="text-[8px] font-mono text-muted uppercase">{totalStock} in stock</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-3 text-muted">
                        <div className="flex items-center gap-1">
                          <Eye size={10} />
                          <span className="text-[8px] font-mono">{product.view_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart size={10} />
                          <span className="text-[8px] font-mono">{product.like_count || 0}</span>
                        </div>
                      </div>
                      <button className="text-muted hover:text-white transition-colors">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            icon="📦"
            heading="No products found"
            body={searchQuery ? "Try a different search term" : "Start by adding your first product listing"}
            buttonLabel={searchQuery ? "Clear Search" : "Add Product"}
            buttonAction={() => searchQuery ? setSearchQuery('') : navigate('/new-listing')}
          />
        )}
      </div>
    </div>
  );
};

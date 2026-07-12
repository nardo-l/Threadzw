// src/screens/Inventory.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit3, Copy, Trash2, CheckCircle2, 
  X, Filter, Home, Package, BarChart3, Settings, Eye, 
  ChevronRight, Sparkles, LogOut, Check, MoreHorizontal,
  ChevronDown, ArrowUpRight, AlertCircle, ShoppingBag, Loader2,
  Bell
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { seedShopProductsIfEmpty } from '../utils/seedData';

interface Product {
  id: string;
  shop_id: string;
  owner_id?: string;
  name: string;
  price: number;
  description?: string;
  images: string[];
  sizes: { size: string; quantity: number }[];
  category: string;
  total_stock: number;
  is_published: boolean;
  is_featured?: boolean;
  status?: 'active' | 'paused' | 'sold_out';
  collection?: string;
  created_at: string;
}

export const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'sold_out'>('all');
  
  // States for interactive modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [shop, setShop] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let shopData = null;
      try {
        const { data } = await supabase
          .from('shops')
          .select('id, slug, handle, name')
          .eq('owner_id', session.user.id)
          .maybeSingle();
        if (data) shopData = data;
      } catch (err) {
        console.warn("DB shops query failed in Inventory:", err);
      }

      if (!shopData) {
        const cached = localStorage.getItem(`shop_${session.user.id}`);
        if (cached) {
          try {
            shopData = JSON.parse(cached);
          } catch (_) {}
        }
        if (!shopData) {
          shopData = { id: session.user.id, name: 'My Shop', slug: 'demo', handle: 'demo' };
        }
      }

      setShop(shopData);

      if (shopData) {
        // Enforce automatic seed of high quality items (Shadow Hoodie, Capri, etc.)
        const prodData = await seedShopProductsIfEmpty(supabase, shopData.id, session.user.id);
        setProducts(prodData || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Catalog fetch sync error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Quick action: Duplicate Product
  const handleDuplicate = async (product: Product) => {
    const toastId = toast.loading('Duplicating product assets...');
    try {
      const clonedName = `${product.name} (Clone)`;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to duplicate listings.');
      }
      if (!shop || product.shop_id !== shop.id) {
        throw new Error('You do not own this product.');
      }
      const ownerId = session.user.id;
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          shop_id: shop.id,
          owner_id: ownerId,
          name: clonedName,
          price: product.price,
          description: product.description || null,
          category: product.category,
          images: product.images,
          sizes: product.sizes,
          total_stock: product.total_stock,
          is_published: product.is_published,
          is_featured: product.is_featured || false,
          status: product.status || 'active',
          collection: product.collection || null
        })
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [data, ...prev]);
      toast.success('Cloned listing with asset links!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to duplicate listing: ' + err.message, { id: toastId });
    }
  };

  // Quick action: Toggle Feature
  const handleToggleFeature = async (product: Product) => {
    const nextFeatured = !product.is_featured;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !shop || product.shop_id !== shop.id) {
        throw new Error('Unauthorized action');
      }
      const { error } = await supabase
        .from('products')
        .update({ is_featured: nextFeatured })
        .eq('id', product.id)
        .eq('shop_id', shop.id);

      if (error) throw error;

      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: nextFeatured } : p));
      toast.success(nextFeatured ? 'Listing promoted to Best Seller! ⭐' : 'Pushed to standard listing.');
    } catch (err: any) {
      console.error(err);
      toast.error('Workflow error toggling highlight: ' + (err.message || ''));
    }
  };

  // Quick Action: Toggle In Stock vs Sold out
  const handleToggleAvailability = async (product: Product) => {
    const currentIsSoldOut = product.total_stock === 0 || product.status === 'sold_out';
    const nextStatus = currentIsSoldOut ? 'active' : 'sold_out';
    const nextStock = currentIsSoldOut ? 10 : 0;
    
    const updatedSizes = product.sizes.map(sz => ({
      ...sz,
      quantity: currentIsSoldOut ? 10 : 0
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !shop || product.shop_id !== shop.id) {
        throw new Error('Unauthorized action');
      }
      const { error } = await supabase
        .from('products')
        .update({
          total_stock: nextStock,
          status: nextStatus,
          sizes: updatedSizes
        })
        .eq('id', product.id)
        .eq('shop_id', shop.id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === product.id 
          ? { ...p, total_stock: nextStock, status: nextStatus as any, sizes: updatedSizes } 
          : p
      ));

      toast.success(currentIsSoldOut ? 'Restored inventory stock counts' : 'Listing marked as Sold Out');
    } catch (err: any) {
      console.error(err);
      toast.error('Workflow status toggle failed: ' + (err.message || ''));
    }
  };

  // Quick Action: Deletion
  const handleDeleteProduct = async (productId: string) => {
    try {
      setDeletingId(productId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !shop) {
        throw new Error('Unauthorized action');
      }
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('shop_id', shop.id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      setShowDeleteModal(null);
      setSelectedProduct(null);
      toast.success('Listing deleted.');
    } catch (err: any) {
      console.error(err);
      toast.error('Could not delete product: ' + (err.message || ''));
    } finally {
      setDeletingId(null);
    }
  };

  const getProductUrl = (productId: string) => {
    const slugVal = shop?.slug || shop?.handle || 'demo';
    const base = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${base}/shop/${slugVal}/product/${productId}`;
  };

  // Filtering calculations query
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        p.category.toLowerCase().includes(search.toLowerCase()) ||
                        (p.collection && p.collection.toLowerCase().includes(search.toLowerCase()));
    
    if (!matchSearch) return false;
    
    if (activeTab === 'active') return p.status === 'active' || (p.is_published && p.total_stock > 0);
    if (activeTab === 'draft') return p.status === 'paused' || !p.is_published;
    if (activeTab === 'sold_out') return p.total_stock === 0 || p.status === 'sold_out';
    
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-zinc-800 pb-32 relative font-sans selection:bg-[#C6FF00] selection:text-black">
      
      {/* Top Navigation */}
      <header className="border-b border-zinc-100 bg-[#FFFFFF] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-950">
              Thread<span className="text-[#C6FF00] text-stroke">ZW</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => toast.info("Your notification hub")}
              className="relative p-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl transition-all cursor-pointer"
            >
              <Bell size={21} />
            </button>
            <div className="h-8 w-8 rounded-full border border-zinc-100 bg-zinc-200" />
          </div>
        </div>
      </header>

      {/* Main Catalog View Column */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6 text-left">
        
        {/* Title drop banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight leading-none uppercase">Products</h1>
            <p className="text-xs text-zinc-500 mt-1.5 font-medium">Manage and organize your store products.</p>
          </div>
          
          <button 
            onClick={() => navigate('/add-product')}
            className="px-4.5 py-3 rounded-2xl bg-[#C6FF00] hover:bg-opacity-95 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-center active:scale-[0.98] transition-transform"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Product</span>
          </button>
        </div>

        {/* Search Assist and Sort Actions */}
        <div className="flex gap-2.5 items-center">
          <div className="relative flex-grow">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
              <Search size={16} />
            </div>
            <input 
              placeholder="Search products..."
              className="w-full h-11 bg-white border border-zinc-200/80 rounded-2xl pl-10 pr-4 text-xs focus:outline-none focus:border-[#C6FF00] text-zinc-900 font-medium placeholder:text-zinc-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <button className="h-11 px-3.5 bg-white border border-zinc-200/80 rounded-2xl text-[11px] font-bold text-zinc-600 flex items-center gap-1.5 hover:bg-zinc-50 cursor-pointer">
            <Filter size={13} />
            <span>Sort</span>
          </button>
        </div>

        {/* Tab filters with real dynamic counts */}
        <div className="flex border-b border-zinc-200 overflow-x-auto no-scrollbar scroll-smooth gap-3 shrink-0">
          {[
            { id: 'all', label: 'All Products', count: products.length },
            { id: 'active', label: 'Active', count: products.filter(p => p.status === 'active' || (p.is_published && p.total_stock > 0)).length },
            { id: 'draft', label: 'Draft', count: products.filter(p => p.status === 'paused' || !p.is_published).length },
            { id: 'sold_out', label: 'Out of Stock', count: products.filter(p => p.total_stock === 0 || p.status === 'sold_out').length }
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={`inv-tab-v2-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-1 text-xs font-semibold whitespace-nowrap border-b-2 transition-all relative cursor-pointer ${
                  active ? 'text-zinc-950 font-bold border-zinc-950' : 'text-zinc-400 border-transparent hover:text-zinc-700'
                }`}
              >
                {tab.label} <span className="ml-1 text-[10px] bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5 font-bold">{tab.count}</span>
              </button>
            )
          })}
        </div>

        {/* Grid layout */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white border border-zinc-100 rounded-3xl">
            <Loader2 className="animate-spin text-[#C6FF00]" size={36} />
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Syncing ledger list...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-zinc-200 rounded-3xl bg-white space-y-4">
            <ShoppingBag size={40} className="mx-auto text-zinc-300" />
            <div>
              <h3 className="font-bold text-sm text-zinc-900">No listings found</h3>
              <p className="text-zinc-400 text-xs mt-1 max-w-[240px] mx-auto leading-relaxed">Modify your keywords or add items matching other categories.</p>
            </div>
            <button 
              onClick={() => navigate('/add-product')}
              className="px-4 py-2 bg-zinc-950 text-white font-bold text-xs rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Add New Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p, idx) => {
              const isSoldOut = p.total_stock === 0 || p.status === 'sold_out';
              const isDraft = p.status === 'paused' || !p.is_published;
              
              return (
                <div 
                  key={`${p.id}-${idx}`}
                  className="bg-white border border-zinc-150/80 rounded-2xl overflow-hidden p-2.5 flex flex-col justify-between group shadow-xs relative hover:border-[#C6FF00] transition-colors"
                >
                  {/* Photo frame element */}
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-350">
                    {p.images?.[0] ? (
                      <img 
                        src={p.images[0]} 
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" 
                        alt={p.name}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Package size={30} />
                    )}

                    {/* Left corner badges */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      {isSoldOut ? (
                        <span className="text-[8px] font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full uppercase">
                          Out of Stock
                        </span>
                      ) : isDraft ? (
                        <span className="text-[8px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded-full uppercase">
                          Draft
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold bg-[#C6FF00]/20 text-zinc-900 border border-[#C6FF00]/30 px-2 py-0.5 rounded-full uppercase">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Featured Star symbol */}
                    {p.is_featured && (
                      <div className="absolute top-2.5 right-2.5 bg-yellow-450 border border-yellow-200 text-white rounded-full p-1.5 shadow-sm">
                        <Sparkles size={10} className="fill-white" />
                      </div>
                    )}
                  </div>

                  {/* Body elements */}
                  <div className="pt-3 px-1">
                    <h4 className="text-xs font-bold text-zinc-900 truncate tracking-tight">{p.name}</h4>
                    
                    <div className="flex items-center justify-between mt-2 first-letter:align-middle">
                      <span className="text-zinc-950 text-sm font-bold">${p.price}</span>
                      <span className="text-[10px] text-zinc-400 font-bold">{p.total_stock} in stock</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3.5 pt-2.5 border-t border-zinc-50 flex items-center gap-1.5 justify-between">
                    <button
                      onClick={() => navigate(`/edit-product/${p.id}`)}
                      title="Edit specifications"
                      className="flex-1 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 text-zinc-650 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Edit3 size={12} />
                    </button>

                    <button
                      onClick={() => {
                        handleDuplicate(p);
                      }}
                      title="Duplicate Listing"
                      className="px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 text-zinc-650 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Copy size={12} />
                    </button>

                    <button
                      onClick={() => setSelectedProduct(p)}
                      title="More Options"
                      className="px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 text-zinc-650 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <MoreHorizontal size={12} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Slide-Up Overlay Action sheet panel */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white border-t border-zinc-100 rounded-t-3xl p-6 z-10 pb-12 shadow-2xl text-left"
            >
              <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5" />

              <div className="flex items-center gap-3 pb-5 border-b border-zinc-100">
                <img 
                  src={selectedProduct.images?.[0]} 
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-100 bg-zinc-50" 
                  alt="" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 leading-tight uppercase tracking-tight">{selectedProduct.name}</h4>
                  <span className="text-[11px] text-zinc-400 font-bold">${selectedProduct.price} • {selectedProduct.total_stock} stock items</span>
                </div>
              </div>

              <div className="space-y-2 mt-5">
                <button
                  onClick={() => {
                    handleToggleAvailability(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Toggle Stock Status ({selectedProduct.total_stock === 0 ? 'Mark In Stock' : 'Mark Out of Stock'})</span>
                </button>

                <button
                  onClick={() => {
                    handleToggleFeature(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Sparkles size={14} className="text-yellow-500 fill-yellow-500" />
                  <span>{selectedProduct.is_featured ? 'Remove from Best Seller Highlight' : 'Promote to Best Seller Highlight'}</span>
                </button>

                <button
                  onClick={() => {
                    const link = getProductUrl(selectedProduct.id);
                    navigator.clipboard.writeText(link);
                    toast.success('Product path copied link!');
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Copy size={13} />
                  <span>Copy Store Link</span>
                </button>

                <button
                  onClick={() => {
                    setShowDeleteModal(selectedProduct.id);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {deletingId === selectedProduct.id ? (
                    <Loader2 className="animate-spin text-red-650" size={13} />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  <span>Delete Listing permanently</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 z-10 shadow-2xl text-center"
            >
              <div className="w-12 h-12 bg-red-950/40 border border-red-900/50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              
              <h3 className="font-sans font-bold text-base text-white uppercase tracking-tight italic">Delete Listing?</h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-medium">
                Are you sure you want to delete this listing? This action is permanent and cannot be undone.
              </p>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-[11px] uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProduct(showDeleteModal)}
                  disabled={deletingId === showDeleteModal}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-55"
                >
                  {deletingId === showDeleteModal ? (
                    <Loader2 className="animate-spin" size={13} />
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Bottom Navigation bar tab list */}
      <BottomNavBar />
    </div>
  );
};

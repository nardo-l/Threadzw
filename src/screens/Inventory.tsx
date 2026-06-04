import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit3, Copy, Star, AlertCircle, ShoppingBag, Trash2, CheckCircle2, 
  X, Filter, Home, Package, BarChart3, Settings, Eye, ChevronRight, Sparkles, LogOut, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

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
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'featured' | 'sold_out'>('all');
  
  // States for interactive modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let shop = null;
      try {
        const { data } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', session.user.id)
          .maybeSingle();
        if (data) shop = data;
      } catch (err) {
        console.warn("DB shops query failed in Inventory:", err);
      }

      if (!shop) {
        const cached = localStorage.getItem(`shop_${session.user.id}`) || localStorage.getItem('threadzw_shop');
        if (cached) {
          try {
            shop = JSON.parse(cached);
          } catch (_) {}
        }
        if (!shop) {
          shop = { id: 'local-shop-' + session.user.id };
        }
      }

      if (shop) {
        let prodData = [];
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('shop_id', shop.id)
            .order('created_at', { ascending: false });
          
          if (!error && data && data.length > 0) {
            prodData = data;
          } else {
            const cached = localStorage.getItem(`products_${shop.id}`);
            if (cached) {
              prodData = JSON.parse(cached);
            }
          }
        } catch (dbErr) {
          console.warn("DB product query failed in Inventory, fallback to cached:", dbErr);
          const cached = localStorage.getItem(`products_${shop.id}`);
          if (cached) {
            prodData = JSON.parse(cached);
          }
        }
        setProducts(prodData);
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
      const ownerId = session?.user?.id || product.owner_id;
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          shop_id: product.shop_id,
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

      // Increment product counts RPC trigger
      await supabase.rpc('increment_shop_product_count', { shop_id: product.shop_id });

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
      const { error } = await supabase
        .from('products')
        .update({ is_featured: nextFeatured })
        .eq('id', product.id);

      if (error) throw error;

      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: nextFeatured } : p));
      toast.success(nextFeatured ? 'Listing promoted to Best Seller! ⭐' : 'Pushed to standard listing.');
    } catch (err: any) {
      console.error(err);
      toast.error('Workflow error toggling highlight.');
    }
  };

  // Quick Action: Toggle In Stock vs Sold out
  const handleToggleAvailability = async (product: Product) => {
    const currentIsSoldOut = product.total_stock === 0 || product.status === 'sold_out';
    
    // Switch state triggers:
    // Sold out -> In stock (we assign 10 stock items auto, status = active)
    // In stock -> Sold out (we assign 0 stock items, status = sold_out)
    const nextStatus = currentIsSoldOut ? 'active' : 'sold_out';
    const nextStock = currentIsSoldOut ? 10 : 0;
    
    const updatedSizes = product.sizes.map(sz => ({
      ...sz,
      quantity: currentIsSoldOut ? 10 : 0
    }));

    try {
      const { error } = await supabase
        .from('products')
        .update({
          total_stock: nextStock,
          status: nextStatus,
          sizes: updatedSizes
        })
        .eq('id', product.id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === product.id 
          ? { ...p, total_stock: nextStock, status: nextStatus as any, sizes: updatedSizes } 
          : p
      ));

      toast.success(currentIsSoldOut ? 'Restored inventory stock counts' : 'Listing marked as Sold Out');
    } catch (err) {
      console.error(err);
      toast.error('Workflow status toggle failed.');
    }
  };

  // Quick Action: Confirm deletion
  const handleDeleteProduct = async (productId: string) => {
    const toastId = toast.loading('Purging listing metadata...');
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      setShowDeleteModal(null);
      setSelectedProduct(null);
      toast.success('Listing deleted.', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Purge error: ' + err.message, { id: toastId });
    }
  };

  // Filtering calculations query
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        p.category.toLowerCase().includes(search.toLowerCase()) ||
                        (p.collection && p.collection.toLowerCase().includes(search.toLowerCase()));
    
    if (!matchSearch) return false;
    
    if (activeTab === 'published') return p.is_published && p.total_stock > 0;
    if (activeTab === 'featured') return p.is_featured;
    if (activeTab === 'sold_out') return p.total_stock === 0 || p.status === 'sold_out';
    
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070709] text-white pb-36 relative font-sans selection:bg-[#C6FF00]/10 select-none">
      
      {/* Background glow ambiance */}
      <div className="absolute top-0 inset-x-0 h-[220px] bg-gradient-to-b from-[#C6FF00]/[0.02] to-transparent pointer-events-none blur-3xl" />

      {/* TOP HEADER CONTROLS BANNER */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-sm font-mono tracking-widest uppercase text-zinc-500 font-extrabold leading-none">Creative Hub</h1>
            <p className="text-3xl font-black tracking-tight leading-none uppercase italic text-white mt-1">My Catalog</p>
          </div>
          <button 
            onClick={() => navigate('/add-product')} 
            className="h-12 px-6 rounded-full bg-[#C6FF00] hover:brightness-110 text-black flex items-center justify-center gap-2 font-grotesk font-extrabold text-xs uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-[#C6FF00]/10 cursor-pointer"
          >
            <Plus size={15} strokeWidth={3.5} />
            <span>Post item</span>
          </button>
        </div>

        {/* Dynamic Search assist bar */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
            <Search size={16} />
          </div>
          <input 
            placeholder="Search items, categories, tags..."
            className="w-full h-12 bg-[#121217] border border-white/5 rounded-full pl-11 pr-5 text-sm focus:outline-none focus:border-[#C6FF00] transition-colors placeholder:text-zinc-600"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex px-4 border-b border-white/[0.04] mb-6 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'published', label: 'Active (In Stock)' },
          { id: 'featured', label: 'Highlight Drops' },
          { id: 'sold_out', label: 'Marked Out' }
        ].map((tab, i) => {
          const active = activeTab === tab.id;
          return (
            <button 
              key={`inv-tab-${tab.id}`} 
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-mono uppercase tracking-widest border-b-2 transition-all relative shrink-0 cursor-pointer ${
                active ? 'text-[#C6FF00] font-extrabold border-[#C6FF00]' : 'text-zinc-500 border-transparent hover:text-white'
              }`}
            >
              {tab.label}
              {active && (
                <span className="absolute -top-0.5 right-1 w-1 h-1 rounded-full bg-[#C6FF00] animate-ping" />
              )}
            </button>
          )
        })}
      </div>

      {/* INTUITIVE PINTEREST/INSTAGRAM IMAGE CARD LIST */}
      <main className="px-5 space-y-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#C6FF00] border-t-transparent animate-spin rounded-full" />
            <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wide">Syncing product ledger...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/5 rounded-[28px] bg-[#111116]/50">
            <ShoppingBag size={35} className="mx-auto text-zinc-700 animate-pulse mb-3" />
            <h3 className="font-bold text-sm">No listings found</h3>
            <p className="text-zinc-500 text-xs mt-1.5 max-w-[200px] mx-auto leading-relaxed">Try tweaking your search parameters or post a new drop.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(p => {
              const isSoldOut = p.total_stock === 0 || p.status === 'sold_out';
              return (
                <motion.div 
                  key={p.id} 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#121217] rounded-3xl overflow-hidden border border-white/[0.05] p-2.5 flex flex-col justify-between group relative"
                >
                  
                  {/* Outer thumbnail frame */}
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-950 border border-white/5">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-800"><Package size={28} /></div>
                    )}

                    {/* Badge notifications lists */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      {p.is_featured && (
                        <span className="bg-[#C6FF00] text-black text-[7px] font-black font-mono tracking-widest px-1.5 py-0.5 rounded uppercase leading-none shadow-md">
                          Best Seller
                        </span>
                      )}
                      {p.collection && (
                        <span className="bg-black/80 backdrop-blur-md text-white text-[7.5px] font-mono tracking-wider px-1.5 py-0.5 rounded leading-none border border-white/10 uppercase">
                          {p.collection}
                        </span>
                      )}
                    </div>

                    {/* Sold out overlay */}
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px] z-10">
                        <span className="border-2 border-red-500 text-red-500 rounded font-mono font-extrabold text-[9px] uppercase tracking-widest px-2.5 py-1 rotate-[-6deg] shadow-lg">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body textual information */}
                  <div className="pt-3 px-1.5">
                    <h4 className="font-bold text-xs truncate leading-tight uppercase tracking-wide text-zinc-100">{p.name}</h4>
                    
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[#C6FF00] font-mono text-sm font-extrabold">${p.price}</span>
                      <span className="text-[10px] font-mono text-zinc-500">{p.total_stock} Units</span>
                    </div>
                  </div>

                  {/* BOTTOM REVOLVING INTERACTIVE POP-RAIL ACTION BUTTONS */}
                  <div className="mt-3 border-t border-white/[0.04] pt-2 flex items-center justify-between gap-1">
                    <button
                      onClick={() => navigate(`/edit-product/${p.id}`)}
                      title="Edit Item Specs"
                      className="flex-1 h-9 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                    >
                      <Edit3 size={13} />
                    </button>
                    
                    <button
                      onClick={() => setSelectedProduct(p)}
                      title="Quick Configuration"
                      className="w-10 h-9 rounded-xl bg-[#C6FF00]/5 hover:bg-[#C6FF00]/10 border border-[#C6FF00]/10 flex items-center justify-center text-[#C6FF00] transition-colors cursor-pointer"
                    >
                      <Sparkles size={13} strokeWidth={2.5} />
                    </button>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* DETAILED QUICK CONFIGURATION CONTEXT DIALOG (POP PANEL SLIDERS) */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
            
            {/* Backdrop layer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Panel box */}
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-[#111116] border-t border-white/10 rounded-t-[32px] p-6 z-10 pb-12"
            >
              <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-5 shrink-0" />

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                    <img src={selectedProduct.images?.[0]} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[13px] uppercase tracking-wider text-white line-clamp-1">{selectedProduct.name}</h3>
                    <p className="text-xs text-[#C6FF00] font-mono font-bold mt-0.5">${selectedProduct.price}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/15 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* ACTION TILES ASSISTANT */}
              <div className="space-y-3.5">
                
                {/* 1. EDIT ACTION */}
                <button
                  onClick={() => {
                    navigate(`/edit-product/${selectedProduct.id}`);
                    setSelectedProduct(null);
                  }}
                  className="w-full p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 flex items-center gap-3.5 text-left transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 bg-white/[0.04] rounded-xl flex items-center justify-center text-zinc-300">
                    <Edit3 size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-white font-extrabold">Detailed Modification</h4>
                    <p className="text-zinc-500 text-[10.5px] mt-0.5">Customize photos, description copy, collection drops, MSV details.</p>
                  </div>
                  <ChevronRight size={14} className="text-zinc-600" />
                </button>

                {/* 2. DUPLICATE LISTING */}
                <button
                  onClick={() => {
                    handleDuplicate(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 flex items-center gap-3.5 text-left transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 bg-white/[0.04] rounded-xl flex items-center justify-center text-zinc-300">
                    <Copy size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-white font-extrabold">Clone Listing (Fast Copy)</h4>
                    <p className="text-zinc-500 text-[10.5px] mt-0.5">Duplicates product parameters. Change colorway options quickly.</p>
                  </div>
                  <ChevronRight size={14} className="text-zinc-600" />
                </button>

                {/* 3. FEATURE TOGGLE */}
                <button
                  onClick={() => {
                    handleToggleFeature(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 flex items-center gap-3.5 text-left transition-all cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedProduct.is_featured ? 'bg-[#C6FF00]/10 text-[#C6FF00]' : 'bg-white/[0.04] text-zinc-400'}`}>
                    <Star size={16} className={selectedProduct.is_featured ? 'fill-[#C6FF00]' : ''} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-white font-extrabold">Best Seller Status</h4>
                    <p className="text-zinc-500 text-[10.5px] mt-0.5">Tag this item under Best Seller grid. Floats product atop page.</p>
                  </div>
                  <div className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${selectedProduct.is_featured ? 'bg-[#C6FF00] text-black font-extrabold' : 'bg-zinc-800 text-zinc-500'}`}>
                    {selectedProduct.is_featured ? 'ACTIVE' : 'OFF'}
                  </div>
                </button>

                {/* 4. SET STOCK OPTIONS TOGGLE */}
                <button
                  onClick={() => {
                    handleToggleAvailability(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 flex items-center gap-3.5 text-left transition-all cursor-pointer"
                >
                  {/* Mark Sold out vs Mark restock depending on stock levels */}
                  {selectedProduct.total_stock === 0 ? (
                    <>
                      <div className="w-10 h-10 bg-[#C6FF00]/10 text-[#C6FF00] rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-[#C6FF00] font-extrabold">Mark In Stock</h4>
                        <p className="text-zinc-500 text-[10.5px] mt-0.5">Re-allocates stock buffer value safely. Activates buy status.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                        <ShoppingBag size={16} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-extrabold">Mark Liquidated (Sold Out)</h4>
                        <p className="text-zinc-500 text-[10.5px] mt-0.5">Sets item status immediately to Sold Out on public link.</p>
                      </div>
                    </>
                  )}
                  <ChevronRight size={14} className="text-zinc-600" />
                </button>

                {/* 5. PURGE ROW */}
                <button
                  onClick={() => setShowDeleteModal(selectedProduct.id)}
                  className="w-full p-4 rounded-2xl bg-red-950/10 hover:bg-red-950/20 border border-red-900/10 flex items-center gap-3.5 text-left transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 bg-red-800/20 text-red-400 rounded-xl flex items-center justify-center">
                    <Trash2 size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-red-400 font-extrabold">Purge Metadata (Delete)</h4>
                    <p className="text-zinc-600 text-[10.5px] mt-0.5">Irreversibly erase database assets. Confirm warning step.</p>
                  </div>
                  <ChevronRight size={14} className="text-red-900/40" />
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED DELETE OPTION WARNING CONFIRM OVERLAYS MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center px-6">
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-sm"
              onClick={() => setShowDeleteModal(null)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#121218] border border-white/10 rounded-3xl p-6 z-10 text-center"
            >
              <div className="w-14 h-14 bg-red-900/20 rounded-full flex items-center justify-center text-red-400 mx-auto mb-4 animate-bounce">
                <AlertCircle size={26} />
              </div>

              <h3 className="text-lg font-black tracking-tight text-white uppercase italic">Confirm Purge Protocol</h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                This operation irreversibly deletes this product catalog listing and all associated buyer links. This action cannot be undone.
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  onClick={() => handleDeleteProduct(showDeleteModal)}
                  className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-extrabold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Yes, Purge Metadata
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(null)}
                  className="w-full h-12 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-zinc-300 font-mono font-extrabold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STEADY NAVIGATION BAR FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#0E0E12] border-t border-white/[0.04] z-50 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex items-center pb-safe">
        <div className="flex items-center justify-around w-full min-w-max px-4 gap-2">
          <NavTab icon={<Home size={20} />} label="Dashboard" onClick={() => navigate('/dashboard')} />
          <NavTab icon={<ShoppingBag size={20} />} label="Sales" onClick={() => navigate('/sales')} />
          <NavTab icon={<Package size={20} />} label="Products" active />
          <NavTab icon={<BarChart3 size={20} />} label="Analytics" onClick={() => navigate('/analytics')} />
          <NavTab icon={<Settings size={20} />} label="Settings" onClick={() => navigate('/settings')} />
        </div>
      </div>

    </div>
  );
};

const NavTab = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-5 py-1.5 rounded-xl transition-all cursor-pointer ${active ? 'text-[#C6FF00]' : 'text-zinc-500 hover:text-white'}`}
  >
    {icon}
    <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{label}</span>
  </button>
);

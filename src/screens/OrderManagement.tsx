import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Plus, 
  X, 
  ChevronRight, 
  Minus, 
  Store, 
  MessageCircle, 
  Edit2, 
  Trash2, 
  Receipt,
  Calendar,
  Tag,
  ShoppingBag,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { mapError } from '../lib/utils';
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';

// --- Types ---

interface ProductVariant {
  size: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  condition?: string;
  images: string[];
  sizes: ProductVariant[];
  total_stock: number;
  is_published: boolean;
}

interface Sale {
  id: string;
  shop_id: string;
  product_id: string;
  product_name: string; // Joined field
  size: string;
  quantity: number;
  sale_price: number;
  listed_price: number; // Joined field
  channel: 'in_store' | 'whatsapp';
  reference: string;
  created_at: string;
  is_negotiated: boolean;
}

interface Filters {
  dateRange: 'All' | 'Today' | 'This Week' | 'This Month' | 'Custom';
  channel: 'All' | 'in_store' | 'whatsapp';
  saleType: 'All' | 'Full Price' | 'Negotiated';
  productId: string;
}

export const OrderManagement: React.FC = () => {
  const { userShop } = useInventory();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [filters, setFilters] = useState<Filters>({
    dateRange: 'All',
    channel: 'All',
    saleType: 'All',
    productId: 'All'
  });

  const fetchData = async () => {
    if (!userShop?.id) return;
    setLoading(true);
    
    // Safety timeout to prevent stuck loading state
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    try {
      // Fetch Products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', userShop.id);
      
      // Map sizes from jsonb to ProductVariant if needed
      if (productsData) {
        setProducts(productsData.map(p => ({
          ...p,
          sizes: p.sizes || []
        })));
      }

      // Fetch Orders
      const { data: salesData, error: salesError } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(name, price)
        `)
        .eq('shop_id', userShop.id)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      if (salesData) {
        setSales(salesData.map(s => ({
          ...s,
          product_name: s.product?.name || 'Unknown Product',
          listed_price: s.product?.price || s.sale_price,
          reference: s.order_reference
        })));
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(mapError(error) || 'Failed to load orders');
    } finally {
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userShop?.id]);

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const now = new Date();
    const todaySales = sales.filter(s => isToday(parseISO(s.created_at)));
    const monthSales = sales.filter(s => {
      const date = parseISO(s.created_at);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    return {
      todayRevenue: todaySales.reduce((acc, s) => acc + (s.sale_price * s.quantity), 0),
      todaySalesCount: todaySales.reduce((acc, s) => acc + s.quantity, 0),
      monthRevenue: monthSales.reduce((acc, s) => acc + (s.sale_price * s.quantity), 0)
    };
  }, [sales]);

  // --- Filter Logic ---
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Search
      const matchesSearch = 
        sale.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.reference?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Date Range
      if (filters.dateRange === 'Today' && !isToday(parseISO(sale.created_at))) return false;
      if (filters.dateRange === 'This Week' && !isThisWeek(parseISO(sale.created_at))) return false;
      if (filters.dateRange === 'This Month') {
        const date = parseISO(sale.created_at);
        const now = new Date();
        if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false;
      }

      // Channel
      if (filters.channel !== 'All' && sale.channel !== filters.channel) return false;

      // Sale Type
      if (filters.saleType === 'Negotiated' && !sale.is_negotiated) return false;
      if (filters.saleType === 'Full Price' && sale.is_negotiated) return false;

      // Product
      if (filters.productId !== 'All' && sale.product_id !== filters.productId) return false;

      return true;
    });
  }, [sales, searchQuery, filters]);

  // --- Grouped Sales ---
  const groupedSales = useMemo(() => {
    const groups: { [key: string]: Sale[] } = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Earlier': []
    };

    filteredSales.forEach(sale => {
      const date = parseISO(sale.created_at);
      if (isToday(date)) groups['Today'].push(sale);
      else if (isYesterday(date)) groups['Yesterday'].push(sale);
      else if (isThisWeek(date)) groups['This Week'].push(sale);
      else groups['Earlier'].push(sale);
    });

    return groups;
  }, [filteredSales]);

  // --- Handlers ---
  const handleLogSale = async (newSale: any) => {
    if (!userShop?.id) return;
    
    try {
      const product = products.find(p => p.id === newSale.product_id);
      const { data, error } = await supabase
        .from('orders')
        .insert({
          shop_id: userShop.id,
          owner_id: user.id,
          product_id: newSale.product_id,
          product_name: product?.name || 'Unknown Product',
          listed_price: product?.price || newSale.sale_price,
          size: newSale.size,
          quantity: newSale.quantity,
          sale_price: newSale.sale_price,
          is_negotiated: newSale.is_negotiated,
          channel: newSale.channel
        })
        .select(`
          *,
          product:products(name, price)
        `)
        .single();

      if (error) throw error;

      if (data) {
        const mapped: Sale = {
          ...data,
          product_name: data.product?.name || 'Unknown Product',
          listed_price: data.product?.price || data.sale_price,
          reference: data.order_reference
        };
        setSales(prev => [mapped, ...prev]);
        toast.success('Sale logged ✓ Stock updated');
        setIsLogSheetOpen(false);
        // Refresh everything to ensure stock UI is accurate
        fetchData();
      }
    } catch (error: any) {
      console.error('Error logging sale:', error);
      toast.error(mapError(error) || 'Failed to log sale');
    }
  };

  const handleUpdateSale = async (updatedSale: Sale) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          size: updatedSale.size,
          quantity: updatedSale.quantity,
          sale_price: updatedSale.sale_price,
          is_negotiated: updatedSale.is_negotiated,
          channel: updatedSale.channel
        })
        .eq('id', updatedSale.id);

      if (error) throw error;

      setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
      setEditingSale(null);
      toast.success('Sale updated ✓');
      fetchData();
    } catch (error: any) {
      console.error('Error updating sale:', error);
      toast.error(mapError(error) || 'Failed to update sale');
    }
  };

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', saleToDelete.id);

      if (error) throw error;

      setSales(prev => prev.filter(s => s.id !== saleToDelete.id));
      setIsDeleteModalOpen(false);
      setSaleToDelete(null);
      toast.success('Sale deleted ✓');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      toast.error(mapError(error) || 'Failed to delete sale');
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-screen pb-12">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex flex-col max-w-[430px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-pacifico text-white">Orders</h1>
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">SoleKing HRE</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsFilterSheetOpen(true)} className={`p-2 rounded-full transition-colors ${Object.values(filters).some(v => v !== 'All') ? 'text-primary' : 'text-white'}`}>
              <Filter size={20} />
            </button>
            <button onClick={() => setIsSearchExpanded(!isSearchExpanded)} className="p-2 text-white">
              <Search size={20} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isSearchExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input 
                  type="text"
                  placeholder="Search product, ID, or note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-card border border-white/10 rounded-pill py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                    <X size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-2">
          {Object.entries(filters).map(([key, value]) => {
            if (value === 'All') return null;
            return (
              <button 
                key={key}
                onClick={() => setFilters(prev => ({ ...prev, [key]: 'All' }))}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 rounded-pill text-[10px] font-mono text-primary whitespace-nowrap"
              >
                {value}
                <X size={10} />
              </button>
            );
          })}
        </div>
      </header>

      <main className="pt-32 px-6 flex flex-col gap-8">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Today's Revenue" value={`$${stats.todayRevenue}`} color="text-secondary" delay={0.1} />
          <StatCard label="Today's Sales" value={stats.todaySalesCount} color="text-green-400" delay={0.2} />
          <StatCard label="This Month" value={`$${stats.monthRevenue}`} color="text-primary" delay={0.3} />
        </div>

        {/* Log a Sale Button */}
        <button 
          onClick={() => setIsLogSheetOpen(true)}
          className="w-full py-4 gradient-pink-purple text-white font-syne font-bold rounded-button shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Log a Sale
        </button>

        {/* Sales Log Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-primary uppercase tracking-[0.3em]">Sales Log</span>
          </div>

          {filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-card border border-dashed border-white/10 gap-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted">
                <Receipt size={32} />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-syne font-bold text-white">No sales found</h3>
                <p className="text-sm text-muted font-sans mt-1">Try adjusting your filters or log a new sale</p>
              </div>
              <button 
                onClick={() => setIsLogSheetOpen(true)}
                className="mt-2 px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded-pill text-xs font-bold"
              >
                Log a Sale
              </button>
            </div>
          ) : (
            (Object.entries(groupedSales) as [string, Sale[]][]).map(([group, groupSales]) => {
              if (groupSales.length === 0) return null;
              return (
                <div key={group} className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-muted uppercase tracking-widest whitespace-nowrap">{group}</span>
                    <div className="h-[1px] w-full bg-white/5" />
                  </div>
                  <div className="flex flex-col gap-4">
                    {groupSales.map(sale => (
                      <SaleCard 
                        key={sale.id} 
                        sale={sale} 
                        products={products}
                        onEdit={() => setEditingSale(sale)}
                        onDelete={() => {
                          setSaleToDelete(sale);
                          setIsDeleteModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Sheets & Modals */}
      <AnimatePresence>
        {isLogSheetOpen && (
          <SaleSheet 
            products={products}
            onClose={() => setIsLogSheetOpen(false)}
            onConfirm={handleLogSale}
          />
        )}
        {editingSale && (
          <SaleSheet 
            products={products}
            initialSale={editingSale}
            onClose={() => setEditingSale(null)}
            onConfirm={(sale) => handleUpdateSale({ ...editingSale, ...sale })}
          />
        )}
        {isFilterSheetOpen && (
          <FilterSheet 
            filters={filters}
            products={products}
            onClose={() => setIsFilterSheetOpen(false)}
            onApply={setFilters}
          />
        )}
        {isDeleteModalOpen && saleToDelete && (
          <DeleteModal 
            sale={saleToDelete}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteSale}
          />
        )}
      </AnimatePresence>

      <div className="h-20" />
    </div>
  );
};

// --- Sub-components ---

const StatCard: React.FC<{ label: string; value: string | number; color: string; delay: number }> = ({ label, value, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-card p-4 rounded-card border border-white/5 flex flex-col gap-1"
  >
    <span className={`text-xl font-syne font-bold ${color}`}>{value}</span>
    <span className="text-[8px] font-mono text-muted uppercase tracking-wider">{label}</span>
  </motion.div>
);

const SaleCard: React.FC<{ sale: Sale; products: Product[]; onEdit: () => void; onDelete: () => void }> = ({ sale, products, onEdit, onDelete }) => {
  const isNegotiated = sale.is_negotiated;
  const date = parseISO(sale.created_at);
  const timeStr = format(date, 'h:mm a');
  const dateStr = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMM d');
  const product = products.find(p => p.id === sale.product_id);

  return (
    <div className="bg-card rounded-card border border-white/5 overflow-hidden flex flex-col">
      <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
        <span className="text-[10px] font-mono text-muted">{sale.reference}</span>
        <span className="text-[10px] font-mono text-muted">{dateStr}, {timeStr}</span>
      </div>
      
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-pink-purple flex items-center justify-center text-2xl opacity-80 overflow-hidden">
            {product?.images?.[0] ? (
              <img src={product.images[0] || undefined} alt="" className="w-full h-full object-cover" />
            ) : (
              '👟'
            )}
          </div>
          <div className="flex-1 flex flex-col">
            <h4 className="text-sm font-bold text-white">{sale.product_name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2 py-0.5 bg-white/5 rounded-pill text-[10px] font-mono text-light">{sale.size}</span>
              <span className="text-[10px] font-mono text-muted">×{sale.quantity}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-syne font-bold text-primary">${sale.sale_price * sale.quantity}</span>
            {isNegotiated && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted line-through">${sale.listed_price * sale.quantity}</span>
                <span className="px-2 py-0.5 bg-amber-400/10 text-amber-400 text-[8px] font-mono font-bold rounded-pill border border-amber-400/20 uppercase">Negotiated</span>
              </div>
            )}
          </div>
          <div className={`px-3 py-1 rounded-pill text-[10px] font-mono font-bold flex items-center gap-1.5 capitalize ${
            sale.channel === 'in_store' ? 'bg-green-400/10 text-green-400' : 'bg-blue-400/10 text-blue-400'
          }`}>
            {sale.channel === 'in_store' ? <Store size={12} /> : <MessageCircle size={12} />}
            {sale.channel.replace('_', ' ')}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <button onClick={onEdit} className="flex items-center gap-1.5 text-[10px] font-mono text-muted hover:text-white transition-colors">
            <Edit2 size={12} />
            Edit
          </button>
          <button onClick={onDelete} className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors">
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const SaleSheet: React.FC<{ 
  products: Product[]; 
  initialSale?: Sale;
  onClose: () => void; 
  onConfirm: (sale: any) => void 
}> = ({ products, initialSale, onClose, onConfirm }) => {
  const [step, setStep] = useState(initialSale ? 2 : 1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    initialSale ? products.find(p => p.id === initialSale.product_id) || null : null
  );
  const [search, setSearch] = useState('');
  const [size, setSize] = useState(initialSale?.size || '');
  const [quantity, setQuantity] = useState(initialSale?.quantity || 1);
  const [price, setPrice] = useState(initialSale?.sale_price || 0);
  const [channel, setChannel] = useState<'in_store' | 'whatsapp'>(initialSale?.channel || 'in_store');

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelectProduct = (p: Product) => {
    if (p.total_stock === 0) return;
    setSelectedProduct(p);
    setPrice(p.price);
    setStep(2);
  };

  const currentVariant = selectedProduct?.sizes.find(v => v.size === size);
  const maxStock = currentVariant ? currentVariant.quantity + (initialSale?.size === size ? initialSale.quantity : 0) : 0;

  const total = price * quantity;
  const isNegotiated = selectedProduct && price !== selectedProduct.price;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-background w-full max-w-[430px] rounded-t-[32px] p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-2" />
        
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-syne font-bold text-white">{initialSale ? 'Edit Sale' : 'Log a Sale'}</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-card text-muted"><X size={20} /></button>
        </div>

        {step === 1 ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-mono text-primary uppercase tracking-widest">Which product was sold?</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input 
                  type="text"
                  placeholder="Search your listings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-card border border-white/10 rounded-pill py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {filteredProducts.map(p => {
                const isOutOfStock = p.total_stock === 0;
                return (
                  <button
                    key={p.id}
                    disabled={isOutOfStock}
                    onClick={() => handleSelectProduct(p)}
                    className={`p-4 rounded-card border transition-all flex items-center justify-between ${
                      isOutOfStock ? 'bg-card/50 border-white/5 opacity-50' : 'bg-card border-white/5 active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl gradient-pink-purple flex items-center justify-center text-xl opacity-80 overflow-hidden">
                        {p.images?.[0] ? (
                          <img src={p.images[0] || undefined} alt="" className="w-full h-full object-cover" />
                        ) : (
                          '👟'
                        )}
                      </div>
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-sm font-bold text-white line-clamp-1">{p.name}</span>
                        <span className="text-[10px] font-mono text-muted">{p.total_stock} in stock</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-syne font-bold text-primary">${p.price}</span>
                      {isOutOfStock && <span className="text-[8px] font-mono text-red-100 uppercase">Out of Stock</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Summary Chip */}
            <div className="bg-card p-3 rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-pink-purple flex items-center justify-center text-xl opacity-80 overflow-hidden">
                  {selectedProduct?.images?.[0] ? (
                    <img src={selectedProduct.images[0] || undefined} alt="" className="w-full h-full object-cover" />
                  ) : (
                    '👟'
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{selectedProduct?.name}</span>
                  <span className="text-[10px] font-mono text-muted">${selectedProduct?.price} listed</span>
                </div>
              </div>
              {!initialSale && (
                <button onClick={() => setStep(1)} className="p-2 text-muted hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Size Selection */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Size</label>
              <div className="flex flex-wrap gap-2">
                {selectedProduct?.sizes.map(v => {
                  const isAvailable = v.quantity > 0 || (initialSale?.size === v.size);
                  const isSelected = size === v.size;
                  return (
                    <button
                      key={v.size}
                      disabled={!isAvailable}
                      onClick={() => {
                        setSize(v.size);
                        setQuantity(1);
                      }}
                      className={`px-4 py-2 rounded-pill border text-xs font-bold transition-all ${
                        isSelected 
                          ? 'bg-primary border-primary text-white' 
                          : isAvailable 
                            ? 'bg-card border-white/10 text-white' 
                            : 'bg-card/50 border-white/5 text-muted opacity-50'
                      }`}
                    >
                      {v.size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Quantity</label>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 bg-card p-1 rounded-pill border border-white/10">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-90 transition-all"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-lg font-syne font-bold text-white min-w-[20px] text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                    disabled={quantity >= maxStock}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-30"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Max: {maxStock}</span>
              </div>
            </div>

            {/* Sale Price */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Sale Price (per unit)</label>
                {isNegotiated && (
                  <span className="px-2 py-0.5 bg-amber-400/10 text-amber-400 text-[8px] font-mono font-bold rounded-pill border border-amber-400/20 uppercase">Negotiated</span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-syne font-bold">$</span>
                <input 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-card border border-white/10 rounded-pill py-3 pl-8 pr-4 text-sm text-white font-syne font-bold focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Sale Channel */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Sale Channel</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-card rounded-pill border border-white/10">
                <button 
                  onClick={() => setChannel('in_store')}
                  className={`py-2 rounded-pill text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    channel === 'in_store' ? 'bg-primary text-white' : 'text-muted'
                  }`}
                >
                  <Store size={14} /> In Store
                </button>
                <button 
                  onClick={() => setChannel('whatsapp')}
                  className={`py-2 rounded-pill text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    channel === 'whatsapp' ? 'bg-primary text-white' : 'text-muted'
                  }`}
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-mono text-muted uppercase tracking-widest">Total</span>
                <span className="text-2xl font-syne font-bold text-primary">${total}</span>
              </div>
              <button 
                disabled={!size}
                onClick={() => onConfirm({
                  product_id: selectedProduct!.id,
                  size,
                  quantity,
                  sale_price: price,
                  is_negotiated: isNegotiated,
                  channel
                })}
                className="w-full py-4 bg-primary text-white font-syne font-bold rounded-button shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
              >
                {initialSale ? 'Save Changes' : 'Confirm Sale'}
              </button>
              {initialSale && (
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-transparent border border-white/10 text-white font-bold rounded-button active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const FilterSheet: React.FC<{ 
  filters: Filters; 
  products: Product[];
  onClose: () => void; 
  onApply: (f: Filters) => void 
}> = ({ filters: initialFilters, products, onClose, onApply }) => {
  const [localFilters, setLocalFilters] = useState<Filters>(initialFilters);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-background w-full max-w-[430px] rounded-t-[32px] p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-2" />
        
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-syne font-bold text-white">Filters</h2>
          <button onClick={() => onApply({ dateRange: 'All', channel: 'All', saleType: 'All', productId: 'All' })} className="text-xs font-mono text-muted uppercase tracking-widest hover:text-white transition-colors">Reset</button>
        </div>

        <div className="flex flex-col gap-6">
          {/* Date Range */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Date Range</label>
            <div className="flex flex-wrap gap-2">
              {['All', 'Today', 'This Week', 'This Month'].map(range => (
                <button
                  key={range}
                  onClick={() => setLocalFilters(prev => ({ ...prev, dateRange: range as any }))}
                  className={`px-4 py-2 rounded-pill border text-xs font-bold transition-all ${
                    localFilters.dateRange === range ? 'bg-primary border-primary text-white' : 'bg-card border-white/10 text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Channel */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Channel</label>
            <div className="flex gap-2">
              {['All', 'in_store', 'whatsapp'].map(c => (
                <button
                  key={c}
                  onClick={() => setLocalFilters(prev => ({ ...prev, channel: c as any }))}
                  className={`px-4 py-2 rounded-pill border text-xs font-bold transition-all capitalize ${
                    localFilters.channel === c ? 'bg-primary border-primary text-white' : 'bg-card border-white/10 text-white'
                  }`}
                >
                  {c.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Sale Type */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Sale Type</label>
            <div className="flex gap-2">
              {['All', 'Full Price', 'Negotiated'].map(t => (
                <button
                  key={t}
                  onClick={() => setLocalFilters(prev => ({ ...prev, saleType: t as any }))}
                  className={`px-4 py-2 rounded-pill border text-xs font-bold transition-all ${
                    localFilters.saleType === t ? 'bg-primary border-primary text-white' : 'bg-card border-white/10 text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Product</label>
            <select 
              value={localFilters.productId}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, productId: e.target.value }))}
              className="w-full bg-card border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary transition-all appearance-none"
            >
              <option value="All">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => {
              onApply(localFilters);
              onClose();
            }}
            className="w-full py-4 bg-primary text-white font-syne font-bold rounded-button shadow-xl shadow-primary/20 active:scale-[0.98] transition-all mt-4"
          >
            Apply Filters
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DeleteModal: React.FC<{ sale: Sale; onClose: () => void; onConfirm: () => void }> = ({ sale, onClose, onConfirm }) => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-6"
    onClick={onClose}
  >
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      className="bg-card w-full max-w-[340px] rounded-[32px] p-8 flex flex-col gap-6 border border-white/5"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-16 h-16 rounded-full bg-red-400/10 flex items-center justify-center text-red-400 mb-2">
          <Trash2 size={32} />
        </div>
        <h2 className="text-xl font-syne font-bold text-white">Delete this sale?</h2>
        <p className="text-sm text-muted font-sans leading-relaxed">
          This will restore <span className="text-white font-bold">{sale.quantity} unit(s)</span> of <span className="text-white font-bold">{sale.product_name}</span> to stock.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={onConfirm}
          className="w-full py-4 bg-red-400 text-white font-bold rounded-button active:scale-[0.98] transition-all"
        >
          Delete
        </button>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-transparent border border-white/10 text-white font-bold rounded-button active:scale-[0.98] transition-all"
        >
          Keep
        </button>
      </div>
    </motion.div>
  </motion.div>
);

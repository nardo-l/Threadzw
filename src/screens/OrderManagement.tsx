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
    <div className="flex flex-col bg-cream min-h-screen pb-12">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-xl px-6 py-6 flex flex-col max-w-[430px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-5xl font-display font-black uppercase italic tracking-tighter leading-none">
              the <span className="text-[#C6FF00]">log</span>
            </h1>
            <p className="italic-accent text-lg mt-1">Order Engagement Ledger</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsFilterSheetOpen(true)} className={`w-12 h-12 rounded-full border-2 border-charcoal flex items-center justify-center transition-all ${Object.values(filters).some(v => v !== 'All') ? 'bg-lime' : 'bg-white'}`}>
              <Filter size={20} />
            </button>
            <button onClick={() => setIsSearchExpanded(!isSearchExpanded)} className="w-12 h-12 rounded-full border-2 border-charcoal bg-white flex items-center justify-center">
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
              className="mt-6 overflow-hidden"
            >
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-charcoal/20 group-focus-within:text-[#C6FF00] transition-colors" size={20} />
                <input 
                  type="text"
                  placeholder="ID / Reference / Product"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-2 border-charcoal rounded-[24px] py-4 pl-14 pr-12 text-sm text-charcoal font-display uppercase tracking-tight focus:shadow-[8px_8px_0_#C6FF00] outline-none transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-charcoal/30">
                    <X size={20} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4">
          {Object.entries(filters).map(([key, value]) => {
            if (value === 'All') return null;
            return (
              <button 
                key={key}
                onClick={() => setFilters(prev => ({ ...prev, [key]: 'All' }))}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-charcoal text-cream border-2 border-charcoal rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-[4px_4px_0_#C6FF00]"
              >
                {value}
                <X size={12} />
              </button>
            );
          })}
        </div>
      </header>

      <main className="pt-48 px-6 flex flex-col gap-10">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Today Rev" value={`$${stats.todayRevenue}`} color="text-charcoal" delay={0.1} />
          <StatCard label="Today Unit" value={stats.todaySalesCount} color="text-[#C6FF00]" delay={0.2} />
          <StatCard label="Month Rev" value={`$${stats.monthRevenue}`} color="text-charcoal" delay={0.3} />
        </div>

        {/* Log a Sale Button */}
        <button 
          onClick={() => setIsLogSheetOpen(true)}
          className="w-full py-6 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-[32px] shadow-[10px_10px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3"
        >
          <Plus size={28} strokeWidth={3} />
          Log Engagement
        </button>

        {/* Sales Log Section */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-charcoal/20 uppercase tracking-[0.4em]">Historical Ledger</span>
            <div className="h-px flex-1 bg-charcoal/10" />
          </div>

          {filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border-2 border-dashed border-charcoal/20 shadow-inner gap-6 text-center">
              <div className="w-20 h-20 rounded-[32px] bg-cream border-2 border-charcoal flex items-center justify-center text-charcoal/10 shadow-[8px_8px_0_rgba(0,0,0,0.05)]">
                <Receipt size={40} />
              </div>
              <div className="px-10">
                <h3 className="text-3xl font-display font-black uppercase italic tracking-tighter leading-none mb-2">Zero Records</h3>
                <p className="italic-accent text-lg text-charcoal/40">The ledger is void. Initialize a transaction log.</p>
              </div>
              <button 
                onClick={() => setIsLogSheetOpen(true)}
                className="px-10 py-4 bg-charcoal text-cream rounded-full font-black uppercase tracking-widest italic text-xs shadow-[6px_6px_0_#C6FF00]"
              >
                Log First Sale
              </button>
            </div>
          ) : (
            (Object.entries(groupedSales) as [string, Sale[]][]).map(([group, groupSales]) => {
              if (groupSales.length === 0) return null;
              return (
                <div key={group} className="flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-[#C6FF00] uppercase tracking-widest whitespace-nowrap bg-[#C6FF00]/10 px-3 py-1 rounded-full">{group}</span>
                    <div className="h-[2px] w-full bg-charcoal/5" />
                  </div>
                  <div className="flex flex-col gap-6">
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
    className="bg-white p-5 rounded-[24px] border-2 border-charcoal flex flex-col gap-1 shadow-[4px_4px_0_rgba(0,0,0,0.05)]"
  >
    <span className={`text-2xl font-display font-black italic tracking-tighter leading-none ${color}`}>{value}</span>
    <span className="text-[8px] font-black text-charcoal/30 uppercase tracking-widest">{label}</span>
  </motion.div>
);

const SaleCard: React.FC<{ sale: Sale; products: Product[]; onEdit: () => void; onDelete: () => void }> = ({ sale, products, onEdit, onDelete }) => {
  const isNegotiated = sale.is_negotiated;
  const date = parseISO(sale.created_at);
  const timeStr = format(date, 'h:mm a');
  const dateStr = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMM d');
  const product = products.find(p => p.id === sale.product_id);

  return (
    <div className="bg-white rounded-[32px] border-2 border-charcoal overflow-hidden flex flex-col shadow-[8px_8px_0_rgba(0,0,0,0.05)] hover:shadow-[10px_10px_0_#C6FF00] transition-all">
      <div className="px-5 py-3 bg-cream border-b-2 border-charcoal flex justify-between items-center">
        <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest">{sale.reference}</span>
        <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest">{dateStr}, {timeStr}</span>
      </div>
      
      <div className="p-6 flex flex-col gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-cream border-2 border-charcoal flex items-center justify-center text-3xl font-display font-black text-charcoal italic overflow-hidden shadow-inner">
            {product?.images?.[0] ? (
              <img src={product.images[0] || undefined} alt="" className="w-full h-full object-cover" />
            ) : (
              <ShoppingBag size={24} />
            )}
          </div>
          <div className="flex-1 flex flex-col">
            <h4 className="text-xl font-display font-black uppercase italic tracking-tighter leading-none">{sale.product_name}</h4>
            <div className="flex items-center gap-3 mt-2">
              <div className="oval-sticker !bg-charcoal !text-cream !shadow-none !text-[9px]">{sale.size}</div>
              <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest">×{sale.quantity} UNIT</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-display font-black text-[#C6FF00] italic tracking-tighter leading-none">${sale.sale_price * sale.quantity}</span>
            {isNegotiated && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-display font-black text-charcoal/20 line-through tracking-tighter">${sale.listed_price * sale.quantity}</span>
                <span className="oval-sticker !bg-lime !text-charcoal !shadow-none !text-[8px]">Negotiated</span>
              </div>
            )}
          </div>
          <div className={`oval-sticker !shadow-none !text-[9px] flex items-center gap-2 ${
            sale.channel === 'in_store' ? '!bg-charcoal !text-white' : '!bg-white border-2 border-charcoal !text-charcoal'
          }`}>
            {sale.channel === 'in_store' ? <Store size={14} /> : <MessageCircle size={14} />}
            {sale.channel.replace('_', ' ')}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t-2 border-charcoal/5">
          <button onClick={onEdit} className="flex items-center gap-2 text-[10px] font-black text-charcoal/40 hover:text-charcoal transition-colors uppercase tracking-widest italic">
            <Edit2 size={14} />
            Refine
          </button>
          <button onClick={onDelete} className="flex items-center gap-2 text-[10px] font-black text-[#C6FF00] hover:text-[#C6FF00]-dark transition-colors uppercase tracking-widest italic">
            <Trash2 size={14} />
            Purge
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
      className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-cream w-full max-w-[430px] rounded-t-[40px] border-t-4 border-charcoal p-10 flex flex-col gap-8 max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-16 h-1.5 bg-charcoal/10 rounded-full mx-auto" />
        
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter leading-none">{initialSale ? 'Edit Record' : 'Initialize Sale'}</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border-2 border-charcoal flex items-center justify-center text-charcoal"><X size={20} /></button>
        </div>

        {step === 1 ? (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em] italic">Product Identification</label>
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-charcoal/20 group-focus-within:text-[#C6FF00] transition-colors" size={20} />
                <input 
                  type="text"
                  placeholder="Query units catalog..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border-2 border-charcoal rounded-[24px] py-4 pl-14 pr-6 text-sm text-charcoal outline-none focus:shadow-[6px_6px_0_#C6FF00] transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {filteredProducts.map(p => {
                const isOutOfStock = p.total_stock === 0;
                return (
                  <button
                    key={p.id}
                    disabled={isOutOfStock}
                    onClick={() => handleSelectProduct(p)}
                    className={`p-5 rounded-[32px] border-2 transition-all flex items-center justify-between shadow-[4px_4px_0_rgba(0,0,0,0.05)] ${
                      isOutOfStock ? 'bg-white/50 border-charcoal/10 opacity-50 grayscale' : 'bg-white border-charcoal hover:shadow-[6px_6px_0_#C6FF00] active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-14 h-14 rounded-2xl bg-cream border-2 border-charcoal flex items-center justify-center text-2xl font-display font-black text-charcoal italic overflow-hidden shadow-inner">
                        {p.images?.[0] ? (
                          <img src={p.images[0] || undefined} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag size={20} />
                        )}
                      </div>
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-lg font-display font-black uppercase italic tracking-tighter leading-none">{p.name}</span>
                        <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest mt-1">{p.total_stock} IN BASE</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-display font-black text-[#C6FF00] italic tracking-tighter leading-none">${p.price}</span>
                      {isOutOfStock && <span className="text-[8px] font-black text-[#C6FF00] uppercase mt-1">DEPLETED</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Summary Chip */}
            <div className="bg-white p-5 rounded-[32px] border-2 border-charcoal flex items-center justify-between shadow-[6px_6px_0_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cream border-2 border-charcoal flex items-center justify-center text-2xl font-display font-black text-charcoal italic overflow-hidden shadow-inner">
                  {selectedProduct?.images?.[0] ? (
                    <img src={selectedProduct.images[0] || undefined} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag size={20} />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-display font-black uppercase italic tracking-tighter leading-none">{selectedProduct?.name}</span>
                  <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest mt-1">${selectedProduct?.price} LISTED</span>
                </div>
              </div>
              {!initialSale && (
                <button onClick={() => setStep(1)} className="w-10 h-10 rounded-full bg-cream border-2 border-charcoal flex items-center justify-center text-charcoal/30 hover:text-charcoal transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Size Selection */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest italic">Inventory Class (Size)</label>
              <div className="flex flex-wrap gap-3">
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
                      className={`px-6 py-3 rounded-full border-2 text-xs font-black uppercase tracking-widest transition-all ${
                        isSelected 
                          ? 'bg-charcoal border-charcoal text-white shadow-[4px_4px_0_#C6FF00]' 
                          : isAvailable 
                            ? 'bg-white border-charcoal text-charcoal' 
                            : 'bg-white/50 border-charcoal/10 text-charcoal/20 opacity-50'
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
              <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest italic">Quantity Protocol</label>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-6 bg-white p-2 rounded-full border-2 border-charcoal inline-flex shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-full bg-cream border-2 border-charcoal flex items-center justify-center text-charcoal active:scale-90 transition-all"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-2xl font-display font-black text-charcoal min-w-[30px] text-center italic tracking-tighter">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                    disabled={quantity >= maxStock}
                    className="w-12 h-12 rounded-full bg-charcoal border-2 border-charcoal flex items-center justify-center text-cream active:scale-90 transition-all disabled:opacity-30"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest italic">Base Max: {maxStock}</span>
              </div>
            </div>

            {/* Sale Price */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest italic">Unit Price Calibration</label>
                {isNegotiated && (
                  <div className="oval-sticker !bg-lime !text-charcoal !shadow-none !text-[8.5px]">Negotiated</div>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-charcoal font-display font-black text-2xl italic tracking-tighter leading-none">$</span>
                <input 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-white border-2 border-charcoal rounded-[24px] py-5 pl-12 pr-6 text-2xl font-display font-black text-[#C6FF00] outline-none italic tracking-tighter focus:shadow-[6px_6px_0_#C6FF00] transition-all"
                />
              </div>
            </div>

            {/* Sale Channel */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest italic">Capture Channel</label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-white border-2 border-charcoal rounded-full shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <button 
                  onClick={() => setChannel('in_store')}
                  className={`py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    channel === 'in_store' ? 'bg-charcoal text-white' : 'text-charcoal/40'
                  }`}
                >
                  <Store size={16} /> Physical
                </button>
                <button 
                  onClick={() => setChannel('whatsapp')}
                  className={`py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    channel === 'whatsapp' ? 'bg-[#C6FF00] text-charcoal' : 'text-charcoal/40'
                  }`}
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6 mt-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest italic">Sum Total</span>
                <span className="text-4xl font-display font-black text-charcoal italic tracking-tighter leading-none">${total}</span>
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
                className="w-full py-6 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-[32px] shadow-[10px_10px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:grayscale"
              >
                {initialSale ? 'Update Ledger' : 'Confirm Entry'}
              </button>
              {initialSale && (
                <button 
                  onClick={onClose}
                  className="w-full py-5 bg-transparent border-2 border-charcoal text-charcoal font-black uppercase tracking-widest italic text-[11px] rounded-[32px] active:scale-[0.98] transition-all"
                >
                  Abort
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
      className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-cream w-full max-w-[430px] rounded-t-[40px] border-t-4 border-charcoal p-10 flex flex-col gap-8 max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-16 h-1.5 bg-charcoal/10 rounded-full mx-auto" />
        
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter leading-none">Filter Protocol</h2>
          <button onClick={() => onApply({ dateRange: 'All', channel: 'All', saleType: 'All', productId: 'All' })} className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest hover:text-charcoal transition-colors italic underline decoration-charcoal/10 underline-offset-4">Reset Ledger</button>
        </div>

        <div className="flex flex-col gap-8">
          {/* Date Range */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest italic">Temporal Window</label>
            <div className="flex flex-wrap gap-3">
              {['All', 'Today', 'This Week', 'This Month'].map(range => (
                <button
                  key={range}
                  onClick={() => setLocalFilters(prev => ({ ...prev, dateRange: range as any }))}
                  className={`px-6 py-3 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    localFilters.dateRange === range ? 'bg-charcoal border-charcoal text-white shadow-[4px_4px_0_#C6FF00]' : 'bg-white border-charcoal text-charcoal'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Channel */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest italic">Capture Channel</label>
            <div className="flex gap-3">
              {['All', 'in_store', 'whatsapp'].map(c => (
                <button
                  key={c}
                  onClick={() => setLocalFilters(prev => ({ ...prev, channel: c as any }))}
                  className={`px-6 py-3 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all capitalize ${
                    localFilters.channel === c ? 'bg-charcoal border-charcoal text-white shadow-[4px_4px_0_#C6FF00]' : 'bg-white border-charcoal text-charcoal'
                  }`}
                >
                  {c.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Sale Type */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest italic">Engagement Modality</label>
            <div className="flex gap-3">
              {['All', 'Full Price', 'Negotiated'].map(t => (
                <button
                  key={t}
                  onClick={() => setLocalFilters(prev => ({ ...prev, saleType: t as any }))}
                  className={`px-6 py-3 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    localFilters.saleType === t ? 'bg-charcoal border-charcoal text-white shadow-[4px_4px_0_#C6FF00]' : 'bg-white border-charcoal text-charcoal'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest italic">Unit Specificity</label>
            <div className="relative group">
               <select 
                value={localFilters.productId}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, productId: e.target.value }))}
                className="w-full bg-white border-2 border-charcoal rounded-[24px] py-4 px-6 text-sm font-black uppercase text-charcoal focus:shadow-[6px_6px_0_#C6FF00] transition-all appearance-none outline-none"
              >
                <option value="All">All Units</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                 <ChevronRight size={20} className="rotate-90" />
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              onApply(localFilters);
              onClose();
            }}
            className="w-full py-6 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-[32px] shadow-[10px_10px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all mt-4"
          >
            Apply Protocol
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DeleteModal: React.FC<{ sale: Sale; onClose: () => void; onConfirm: () => void }> = ({ sale, onClose, onConfirm }) => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-[110] flex items-center justify-center p-6"
    onClick={onClose}
  >
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      className="bg-cream w-full max-w-[340px] rounded-[40px] p-10 flex flex-col gap-8 border-4 border-charcoal shadow-[12px_12px_0_rgba(0,0,0,1)]"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-[32px] bg-[#C6FF00]/10 border-2 border-charcoal flex items-center justify-center text-[#C6FF00] mb-2 shadow-[6px_6px_0_rgba(0,0,0,1)]">
          <Trash2 size={40} />
        </div>
        <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter leading-none">Purge Entry?</h2>
        <p className="italic-accent text-lg leading-relaxed text-charcoal/60">
          Reverse protocol? This will restore <span className="text-charcoal font-black">{sale.quantity} UNIT(S)</span> to base stock.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <button 
          onClick={onConfirm}
          className="w-full py-5 bg-[#C6FF00] text-charcoal font-black uppercase tracking-widest italic text-[11px] rounded-[32px] border-2 border-charcoal shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all"
        >
          Confirm Purge
        </button>
        <button 
          onClick={onClose}
          className="w-full py-5 bg-white border-2 border-charcoal text-charcoal font-black uppercase tracking-widest italic text-[11px] rounded-[32px] active:scale-[0.98] transition-all"
        >
          Abort
        </button>
      </div>
    </motion.div>
  </motion.div>
);

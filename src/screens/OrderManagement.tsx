import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, Filter, Plus, X, ChevronRight, MessageCircle, 
  Trash2, Receipt, Calendar, ShoppingBag, Eye, RefreshCw, Loader2, ArrowLeft 
} from 'lucide-react';
import { toast } from 'sonner';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { motion, AnimatePresence } from 'motion/react';

interface OrderItem {
  id: string;
  shop_id: string;
  owner_id: string;
  product_id?: string;
  product_name: string;
  size: string;
  quantity: number;
  sale_price: number;
  channel: 'in_store' | 'whatsapp';
  order_reference: string;
  total_price: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  note?: string;
  customer_name?: string;
  customer_whatsapp?: string;
  created_at: string;
}

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  
  // Selected order details state (SCREEN 10 details modal)
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [updatingRef, setUpdatingRef] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  const fetchOrdersAndProducts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: shopData } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', session.user.id)
        .maybeSingle();

      if (shopData) {
        // Fetch products for dropdown mapping
        const { data: pData } = await supabase
          .from('products')
          .select('id, name, price')
          .eq('shop_id', shopData.id);
        if (pData) setProducts(pData);

        // Fetch orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('shop_id', shopData.id)
          .order('created_at', { ascending: false });

        if (ordersData) {
          // Parse status fallback, items array mapping or notes parsing
          setOrders(ordersData.map(o => ({
            id: o.id,
            shop_id: o.shop_id,
            owner_id: o.owner_id,
            product_id: o.product_id,
            product_name: o.product_name || 'Listing Item',
            size: o.size || 'M',
            quantity: o.quantity || 1,
            sale_price: Number(o.sale_price || 0),
            channel: o.channel || 'in_store',
            order_reference: o.order_reference || '#TZW-0000',
            total_price: Number(o.total_price || o.sale_price * (o.quantity || 1)),
            status: o.status || 'pending',
            note: o.note || '',
            // Populate friendly names for local detail presentation (from metadata/claims or fallbacks)
            customer_name: o.customer_name || 'Zim Shopper',
            customer_whatsapp: o.customer_whatsapp || '263776223144',
            created_at: o.created_at
          })));
        }
      }
    } catch (err: any) {
      console.error('Error fetching order records:', err);
      toast.error('Orders synchronization failure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndProducts();
  }, []);

  // Update real status in DB
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderItem['status']) => {
    setUpdatingRef(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: nextStatus } : null);
      }
      toast.success(`Order status converted to ${nextStatus.toUpperCase()}!`);
    } catch (err: any) {
      console.error('Status conversion failure:', err);
      toast.error('Could not translate status code.');
    } finally {
      setUpdatingRef(null);
    }
  };

  // Filter orders by search & status tab
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Status Tab filter
      if (activeStatusTab !== 'all' && o.status !== activeStatusTab) return false;

      // Query Search matching
      const matchesSearch = 
        o.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.order_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [orders, searchQuery, activeStatusTab]);

  return (
    <div className="min-h-screen bg-[#070709] text-white pb-32 font-sans select-none overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <div className="px-5 pt-8 sticky top-0 bg-[#070709]/80 backdrop-blur-md z-30 pb-4 border-b border-white/[0.02]">
        <div className="flex justify-between items-center mb-5">
          <div>
            <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase font-black">Merchant Logbook</span>
            <h1 className="text-2xl font-black italic tracking-tighter text-white mt-1 uppercase">Orders</h1>
          </div>
          <button 
            onClick={() => {
              setLoading(true);
              fetchOrdersAndProducts();
            }}
            className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 active:rotate-180 transition-transform duration-300"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* SEARCH BOX */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Search reference, product, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#c8ff00] transition-all placeholder-zinc-500"
          />
        </div>

        {/* STATUS SEPARATOR SEGMENTS */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-4 pt-1 pb-1 scroll-smooth">
          {(['all', 'pending', 'processing', 'completed', 'cancelled'] as const).map((tab) => {
            const isActive = activeStatusTab === tab;
            const labelMap = { all: 'All', pending: 'Pending', processing: 'Processing', completed: 'Completed', cancelled: 'Cancelled' };
            const count = tab === 'all' ? orders.length : orders.filter(o => o.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveStatusTab(tab)}
                className={`flex-shrink-0 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
                  isActive 
                    ? 'bg-[#c8ff00] text-black font-extrabold' 
                    : 'bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 border border-white/[0.02]'
                }`}
              >
                {labelMap[tab]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ORDERS CARD LIST */}
      <div className="px-5 mt-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#c8ff00]" />
            <p className="text-zinc-500 text-xs font-mono font-bold uppercase tracking-wider mt-3">Syncing operations log...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white/[0.01] border-2 border-dashed border-white/5 py-16 px-6 text-center rounded-3xl flex flex-col items-center">
            <Receipt size={28} className="text-zinc-600 mb-3" />
            <h3 className="font-extrabold text-sm text-zinc-300">No active bookings</h3>
            <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
              No orders registered under <span className="text-[#c8ff00] font-mono">"{activeStatusTab.toUpperCase()}"</span> category for this store node.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 animate-fadeIn">
            {filteredOrders.map((itm) => {
              // Status Badge Styling Helper
              const getStatusStyling = (s: string) => {
                switch (s) {
                  case 'pending': 
                    return 'bg-orange-500/10 text-orange-400 border-orange-500/15';
                  case 'processing': 
                    return 'bg-blue-500/10 text-blue-400 border-blue-500/15';
                  case 'completed': 
                    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15';
                  default: 
                    return 'bg-zinc-500/10 text-zinc-400 border-white/5';
                }
              };

              return (
                <div 
                  key={itm.id}
                  onClick={() => setSelectedOrder(itm)}
                  className="bg-[#111115] border border-white/[0.05] hover:border-white/10 p-4 rounded-2xl relative overflow-hidden transition-all duration-300 cursor-pointer active:scale-[0.99] flex flex-col justify-between"
                  id={`order-card-${itm.order_reference}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest block bg-white/[0.04] px-2 py-1 rounded border border-white/5">
                      {itm.order_reference}
                    </span>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusStyling(itm.status)}`}>
                      {itm.status}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-sm font-extrabold text-white leading-snug">{itm.product_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-semibold text-[#c8ff00] bg-[#c8ff00]/10 px-1.5 py-0.5 rounded">M</span>
                      <span className="text-[11px] text-zinc-500">{itm.quantity} item • walk-in sale</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/[0.04] my-3.5" />

                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[8.5px] uppercase font-mono tracking-widest text-[#A1A1AA]/50 font-bold block">Purchased by</span>
                      <span className="text-xs font-bold text-white block mt-0.5">{itm.customer_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8.5px] uppercase font-mono tracking-widest text-[#A1A1AA]/50 font-bold block">Order Value</span>
                      <span className="text-sm font-black font-mono text-[#c8ff00] block mt-0.5">${itm.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SCREEN 10: ACTIVE ORDER DETAILS MODAL OVERLAY */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center px-0">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/85 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedOrder(null)}
            />

            {/* Bottom Sheet Drawer Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-[#0F0F13] border-t border-white/10 rounded-t-3xl pt-5 pb-safe z-10 font-sans shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-4 shrink-0" />

              <div className="px-5 pb-4 flex justify-between items-center border-b border-white/[0.04] shrink-0">
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase font-black block">Order Detail System</span>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{selectedOrder.order_reference}</h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00]" />
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              {/* SHEET CONTENT BODY */}
              <div className="p-5 space-y-6">
                
                {/* Product snapshot banner */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-4">
                  <div className="w-14 h-14 bg-zinc-800 rounded-xl shrink-0 overflow-hidden border border-white/5 flex items-center justify-center text-zinc-400">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#c8ff00] text-[15px] leading-snug">{selectedOrder.product_name}</h4>
                    <p className="text-zinc-500 text-xs mt-1 font-medium">Quantity: {selectedOrder.quantity || 1} • Size: {selectedOrder.size || 'M'} • Channel: {selectedOrder.channel}</p>
                    <div className="text-xs font-black font-mono text-white mt-1.5">${selectedOrder.sale_price.toFixed(2)} unit</div>
                  </div>
                </div>

                {/* Status selector segments (Status Transitions action rows) */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 block px-1">Transition Order Status</span>
                  
                  <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                    {(['pending', 'processing', 'completed', 'cancelled'] as const).map((st) => {
                      const isActive = selectedOrder.status === st;
                      const activeColors = {
                        pending: 'bg-orange-500 text-white',
                        processing: 'bg-blue-500 text-white',
                        completed: 'bg-emerald-500 text-black',
                        cancelled: 'bg-red-500 text-white'
                      };

                      return (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                          className={`py-2 px-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                            isActive 
                              ? activeColors[st]
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Details list card */}
                <div className="bg-[#111115] border border-white/[0.05] rounded-2.5xl divide-y divide-white/[0.03]">
                  
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-zinc-500 font-bold text-xs">Customer Name</span>
                    <span className="text-white font-extrabold text-xs">{selectedOrder.customer_name}</span>
                  </div>

                  <div className="p-4 flex justify-between items-center">
                    <span className="text-zinc-500 font-bold text-xs">Phone (WhatsApp)</span>
                    <span className="text-white font-mono text-xs font-bold">{selectedOrder.customer_whatsapp}</span>
                  </div>

                  <div className="p-4 flex justify-between items-center">
                    <span className="text-zinc-500 font-bold text-xs">Placed On</span>
                    <span className="text-white font-medium text-xs flex items-center gap-1">
                      <Calendar size={13} className="text-zinc-500" />
                      {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>

                  {selectedOrder.note && (
                    <div className="p-4">
                      <span className="text-zinc-500 font-bold text-xs block mb-1">Log Memo (Notes)</span>
                      <p className="text-xs text-zinc-300 italic-accent bg-black/10 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                        {selectedOrder.note}
                      </p>
                    </div>
                  )}

                  <div className="p-4 flex justify-between items-center">
                    <span className="text-zinc-500 font-black text-xs uppercase text-[#A1A1AA]">Total Value</span>
                    <span className="text-lg font-black font-mono text-[#c8ff00]">${selectedOrder.total_price.toFixed(2)}</span>
                  </div>

                </div>

                {/* Contact Customer on WhatsApp */}
                <a
                  href={`https://wa.me/${selectedOrder.customer_whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hi, I saw your order for ${selectedOrder.product_name} on my ThreadZW shop. Checking on payment or delivery preferences!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-13 bg-[#25D366] hover:bg-[#20ba59] rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider text-white transition-colors"
                >
                  <MessageCircle size={15} />
                  <span>Contact buyer via WhatsApp</span>
                </a>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNavBar />
    </div>
  );
};

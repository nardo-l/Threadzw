import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Edit3, MoreHorizontal, Plus, BarChart3, Package, ArrowLeft, Camera, Trash2, Settings } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { supabase } from '../../lib/supabase';
import { AppBrandingView } from './AppBrandingView';
import { toast as sonnerToast } from 'sonner';
import { Avatar } from '../Avatar';

export const LiveShopCentreView: React.FC<{ myShop: any; onUpdate: () => void | Promise<void> }> = ({ myShop, onUpdate }) => {
  const { setSellerFlowState, products, postStory, unreadNotificationCount, setBuyerFlowState, deleteProduct } = useInventory();
  const navigate = useNavigate();
  const [showSaleSheet, setShowSaleSheet] = useState(false);
  const [saleProduct, setSaleProduct] = useState<any>(null);
  const [saleSize, setSaleSize] = useState('');
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState('');
  const [saleChannel, setSaleChannel] = useState<'in_store' | 'whatsapp'>('in_store');
  const [recordingSale, setRecordingSale] = useState(false);
  const [isPostingStory, setIsPostingStory] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleDeleteListing = async (productId: string, name: string) => {
    if (!window.confirm(`Delete "${name}" forever?`)) return;
    try {
      const success = await deleteProduct(productId);
      if (success) {
        sonnerToast.success('Product deleted');
        await onUpdate();
      } else {
        sonnerToast.error('Could not delete product');
      }
    } catch (err) {
      sonnerToast.error('Error deleting product');
    }
  };

  // Trial Analytics State
  const [trialSales, setTrialSales] = useState<any[]>([]);
  const [loadingTrialSales, setLoadingTrialSales] = useState(false);

  const fetchTrialSales = async () => {
    if (!myShop?.id) return;
    setLoadingTrialSales(true);
    try {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          sale_price,
          quantity,
          channel,
          created_at,
          products (
            name,
            images
          )
        `)
        .eq('shop_id', myShop.id)
        .gte('created_at', fiveDaysAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrialSales(data || []);
    } catch (err) {
      console.error('Trial sales error:', err);
    } finally {
      setLoadingTrialSales(false);
    }
  };

  const calcTrialStats = (sales: any[]) => {
    const totalRevenue = sales.reduce((sum, s) => sum + (s.sale_price || 0) * (s.quantity || 1), 0);
    const today = new Date();
    const days = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en-GB', { weekday: 'short' });
      const daySales = sales.filter(s => s.created_at.startsWith(dateStr));
      const dayRevenue = daySales.reduce((sum, s) => sum + (s.sale_price || 0) * (s.quantity || 1), 0);
      days.push({ label: dayLabel, revenue: dayRevenue, count: daySales.length });
    }
    const totalSales = sales.length;
    const bestDay = days.reduce((best, day) => day.revenue > best.revenue ? day : best, days[0]);
    return { totalRevenue, totalSales, days, bestDay };
  };

  const trialStats = calcTrialStats(trialSales);

  const { updateStock } = useInventory();

  const refetchProducts = async () => {
    if (!myShop?.id) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', myShop.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log(
        'Products refetched:',
        data?.map(p => ({
          name: p.name,
          total_stock: p.total_stock,
          sizes: p.sizes
        }))
      );
      
      await onUpdate();
      
    } catch (err) {
      console.error('Refetch products error:', err);
    }
  };

  const openSaleSheet = (product: any) => {
    setSaleProduct(product);
    setSaleSize('');
    setSaleQuantity(1);
    setSalePrice(product.price?.toString() || '');
    setSaleChannel('in_store');
    setShowSaleSheet(true);
  };

  const handleRecordSale = async () => {
    if (!saleSize.trim()) {
      sonnerToast.error('Select or enter a size.');
      return;
    }
    
    if (!salePrice || parseFloat(salePrice) <= 0) {
      sonnerToast.error('Enter the sale price.');
      return;
    }
    
    if (!saleProduct?.id) {
      sonnerToast.error('No product selected.');
      return;
    }
    
    if (!myShop?.id) {
      sonnerToast.error('Shop not found.');
      return;
    }
    
    setRecordingSale(true);
    
    try {
      const parsedPrice = parseFloat(salePrice);
      const listedPrice = parseFloat(saleProduct.price);
      const isNegotiated = Math.abs(parsedPrice - listedPrice) > 0.01;
      
      console.log('Recording sale:', {
        shop_id: myShop.id,
        product_id: saleProduct.id,
        size: saleSize.trim(),
        quantity: saleQuantity,
        sale_price: parsedPrice,
        is_negotiated: isNegotiated,
        channel: saleChannel
      });
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          shop_id: myShop.id,
          owner_id: myShop.owner_id,
          product_id: saleProduct.id,
          product_name: saleProduct.name,
          size: saleSize.trim(),
          quantity: saleQuantity,
          sale_price: parsedPrice,
          listed_price: listedPrice,
          is_negotiated: isNegotiated,
          channel: saleChannel
        })
        .select()
        .single();
      
      if (error) {
        console.error('Record sale DB error:', error);
        throw error;
      }
      
      console.log('Sale recorded:', data);
      
      // Local check before refetching
      updateStock(saleProduct.id, saleSize.trim(), saleQuantity);
      
      // Full refresh ensures consistency
      await onUpdate();
      
      // Close sheet and show success
      setShowSaleSheet(false);
      setSaleProduct(null);
      
      sonnerToast.success('Sale recorded ✓');

      // Refetch real stock from DB after a short delay to let trigger run
      setTimeout(() => {
        refetchProducts();
      }, 500);
      
    } catch (err: any) {
      console.error('Record sale error:', err);
      
      if (err.message?.includes('foreign key')) {
        sonnerToast.error('Product not found in database.');
      } else if (err.message?.includes('violates')) {
        sonnerToast.error('Invalid sale data. Check all fields.');
      } else {
        sonnerToast.error('Could not record sale: ' + err.message);
      }
    } finally {
      setRecordingSale(false);
    }
  };

  const isTrial = myShop?.subscription_status === 'trial';
  
  const getTrialDaysRemaining = () => {
    if (!myShop?.trial_ends_at) return 0;
    const now = new Date();
    const expiry = new Date(myShop.trial_ends_at);
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };
  const daysLeft = getTrialDaysRemaining();

  useEffect(() => {
    if (isTrial && daysLeft === 0) {
      setSellerFlowState('paywall');
    }
    if (isTrial && myShop?.id) {
      fetchTrialSales();
    }
    // Call debug function if it exists on window
    if ((window as any).debugStockState) {
      (window as any).debugStockState();
    }
  }, [isTrial, daysLeft, setSellerFlowState, myShop?.id]);

  const maxProducts = 3;
  const canAddProduct = !isTrial || products.length < maxProducts;

  const handlePostStory = async () => {
    if (products.length === 0) {
      sonnerToast.error('Upload a product first to post a story');
      return;
    }

    setIsPostingStory(true);
    try {
      const latestProduct = products[0];
      const success = await postStory({
        shop_id: myShop.id,
        media_url: latestProduct.images?.[0] || 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&q=80&w=800',
        media_type: 'image',
        content: `Just dropped: ${latestProduct.name}! 🔥`,
        product_id: latestProduct.id
      });

      if (success) {
        sonnerToast.success('Story posted! Visible to followers for 24h.');
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      console.error(err);
      sonnerToast.error('Could not post story');
    } finally {
      setIsPostingStory(false);
    }
  };

  const stats = [
    { label: 'Products listed', value: products.length },
    { label: 'Units in stock', value: products.reduce((sum, p) => sum + (p.total_stock || 0), 0) },
    { label: 'Followers', value: myShop?.follower_count || '0' },
  ];

  const lowStockProducts = products.filter(p => p.total_stock > 0 && p.total_stock <= 3);
  const soldOutProducts = products.filter(p => p.total_stock === 0);

  const signals = [
    ...lowStockProducts.map(p => ({
      id: `low-${p.id}`,
      title: 'Low Stock Alert',
      body: `${p.name} has only ${p.total_stock} left`,
      icon: '⚠️',
      type: 'low',
      productId: p.id
    })),
    ...soldOutProducts.slice(0, 2).map(p => ({
      id: `out-${p.id}`,
      title: 'Sold Out',
      body: `${p.name} is out of stock`,
      icon: '🚫',
      type: 'out',
      productId: p.id
    })),
    ...(products.length === 0 ? [{
      id: 'empty',
      title: 'Shop is Empty',
      body: 'Get started by adding your first product!',
      icon: '🚀',
      type: 'empty'
    }] : [])
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black pb-[100px] relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-5 py-2.5 rounded-full font-bold text-[13px] shadow-lg flex items-center gap-2"
          >
             {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h1 className="text-white font-bold text-[18px]">Shop Centre</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowBranding(true)}
            className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10"
          >
            <Settings size={18} className="text-white/60" />
          </button>
          <div className="relative cursor-pointer" onClick={() => navigate('/notifications')}>
            <Bell className="text-white" size={24} />
          {unreadNotificationCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#FF2D78] rounded-full border-2 border-black flex items-center justify-center px-1">
              <span className="text-white text-[9px] font-bold">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Subscription Status Banner */}
      <div className="mx-5 mb-5 text-sans">
        {myShop?.subscription_status === 'pending_payment' ? (
          <div className="bg-[#f59e0b1a] border border-[#f59e0b4d] rounded-[12px] p-3 px-4 flex items-center justify-between shadow-[0_0_15px_rgba(245,158,11,0.05)]">
             <div className="flex flex-col">
                <span className="text-[#f59e0b] text-[13px] font-bold">Payment Received</span>
                <span className="text-[#888] text-[12px]">Code is being generated...</span>
                <span className="text-[#888] text-[10px] mt-0.5 italic">Check back in 30 mins</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#f59e0b26] flex items-center justify-center">
                   <motion.div 
                     animate={{ rotate: 360 }} 
                     transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                   >
                     ⏳
                   </motion.div>
                </div>
             </div>
          </div>
        ) : isTrial ? (
          <div className={`rounded-[12px] p-3 px-4 flex items-center justify-between border ${
            daysLeft <= 3 
              ? 'bg-[#ef44441a] border-[#ef44444d]' 
              : daysLeft <= 7 
                ? 'bg-[#f59e0b1a] border-[#f59e0b4d]' 
                : 'bg-[#3b82f61a] border-[#3b82f64d]'
          }`}>
             <div className="flex flex-col">
                <span className={`text-[13px] font-bold ${
                  daysLeft <= 3 ? 'text-[#ef4444]' : daysLeft <= 7 ? 'text-[#f59e0b]' : 'text-[#3b82f6]'
                }`}>
                  {daysLeft <= 3 ? '⚠️ Trial Expiring Soon' : '🎁 Free Trial'}
                </span>
                <span className="text-[#888] text-[12px]">{daysLeft} days remaining</span>
             </div>
             <div className="w-[60px] h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    daysLeft <= 3 ? 'bg-[#ef4444]' : daysLeft <= 7 ? 'bg-[#f59e0b]' : 'bg-[#3b82f6]'
                  }`} 
                  style={{ width: `${Math.max(5, ((20 - daysLeft) / 20) * 100)}%` }}
                />
             </div>
          </div>
        ) : (
          <div className="bg-[#22c55e14] border border-[#22c55e33] rounded-[12px] p-3 px-4 flex items-center justify-between shadow-[0_0_15px_rgba(34,197,94,0.05)]">
             <div className="flex flex-col">
                <span className="text-[#22c55e] text-[13px] font-bold">✓ Active Shop</span>
                <span className="text-[#888] text-[12px]">Thread ZW Shop Plan</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="bg-[#FF2D78] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(255,45,120,0.3)]">
                   Live
                </span>
             </div>
          </div>
        )}
      </div>

      {/* Trial Product Limit Indicator */}
      {isTrial && (
        <div className="mx-5 mb-5 bg-[#111] border border-[#222] rounded-[12px] p-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[14px]">📦</div>
             <div>
                <p className="text-white text-[13px] font-bold">Product Limit</p>
                <p className="text-[#888] text-[11px]">{products.length} of {maxProducts} slots used</p>
             </div>
          </div>
          <div className="flex gap-1">
             {[1, 2, 3].map(i => (
                <div 
                   key={i} 
                   className={`w-5 h-1.5 rounded-full transition-all ${i <= products.length ? 'bg-[#FF2D78]' : 'bg-[#222]'}`} 
                />
             ))}
          </div>
        </div>
      )}

      {/* Trial Analytics Card */}
      {isTrial && (
        <>
          {loadingTrialSales ? (
            <div className="mx-5 mb-4 h-[240px] bg-[#111] border border-[#222] rounded-[16px] animate-pulse" />
          ) : trialSales.length === 0 ? (
            <div className="mx-5 mb-4 bg-[#111] border border-[#222] rounded-[16px] p-5 flex flex-col items-center text-center">
              <div className="text-[32px] mb-3">📊</div>
              <p className="text-white font-bold text-[14px]">No sales recorded yet</p>
              <p className="text-[#888] text-[12px] mt-2 max-w-[220px]">
                Record your first sale to see your analytics here.
              </p>
            </div>
          ) : (
            <div className="mx-5 mb-4 bg-[#111] border border-[#222] rounded-[16px] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white text-[15px] font-bold">Last 5 Days</span>
                <div className="bg-[#1a1a1a] border border-[#222] rounded-full px-2.5 py-1">
                  <span className="text-[#888] text-[10px] uppercase font-bold tracking-wider">Trial Analytics</span>
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="text-white font-bold text-[36px] font-mono leading-none">
                  ${trialStats.totalRevenue.toFixed(2)}
                </div>
                <div className="text-[#888] text-[12px] mt-1">total revenue</div>
                <div className="text-[#888] text-[11px]">
                  {trialStats.totalSales} sale{trialStats.totalSales !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="h-[1px] bg-[#1a1a1a] mb-4" />

              <div className="flex flex-col gap-2.5">
                {trialStats.days.map((day, idx) => {
                  const maxRevenue = Math.max(...trialStats.days.map(d => d.revenue), 1);
                  const barWidth = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="w-[60px] text-white text-[13px] font-bold">{day.label}</div>
                      <div className="flex-1 mx-3 h-1 bg-[#1a1a1a] rounded-full relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ delay: idx * 0.1, duration: 0.6, ease: 'easeOut' }}
                          className="absolute inset-y-0 left-0 bg-linear-to-r from-[#9B27AF] to-[#FF2D78] rounded-full"
                        />
                      </div>
                      <div className="w-[70px] text-right">
                        {day.revenue > 0 ? (
                          <>
                            <div className="text-[#FF2D78] font-bold text-[13px] leading-tight">${day.revenue.toFixed(2)}</div>
                            <div className="text-[#888] text-[10px] mt-0.5">{day.count} sale{day.count !== 1 ? 's' : ''}</div>
                          </>
                        ) : (
                          <div className="text-[#444] text-[13px]">—</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {trialStats.totalRevenue > 0 && (
                <div className="mt-4.5 bg-[#FF2D7814] border border-[#FF2D7833] rounded-[10px] p-2.5 px-3 flex items-center gap-2">
                  <span className="text-[14px]">🔥</span>
                  <div className="text-[12px]">
                    <span className="text-[#888]">Best day: </span>
                    <span className="text-white font-bold">{trialStats.bestDay.label} — ${trialStats.bestDay.revenue.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upgrade Teaser */}
          <div className="mx-5 mb-4 bg-[#0a0a0a] border border-dashed border-[#222] rounded-[12px] p-3.5 px-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-white text-[13px] font-bold">📈 Want full analytics?</span>
              <span className="text-[#888] text-[11px] mt-0.5">Graphs, top products, sizes and more.</span>
            </div>
            <button
              onClick={() => setSellerFlowState('paywall')}
              className="bg-linear-to-br from-[#9B27AF] to-[#FF2D78] text-white font-bold text-[11px] px-3.5 py-2 rounded-full shadow-sm active:scale-[0.95] transition-all"
            >
              Upgrade →
            </button>
          </div>
        </>
      )}

      {/* Expiry Warning Banner */}
      {!isTrial && daysLeft <= 3 && daysLeft > 0 && (
         <div className="mx-5 mb-5 bg-[#f59e0b1a] border border-[#f59e0b4d] rounded-[12px] p-3 px-4 flex items-center justify-between">
            <div className="flex gap-2">
               <span className="text-[16px]">⚠️</span>
               <div className="flex flex-col">
                  <span className="text-[#f59e0b] text-[13px] font-bold">Subscription expires in {daysLeft} day(s)</span>
                  <span className="text-[#888] text-[12px]">Send ${myShop?.monthly_price} to 0776223144 to renew.</span>
               </div>
            </div>
            <button 
               onClick={() => setSellerFlowState('paywall')}
               className="border border-[#f59e0b] rounded-full px-3.5 py-1.5 text-[#f59e0b] text-[12px] font-bold"
            >
               Pay Now →
            </button>
         </div>
      )}

      {/* Upgrade Card (Simplified) */}
      {isTrial && (
        <div className="mx-5 mb-5 bg-linear-to-br from-[#1a1a1a] to-[#111] border border-[#222] rounded-[20px] p-5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#FF2D78] opacity-5 blur-3xl group-hover:opacity-10 transition-opacity" />
          
          <div className="flex items-start justify-between mb-2">
            <div className="flex flex-col">
              <h3 className="text-white font-bold text-[18px]">⚡ Trial ending soon?</h3>
            </div>
          </div>

          <p className="text-[#888] text-[13px] leading-relaxed mb-5">
            Upgrade for $6/month — unlimited products.
          </p>

          <button 
            onClick={() => setSellerFlowState('paywall')}
            className="w-full h-[52px] bg-white text-black rounded-full font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            Upgrade →
          </button>
        </div>
      )}

      {/* Shop Header Card */}
      <div className="mx-5 bg-[#111111] border border-[#222222] rounded-[16px] p-5 flex items-center">
        <div className="flex flex-col items-center gap-2 mr-3.5">
          <button 
            onClick={handlePostStory}
            disabled={isPostingStory}
            className={`w-[68px] h-[68px] rounded-full p-[2.5px] transition-all relative ${products.some(p => {
              const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
              return new Date(p.created_at) > cutoff;
            }) ? 'bg-linear-to-tr from-[#9B27AF] to-[#FF2D78] shadow-[0_0_15px_rgba(255,45,120,0.3)]' : 'bg-white/10'}`}
          >
            <Avatar 
              url={myShop?.avatar_url || myShop?.logo_url} 
              size={63}
              className="border-2 border-black"
            />
            {!products.some(p => {
              const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
              return new Date(p.created_at) > cutoff;
            }) && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#FF2D78] rounded-full border-2 border-black flex items-center justify-center text-white">
                <Plus size={12} />
              </div>
            )}
            {isPostingStory && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full" />
              </div>
            )}
          </button>
          <span className="text-[10px] text-[#888] font-mono">Your Story</span>
        </div>

        <div className="flex-1">
          <div className="text-white font-bold text-[16px]">{myShop?.name || 'My Shop'}</div>
          <div className="text-[#888888] text-[12px]">@{myShop?.handle || 'myshop'}</div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-green-500 text-[12px] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
            </span>
            <span className="bg-[#FF2D7826] text-[#FF2D78] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">Thread ZW Shop</span>
          </div>
        </div>
        <button 
          onClick={() => setSellerFlowState('edit_shop')}
          className="border border-[#333] rounded-full px-4 py-2 text-[#888] text-[12px] font-medium hover:text-white transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Stats Row */}
      <div className="mx-5 mt-5 flex gap-2">
        {stats.map((s, i) => (
          <div 
            key={i} 
            onClick={() => i === 1 && setSellerFlowState('dashboard')}
            className={`flex-1 bg-[#111111] border border-[#222222] rounded-[12px] p-3 flex flex-col items-center ${i === 1 ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
          >
            {i === 1 && <BarChart3 className="text-[#FF2D78] mb-1" size={14} />}
            <div className="text-white font-bold text-[22px]">{s.value}</div>
            <div className="text-[#888888] text-[11px] mt-0.5">{i === 1 ? 'Analytics' : s.label}</div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mx-5 mt-5 flex flex-col gap-2.5">
        <button 
          onClick={() => {
            if (canAddProduct) {
              setSellerFlowState('add_product');
            } else {
              sonnerToast.error(`Trial limit reached (${maxProducts} products). Upgrade to add more.`);
            }
          }}
          className={`w-full h-[52px] rounded-full text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]
            ${canAddProduct ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78]' : 'bg-[#222] opacity-50'}`}
        >
          <Plus size={18} /> Add New Product {!canAddProduct && ' (Full)'}
        </button>
        <button 
          onClick={handlePostStory}
          disabled={isPostingStory}
          className="w-full h-[52px] bg-[#111] border border-[#222] rounded-full text-white font-bold text-[15px] flex items-center justify-center gap-2"
        >
          {isPostingStory ? (
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
          ) : (
            <Camera size={18} />
          )}
          Post Story (Latest Drop)
        </button>
      </div>

      {/* Smart Signals */}
      <div className="mx-5 mt-5">
        <h2 className="text-white font-bold text-[14px] mb-2.5 flex items-center gap-2">
          ⚡ Smart Signals
        </h2>
        {signals.length === 0 ? (
          <div className="bg-[#111] rounded-[10px] p-4 text-center border border-[#222]">
            <p className="text-[#888] text-[12px]">All systems normal. Your stock levels look good!</p>
          </div>
        ) : (
          signals.map((s) => (
            <div key={s.id} className={`${
              s.type === 'low' ? 'bg-[#f59e0b14] border-[#f59e0b40]' : 
              s.type === 'out' ? 'bg-[#ef444414] border-[#ef444440]' : 
              'bg-blue-500/10 border-blue-500/40'
            } border rounded-[10px] p-3 px-3.5 mb-2 flex items-center justify-between`}>
              <div className="flex gap-2.5">
                <span className="text-[14px] mt-0.5">{s.icon}</span>
                <div>
                  <div className={`${
                    s.type === 'low' ? 'text-[#f59e0b]' : 
                    s.type === 'out' ? 'text-[#ef4444]' : 
                    'text-blue-400'
                  } text-[13px] font-bold`}>{s.title}</div>
                  <div className="text-[#888888] text-[12px] mt-0.5">{s.body}</div>
                </div>
              </div>
              {s.type !== 'empty' && 'productId' in s && s.productId && (
                <button 
                  onClick={() => navigate(`/edit-product/${(s as any).productId}`)}
                  className={`border rounded-full px-3 py-1 text-[11px] font-bold ${
                    s.type === 'low' ? 'border-[#f59e0b] text-[#f59e0b]' : 'border-[#ef4444] text-[#ef4444]'
                  }`}
                >
                  Restock
                </button>
              )}
              {s.type === 'empty' && (
                <button 
                  onClick={() => setSellerFlowState('add_product')}
                  className="bg-blue-500 text-white rounded-full px-3 py-1 text-[11px] font-bold"
                >
                  Go →
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* My Products Section */}
      <div className="mx-5 mt-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-white font-bold text-[15px]">My Products</h2>
          <button className="text-[#FF2D78] text-[13px] font-medium">See All</button>
        </div>

        {products.length === 0 ? (
          <div className="bg-[#111] rounded-[16px] p-8 flex flex-col items-center text-center">
            <div className="text-[32px] mb-3">📦</div>
            <div className="text-white font-medium text-[14px]">No products yet</div>
            <p className="text-[#888888] text-[12px] mt-1 max-w-[200px]">Add your first product to go live in the feed</p>
            <button 
              onClick={() => setSellerFlowState('add_product')}
              className="mt-3 text-[#FF2D78] border border-[#FF2D78] rounded-full px-4 py-1.5 text-[12px] font-bold"
            >
              Add Product
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {products.slice(0, 3).map((p, i) => (
              <div key={i} className="bg-[#111111] border border-[#222222] rounded-[12px] p-3.5 flex items-center">
                <div className="w-[60px] h-[60px] rounded-[8px] bg-linear-to-br from-[#1a1a1a] to-[#222] flex items-center justify-center text-[24px]">
                  👟
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-white font-bold text-[14px] truncate">{p.name}</div>
                  <div className="text-[#FF2D78] text-[13px] font-bold mt-0.5">${p.price}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-green-500 text-[11px] font-medium">{p.total_stock || 0} in stock</span>
                    <span className="text-[#888888] text-[11px]">👁 {p.view_count || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => navigate(`/edit-product/${p.id}`)}
                    className="p-2 text-[#888888] hover:text-[#FF2D78] transition-colors"
                    title="Edit Listing"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => openSaleSheet(p)}
                    className="p-2 text-[#888888] hover:text-white transition-colors"
                    title="Record Sale"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  <button 
                    onClick={() => handleDeleteListing(p.id, p.name)}
                    className="p-2 text-[#888888] hover:text-red-500 transition-colors"
                    title="Delete Listing"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record a Sale Bottom Sheet */}
      <AnimatePresence>
        {showBranding && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] bg-black"
          >
            <AppBrandingView onClose={() => setShowBranding(false)} />
          </motion.div>
        )}
        
        {showSaleSheet && saleProduct && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/80 z-[60]"
               onClick={() => setShowSaleSheet(false)}
            />
            <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#111] rounded-t-[24px] p-6 z-[70] max-h-[80vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-10 h-1 bg-[#ffffff22] rounded-full mx-auto mb-6" />
              <h3 className="text-white font-bold text-[18px] mb-4">Record a Sale</h3>
              
              <div className="flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-[16px] mb-6">
                 <div className="w-12 h-12 bg-[#222] rounded-[10px] flex items-center justify-center text-[20px]">👟</div>
                 <div className="flex-1">
                    <div className="text-white font-bold text-[14px]">{saleProduct.name}</div>
                    <div className="text-[#FF2D78] font-bold text-[13px]">${saleProduct.price}</div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="text-white font-bold text-[13px] block mb-3">Size Sold *</label>
                    <div className="flex flex-wrap gap-2">
                       {(() => {
                         try {
                           const sizes = Array.isArray(saleProduct.sizes) ? saleProduct.sizes : JSON.parse(saleProduct.sizes || '[]');
                           if (sizes.length === 0) throw new Error();
                           return sizes.map((s: any) => (
                             <button 
                               key={s.size} 
                               onClick={() => setSaleSize(s.size)}
                               className={`px-[18px] h-10 rounded-full border text-[13px] font-bold transition-all
                                 ${saleSize === s.size 
                                   ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] border-transparent text-white' 
                                   : 'bg-[#1a1a1a] border-[#222] text-[#888]'}`}
                             >
                               {s.size} {s.quantity <= 0 && '(sold out)'}
                             </button>
                           ));
                         } catch {
                           return (
                             <input 
                               type="text"
                               placeholder="e.g. UK8, L, XL"
                               value={saleSize}
                               onChange={(e) => setSaleSize(e.target.value)}
                               className="w-full h-11 bg-[#1a1a1a] border border-[#222] rounded-[12px] px-4 text-white text-[14px] outline-none"
                             />
                           );
                         }
                       })()}
                    </div>
                 </div>

                 <div className="flex justify-between items-center">
                    <label className="text-white font-bold text-[13px]">Quantity *</label>
                    <div className="flex items-center gap-6">
                       <button 
                        onClick={() => setSaleQuantity(prev => Math.max(1, prev - 1))} 
                        className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#222] flex items-center justify-center text-white text-[18px]"
                       >
                         −
                       </button>
                       <span className="text-white font-bold text-[18px] min-w-[24px] text-center">{saleQuantity}</span>
                       <button 
                        onClick={() => setSaleQuantity(prev => prev + 1)} 
                        className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#222] flex items-center justify-center text-white text-[18px]"
                       >
                         +
                       </button>
                    </div>
                 </div>

                 <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-white font-bold text-[13px]">Sale Price (USD) *</label>
                      <span className="text-[#888] text-[11px] mb-0.5">Change if negotiated</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888] font-bold text-[14px]">$</span>
                      <input 
                         type="number"
                         value={salePrice}
                         onChange={(e) => setSalePrice(e.target.value)}
                         className="w-full h-12 bg-[#1a1a1a] border border-[#222] rounded-[12px] pl-8 pr-4 text-white text-[15px] font-bold outline-none focus:border-[#FF2D78]/50 transition-colors"
                      />
                    </div>
                 </div>

                 <div>
                    <label className="text-white font-bold text-[13px] block mb-3">How was it sold?</label>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => setSaleChannel('in_store')}
                        className={`flex-1 h-12 rounded-full text-[13px] font-bold transition-all border
                          ${saleChannel === 'in_store' 
                            ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] border-transparent text-white' 
                            : 'bg-transparent border-[#222] text-[#888]'}`}
                       >
                         🏪 In Store
                       </button>
                       <button 
                        onClick={() => setSaleChannel('whatsapp')}
                        className={`flex-1 h-12 rounded-full text-[13px] font-bold transition-all border
                          ${saleChannel === 'whatsapp' 
                            ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] border-transparent text-white' 
                            : 'bg-transparent border-[#222] text-[#888]'}`}
                       >
                         💬 WhatsApp
                       </button>
                    </div>
                 </div>
              </div>

              <button 
                onClick={handleRecordSale}
                disabled={recordingSale || !saleSize.trim() || !salePrice}
                className={`w-full h-[52px] mt-8 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                  ${(recordingSale || !saleSize.trim() || !salePrice) 
                    ? 'bg-[#1a1a1a] text-[#555] cursor-not-allowed' 
                    : 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white shadow-[0_0_20px_rgba(255,45,120,0.2)]'}`}
              >
                {recordingSale ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                ) : (
                  <>Record Sale ✓</>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Plus, 
  BarChart3, 
  Package, 
  ArrowLeft, 
  Camera, 
  Settings, 
  Link, 
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  Smartphone,
  Eye,
  ShoppingBag,
  MoreVertical,
  X,
  PlusCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { supabase } from '../../lib/supabase';
import { AppBrandingView } from './AppBrandingView';
import { toast as sonnerToast } from 'sonner';
import { Avatar } from '../Avatar';
import { ShareSheet } from '../ShareSheet';

export const LiveShopCentreView: React.FC<{ myShop: any; onUpdate: () => void | Promise<void> }> = ({ myShop, onUpdate }) => {
  const { setSellerFlowState, products, postStory, unreadNotificationCount, deleteProduct, updateStock } = useInventory();
  const navigate = useNavigate();
  
  const [showSaleSheet, setShowSaleSheet] = useState(false);
  const [saleProduct, setSaleProduct] = useState<any>(null);
  const [recordingSale, setRecordingSale] = useState(false);
  const [isPostingStory, setIsPostingStory] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // States for Sale recording
  const [saleSize, setSaleSize] = useState('');
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState('');
  const [saleChannel, setSaleChannel] = useState<'in_store' | 'whatsapp'>('in_store');

  const stats = useMemo(() => [
    { label: 'Active Drop', value: products.length, icon: <Package size={14} /> },
    { label: 'Views', value: myShop?.view_count || 0, icon: <Eye size={14} /> },
    { label: 'Shares', value: myShop?.share_count || 0, icon: <Link size={14} /> },
  ], [products.length, myShop]);

  const handlePostStory = async () => {
    if (products.length === 0) {
      sonnerToast.error('Upload a product first');
      return;
    }
    setIsPostingStory(true);
    try {
      const latestProduct = products[0];
      const success = await postStory({
        shop_id: myShop.id,
        media_url: latestProduct.images?.[0],
        media_type: 'image',
        content: `Just dropped: ${latestProduct.name}! 🔥`,
        product_id: latestProduct.id
      });
      if (success) sonnerToast.success('Editorial Story live! 🔥');
    } catch (err) {
      sonnerToast.error('Could not post story');
    } finally {
      setIsPostingStory(false);
    }
  };

  const openSaleSheet = (product: any) => {
    setSaleProduct(product);
    setSaleSize('');
    setSaleQuantity(1);
    setSalePrice(product.price?.toString() || '');
    setShowSaleSheet(true);
  };

  const handleRecordSale = async () => {
    if (!saleSize.trim() || !salePrice) return;
    setRecordingSale(true);
    try {
      const { error } = await supabase.from('orders').insert({
        shop_id: myShop.id,
        owner_id: myShop.owner_id,
        product_id: saleProduct.id,
        product_name: saleProduct.name,
        size: saleSize.trim(),
        quantity: saleQuantity,
        sale_price: parseFloat(salePrice),
        listed_price: parseFloat(saleProduct.price),
        channel: saleChannel
      });
      if (error) throw error;
      updateStock(saleProduct.id, saleSize.trim(), saleQuantity);
      await onUpdate();
      setShowSaleSheet(false);
      sonnerToast.success('Sale logged ✓');
    } catch (err) {
      sonnerToast.error('Could not record sale');
    } finally {
      setRecordingSale(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans pb-32">
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-syne font-black tracking-tighter uppercase leading-none">FOUNDER MODE</h1>
            <span className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Ready to scale</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowBranding(true)}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 relative"
          >
            <Bell size={20} />
            {unreadNotificationCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-black" />}
          </button>
        </div>
      </header>

      <main className="px-6 py-8 flex flex-col gap-10">
        {/* Shop ID Card */}
        <section className="p-8 rounded-[40px] bg-[#0A0A0A] border border-white/5 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
           
           <div className="flex items-center gap-6 mb-8 relative z-10">
              <div className="relative">
                <Avatar url={myShop?.logo_url} size={84} className="border-2 border-white/10 ring-4 ring-black" />
                <button 
                  onClick={handlePostStory}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center ring-4 ring-[#0A0A0A]"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
              <div className="flex flex-col">
                 <h2 className="text-2xl font-syne font-black tracking-tighter uppercase italic">{myShop?.name}</h2>
                 <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1 italic">Verified Partner</p>
              </div>
           </div>

           <div className="flex gap-4">
              <button 
                onClick={() => setShowShareSheet(true)}
                className="flex-1 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest text-white/70 hover:bg-white/10 transition-all"
              >
                <Link size={14} /> Share Link
              </button>
              <button 
                onClick={() => setSellerFlowState('edit_shop')}
                className="flex-1 h-12 bg-white text-black rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                <Smartphone size={14} /> My Profile
              </button>
           </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-3 gap-3">
           {stats.map((stat, i) => (
             <div key={`quick-stat-${i}`} className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl flex flex-col items-center justify-center gap-2 text-center">
                <div className="text-white/20">{stat.icon}</div>
                <div className="text-xl font-syne font-black tracking-tighter">{stat.value}</div>
                <div className="text-[8px] font-black uppercase tracking-widest text-white/30">{stat.label}</div>
             </div>
           ))}
        </section>

        {/* Inventory Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
               <h3 className="text-lg font-syne font-black tracking-tighter uppercase">Inventory</h3>
               <span className="text-[10px] font-black uppercase text-white/20">({products.length})</span>
             </div>
             <button 
               onClick={() => setSellerFlowState('add_product')}
               className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5"
             >
               <PlusCircle size={14} /> Add Product
             </button>
          </div>

          <div className="flex flex-col gap-3">
             {products.length === 0 ? (
               <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[40px]">
                  <ShoppingBag size={40} className="mx-auto text-white/10 mb-4" />
                  <p className="text-white/30 font-bold text-sm">No products listed yet</p>
               </div>
             ) : (
               products.map((p) => (
                 <motion.div 
                   key={p.id}
                   whileTap={{ scale: 0.98 }}
                   className="p-4 rounded-3xl bg-[#0A0A0A] border border-white/5 flex items-center justify-between group"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5">
                          <img src={p.images?.[0]} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex flex-col">
                          <h4 className="text-sm font-bold text-white mb-1">{p.name}</h4>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-primary">${p.price}</span>
                             <span className="w-1 h-1 rounded-full bg-white/10" />
                             <span className={`text-[10px] font-black ${p.total_stock < 5 ? 'text-orange-500' : 'text-white/30'}`}>
                               {p.total_stock} LEFT
                             </span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => openSaleSheet(p)}
                        className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-white transition-all"
                       >
                         <ArrowUpRight size={18} />
                       </button>
                       <button 
                        onClick={() => navigate(`/edit-product/${p.id}`)}
                        className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-white transition-all"
                       >
                         <MoreVertical size={18} />
                       </button>
                    </div>
                 </motion.div>
               ))
             )}
          </div>
        </section>
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-10 left-6 right-6 h-20 glass rounded-full shadow-2xl border-white/10 z-[60] flex items-center justify-between px-8">
         <button 
           onClick={() => setSellerFlowState('dashboard')}
           className="flex-1 flex flex-col items-center justify-center gap-1 text-white/50 hover:text-primary transition-all"
         >
           <BarChart3 size={22} />
           <span className="text-[8px] font-black uppercase tracking-widest italic">Insights</span>
         </button>
         
         <button 
           onClick={() => setSellerFlowState('add_product')}
           className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-heavy -mt-10 border-4 border-black active:scale-90 transition-all"
         >
           <Plus size={28} strokeWidth={3} />
         </button>

         <button 
           onClick={handlePostStory}
           disabled={isPostingStory}
           className="flex-1 flex flex-col items-center justify-center gap-1 text-white/50 hover:text-primary transition-all disabled:opacity-30"
         >
           <Camera size={22} />
           <span className="text-[8px] font-black uppercase tracking-widest italic">Post Story</span>
         </button>
      </div>

      <ShareSheet isOpen={showShareSheet} onClose={() => setShowShareSheet(false)} shop={myShop} />
      
      <AnimatePresence>
        {showBranding && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 z-[100] bg-black">
            <AppBrandingView onClose={() => setShowBranding(false)} />
          </motion.div>
        )}

        {showSaleSheet && saleProduct && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSaleSheet(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
             <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
               className="relative w-full max-w-[440px] bg-[#0A0A0A] border-t border-white/10 rounded-t-[48px] p-10 pb-16"
             >
                <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-10" />
                <h3 className="text-2xl font-syne font-black tracking-tighter text-center uppercase italic mb-8">Record Sale</h3>
                
                <div className="flex items-center gap-6 mb-10 p-4 rounded-3xl bg-white/5 border border-white/5">
                   <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10">
                      <img src={saleProduct.images?.[0]} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-white font-bold">{saleProduct.name}</span>
                      <span className="text-primary font-black text-sm">${saleProduct.price}</span>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="flex flex-col gap-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Select Size</p>
                      <div className="flex flex-wrap gap-2">
                         {(() => {
                           try {
                             const sizes = Array.isArray(saleProduct.sizes) ? saleProduct.sizes : JSON.parse(saleProduct.sizes || '[]');
                             return sizes.map((s: any) => (
                               <button 
                                 key={s.size} 
                                 onClick={() => setSaleSize(s.size)}
                                 className={`px-6 py-2 rounded-xl transition-all font-black text-[11px] uppercase tracking-widest ${saleSize === s.size ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/5'}`}
                               >
                                 {s.size}
                               </button>
                             ));
                           } catch { return null; }
                         })()}
                      </div>
                   </div>

                   <div className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Quantity</span>
                      <div className="flex items-center gap-6">
                         <button onClick={() => setSaleQuantity(Math.max(1, saleQuantity - 1))} className="text-white/50"><X size={14} /></button>
                         <span className="text-xl font-syne font-black">{saleQuantity}</span>
                         <button onClick={() => setSaleQuantity(saleQuantity + 1)} className="text-white/50"><Plus size={14} /></button>
                      </div>
                   </div>

                   <button 
                     onClick={handleRecordSale}
                     disabled={recordingSale || !saleSize.trim()}
                     className="w-full h-16 bg-white text-black rounded-[24px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl disabled:opacity-30"
                   >
                     Confirm Sale
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

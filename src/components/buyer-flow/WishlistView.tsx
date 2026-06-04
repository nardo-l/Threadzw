import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Bell, Trash2, X, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';

export const WishlistView: React.FC = () => {
  const navigate = useNavigate();
  const { 
    setBuyerFlowState, 
    savedProductIds, 
    toggleSave, 
    products, 
    shops,
    setCurrentProductId 
  } = useInventory();
  
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState<string | null>(null);

  const wishlistProducts = products.filter(p => savedProductIds.includes(p.id));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemove = (id: string) => {
    toggleSave(id);
    showToast('Removed from wishlist');
  };

  if (wishlistProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center bg-[#0A0A0A]">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
          <Heart className="opacity-20 text-[#C6FF00]" size={40} />
        </div>
        <h2 className="font-bold text-[20px] text-white">Nothing saved yet</h2>
        <p className="text-white/40 text-[14px] mt-2 leading-relaxed max-w-[260px]">
          Tap the heart on any product to save it here for later.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="mt-10 px-10 h-14 rounded-full text-white font-bold text-[15px] shadow-xl flex items-center gap-2 transition-all active:scale-95 bg-gradient-to-br from-[#9B27AF] to-[#C6FF00]"
        >
          Explore Shop <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-[120px] bg-[#0A0A0A]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] border px-6 py-3 rounded-full font-bold text-[13px] shadow-2xl bg-[#111111] border-white/10 text-white"
          >
             {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div 
        className="px-5 py-5 flex items-center justify-between sticky top-0 backdrop-blur-md z-20 border-b bg-black/80 border-white/5"
      >
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-95 transition-transform text-white">
             <ArrowLeft size={22} />
          </button>
          <h1 className="font-bold text-[20px] text-white">Wishlist</h1>
        </div>
        <Heart className="fill-[#C6FF00] text-[#C6FF00]" size={24} />
      </div>

      {/* Info Card */}
      <div 
        className="mx-5 mt-6 border rounded-[20px] p-4 flex gap-3.5 bg-[#C6FF001A] border-white/5"
      >
        <Bell className="shrink-0 text-[#C6FF00]" size={18} />
        <p className="text-[13px] leading-relaxed text-[#C6FF00] font-medium">
          We'll notify you when prices drop or stock gets low on your saved items.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 px-5 mt-6 mb-4">
        {["All", "In Stock", "Low Stock", "Price Drops"].map(c => (
          <button 
            key={c}
            onClick={() => setFilter(c)}
            className={`h-[40px] px-6 rounded-full text-[13px] font-bold transition-all shrink-0 border ${filter === c ? 'bg-[#C6FF00] border-[#C6FF00] text-white shadow-lg' : 'bg-transparent border-white/10 text-white/40'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Products List */}
      <div className="px-5 flex flex-col gap-3">
        <div className="flex justify-between items-center mb-1 px-1">
          <span className="text-[13px] font-bold text-white/40">{wishlistProducts.length} items saved</span>
          <button className="text-[12px] font-bold text-[#C6FF00]">Clear All</button>
        </div>

        {wishlistProducts.map(p => (
          <div 
            key={p.id} 
            className="border rounded-[24px] p-4 flex items-start cursor-pointer transition-all active:scale-[0.98] bg-[#111111] border-white/5 shadown-sm"
            onClick={() => navigate(`/product/${p.id}`)}
          >
            <div className="w-[90px] h-[90px] rounded-[18px] flex items-center justify-center text-[32px] shrink-0 relative overflow-hidden bg-white/5">
               {p.images?.[0] ? (
                 <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                 '👟'
               )}
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <div className="flex justify-between items-start">
                 <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] truncate text-white">{p.name}</h3>
                    <div className="text-[12px] mt-0.5 font-bold text-white/40">{shops.find(s => s.id === p.shop_id)?.name || 'Unknown Shop'}</div>
                 </div>
                 <button 
                  onClick={(e) => { e.stopPropagation(); handleRemove(p.id); }}
                  className="p-1 -mt-1 -mr-1 text-white/20"
                 >
                    <X size={20} />
                 </button>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                 <span className="font-bold text-[16px] text-[#C6FF00]">${p.price}</span>
                 {p.id === 'p1' && (
                    <div className="flex items-center gap-1.5">
                       <span className="text-[11px] font-bold text-green-500">🔥 Trending</span>
                    </div>
                 )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                 {p.id === 'p1' ? (
                    <span className="text-[12px] font-bold text-[#FF9500]">Only 2 left ⚠️</span>
                 ) : (
                    <span className="text-[12px] font-bold text-green-500">In Stock</span>
                 )}
                 <button 
                  className="rounded-full px-4 py-2 text-white text-[11px] font-bold bg-gradient-to-br from-[#9B27AF] to-[#C6FF00] shadow-lg shadow-[#C6FF00]/20"
                 >
                    I Like It
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notification Settings */}
      <div className="mt-12 px-5 pb-8">
        <h2 className="font-bold text-[15px] mb-5 px-1 uppercase tracking-widest text-white/40">Preferences</h2>
        <div className="space-y-3">
           <ToggleRow icon="💰" label="Price Drop Alerts" defaultOn={true} />
           <ToggleRow icon="📦" label="Low Stock Alerts" defaultOn={true} />
        </div>
      </div>
    </div>
  );
};

const ToggleRow: React.FC<{ icon: string, label: string, defaultOn: boolean }> = ({ icon, label, defaultOn }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="border border-white/5 rounded-[20px] p-5 flex items-center justify-between bg-[#111111] shadow-sm">
       <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[20px] bg-white/5">{icon}</div>
          <span className="font-bold text-[14px] text-white">{label}</span>
       </div>
       <button 
        onClick={() => setOn(!on)}
        className={`w-12 h-7 rounded-full relative transition-colors p-1`}
        style={{ background: on ? '#C6FF00' : '#222' }}
       >
          <motion.div 
            animate={{ x: on ? 20 : 0 }}
            className="w-5 h-5 bg-white rounded-full shadow-md"
          />
       </button>
    </div>
  );
};

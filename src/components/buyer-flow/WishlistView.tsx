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
      <div className="flex flex-col items-center justify-center min-h-screen bg-black px-8 text-center bg-black">
        <Heart className="text-[#FF2D78]/40 mb-6" size={64} />
        <h2 className="text-white font-bold text-[18px]">Nothing saved yet</h2>
        <p className="text-[#888] text-[14px] mt-2 leading-relaxed max-w-[260px]">
          Tap the heart on any product to save it here.
        </p>
        <button 
          onClick={() => setBuyerFlowState('home')}
          className="mt-8 px-8 h-12 bg-linear-to-r from-[#9B27AF] to-[#FF2D78] rounded-full text-white font-bold text-[14px] shadow-lg flex items-center gap-2"
        >
          Browse Products <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-black min-h-screen pb-[120px]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-[#1a1a1a] border border-[#333] text-white px-5 py-2.5 rounded-full font-bold text-[13px] shadow-xl"
          >
             {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform">
             <ArrowLeft size={22} />
          </button>
          <h1 className="text-white font-bold text-[18px]">Wishlist</h1>
        </div>
        <Heart className="text-[#FF2D78] fill-[#FF2D78]" size={22} />
      </div>

      {/* Info Card */}
      <div className="mx-5 mb-5 bg-[#FF2D780F] border border-[#FF2D7826] rounded-[12px] p-3 flex gap-3">
        <Bell className="text-[#FF2D78] shrink-0" size={16} />
        <p className="text-[#888] text-[12px] leading-relaxed">
          We'll notify you when prices drop or stock gets low on your saved items.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 px-5 mb-5">
        {["All", "In Stock", "Low Stock", "Price Drops"].map(c => (
          <button 
            key={c}
            onClick={() => setFilter(c)}
            className={`h-[34px] px-4 rounded-full text-[12px] font-medium transition-all shrink-0
              ${filter === c ? 'bg-linear-to-br from-[#9B27AF] to-[#FF2D78] text-white' : 'bg-[#1a1a1a] border border-[#222] text-[#888]'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Products List */}
      <div className="px-5 flex flex-col gap-2.5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[#888] text-[13px]">{wishlistProducts.length} saved items</span>
          <button className="text-[#888] text-[12px] font-medium">Clear All</button>
        </div>

        {wishlistProducts.map(p => (
          <div 
            key={p.id} 
            className="bg-[#111] border border-[#222] rounded-[14px] p-3.5 flex items-start"
            onClick={() => navigate(`/product/${p.id}`)}
          >
            <div className="w-[80px] h-[80px] rounded-[10px] bg-linear-to-br from-[#1a1a1a] to-[#222] flex items-center justify-center text-[32px] shrink-0">
               👟
            </div>
            <div className="ml-3.5 flex-1 min-w-0">
              <div className="flex justify-between items-start">
                 <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-[14px] truncate">{p.name}</h3>
                    <div className="text-[#888] text-[12px] mt-0.5">{shops.find(s => s.id === p.shop_id)?.name || 'Unknown Shop'}</div>
                 </div>
                 <button 
                  onClick={(e) => { e.stopPropagation(); handleRemove(p.id); }}
                  className="p-1 -mt-1 -mr-1"
                 >
                    <X size={18} className="text-[#555] hover:text-white" />
                 </button>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                 <span className="text-[#FF2D78] font-bold text-[15px]">${p.price}</span>
                 {p.id === 'p2' && (
                    <div className="flex items-center gap-1.5">
                       <span className="text-[#555] text-[11px] line-through">$24</span>
                       <span className="text-green-500 text-[11px] font-medium">↓ Price drop!</span>
                    </div>
                 )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                 {p.id === 'p1' ? (
                    <span className="text-amber-500 text-[11px] font-medium">Only 2 left ⚠️</span>
                 ) : (
                    <span className="text-green-500 text-[11px] font-medium">In Stock</span>
                 )}
                 <button className="bg-linear-to-r from-[#9B27AF] to-[#FF2D78] rounded-full px-3 py-1.5 text-white text-[11px] font-bold">
                    I Like It 🔥
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notification Settings */}
      <div className="mt-10 px-5 pb-8">
        <h2 className="text-white font-bold text-[14px] mb-4">Notification Settings</h2>
        <div className="space-y-2">
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
    <div className="bg-[#111] border border-[#222] rounded-[12px] p-4 flex items-center justify-between">
       <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1a1a1a] rounded-[10px] flex items-center justify-center text-[16px]">{icon}</div>
          <span className="text-white font-bold text-[13px]">{label}</span>
       </div>
       <button 
        onClick={() => setOn(!on)}
        className={`w-10 h-5 rounded-full relative transition-colors ${on ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78]' : 'bg-[#333]'}`}
       >
          <motion.div 
            animate={{ x: on ? 20 : 2 }}
            className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full"
          />
       </button>
    </div>
  );
};

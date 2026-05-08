import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Bell, Trash2, X, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../App';

export const WishlistView: React.FC = () => {
  const t = useTheme();
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
      <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center" style={{ background: t.bg_primary }}>
        <Heart className="mb-6 opacity-20" size={64} style={{ color: t.accent }} />
        <h2 className="font-bold text-[18px]" style={{ color: t.text_primary }}>Nothing saved yet</h2>
        <p className="text-[14px] mt-2 leading-relaxed max-w-[260px]" style={{ color: t.text_secondary }}>
          Tap the heart on any product to save it here.
        </p>
        <button 
          onClick={() => setBuyerFlowState('home')}
          className="mt-8 px-8 h-12 rounded-full text-white font-bold text-[14px] shadow-lg flex items-center gap-2 transition-transform active:scale-95"
          style={{ background: t.gradient, boxShadow: t.shadow }}
        >
          Browse Products <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-[120px]" style={{ background: t.bg_primary }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] border px-5 py-2.5 rounded-full font-bold text-[13px] shadow-xl"
            style={{ background: t.bg_elevated, borderColor: t.border_secondary, color: t.text_primary }}
          >
             {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div 
        className="px-5 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-20 border-b"
        style={{ background: `${t.bg_primary}CC`, borderColor: t.border_secondary }}
      >
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform" style={{ color: t.text_primary }}>
             <ArrowLeft size={22} />
          </button>
          <h1 className="font-bold text-[18px]" style={{ color: t.text_primary }}>Wishlist</h1>
        </div>
        <Heart className="fill-current" size={22} style={{ color: t.accent }} />
      </div>

      {/* Info Card */}
      <div 
        className="mx-5 my-5 border rounded-[12px] p-3 flex gap-3"
        style={{ background: t.accent_bg, borderColor: t.accent_border }}
      >
        <Bell style={{ color: t.accent }} className="shrink-0" size={16} />
        <p className="text-[12px] leading-relaxed" style={{ color: t.text_secondary }}>
          We'll notify you when prices drop or stock gets low on your saved items.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 px-5 mb-5">
        {["All", "In Stock", "Low Stock", "Price Drops"].map(c => (
          <button 
            key={c}
            onClick={() => setFilter(c)}
            className={`h-[34px] px-4 rounded-full text-[12px] font-medium transition-all shrink-0 border`}
            style={{ 
              backgroundColor: filter === c ? t.accent : t.bg_card,
              borderColor: filter === c ? t.accent : t.border_secondary,
              color: filter === c ? '#fff' : t.text_secondary
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Products List */}
      <div className="px-5 flex flex-col gap-2.5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[13px]" style={{ color: t.text_secondary }}>{wishlistProducts.length} saved items</span>
          <button className="text-[12px] font-medium" style={{ color: t.text_tertiary }}>Clear All</button>
        </div>

        {wishlistProducts.map(p => (
          <div 
            key={p.id} 
            className="border rounded-[14px] p-3.5 flex items-start cursor-pointer transition-colors"
            style={{ background: t.bg_card, borderColor: t.border_secondary }}
            onClick={() => navigate(`/product/${p.id}`)}
          >
            <div className="w-[80px] h-[80px] rounded-[10px] flex items-center justify-center text-[32px] shrink-0 relative overflow-hidden" style={{ background: t.bg_secondary }}>
               {p.images?.[0] ? (
                 <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                 '👟'
               )}
            </div>
            <div className="ml-3.5 flex-1 min-w-0">
              <div className="flex justify-between items-start">
                 <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[14px] truncate" style={{ color: t.text_primary }}>{p.name}</h3>
                    <div className="text-[12px] mt-0.5" style={{ color: t.text_secondary }}>{shops.find(s => s.id === p.shop_id)?.name || 'Unknown Shop'}</div>
                 </div>
                 <button 
                  onClick={(e) => { e.stopPropagation(); handleRemove(p.id); }}
                  className="p-1 -mt-1 -mr-1"
                  style={{ color: t.text_tertiary }}
                 >
                    <X size={18} />
                 </button>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                 <span className="font-bold text-[15px]" style={{ color: t.accent }}>${p.price}</span>
                 {p.id === 'p2' && (
                    <div className="flex items-center gap-1.5">
                       <span className="text-[11px] line-through" style={{ color: t.text_tertiary }}>$24</span>
                       <span className="text-[11px] font-medium" style={{ color: t.green }}>↓ Price drop!</span>
                    </div>
                 )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                 {p.id === 'p1' ? (
                    <span className="text-[11px] font-medium" style={{ color: t.amber }}>Only 2 left ⚠️</span>
                 ) : (
                    <span className="text-[11px] font-medium" style={{ color: t.green }}>In Stock</span>
                 )}
                 <button 
                  className="rounded-full px-3 py-1.5 text-white text-[11px] font-bold"
                  style={{ background: t.gradient }}
                 >
                    I Like It 🔥
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notification Settings */}
      <div className="mt-10 px-5 pb-8">
        <h2 className="font-bold text-[14px] mb-4" style={{ color: t.text_primary }}>Notification Settings</h2>
        <div className="space-y-2">
           <ToggleRow icon="💰" label="Price Drop Alerts" defaultOn={true} />
           <ToggleRow icon="📦" label="Low Stock Alerts" defaultOn={true} />
        </div>
      </div>
    </div>
  );
};

const ToggleRow: React.FC<{ icon: string, label: string, defaultOn: boolean }> = ({ icon, label, defaultOn }) => {
  const t = useTheme();
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="border rounded-[12px] p-4 flex items-center justify-between" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
       <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[16px]" style={{ background: t.bg_secondary }}>{icon}</div>
          <span className="font-bold text-[13px]" style={{ color: t.text_primary }}>{label}</span>
       </div>
       <button 
        onClick={() => setOn(!on)}
        className={`w-10 h-5 rounded-full relative transition-colors`}
        style={{ background: on ? t.accent : t.border_subtle }}
       >
          <motion.div 
            animate={{ x: on ? 20 : 2 }}
            className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
          />
       </button>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Store, 
  ChevronRight, 
  X,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { getShopUrl } from '../utils/shopUrl';
import { ShopLogo } from '../components/ui/ShopImage';

export const Following: React.FC = () => {
  const navigate = useNavigate();
  const { following, toggleFollow, shops } = useInventory();
  const [shopToUnfollow, setShopToUnfollow] = useState<string | null>(null);

  const followedShops = shops.filter(shop => following.includes(shop.id));

  const handleUnfollow = (shopId: string) => {
    toggleFollow(shopId);
    setShopToUnfollow(null);
  };

  if (followedShops.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4 max-w-[430px] mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-pacifico text-white">Following</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
          <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center text-muted">
            <Store size={48} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-syne font-bold text-white">Not following any shops yet</h2>
            <p className="text-sm text-muted font-sans max-w-[280px]">
              Follow shops to see their new drops first in your feed
            </p>
          </div>
          <button 
            onClick={() => navigate('/shops')}
            className="w-full py-4 bg-primary text-white font-sans font-bold rounded-button shadow-lg shadow-primary/20"
          >
            Browse Shops
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-[430px] mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-pacifico text-white">Following</h1>
        </div>
        <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-mono font-bold rounded-pill uppercase tracking-wider">
          {followedShops.length} {followedShops.length === 1 ? 'shop' : 'shops'}
        </span>
      </header>

      <main className="pt-24 px-6 flex flex-col gap-4">
        {followedShops.map(shop => (
          <div 
            key={shop.id}
            className="bg-card p-4 rounded-card border border-white/5 flex items-center gap-4 group active:scale-[0.98] transition-all"
            onClick={() => {
              const path = getShopUrl((shop as any).handle || (shop as any).slug, shop.id);
              console.log("[FOLLOWING ROUTING] Following shop click: navigating to store path:", path);
              if (path) {
                navigate(path);
              } else {
                console.warn("[FOLLOWING ROUTING] Broken link prevented: slug/handle missing on", shop);
              }
            }}
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-elevated flex items-center justify-center border border-white/10 relative overflow-hidden">
                <ShopLogo shop={shop} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              <h3 className="text-lg font-syne font-bold text-white leading-tight">{shop.name}</h3>
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {(shop.categories || []).map(cat => (
                  <span key={cat} className="text-[8px] font-mono text-muted uppercase tracking-widest">{cat}</span>
                ))}
              </div>
              <span className="text-xs font-sans text-muted mt-1">{shop.location}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShopToUnfollow(shop.id);
              }}
              className="px-4 py-2 bg-elevated border border-white/10 rounded-pill text-[10px] font-mono text-white uppercase tracking-widest hover:bg-white/5 transition-colors"
            >
              Following
            </button>
          </div>
        ))}
      </main>

      {/* Unfollow Bottom Sheet */}
      <AnimatePresence>
        {shopToUnfollow && (
          <UnfollowSheet 
            shop={shops.find(s => s.id === shopToUnfollow)!} 
            onClose={() => setShopToUnfollow(null)}
            onUnfollow={() => handleUnfollow(shopToUnfollow)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const UnfollowSheet: React.FC<{ shop: any; onClose: () => void; onUnfollow: () => void }> = ({ shop, onClose, onUnfollow }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end justify-center"
    onClick={onClose}
  >
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="bg-background w-full max-w-[430px] rounded-t-[32px] p-8 flex flex-col gap-8"
      onClick={e => e.stopPropagation()}
    >
      <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-2" />
      
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-card flex items-center justify-center border border-white/10 overflow-hidden">
          <ShopLogo shop={shop} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-syne font-bold text-white">Unfollow {shop?.name}?</h2>
          <p className="text-sm font-sans text-muted max-w-[280px]">
            You'll stop seeing their new drops first in your feed
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={onUnfollow}
          className="w-full py-4 bg-transparent border border-red-500 text-red-500 font-sans font-bold rounded-button active:scale-[0.98] transition-all"
        >
          Unfollow
        </button>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-card text-white font-sans font-bold rounded-button border border-white/5 active:scale-[0.98] transition-all"
        >
          Keep Following
        </button>
      </div>
    </motion.div>
  </motion.div>
);

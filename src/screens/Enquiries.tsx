import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  MessageCircle,
  ArrowRight,
  Clock,
  Navigation
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory, CartItem } from '../context/InventoryContext';
import { toast } from 'sonner';

export const Enquiries: React.FC = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartQuantity, clearCart, isShopOpen, shops, createOrder } = useInventory();
  const [expandedShopDirections, setExpandedShopDirections] = useState<Record<string, boolean>>({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{ productId: string; size: string; name: string } | null>(null);

  // Group items by shop
  const groupedItems = useMemo(() => {
    const groups: Record<string, CartItem[]> = {};
    cart.forEach(item => {
      if (!groups[item.shopName]) groups[item.shopName] = [];
      groups[item.shopName].push(item);
    });
    return groups;
  }, [cart]);

  const shopNames = Object.keys(groupedItems);
  const totalValue = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const toggleDirections = (shopName: string) => {
    setExpandedShopDirections(prev => ({ ...prev, [shopName]: !prev[shopName] }));
  };

  const handleWhatsAppShop = async (shopName: string, items: CartItem[]) => {
    const shop = shops.find(s => s.name === shopName);
    if (!shop) return;

    // Record order in Supabase
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    await createOrder(shop.id, items, subtotal);

    let message = `Hi, I'm interested in the following from Thread ZW:\n`;
    items.forEach(item => {
      message += `• ${item.name} (Size ${item.size}) × ${item.quantity}\n`;
    });
    message += `\nPlease confirm availability.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${shop.whatsapp?.replace(/\+/g, '')}?text=${encodedMessage}`, '_blank');
  };

  const handleWhatsAppItem = async (item: CartItem) => {
    const shop = shops.find(s => s.id === item.shopId);
    if (!shop) return;

    // Record order in Supabase
    await createOrder(shop.id, [item], item.price * item.quantity);

    const message = `Hi, I'm interested in this from Thread ZW:\n• ${item.name} (Size ${item.size}) × ${item.quantity}\n\nPlease confirm availability.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${shop.whatsapp?.replace(/\+/g, '')}?text=${encodedMessage}`, '_blank');
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-[430px] mx-auto">
          <h1 className="text-2xl font-pacifico text-white">Enquiries</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
          <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center text-muted">
            <ShoppingBag size={48} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-syne font-bold text-white">No enquiries yet</h2>
            <p className="text-sm text-muted font-sans max-w-[280px]">
              Save products you're interested in and contact sellers here
            </p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-primary text-white font-sans font-bold rounded-button shadow-lg shadow-primary/20"
          >
            Browse the Feed
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-[430px] mx-auto">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-pacifico text-white">Enquiries</h1>
          <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-mono font-bold rounded-pill uppercase tracking-wider">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        </div>
        <button 
          onClick={() => setShowClearConfirm(true)}
          className="text-xs font-mono text-muted uppercase tracking-widest hover:text-white transition-colors"
        >
          Clear all
        </button>
      </header>

      <main className="pt-20 px-6 flex flex-col gap-6">
        {/* Plan Your Visit Banner */}
        {shopNames.length >= 2 && (
          <div className="bg-elevated border-l-4 border-primary rounded-xl p-5 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Navigation size={20} />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-syne font-bold text-white">Visiting {shopNames.length} shops</h3>
              <div className="flex flex-col gap-2">
                {shopNames.map((name, idx) => {
                  const shop = shops.find(s => s.name === name);
                  return (
                    <div key={name} className="flex gap-2 text-sm font-sans text-light">
                      <span className="text-primary font-mono">{idx + 1}.</span>
                      <span>{name} — {shop?.area}{shop?.landmark ? `, ${shop.landmark}` : ''}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] font-sans text-muted">
                Plan the most efficient route — visit closest shops first
              </p>
            </div>
          </div>
        )}

        {/* Shop Groups */}
        {shopNames.map(shopName => {
          const items = groupedItems[shopName];
          const shop = shops.find(s => s.name === shopName);
          const isOpen = isShopOpen(shopName);
          const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          const isExpanded = expandedShopDirections[shopName];

          return (
            <div key={shopName} className="bg-card rounded-card border border-white/5 overflow-hidden flex flex-col">
              {/* Shop Header */}
              <div className="p-5 border-b border-white/5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-elevated flex items-center justify-center text-2xl border-2 ${isOpen ? 'border-primary' : 'border-white/10'} overflow-hidden`}>
                    {shop?.logo_url ? <img src={shop.logo_url || undefined} className="w-full h-full object-cover" /> : '🏪'}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-lg font-syne font-bold text-white">{shopName}</h3>
                    <span className="text-xs font-sans text-muted">{shop?.area}{shop?.landmark ? ` • ${shop.landmark}` : ''}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-pill text-[8px] font-mono font-bold uppercase tracking-wider ${isOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {isOpen ? 'Open now' : 'Closed'}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-muted">
                      <Clock size={10} />
                      <span>8am – 6pm</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                </div>
              </div>

              {/* Product Rows */}
              <div className="flex flex-col">
                {items.map(item => (
                  <ProductRow 
                    key={`${item.productId}-${item.size}`} 
                    item={item} 
                    onRemove={() => setItemToRemove({ productId: item.productId, size: item.size, name: item.name })}
                    onUpdateQuantity={(delta) => updateCartQuantity(item.productId, item.size, delta)}
                    onWhatsApp={() => handleWhatsAppItem(item)}
                  />
                ))}
              </div>

              {/* Directions Card */}
              <div className="px-5 py-3 border-t border-white/5">
                <button 
                  onClick={() => toggleDirections(shopName)}
                  className="flex items-center gap-2 text-[10px] font-mono text-primary uppercase tracking-widest"
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  How to get there
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-4 bg-background rounded-xl flex gap-3">
                        <MapPin size={18} className="text-primary flex-shrink-0" />
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-primary uppercase tracking-widest">Directions</span>
                          <p className="text-sm font-sans text-white leading-relaxed">
                            {shop?.directions || 'Contact seller for exact directions.'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shop Actions */}
              <div className="p-5 bg-elevated flex flex-col gap-4">
                <button 
                  onClick={() => handleWhatsAppShop(shopName, items)}
                  className="w-full py-4 bg-primary text-white font-sans font-bold rounded-button flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                >
                  <MessageCircle size={20} />
                  WhatsApp All Items
                </button>
                <div className="flex justify-end">
                  <span className="text-sm font-mono text-muted uppercase tracking-widest">
                    Subtotal: <span className="text-white font-syne font-bold ml-1">${subtotal}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Grand Summary */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-white/5 p-6 max-w-[430px] mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Total across {shopNames.length} shops</span>
              <span className="text-3xl font-syne font-bold text-white">${totalValue}</span>
            </div>
          </div>
          <button 
            onClick={() => toast.info("Contact each shop separately using the buttons above")}
            className="w-full py-4 bg-primary text-white font-sans font-bold rounded-button flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            WhatsApp All Shops
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {showClearConfirm && (
          <Modal 
            title="Clear all enquiries?"
            message="This will remove all items from your list."
            confirmLabel="Clear All"
            onConfirm={() => {
              clearCart();
              setShowClearConfirm(false);
            }}
            onCancel={() => setShowClearConfirm(false)}
          />
        )}
        {itemToRemove && (
          <Modal 
            title={`Remove ${itemToRemove.name}?`}
            message="Remove this item from your enquiries?"
            confirmLabel="Remove"
            onConfirm={() => {
              removeFromCart(itemToRemove.productId, itemToRemove.size);
              setItemToRemove(null);
            }}
            onCancel={() => setItemToRemove(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductRow: React.FC<{ 
  item: CartItem; 
  onRemove: () => void; 
  onUpdateQuantity: (delta: number) => void;
  onWhatsApp: () => void;
}> = ({ item, onRemove, onUpdateQuantity, onWhatsApp }) => {
  const [swipeX, setSwipeX] = useState(0);
  const [startX, setStartX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff < 0) {
      setSwipeX(Math.max(-80, diff));
    } else {
      setSwipeX(0);
    }
  };

  const handleTouchEnd = () => {
    if (swipeX < -40) {
      setSwipeX(-80);
    } else {
      setSwipeX(0);
    }
  };

  return (
    <div className="relative overflow-hidden group">
      {/* Delete Background */}
      <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6">
        <Trash2 size={20} className="text-white" />
      </div>

      {/* Main Content */}
      <motion.div 
        style={{ x: swipeX }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="bg-card p-5 border-b border-white/5 flex items-center gap-4 relative z-10"
      >
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-purple/20 flex items-center justify-center text-2xl flex-shrink-0">
          {item.imageEmoji}
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          <h4 className="text-sm font-sans font-bold text-white truncate">{item.name}</h4>
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Size {item.size}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-syne font-bold text-primary">${item.price}</span>
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[8px] font-mono font-bold rounded-pill uppercase">In Stock</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-elevated rounded-lg p-1">
            <button 
              onClick={() => onUpdateQuantity(-1)}
              className="p-1 text-muted hover:text-white transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="w-6 text-center text-xs font-mono text-white">{item.quantity}</span>
            <button 
              onClick={() => onUpdateQuantity(1)}
              className="p-1 text-muted hover:text-white transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <button 
            onClick={onWhatsApp}
            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
          >
            <MessageCircle size={18} />
          </button>
          <button 
            onClick={onRemove}
            className="p-1 text-muted hover:text-red-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Modal: React.FC<{ 
  title: string; 
  message: string; 
  confirmLabel: string; 
  onConfirm: () => void; 
  onCancel: () => void;
}> = ({ title, message, confirmLabel, onConfirm, onCancel }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
    onClick={onCancel}
  >
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-elevated border border-white/10 rounded-[32px] p-8 w-full max-w-[320px] flex flex-col gap-6"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex flex-col gap-2 text-center">
        <h3 className="text-xl font-syne font-bold text-white">{title}</h3>
        <p className="text-sm font-sans text-muted">{message}</p>
      </div>
      <div className="flex flex-col gap-3">
        <button 
          onClick={onConfirm}
          className="w-full py-4 bg-red-500 text-white font-sans font-bold rounded-button shadow-lg shadow-red-500/20"
        >
          {confirmLabel}
        </button>
        <button 
          onClick={onCancel}
          className="w-full py-4 bg-card text-white font-sans font-bold rounded-button border border-white/5"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  </motion.div>
);

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
      <div className="flex flex-col min-h-screen pb-20 bg-cream text-charcoal">
        <header 
          className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl px-6 py-8 flex items-center justify-between max-w-[430px] mx-auto bg-cream/80"
        >
          <h1 className="text-4xl font-display font-black uppercase italic tracking-tighter">enquiries</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-8">
          <div className="w-32 h-32 rounded-[40px] flex items-center justify-center bg-white border-2 border-charcoal text-charcoal shadow-[12px_12px_0_#F4A6C1]">
            <ShoppingBag size={56} />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter leading-none">The Void</h2>
            <p className="italic-accent text-2xl text-charcoal/40 max-w-[300px] leading-tight">
              No active protocols. Signal Zimbabwean businesses to begin.
            </p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full h-20 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-[32px] shadow-[10px_10px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all"
          >
            Explore Catalog
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-48 bg-cream text-charcoal">
      {/* Top Bar */}
      <header 
         className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl px-6 py-8 flex items-center justify-between max-w-[430px] mx-auto bg-cream/80"
      >
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-display font-black uppercase italic tracking-tighter">enquiries</h1>
          <div 
            className="oval-sticker !bg-pink !text-charcoal !shadow-none !text-[9px]"
          >
            {totalItems} {totalItems === 1 ? 'UNIT' : 'UNITS'}
          </div>
        </div>
        <button 
          onClick={() => setShowClearConfirm(true)}
          className="text-[10px] font-black uppercase tracking-widest text-charcoal/30 hover:text-charcoal transition-colors italic underline underline-offset-4 decoration-charcoal/10"
        >
          Flush
        </button>
      </header>

      <main className="pt-32 px-6 flex flex-col gap-10">
        {/* Plan Your Visit Banner */}
        {shopNames.length >= 2 && (
          <div 
            className="bg-white border-2 border-charcoal rounded-[32px] p-8 flex gap-6 shadow-[8px_8px_0_rgba(0,0,0,0.05)]"
          >
            <div 
              className="w-16 h-16 rounded-[24px] flex items-center justify-center flex-shrink-0 bg-cream border-2 border-charcoal text-charcoal shadow-inner"
            >
              <Navigation size={28} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter leading-none">MULTI-STOP <span className="text-pink">ROUTE</span></h3>
              <div className="flex flex-col gap-3">
                {shopNames.map((name, idx) => {
                  const shop = shops.find(s => s.name === name);
                  return (
                    <div key={name} className="flex gap-4 text-xs font-black uppercase tracking-widest text-charcoal/40 italic leading-none items-center">
                      <span className="text-pink text-[14px] leading-none">{idx + 1}.</span>
                      <span className="truncate">{name} <span className="text-charcoal/10 ml-2">[{shop?.area || 'BASE'}]</span></span>
                    </div>
                  );
                })}
              </div>
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
            <div 
              key={shopName} 
              className="bg-white rounded-[40px] border-2 border-charcoal overflow-hidden flex flex-col shadow-[12px_12px_0_rgba(0,0,0,0.05)]"
            >
              {/* Shop Header */}
              <div className="p-8 border-b-2 border-charcoal/5 flex flex-col gap-4">
                <div className="flex items-center gap-6">
                  <div 
                    className={`shrink-0 w-16 h-16 rounded-[24px] border-2 flex items-center justify-center text-3xl overflow-hidden bg-cream shadow-inner`}
                    style={{ borderColor: isOpen ? '#C6FF00' : '#eee' }}
                  >
                    {shop?.logo_url ? <img src={shop.logo_url || undefined} className="w-full h-full object-cover" /> : '🏪'}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter leading-none">{shopName}</h3>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal/30 mt-2 italic">{shop?.area} • {shop?.landmark || 'ZIM'}</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div 
                      className="oval-sticker !shadow-none !text-[8.5px] border-none"
                      style={{ 
                        background: isOpen ? '#C6FF00' : '#ff4e88',
                        color: isOpen ? '#000' : '#fff' 
                      }}
                    >
                      {isOpen ? 'ONLINE' : 'OFFLINE'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-charcoal/20 uppercase tracking-widest italic">
                      <Clock size={10} />
                      <span>08:00 – 18:00</span>
                    </div>
                  </div>
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
              <div className="px-8 py-4 bg-cream/30 border-t-2 border-charcoal/5">
                <button 
                  onClick={() => toggleDirections(shopName)}
                  className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-charcoal/40 italic"
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Navigation Protocol
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 p-6 rounded-[24px] flex gap-5 bg-white border-2 border-charcoal shadow-inner">
                        <MapPin size={24} className="shrink-0 text-pink" />
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-charcoal/20 italic font-display">Coordinate Metadata</span>
                          <p className="text-lg italic-accent text-charcoal/60 leading-tight">
                            {shop?.directions || 'Connect on WhatsApp for private GPS coordinate drop.'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shop Actions */}
              <div className="p-8 flex flex-col gap-6 bg-white border-t-2 border-charcoal/5">
                <button 
                  onClick={() => handleWhatsAppShop(shopName, items)}
                  className="w-full h-16 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-xl rounded-full flex items-center justify-center gap-3 shadow-[6px_6px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  <MessageCircle size={22} strokeWidth={3} />
                  Initiate Secure Sync
                </button>
                <div className="flex justify-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/20 italic">
                    SUBTOTAL: <span className="font-display font-black ml-2 text-pink text-3xl tracking-tighter leading-none italic">${subtotal}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Grand Summary */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t-4 border-charcoal p-8 max-w-[430px] mx-auto bg-cream/95"
      >
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/30 italic">Aggregate Payload Value</span>
              <span className="text-5xl font-display font-black text-charcoal italic tracking-tighter leading-none">${totalValue}</span>
            </div>
            <div className="oval-sticker !bg-charcoal !text-white !shadow-none !text-[10px]">
               {totalItems} UNITS
            </div>
          </div>
          <button 
            onClick={() => toast.info("Execute protocols for each business individually.")}
            className="w-full h-20 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-full flex items-center justify-center gap-4 shadow-[10px_10px_0_#F4A6C1] active:translate-y-[4px] active:shadow-none transition-all"
          >
            Launch Global Sequence
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
      <div className="absolute inset-0 bg-pink flex items-center justify-end px-8">
        <Trash2 size={24} className="text-charcoal" />
      </div>

      {/* Main Content */}
      <motion.div 
        style={{ x: swipeX }}
        className="p-6 border-b-2 border-charcoal/5 flex items-center gap-6 relative z-10 bg-white"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-display font-black text-charcoal italic flex-shrink-0 relative overflow-hidden bg-cream border-2 border-charcoal shadow-inner">
          {item.imageEmoji?.startsWith('http') ? (
            <img src={item.imageEmoji} className="w-full h-full object-cover" />
          ) : (
            item.imageEmoji || '📦'
          )}
        </div>
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <h4 className="text-xl font-display font-black uppercase italic tracking-tighter truncate leading-none text-charcoal">{item.name}</h4>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-charcoal/30 italic">UNIT SPEC: {item.size}</span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl font-display font-black text-pink italic tracking-tighter leading-none">${item.price}</span>
            <div 
              className="oval-sticker !bg-lime !text-charcoal !shadow-none !text-[7.5px]"
            >
              READY
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-full p-1 bg-cream border-2 border-charcoal shadow-[2px_2px_0_rgba(0,0,0,1)]">
            <button 
              onClick={() => onUpdateQuantity(-1)}
              className="w-8 h-8 flex items-center justify-center transition-colors text-charcoal hover:text-pink"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-display font-black text-charcoal italic tracking-tighter leading-none">{item.quantity}</span>
            <button 
              onClick={() => onUpdateQuantity(1)}
              className="w-8 h-8 flex items-center justify-center transition-colors text-charcoal hover:text-pink"
            >
              <Plus size={14} />
            </button>
          </div>
          <button 
            onClick={onWhatsApp}
            className="w-12 h-12 rounded-full transition-all bg-charcoal text-cream flex items-center justify-center shadow-[4px_4px_0_#C6FF00] active:scale-95"
          >
            <MessageCircle size={20} strokeWidth={3} />
          </button>
          <button 
            onClick={onRemove}
            className="w-10 h-10 flex items-center justify-center transition-colors text-charcoal/10 hover:text-pink"
          >
            <X size={20} />
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
}> = ({ title, message, confirmLabel, onConfirm, onCancel }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] backdrop-blur-md flex items-center justify-center p-6 bg-charcoal/40"
      onClick={onCancel}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-cream border-4 border-charcoal rounded-[40px] p-10 w-full max-w-[340px] flex flex-col gap-8 shadow-[12px_12px_0_rgba(0,0,0,1)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4 text-center">
          <h3 className="text-3xl font-display font-black uppercase italic tracking-tighter text-charcoal leading-none">{title}</h3>
          <p className="italic-accent text-lg text-charcoal/50 leading-relaxed">{message}</p>
        </div>
        <div className="flex flex-col gap-4">
          <button 
            onClick={onConfirm}
            className="w-full h-16 bg-pink text-charcoal font-black uppercase tracking-widest italic text-xs rounded-full border-2 border-charcoal shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all"
          >
            {confirmLabel}
          </button>
          <button 
            onClick={onCancel}
            className="w-full h-16 font-black uppercase tracking-widest text-xs rounded-full border-2 border-charcoal bg-white text-charcoal active:scale-[0.98] transition-all"
          >
            Abort
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};


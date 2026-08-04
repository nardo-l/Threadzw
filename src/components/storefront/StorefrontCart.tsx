// src/components/storefront/StorefrontCart.tsx
import React, { useState, useMemo } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, MapPin, MessageCircle, ArrowRight } from 'lucide-react';
import { ProductImage } from '../ui/ShopImage';
import { CartItem } from './types';
import { DirectionsModal } from './DirectionsModal';

interface StorefrontCartProps {
  shop?: any;
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onNavigateToPage: (page: any) => void;
  shippingMethod?: 'pickup' | 'harare' | 'nationwide';
  onChangeShippingMethod?: (method: 'pickup' | 'harare' | 'nationwide') => void;
}

export const StorefrontCart: React.FC<StorefrontCartProps> = ({
  shop,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onNavigateToPage
}) => {
  const [showDirections, setShowDirections] = useState(false);

  // Calculate total price
  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }, [cart]);

  // Clean WhatsApp number
  const cleanPhone = useMemo(() => {
    if (!shop) return '';
    const rawNum = shop.whatsapp_number || shop.whatsapp || shop.phone || '';
    let clean = rawNum.replace(/\D/g, '');
    if (clean.startsWith('263')) {
      return clean;
    } else if (clean.startsWith('0')) {
      return `263${clean.substring(1)}`;
    } else if (clean.length > 0) {
      return `263${clean}`;
    }
    return '263771234567'; // fallback
  }, [shop]);

  // Order on WhatsApp handler for all cart items
  const handleOrderCartOnWhatsApp = () => {
    if (cart.length === 0) return;

    const shopName = shop?.name || 'Store';
    
    let msg = `Hello *${shopName}*! 👋\nI'd like to place an order from your shop:\n\n`;

    cart.forEach((item, idx) => {
      const sizeStr = item.size ? `Size: ${item.size}` : '';
      const colorStr = item.color ? `Color: ${item.color}` : '';
      const opts = [sizeStr, colorStr].filter(Boolean).join(' | ');

      msg += `${idx + 1}. *${item.product.name}*\n`;
      if (opts) msg += `   ${opts}\n`;
      msg += `   Qty: ${item.quantity} × $${item.product.price} = $${item.product.price * item.quantity} USD\n\n`;
    });

    msg += `*Total Order Value: $${total} USD*\n\n`;
    msg += `Please confirm item availability and store collection/delivery details. Thank you!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 px-5 pb-36 select-none text-left bg-white min-h-screen pt-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 font-sans block">Shopping Bag</span>
          <h2 className="text-xl font-black tracking-tight text-zinc-900 font-sans">Your Cart</h2>
        </div>
        {cart.length > 0 && (
          <span className="text-xs font-bold bg-zinc-100 text-zinc-800 px-3 py-1 rounded-full">
            {cart.reduce((s, i) => s + i.quantity, 0)} {cart.length === 1 ? 'Item' : 'Items'}
          </span>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="py-24 text-center text-zinc-400 space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-150 flex items-center justify-center mx-auto text-zinc-300">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-zinc-800 font-sans">Your shopping bag is empty</p>
            <p className="text-xs text-zinc-400">Discover items from {shop?.name || 'our shop'} to get started.</p>
          </div>
          <button
            onClick={() => onNavigateToPage('shop')}
            className="px-6 py-3 bg-[#bef715] hover:bg-[#aef000] text-black text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs font-sans mt-2"
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-6 font-sans">
          {/* Cart items list */}
          <div className="space-y-3">
            {cart.map((item, idx) => (
              <div
                key={`cart-row-${item.id || idx}`}
                className="flex gap-3.5 bg-white border border-zinc-200/80 rounded-2xl p-3.5 items-center hover:border-zinc-300 transition-colors shadow-2xs"
              >
                {/* Image */}
                <div className="w-16 h-20 bg-zinc-50 rounded-xl overflow-hidden shrink-0 border border-zinc-100">
                  <ProductImage product={item.product} shop={shop} index={0} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-grow space-y-1 min-w-0 text-left">
                  <h4 className="text-xs font-bold text-zinc-900 truncate font-sans">{item.product.name}</h4>
                  
                  {(item.size || item.color) && (
                    <p className="text-[10px] text-zinc-500 font-medium font-sans">
                      {[item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : ''].filter(Boolean).join(' | ')}
                    </p>
                  )}

                  <span className="text-xs font-extrabold text-zinc-950 block font-sans">
                    ${item.product.price} USD
                  </span>
                </div>

                {/* Actions & Quantity */}
                <div className="flex flex-col items-end gap-2.5 shrink-0">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 bg-zinc-100/80 border border-zinc-200 rounded-lg px-2 py-1">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="text-zinc-600 hover:text-black cursor-pointer p-0.5"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center text-zinc-900">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="text-zinc-600 hover:text-black cursor-pointer p-0.5"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Simple Total Price Summary Card */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs text-zinc-500 font-semibold font-sans">
              <span>Subtotal</span>
              <span className="font-bold text-zinc-900">${total} USD</span>
            </div>
            <div className="border-t border-zinc-200 pt-2 flex justify-between items-center">
              <span className="text-zinc-900 font-extrabold text-xs uppercase tracking-wider font-sans">Total Amount</span>
              <span className="text-lg font-black text-zinc-900 font-sans">${total} USD</span>
            </div>
          </div>

          {/* Fixed Bottom Action Panel (Visit Shop & Order on WhatsApp) */}
          <div className="fixed bottom-20 left-4 right-4 p-2.5 bg-white/95 backdrop-blur-md border border-zinc-200/80 shadow-xl rounded-2xl z-45 max-w-[480px] mx-auto flex items-center gap-2">
            {/* Visit Shop */}
            <button
              onClick={() => setShowDirections(true)}
              className="flex-1 py-3.5 px-3 bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Visit Shop</span>
            </button>

            {/* Order on WhatsApp */}
            <button
              onClick={handleOrderCartOnWhatsApp}
              className="flex-1 py-3.5 px-3 bg-[#bef715] hover:bg-[#aef000] text-black text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm font-sans"
            >
              <MessageCircle className="w-4 h-4 fill-black/20" />
              <span>Order on WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Directions Modal Overlay */}
      <DirectionsModal
        isOpen={showDirections}
        onClose={() => setShowDirections(false)}
        shop={shop}
      />
    </div>
  );
};

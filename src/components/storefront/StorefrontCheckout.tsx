// src/components/storefront/StorefrontCheckout.tsx
import React, { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle, MapPin } from 'lucide-react';
import { CartItem } from './types';
import { DirectionsModal } from './DirectionsModal';

interface StorefrontCheckoutProps {
  shop: any;
  cart: CartItem[];
  shippingMethod?: string;
  onNavigateToPage: (page: any, params?: any) => void;
  onClearCart?: () => void;
  onSetLastOrder?: (orderDetails: any) => void;
  onBack: () => void;
}

export const StorefrontCheckout: React.FC<StorefrontCheckoutProps> = ({
  shop,
  cart,
  onNavigateToPage,
  onBack
}) => {
  const [showDirections, setShowDirections] = useState(false);

  // Calculate total price
  const total = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  // Clean WhatsApp number
  const rawNum = shop?.whatsapp_number || shop?.whatsapp || shop?.phone || '';
  let cleanPhone = rawNum.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = `263${cleanPhone.substring(1)}`;
  } else if (!cleanPhone.startsWith('263') && cleanPhone.length > 0) {
    cleanPhone = `263${cleanPhone}`;
  }
  if (!cleanPhone) cleanPhone = '263771234567';

  const handleOrderCartOnWhatsApp = () => {
    if (cart.length === 0) {
      onNavigateToPage('shop');
      return;
    }

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
    <div className="space-y-6 px-5 pb-24 select-none text-left bg-white min-h-screen pt-4 font-sans">
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
        <button
          onClick={onBack}
          className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-full border border-zinc-150 text-zinc-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-black tracking-tight text-zinc-900">Complete Purchase</h2>
          <p className="text-xs text-zinc-500">Choose your preferred way to buy</p>
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4 text-center">
        <h3 className="text-sm font-bold text-zinc-900">Ordering from {shop?.name}</h3>
        <p className="text-xs text-zinc-600 leading-relaxed max-w-xs mx-auto">
          ThreadZW connects you directly with local Zimbabwean businesses. Connect via WhatsApp or visit the showroom in person.
        </p>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex justify-between items-center text-xs">
          <span className="font-semibold text-zinc-500">Cart Total ({cart.length} items)</span>
          <span className="font-black text-sm text-zinc-900">${total} USD</span>
        </div>

        <div className="space-y-3 pt-2">
          {/* Order on WhatsApp */}
          <button
            onClick={handleOrderCartOnWhatsApp}
            className="w-full py-4 store-accent-bg  text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm font-sans"
          >
            <MessageCircle className="w-4 h-4 fill-black/20" />
            <span>Order on WhatsApp</span>
          </button>

          {/* Visit Shop */}
          <button
            onClick={() => setShowDirections(true)}
            className="w-full py-4 bg-zinc-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs font-sans"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Visit Shop</span>
          </button>
        </div>
      </div>

      <DirectionsModal
        isOpen={showDirections}
        onClose={() => setShowDirections(false)}
        shop={shop}
      />
    </div>
  );
};

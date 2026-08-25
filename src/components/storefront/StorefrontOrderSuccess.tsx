// src/components/storefront/StorefrontOrderSuccess.tsx
import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, MessageCircle, Copy, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface StorefrontOrderSuccessProps {
  shop: any;
  lastOrder: any;
  onNavigateToPage: (page: any) => void;
}

export const StorefrontOrderSuccess: React.FC<StorefrontOrderSuccessProps> = ({
  shop,
  lastOrder,
  onNavigateToPage
}) => {
  const orderRef = lastOrder?.orderReference || '#TZW-7241';
  const customerName = lastOrder?.customerName || 'Boutique Enthusiast';
  const deliveryAddress = lastOrder?.deliveryAddress || 'Showroom Pickup';
  const totalPrice = lastOrder?.totalPrice || 0;
  const items = lastOrder?.items || [];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(orderRef);
    toast.success('Order code copied to clipboard!');
  };

  const handleContactSeller = () => {
    const phone = (shop.whatsapp_number || shop.whatsapp || '263771234567').replace(/\D/g, '');
    const text = `Hi ${shop.name}, I am contacting you regarding my order *${orderRef}* placed on your storefront. Please update me on the logistics process!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 px-5 pb-24 select-none text-center bg-white min-h-screen pt-4 font-sans">
      {/* ----------------- SUCCESS CELEBRATION CARD ----------------- */}
      <div className="pt-8 pb-4 flex flex-col items-center space-y-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-16 h-16 rounded-full store-accent-soft-bg border store-accent-soft-border flex items-center justify-center store-accent-text"
        >
          <CheckCircle className="w-8 h-8 stroke-[2]" />
        </motion.div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider store-accent-text font-sans">Boutique Purchase</span>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 leading-none font-sans">Order Confirmed!</h2>
        </div>

        <p className="text-xs text-zinc-500 max-w-xs leading-relaxed font-sans font-medium">
          Your order has been compiled successfully. We have registered your details in our logistics database.
        </p>
      </div>

      {/* ----------------- ORDER CODE CARD ----------------- */}
      <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-5 space-y-2 text-center shadow-xs">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Logistics Code Reference</span>
        
        <div className="flex items-center justify-center gap-2">
          <span className="font-mono text-xl font-bold text-zinc-900 tracking-wider">{orderRef}</span>
          <button
            onClick={handleCopyCode}
            className="p-1.5 hover:bg-zinc-200/50 rounded-md text-zinc-500 hover:text-zinc-900 cursor-pointer transition-colors"
            title="Copy Order Code"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 leading-normal font-sans font-medium">
          Keep this code safe. Use this to monitor delivery updates on our Track Order screen.
        </p>
      </div>

      {/* ----------------- SUMMARY BREAKDOWN ----------------- */}
      <div className="bg-zinc-50/50 border border-zinc-150 rounded-2xl p-5 text-left space-y-4">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Delivery & Details</span>

        <div className="space-y-3.5 text-xs text-zinc-600">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 block font-bold">Recipient</span>
            <span className="font-bold text-zinc-800 font-sans">{customerName}</span>
          </div>

          <div>
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 block font-bold">Physical Coordinates</span>
            <span className="font-semibold text-zinc-800 leading-relaxed font-sans">{deliveryAddress}</span>
          </div>

          {items.length > 0 && (
            <div>
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 block mb-1.5 font-bold">Items Compiled</span>
              <div className="space-y-1.5 font-sans text-xs">
                {items.map((i: any, idx: number) => (
                  <div key={idx} className="flex justify-between border-b border-zinc-100 pb-1 text-zinc-500">
                    <span>{i.name} (x{i.quantity}) {i.size ? `[Size ${i.size}]` : ''}</span>
                    <span className="text-zinc-800 font-bold">${i.price * i.quantity} USD</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-zinc-150 pt-3 flex justify-between items-baseline">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Charged</span>
            <span className="text-base font-bold text-zinc-900 font-sans">${totalPrice} USD</span>
          </div>
        </div>
      </div>

      {/* ----------------- ACTIONS ROW ----------------- */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={handleContactSeller}
          className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors border border-zinc-200"
        >
          <MessageCircle className="w-4 h-4 store-accent-text fill-green-100" /> Contact Seller Agent
        </button>

        <button
          onClick={() => onNavigateToPage('home')}
          className="w-full py-3 store-accent-bg  text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

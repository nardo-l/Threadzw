// src/components/storefront/StorefrontOrderSuccess.tsx
import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, ShoppingBag, MessageCircle, Copy, ArrowRight, Clipboard } from 'lucide-react';
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
  // If lastOrder is empty for some reason, provide general defaults
  const orderRef = lastOrder?.orderReference || '#TZW-7241';
  const customerName = lastOrder?.customerName || 'Boutique Enthusiast';
  const deliveryAddress = lastOrder?.deliveryAddress || 'Showroom Pickup (Bulawayo)';
  const totalPrice = lastOrder?.totalPrice || 0;
  const items = lastOrder?.items || [];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(orderRef);
    toast.success('Order code copied to clipboard!');
  };

  const handleContactSeller = () => {
    const phone = (shop.whatsapp_number || shop.whatsapp || '263771234567').replace(/\D/g, '');
    const text = `Hi ${shop.name}, I'm contacting you regarding order *${orderRef}* placed on your storefront. Please update me on the logistics process!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 px-5 pb-16 select-none text-center">
      {/* ----------------- SUCCESS CELEBRATION CARD ----------------- */}
      <div className="pt-8 pb-4 flex flex-col items-center space-y-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-16 h-16 rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/35 flex items-center justify-center text-[#C6FF00]"
        >
          <CheckCircle className="w-8 h-8 stroke-[2]" />
        </motion.div>

        <div className="space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C6FF00] font-mono">Boutique Purchase</span>
          <h2 className="font-syne text-2xl font-black uppercase tracking-tight text-white leading-none">Order Confirmed!</h2>
        </div>

        <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
          Your tailored order coordinates have been compiled successfully. We have registered your details in our logistics database.
        </p>
      </div>

      {/* ----------------- ORDER CODE CARD ----------------- */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4.5 space-y-2.5 text-center">
        <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500 font-bold block">Logistics Code Reference</span>
        
        <div className="flex items-center justify-center gap-2">
          <span className="font-mono text-xl font-black text-[#C6FF00] tracking-wider">{orderRef}</span>
          <button
            onClick={handleCopyCode}
            className="p-1.5 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white cursor-pointer"
            title="Copy Order Code"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[9.5px] text-neutral-500 leading-normal">
          Keep this code safe. Use this to monitor delivery updates on our Track Order screen.
        </p>
      </div>

      {/* ----------------- SUMMARY BREAKDOWN ----------------- */}
      <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-[20px] p-5 text-left space-y-4">
        <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-550 font-bold block">Delivery & Details</span>

        <div className="space-y-3.5 text-xs text-neutral-300">
          <div>
            <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-500 block">Recipient</span>
            <span className="font-bold text-neutral-100">{customerName}</span>
          </div>

          <div>
            <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-500 block">Physical Coordinates</span>
            <span className="font-bold text-neutral-100 leading-relaxed">{deliveryAddress}</span>
          </div>

          {items.length > 0 && (
            <div>
              <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-500 block mb-1">Items Compiled</span>
              <div className="space-y-1.5 font-mono text-[10px]">
                {items.map((i: any, idx: number) => (
                  <div key={idx} className="flex justify-between border-b border-neutral-900/80 pb-1 text-neutral-400">
                    <span>{i.name} (x{i.quantity}) {i.size ? `[Size ${i.size}]` : ''}</span>
                    <span className="text-neutral-300">${i.price * i.quantity} USD</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-neutral-850 pt-3 flex justify-between items-baseline">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Charged</span>
            <span className="text-base font-black text-[#C6FF00] font-mono">${totalPrice} USD</span>
          </div>
        </div>
      </div>

      {/* ----------------- ACTIONS ROW ----------------- */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={handleContactSeller}
          className="w-full py-4 bg-neutral-900 border border-neutral-800 text-white font-extrabold text-xs uppercase tracking-[2px] rounded-xl hover:border-neutral-700 flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-emerald-400 fill-current" /> Contact Seller Agent
        </button>

        <button
          onClick={() => onNavigateToPage('home')}
          className="w-full py-4 bg-[#C6FF00] text-black font-black text-xs uppercase tracking-[2px] rounded-xl hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#C6FF00]/5"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

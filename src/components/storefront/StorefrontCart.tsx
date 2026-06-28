// src/components/storefront/StorefrontCart.tsx
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Truck, Store } from 'lucide-react';
import { ProductImage } from '../ui/ShopImage';
import { CartItem } from './types';

interface StorefrontCartProps {
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onNavigateToPage: (page: any) => void;
  shippingMethod: 'pickup' | 'harare' | 'nationwide';
  onChangeShippingMethod: (method: 'pickup' | 'harare' | 'nationwide') => void;
}

export const StorefrontCart: React.FC<StorefrontCartProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onNavigateToPage,
  shippingMethod,
  onChangeShippingMethod
}) => {
  // Subtotal
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }, [cart]);

  // Delivery Cost
  const deliveryFee = useMemo(() => {
    if (shippingMethod === 'pickup') return 0;
    if (shippingMethod === 'harare') return 5;
    return 7;
  }, [shippingMethod]);

  // Total
  const total = subtotal + deliveryFee;

  return (
    <div className="space-y-6 px-5 pb-16 select-none text-left">
      <div className="space-y-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C6FF00] font-mono font-black">Shopping Bag</span>
        <h2 className="font-syne text-2xl font-black uppercase tracking-tight text-white">Your Cart</h2>
      </div>

      {cart.length === 0 ? (
        <div className="py-20 text-center text-neutral-500 space-y-4">
          <ShoppingBag className="w-16 h-16 mx-auto text-neutral-800 animate-bounce" />
          <p className="text-xs font-mono uppercase tracking-widest">Your shopping bag is empty</p>
          <button
            onClick={() => onNavigateToPage('shop')}
            className="px-6 py-3 bg-[#C6FF00] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all cursor-pointer"
          >
            Browse Collections
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart items list */}
          <div className="space-y-3">
            {cart.map((item, idx) => (
              <div
                key={`cart-row-${item.id || idx}`}
                className="flex gap-4 bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-3 items-center hover:border-neutral-800 transition-colors"
              >
                {/* Image */}
                <div className="w-16 h-20 bg-neutral-950 rounded-xl overflow-hidden shrink-0">
                  <ProductImage product={item.product} index={0} className="w-full h-full object-cover" />
                </div>

                {/* Metadata */}
                <div className="flex-grow space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold uppercase truncate text-neutral-100">{item.product.name}</h4>
                  <p className="text-[9.5px] uppercase font-mono text-neutral-500 tracking-wider">
                    Size: {item.size} {item.color ? `| Color: ${item.color}` : ''}
                  </p>
                  <span className="text-xs font-black text-[#C6FF00] font-mono block">${item.product.price}</span>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 text-neutral-500 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Quantity control */}
                  <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="text-neutral-400 hover:text-white cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono font-extrabold w-4 text-center text-white">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="text-neutral-400 hover:text-white cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ----------------- DELIVERY METHOD ----------------- */}
          <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-bold block">Delivery Option</span>
            
            <div className="space-y-2">
              {/* Pickup Option */}
              <div
                onClick={() => onChangeShippingMethod('pickup')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  shippingMethod === 'pickup'
                    ? 'bg-[#C6FF00]/5 border-[#C6FF00] text-[#C6FF00]'
                    : 'bg-neutral-950 border-neutral-850 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Store className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block">Boutique Pickup</span>
                    <span className="text-[9px] text-neutral-500 font-mono">Collect in Bulawayo showroom</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold uppercase">Free</span>
              </div>

              {/* Harare Delivery */}
              <div
                onClick={() => onChangeShippingMethod('harare')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  shippingMethod === 'harare'
                    ? 'bg-[#C6FF00]/5 border-[#C6FF00] text-[#C6FF00]'
                    : 'bg-neutral-950 border-neutral-850 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block">Harare Courier Delivery</span>
                    <span className="text-[9px] text-neutral-500 font-mono">Delivered to your Harare coordinates</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold">$5.00</span>
              </div>

              {/* Nationwide Courier */}
              <div
                onClick={() => onChangeShippingMethod('nationwide')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  shippingMethod === 'nationwide'
                    ? 'bg-[#C6FF00]/5 border-[#C6FF00] text-[#C6FF00]'
                    : 'bg-neutral-950 border-neutral-850 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block">Zimbabwe Nationwide Courier</span>
                    <span className="text-[9px] text-neutral-500 font-mono">Certified courier shipping across Zimbabwe</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold">$7.00</span>
              </div>
            </div>
          </div>

          {/* ----------------- PRICE CALCULATION SUMMARY ----------------- */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-[24px] p-5 space-y-3.5">
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-bold block">Summary Breakdown</span>
            
            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span className="font-mono text-neutral-200">${subtotal} USD</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Delivery</span>
                <span className="font-mono text-neutral-200">${deliveryFee === 0 ? '0.00' : `${deliveryFee}.00`} USD</span>
              </div>
              <div className="border-t border-neutral-800 pt-2.5 flex justify-between items-end text-sm font-semibold">
                <span className="text-white uppercase tracking-wider font-extrabold text-xs">Total</span>
                <span className="text-xl font-black text-[#C6FF00] font-mono">${total} USD</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToPage('checkout')}
              className="w-full py-4 mt-2 bg-[#C6FF00] text-black font-black text-xs uppercase tracking-[2px] rounded-xl hover:opacity-90 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#C6FF00]/10 font-sans"
            >
              Proceed to checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

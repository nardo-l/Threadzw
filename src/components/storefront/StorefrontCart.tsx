// src/components/storefront/StorefrontCart.tsx
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Truck, Store, MapPin, MessageCircle, ExternalLink, Compass } from 'lucide-react';
import { ProductImage } from '../ui/ShopImage';
import { CartItem } from './types';

interface StorefrontCartProps {
  shop?: any;
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onNavigateToPage: (page: any) => void;
  shippingMethod: 'pickup' | 'harare' | 'nationwide';
  onChangeShippingMethod: (method: 'pickup' | 'harare' | 'nationwide') => void;
}

export const StorefrontCart: React.FC<StorefrontCartProps> = ({
  shop,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onNavigateToPage,
  shippingMethod,
  onChangeShippingMethod
}) => {
  // Check if any location data exists
  const hasLocationData = useMemo(() => {
    return !!(shop?.location?.trim() || shop?.landmark?.trim() || shop?.directions?.trim() || shop?.town?.trim() || shop?.city?.trim() || shop?.suburb?.trim());
  }, [shop]);

  // Clean WhatsApp number for Enquiry
  const whatsappLink = useMemo(() => {
    if (!shop) return '';
    const rawNum = shop.whatsapp_number || shop.whatsapp || '';
    let clean = rawNum.replace(/\D/g, '');
    if (clean.startsWith('263')) {
      // already formatted
    } else if (clean.startsWith('0')) {
      clean = `263${clean.substring(1)}`;
    } else if (clean.length > 0) {
      clean = `263${clean}`;
    } else {
      clean = '263771234567'; // Fallback
    }
    return `https://wa.me/${clean}?text=${encodeURIComponent(`Hi, I'm looking at your store ${shop.name} and would like to visit or enquire about boutique pickup/location details.`)}`;
  }, [shop]);

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
    <div className="space-y-6 px-5 pb-24 select-none text-left bg-white min-h-screen pt-4 font-sans">
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 font-sans">Shopping Bag</span>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">Your Cart</h2>
      </div>

      {cart.length === 0 ? (
        <div className="py-24 text-center text-zinc-400 space-y-4">
          <ShoppingBag className="w-12 h-12 mx-auto text-zinc-200 animate-bounce" />
          <p className="text-xs font-semibold text-zinc-500 font-sans">Your shopping bag is empty</p>
          <button
            onClick={() => onNavigateToPage('shop')}
            className="px-6 py-2.5 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 transition-colors cursor-pointer shadow-xs font-sans"
          >
            Browse Collections
          </button>
        </div>
      ) : (
        <div className="space-y-6 font-sans">
          {/* Cart items list */}
          <div className="space-y-3">
            {cart.map((item, idx) => (
              <div
                key={`cart-row-${item.id || idx}`}
                className="flex gap-4 bg-white border border-zinc-150 rounded-2xl p-3 items-center hover:border-zinc-200 transition-colors shadow-xs"
              >
                {/* Image */}
                <div className="w-16 h-20 bg-zinc-50 rounded-xl overflow-hidden shrink-0">
                  <ProductImage product={item.product} shop={shop} index={0} className="w-full h-full object-cover" />
                </div>

                {/* Metadata */}
                <div className="flex-grow space-y-0.5 min-w-0 text-left">
                  <h4 className="text-xs font-bold text-zinc-800 truncate font-sans">{item.product.name}</h4>
                  <p className="text-[10px] text-zinc-400 font-sans">
                    Size: {item.size} {item.color ? `| Color: ${item.color}` : ''}
                  </p>
                  <span className="text-xs font-bold text-zinc-950 block font-sans">${item.product.price}</span>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Quantity control */}
                  <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-250/60 rounded-lg px-2 py-0.5">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="text-zinc-500 hover:text-green-600 cursor-pointer p-0.5"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center text-zinc-800">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="text-zinc-500 hover:text-green-600 cursor-pointer p-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ----------------- VISIT SHOP EXPERIENCE (PRIORITY 4) ----------------- */}
          {hasLocationData && (
            <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4 space-y-3.5 text-left">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/60">
                <MapPin className="w-4 h-4 text-green-600 animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-900 font-extrabold font-sans">
                  How to Find Us
                </span>
              </div>
              
              <div className="space-y-3">
                {/* 📍 Address */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs shrink-0">📍</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Address</span>
                    <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shop?.shop_address || shop?.location || shop?.town || 'Bulawayo CBD'}</span>
                  </div>
                </div>

                {/* 📍 Building */}
                {(shop?.building_name) && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs shrink-0">📍</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Building</span>
                      <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shop?.building_name}</span>
                    </div>
                  </div>
                )}

                {/* 🏢 Floor */}
                {(shop?.floor) && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs shrink-0">🏢</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Floor</span>
                      <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shop?.floor}</span>
                    </div>
                  </div>
                )}

                {/* 🚪 Shop Number */}
                {(shop?.shop_number) && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs shrink-0">🚪</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Shop Number</span>
                      <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shop?.shop_number}</span>
                    </div>
                  </div>
                )}

                {/* 📌 Landmark */}
                {(shop?.landmark) && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs shrink-0">📌</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Landmark</span>
                      <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shop?.landmark}</span>
                    </div>
                  </div>
                )}

                {/* 🧭 Directions */}
                {(shop?.directions) && (
                  <div className="bg-white border border-green-200 rounded-xl p-3 shadow-xs mt-3 flex items-start gap-2.5">
                    <span className="text-sm shrink-0 mt-0.5">🧭</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] font-bold text-green-700 uppercase tracking-wider block font-mono">Directions</span>
                      <p className="text-xs font-bold text-zinc-950 font-sans mt-0.5 leading-relaxed break-words whitespace-pre-wrap">
                        {shop?.directions}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white/10" />
                  <span>Enquire via WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* ----------------- DELIVERY METHOD ----------------- */}
          <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Delivery Option</span>
            
            <div className="space-y-2 text-left">
              {/* Pickup Option */}
              <div
                onClick={() => onChangeShippingMethod('pickup')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  shippingMethod === 'pickup'
                    ? 'bg-green-500/5 border-green-500 text-green-700'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Store className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold block font-sans">Boutique Pickup</span>
                    <span className="text-[9px] text-zinc-400 font-sans font-medium">Collect in Bulawayo/Harare showroom</span>
                  </div>
                </div>
                <span className="text-xs font-bold uppercase font-sans">Free</span>
              </div>

              {/* Same City Delivery */}
              <div
                onClick={() => onChangeShippingMethod('harare')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  shippingMethod === 'harare'
                    ? 'bg-green-500/5 border-green-500 text-green-700'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold block font-sans">Same City Courier Delivery</span>
                    <span className="text-[9px] text-zinc-400 font-sans font-medium">Delivered to coordinates in your city</span>
                  </div>
                </div>
                <span className="text-xs font-bold font-sans">$5.00</span>
              </div>

              {/* Nationwide Courier */}
              <div
                onClick={() => onChangeShippingMethod('nationwide')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  shippingMethod === 'nationwide'
                    ? 'bg-green-500/5 border-green-500 text-green-700'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold block font-sans">Nationwide Courier</span>
                    <span className="text-[9px] text-zinc-400 font-sans font-medium">Certified shipping across Zimbabwe</span>
                  </div>
                </div>
                <span className="text-xs font-bold font-sans">$7.00</span>
              </div>
            </div>
          </div>

          {/* ----------------- PRICE CALCULATION SUMMARY ----------------- */}
          <div className="bg-zinc-50 border border-zinc-150 rounded-[20px] p-5 space-y-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Summary Breakdown</span>
            
            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between text-zinc-500 font-sans">
                <span>Subtotal</span>
                <span className="font-bold text-zinc-800">${subtotal} USD</span>
              </div>
              <div className="flex justify-between text-zinc-500 font-sans">
                <span>Delivery</span>
                <span className="font-bold text-zinc-800">${deliveryFee === 0 ? '0.00' : `${deliveryFee}.00`} USD</span>
              </div>
              <div className="border-t border-zinc-200 pt-3 flex justify-between items-end text-sm">
                <span className="text-zinc-900 font-bold text-xs uppercase tracking-wider font-sans">Total</span>
                <span className="text-lg font-bold text-zinc-900 font-sans">${total} USD</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToPage('checkout')}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs font-sans"
            >
              Proceed to checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

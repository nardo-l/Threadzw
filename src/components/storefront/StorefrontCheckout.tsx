// src/components/storefront/StorefrontCheckout.tsx
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MessageCircle, CreditCard, ShieldCheck, ShoppingBag, Store, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CartItem } from './types';
import { toast } from 'sonner';

interface StorefrontCheckoutProps {
  shop: any;
  cart: CartItem[];
  shippingMethod: 'pickup' | 'harare' | 'nationwide';
  onNavigateToPage: (page: any, params?: any) => void;
  onClearCart: () => void;
  onSetLastOrder: (orderDetails: any) => void;
  onBack: () => void;
}

export const StorefrontCheckout: React.FC<StorefrontCheckoutProps> = ({
  shop,
  cart,
  shippingMethod,
  onNavigateToPage,
  onClearCart,
  onSetLastOrder,
  onBack
}) => {
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentOption, setPaymentOption] = useState<'cod' | 'pickup' | 'whatsapp'>('whatsapp');
  const [submitting, setSubmitting] = useState(false);

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

  const total = subtotal + deliveryFee;

  // Shipping Method Label
  const shippingLabel = useMemo(() => {
    if (shippingMethod === 'pickup') return 'Showroom Pickup (Bulawayo)';
    if (shippingMethod === 'harare') return 'Harare Courier Dispatch ($5)';
    return 'Zimbabwe Nationwide Express Courier ($7)';
  }, [shippingMethod]);

  // Helper to format WhatsApp
  const formatWhatsAppNumber = (num: string): string => {
    let clean = num.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '263' + clean.substring(1);
    } else if (clean.length === 9 && (clean.startsWith('77') || clean.startsWith('71') || clean.startsWith('73') || clean.startsWith('78'))) {
      clean = '263' + clean;
    }
    return clean;
  };

  // Submit Order to Supabase!
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Please complete name and phone number coordinates');
      return;
    }

    if (shippingMethod !== 'pickup' && !deliveryAddress.trim()) {
      toast.error('Please specify a delivery address');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Generate unique Order Reference number
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const prefix = shop.name ? shop.name.substring(0, 3).toUpperCase() : 'TZW';
      const orderRef = `#${prefix}-${randomId}`;

      const insertedOrders: any[] = [];

      // 2. Insert order records for each item in the cart
      for (const item of cart) {
        const orderData = {
          shop_id: shop.id,
          owner_id: shop.owner_id,
          product_id: item.product.id,
          product_name: item.product.name,
          size: item.size,
          quantity: item.quantity,
          sale_price: item.product.price,
          channel: paymentOption === 'whatsapp' ? 'whatsapp' : 'website',
          order_reference: orderRef,
          total_price: item.product.price * item.quantity,
          status: 'pending',
          customer_name: customerName,
          customer_whatsapp: formatWhatsAppNumber(customerPhone),
          note: `Address: ${deliveryAddress || 'Pickup Showroom'}. Payment: ${paymentOption === 'cod' ? 'Cash On Delivery' : paymentOption === 'pickup' ? 'Pay at Showroom' : 'WhatsApp Checkout'}. Shipping: ${shippingLabel}`
        };

        const { data, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select();

        if (error) {
          console.error('Error inserting order:', error);
          throw error;
        }

        if (data && data[0]) {
          insertedOrders.push(data[0]);
        }
      }

      // 3. Save order summary to pass to success screen
      const successData = {
        orderReference: orderRef,
        customerName,
        customerPhone,
        shippingLabel,
        deliveryAddress: deliveryAddress || 'Showroom Pickup (Bulawayo)',
        paymentOption,
        totalPrice: total,
        items: cart.map(i => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
          size: i.size,
          color: i.color
        }))
      };

      // 4. Trigger WhatsApp message if "WhatsApp Checkout" option is selected
      if (paymentOption === 'whatsapp') {
        const merchantPhone = formatWhatsAppNumber(shop.whatsapp_number || shop.whatsapp || '263771234567');
        let text = `Yo *${shop.name}*, I just placed order *${orderRef}* on your boutique storefront:\n\n`;
        text += `👤 *Customer Details:*\n`;
        text += `   - Name: ${customerName}\n`;
        text += `   - Phone: ${customerPhone}\n`;
        text += `   - Address: ${deliveryAddress || 'Pickup Showroom'}\n\n`;
        text += `📦 *Ordered Items:*\n`;
        cart.forEach((i, idx) => {
          text += `   [${idx + 1}] ${i.product.name} (Size: ${i.size} | Color: ${i.color || 'None'}) x ${i.quantity} ($${i.product.price} each)\n`;
        });
        text += `\n💵 *Subtotal: $${subtotal} USD*\n`;
        text += `🚚 *Shipping (${shippingLabel}): $${deliveryFee} USD*\n`;
        text += `💰 *Total: $${total} USD*\n\n`;
        text += `Please process instruction details. Thank you!`;

        const waUrl = `https://wa.me/${merchantPhone}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
      }

      // Update parent states
      onSetLastOrder(successData);
      onClearCart();
      toast.success('Boutique Order placed successfully!');
      onNavigateToPage('success');

    } catch (err) {
      console.error(err);
      toast.error('Could not complete order checkout sync');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 px-5 pb-16 select-none text-left">
      {/* Header back */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 bg-neutral-900 border border-neutral-800 rounded-full hover:border-neutral-700 text-white flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C6FF00] font-mono">Boutique Ingress</span>
          <h2 className="font-syne text-xl font-black uppercase tracking-tight text-white leading-tight">Checkout</h2>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="space-y-5">
        {/* ----------------- CUSTOMER DETAILS ----------------- */}
        <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[20px] p-4 space-y-4">
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-550 font-bold block">Contact Coordinates</span>
          
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-mono font-bold tracking-widest text-neutral-400">Your Full Name</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Brian Chidzero"
              className="w-full text-xs bg-neutral-950 border border-neutral-850 rounded-xl focus:border-[#C6FF00] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase font-mono font-bold tracking-widest text-neutral-400">WhatsApp / Phone Number</label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. +263772123456"
              className="w-full text-xs bg-neutral-950 border border-neutral-850 rounded-xl focus:border-[#C6FF00] outline-none"
            />
          </div>
        </div>

        {/* ----------------- DELIVERY DETAILS ----------------- */}
        <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[20px] p-4 space-y-4">
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-550 font-bold block">Shipping Coordinates</span>
          
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-mono font-bold tracking-widest text-neutral-400">Selected Method</label>
            <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl flex items-center justify-between text-neutral-300">
              <span className="text-xs font-bold uppercase">{shippingLabel}</span>
              <span className="text-xs font-mono font-bold">${deliveryFee}.00 USD</span>
            </div>
          </div>

          {shippingMethod !== 'pickup' && (
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-mono font-bold tracking-widest text-neutral-400">Physical Delivery Address</label>
              <textarea
                required
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g. 129 Fife Street, Bulawayo, Zimbabwe"
                className="w-full text-xs bg-neutral-950 border border-neutral-850 rounded-xl focus:border-[#C6FF00] outline-none resize-none p-3"
              />
            </div>
          )}
        </div>

        {/* ----------------- PAYMENT METHOD ----------------- */}
        <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[20px] p-4 space-y-3">
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-550 font-bold block">Payment Method</span>

          <div className="space-y-2">
            {/* WhatsApp Checkout */}
            <div
              onClick={() => setPaymentOption('whatsapp')}
              className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                paymentOption === 'whatsapp'
                  ? 'bg-[#C6FF00]/5 border-[#C6FF00] text-[#C6FF00]'
                  : 'bg-neutral-950 border-neutral-850 hover:border-neutral-700 text-neutral-300'
              }`}
            >
              <MessageCircle className="w-5 h-5 text-emerald-400 fill-current shrink-0" />
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block">WhatsApp Checkout</span>
                <span className="text-[9px] text-neutral-500 font-mono">Send order summary instantly to Merchant WhatsApp</span>
              </div>
            </div>

            {/* Cash on Delivery */}
            {shippingMethod !== 'pickup' && (
              <div
                onClick={() => setPaymentOption('cod')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                  paymentOption === 'cod'
                    ? 'bg-[#C6FF00]/5 border-[#C6FF00] text-[#C6FF00]'
                    : 'bg-neutral-950 border-neutral-850 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider block">Cash On Delivery</span>
                  <span className="text-[9px] text-neutral-500 font-mono">Settle with physical cash upon courier arrival</span>
                </div>
              </div>
            )}

            {/* Showroom Pickup payment */}
            {shippingMethod === 'pickup' && (
              <div
                onClick={() => setPaymentOption('pickup')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                  paymentOption === 'pickup'
                    ? 'bg-[#C6FF00]/5 border-[#C6FF00] text-[#C6FF00]'
                    : 'bg-neutral-950 border-neutral-850 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <Store className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider block">Showroom Pay</span>
                  <span className="text-[9px] text-neutral-500 font-mono">Settle when collecting at Bulawayo Showroom</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ----------------- TOTAL PANEL ----------------- */}
        <div className="bg-neutral-900/60 border border-neutral-800/85 rounded-[24px] p-5 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[9px] uppercase font-mono font-bold text-neutral-400">Total payable</span>
              <h3 className="font-syne text-xl font-black text-[#C6FF00] font-mono leading-none mt-1">${total} USD</h3>
            </div>
            <div className="flex items-center gap-1 text-[8px] uppercase font-bold tracking-widest text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure checkout
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 bg-[#C6FF00] text-black font-black text-xs uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#C6FF00]/10 ${
              submitting ? 'opacity-80 cursor-wait' : 'hover:opacity-95'
            }`}
          >
            {submitting ? 'Constructing Order...' : paymentOption === 'whatsapp' ? 'Checkout on WhatsApp' : 'Place Luxury Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

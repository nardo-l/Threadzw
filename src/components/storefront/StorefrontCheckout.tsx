// src/components/storefront/StorefrontCheckout.tsx
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MessageCircle, CreditCard, ShieldCheck, Store } from 'lucide-react';
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
    if (shippingMethod === 'pickup') return 'Showroom Pickup';
    if (shippingMethod === 'harare') return 'Harare Courier Dispatch ($5)';
    return 'Zimbabwe Express Courier ($7)';
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
      toast.error('Please complete name and phone details');
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
        deliveryAddress: deliveryAddress || 'Showroom Pickup',
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
        let text = `Hi *${shop.name}*, I just placed order *${orderRef}* on your boutique storefront:\n\n`;
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
        text += `Please process details. Thank you!`;

        const waUrl = `https://wa.me/${merchantPhone}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
      }

      // Update parent states
      onSetLastOrder(successData);
      onClearCart();
      toast.success('Order placed successfully!');
      onNavigateToPage('success');

    } catch (err) {
      console.error(err);
      toast.error('Could not complete order checkout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 px-5 pb-24 select-none text-left bg-white min-h-screen pt-4 font-sans">
      {/* Header back */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 bg-zinc-50 border border-zinc-150 rounded-full hover:bg-zinc-100 text-zinc-600 flex items-center justify-center cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 font-sans">Secured Checkout</span>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 leading-none mt-0.5 font-sans">Checkout</h2>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="space-y-5">
        {/* ----------------- CUSTOMER DETAILS ----------------- */}
        <div className="bg-zinc-50 border border-zinc-150 rounded-[20px] p-4 space-y-4 shadow-xs">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Contact Coordinates</span>
          
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Your Full Name</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Brian Chidzero"
              className="w-full text-xs bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none p-3 text-zinc-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">WhatsApp / Phone Number</label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. +263772123456"
              className="w-full text-xs bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none p-3 text-zinc-800"
            />
          </div>
        </div>

        {/* ----------------- DELIVERY DETAILS ----------------- */}
        <div className="bg-zinc-50 border border-zinc-150 rounded-[20px] p-4 space-y-4 shadow-xs">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Shipping Coordinates</span>
          
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Selected Method</label>
            <div className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between text-zinc-750 font-sans">
              <span className="text-xs font-semibold">{shippingLabel}</span>
              <span className="text-xs font-bold">${deliveryFee}.00 USD</span>
            </div>
          </div>

          {shippingMethod !== 'pickup' && (
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Physical Delivery Address</label>
              <textarea
                required
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g. 129 Fife Street, Bulawayo, Zimbabwe"
                className="w-full text-xs bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none resize-none p-3 text-zinc-800 font-sans leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* ----------------- PAYMENT METHOD ----------------- */}
        <div className="bg-zinc-50 border border-zinc-150 rounded-[20px] p-4 space-y-3 shadow-xs">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Payment Method</span>

          <div className="space-y-2">
            {/* WhatsApp Checkout */}
            <div
              onClick={() => setPaymentOption('whatsapp')}
              className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                paymentOption === 'whatsapp'
                  ? 'bg-green-500/5 border-green-500 text-green-700'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600'
              }`}
            >
              <MessageCircle className="w-5 h-5 text-green-600 fill-current shrink-0" />
              <div>
                <span className="text-[11px] font-bold block font-sans">WhatsApp Checkout</span>
                <span className="text-[9px] text-zinc-400 font-sans font-medium">Send summary instantly to merchant WhatsApp</span>
              </div>
            </div>

            {/* Cash on Delivery */}
            {shippingMethod !== 'pickup' && (
              <div
                onClick={() => setPaymentOption('cod')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                  paymentOption === 'cod'
                    ? 'bg-green-500/5 border-green-500 text-green-700'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold block font-sans">Cash On Delivery</span>
                  <span className="text-[9px] text-zinc-400 font-sans font-medium">Settle with cash upon courier arrival</span>
                </div>
              </div>
            )}

            {/* Showroom Pickup payment */}
            {shippingMethod === 'pickup' && (
              <div
                onClick={() => setPaymentOption('pickup')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                  paymentOption === 'pickup'
                    ? 'bg-green-500/5 border-green-500 text-green-700'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                <Store className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold block font-sans">Showroom Pay</span>
                  <span className="text-[9px] text-zinc-400 font-sans font-medium">Settle when collecting at the showroom</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ----------------- TOTAL PANEL ----------------- */}
        <div className="bg-zinc-50 border border-zinc-150 rounded-[20px] p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Total Payable</span>
              <h3 className="text-lg font-bold text-zinc-900 mt-1 font-sans leading-none">${total} USD</h3>
            </div>
            <div className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider text-zinc-400 font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Secure checkout
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs ${
              submitting ? 'opacity-80 cursor-wait' : ''
            }`}
          >
            {submitting ? 'Placing Order...' : paymentOption === 'whatsapp' ? 'Checkout on WhatsApp' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

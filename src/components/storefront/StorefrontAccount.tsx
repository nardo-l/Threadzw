// src/components/storefront/StorefrontAccount.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Heart, ShoppingBag, Clipboard, Save, HelpCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface StorefrontAccountProps {
  shop: any;
  onNavigateToPage: (page: any, params?: any) => void;
  savedAddress: string;
  onSaveAddress: (address: string) => void;
}

export const StorefrontAccount: React.FC<StorefrontAccountProps> = ({
  shop,
  onNavigateToPage,
  savedAddress,
  onSaveAddress
}) => {
  const [phone, setPhone] = useState('');
  const [addressInput, setAddressInput] = useState(savedAddress);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [historicalOrders, setHistoricalOrders] = useState<any[] | null>(null);

  // Load phone from localStorage if they have searched before
  useEffect(() => {
    const storedPhone = localStorage.getItem(`threadzw_customer_phone_${shop.id}`);
    if (storedPhone) {
      setPhone(storedPhone);
      fetchCustomerOrders(storedPhone);
    }
  }, [shop.id]);

  useEffect(() => {
    setAddressInput(savedAddress);
  }, [savedAddress]);

  // Query Supabase for customer orders
  const fetchCustomerOrders = async (phoneQuery: string) => {
    const cleanPhone = phoneQuery.replace(/\D/g, '');
    if (!cleanPhone) return;

    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shop.id)
        .like('customer_whatsapp', `%${cleanPhone}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group orders by reference
      const grouped: Record<string, any> = {};
      (data || []).forEach(o => {
        const ref = o.order_reference;
        if (!grouped[ref]) {
          grouped[ref] = {
            reference: ref,
            created_at: o.created_at,
            status: o.status,
            total: 0,
            items: []
          };
        }
        grouped[ref].total += Number(o.total_price || 0);
        grouped[ref].items.push(o);
      });

      setHistoricalOrders(Object.values(grouped));
      localStorage.setItem(`threadzw_customer_phone_${shop.id}`, cleanPhone);

    } catch (err) {
      console.error(err);
      toast.error('Could not sync customer order logs');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error('Please input phone coordinate');
      return;
    }
    fetchCustomerOrders(phone);
  };

  const handleSaveAddress = () => {
    if (!addressInput.trim()) {
      toast.error('Please input address before saving');
      return;
    }
    onSaveAddress(addressInput);
    toast.success('Physical delivery coordinates preserved!');
  };

  return (
    <div className="space-y-6 px-5 pb-16 select-none text-left">
      <div className="space-y-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C6FF00] font-mono">Customer Ingress</span>
        <h2 className="font-syne text-2xl font-black uppercase tracking-tight text-white">Your Account</h2>
      </div>

      {/* ----------------- SAVED ADDRESS SECTION ----------------- */}
      <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[24px] p-5 space-y-4">
        <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-550 font-bold block flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#C6FF00]" /> Saved Delivery Coordinates
        </span>

        <div className="space-y-2">
          <textarea
            rows={2}
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="Configure your physical delivery address to prefill Checkout..."
            className="w-full text-xs bg-neutral-950 border border-neutral-850 rounded-xl focus:border-[#C6FF00] outline-none resize-none p-3"
          />
          <button
            onClick={handleSaveAddress}
            className="w-full py-3.5 bg-[#C6FF00] text-black text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#C6FF00]/5 hover:opacity-95"
          >
            <Save className="w-4 h-4" /> Save Coordinate Address
          </button>
        </div>
      </div>

      {/* ----------------- WISHLIST ROUTING SHORTCUT ----------------- */}
      <div 
        onClick={() => onNavigateToPage('wishlist')}
        className="p-4 rounded-2xl bg-neutral-900/30 border border-neutral-800/50 hover:border-[#C6FF00]/30 cursor-pointer flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C6FF00]/10 flex items-center justify-center text-[#C6FF00]">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wide text-white">Your Saved Wishlist</h3>
            <span className="text-[9px] uppercase font-mono text-neutral-500">View bookmarked drops</span>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-neutral-500" />
      </div>

      {/* ----------------- SYNC ORDERS SECTION ----------------- */}
      <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[24px] p-5 space-y-4">
        <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-550 font-bold block flex items-center gap-1.5">
          <Clipboard className="w-4 h-4 text-[#C6FF00]" /> Purchase History Logs
        </span>

        <form onSubmit={handlePhoneSubmit} className="flex gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter Phone e.g. 263772..."
            className="flex-grow text-xs bg-neutral-950 border border-neutral-850 rounded-xl focus:border-[#C6FF00] outline-none py-3.5"
          />
          <button
            type="submit"
            className="px-4 bg-neutral-900 border border-neutral-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-neutral-700 cursor-pointer"
          >
            Sync
          </button>
        </form>

        {loadingOrders ? (
          <div className="py-8 text-center text-[10px] font-mono uppercase tracking-widest text-[#C6FF00] animate-pulse">
            Synchronizing Logs...
          </div>
        ) : historicalOrders && historicalOrders.length > 0 ? (
          <div className="space-y-3.5">
            {historicalOrders.map((ord: any, idx: number) => (
              <div 
                key={`hist-ord-${ord.reference}-${idx}`}
                onClick={() => onNavigateToPage('track', { orderRef: ord.reference })}
                className="p-3 bg-neutral-950 border border-neutral-850 hover:border-[#C6FF00]/20 rounded-xl cursor-pointer flex justify-between items-center transition-all"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#C6FF00]">{ord.reference}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 font-mono">
                      {ord.status}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-500 block">
                    {ord.items.map((i: any) => i.product_name).join(', ')}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-white font-mono block">${ord.total} USD</span>
                  <span className="text-[8px] font-mono text-neutral-600 block">
                    {new Date(ord.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : historicalOrders ? (
          <div className="py-8 text-center text-neutral-600 text-xs font-mono uppercase">
            No order logs registered to this phone number
          </div>
        ) : (
          <div className="py-4 text-center text-neutral-600 text-[10px] uppercase font-mono tracking-wider leading-relaxed">
            Provide phone above to fetch historical order records.
          </div>
        )}
      </div>
    </div>
  );
};

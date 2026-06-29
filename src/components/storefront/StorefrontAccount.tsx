// src/components/storefront/StorefrontAccount.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Heart, Clipboard, Save, ArrowRight } from 'lucide-react';
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
      toast.error('Please input phone number');
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
    toast.success('Delivery coordinates saved!');
  };

  return (
    <div className="space-y-6 px-5 pb-24 select-none text-left bg-white min-h-screen pt-4 font-sans">
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 font-sans">Customer Area</span>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">Your Account</h2>
      </div>

      {/* ----------------- SAVED ADDRESS SECTION ----------------- */}
      <div className="bg-zinc-50 border border-zinc-150 rounded-[20px] p-5 space-y-4 shadow-xs">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block flex items-center gap-1.5 font-sans">
          <MapPin className="w-4 h-4 text-green-600" /> Saved Delivery Coordinates
        </span>

        <div className="space-y-2.5 text-left">
          <textarea
            rows={2}
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="Configure your physical delivery address to prefill Checkout..."
            className="w-full text-xs bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none resize-none p-3 text-zinc-800 font-sans leading-relaxed"
          />
          <button
            onClick={handleSaveAddress}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <Save className="w-4 h-4" /> Save Address
          </button>
        </div>
      </div>

      {/* ----------------- WISHLIST ROUTING SHORTCUT ----------------- */}
      <div 
        onClick={() => onNavigateToPage('wishlist')}
        className="p-4 rounded-xl bg-zinc-50 border border-zinc-150 hover:border-green-200 cursor-pointer flex items-center justify-between transition-all shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
            <Heart className="w-4 h-4 fill-green-100" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-bold text-zinc-800 font-sans">Your Saved Wishlist</h3>
            <span className="text-[10px] text-zinc-400 font-sans font-medium">View bookmarked styles</span>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-400" />
      </div>

      {/* ----------------- SYNC ORDERS SECTION ----------------- */}
      <div className="bg-zinc-50 border border-zinc-150 rounded-[20px] p-5 space-y-4 shadow-xs">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block flex items-center gap-1.5 font-sans">
          <Clipboard className="w-4 h-4 text-green-600" /> Purchase History Logs
        </span>

        <form onSubmit={handlePhoneSubmit} className="flex gap-2 text-left">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone e.g. +263..."
            className="flex-grow text-xs bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none p-2.5 text-zinc-800 font-sans"
          />
          <button
            type="submit"
            className="px-4 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-2xs shrink-0"
          >
            Sync
          </button>
        </form>

        {loadingOrders ? (
          <div className="py-8 text-center text-xs font-bold text-green-600 animate-pulse font-sans">
            Synchronizing Logs...
          </div>
        ) : historicalOrders && historicalOrders.length > 0 ? (
          <div className="space-y-3 pt-1">
            {historicalOrders.map((ord: any, idx: number) => (
              <div 
                key={`hist-ord-${ord.reference}-${idx}`}
                onClick={() => onNavigateToPage('track', { orderRef: ord.reference })}
                className="p-3 bg-white border border-zinc-150 hover:border-green-200 rounded-xl cursor-pointer flex justify-between items-center transition-all shadow-2xs text-left"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-800">{ord.reference}</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-sans">
                      {ord.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block font-sans truncate max-w-[180px]">
                    {ord.items.map((i: any) => i.product_name).join(', ')}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-zinc-900 block font-sans">${ord.total} USD</span>
                  <span className="text-[9px] text-zinc-400 block font-sans font-medium">
                    {new Date(ord.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : historicalOrders ? (
          <div className="py-8 text-center text-zinc-400 text-xs font-semibold font-sans">
            No orders registered to this phone number
          </div>
        ) : (
          <div className="py-4 text-center text-zinc-400 text-[11px] leading-relaxed font-sans font-medium">
            Provide phone above to fetch historical order records.
          </div>
        )}
      </div>
    </div>
  );
};

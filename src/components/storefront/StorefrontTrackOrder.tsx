// src/components/storefront/StorefrontTrackOrder.tsx
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Loader2, HelpCircle, Package, MapPin, Truck, CheckCircle2, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface StorefrontTrackOrderProps {
  shop: any;
  onNavigateToPage: (page: any) => void;
  initialOrderRef?: string;
}

export const StorefrontTrackOrder: React.FC<StorefrontTrackOrderProps> = ({
  shop,
  onNavigateToPage,
  initialOrderRef = ''
}) => {
  const [orderRef, setOrderRef] = useState(initialOrderRef);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderResults, setOrderResults] = useState<any[] | null>(null);

  // Status mapping
  // Status: 'pending', 'confirmed', 'shipped', 'delivered'
  const milestones = [
    { value: 'pending', label: 'Order Pending', desc: 'Awaiting showroom agent confirmation.', icon: Package },
    { value: 'confirmed', label: 'Confirmed', desc: 'Boutique agents have validated and packed your drops.', icon: MapPin },
    { value: 'shipped', label: 'Shipped / Dispatched', desc: 'Apparel package dispatched with certified courier logistics.', icon: Truck },
    { value: 'delivered', label: 'Delivered', desc: 'Successfully collected or dropped at physical coordinates.', icon: CheckCircle2 }
  ];

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderRef.trim()) {
      toast.error('Please specify order reference code');
      return;
    }

    setLoading(true);
    setOrderResults(null);

    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shop.id)
        .eq('order_reference', orderRef.trim());

      // If phone is provided, let's filter by phone too
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone) {
        // Query matching with WhatsApp phone numbers
        query = query.like('customer_whatsapp', `%${cleanPhone}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('No matching boutique orders found. Check your reference code.');
        setOrderResults([]);
      } else {
        setOrderResults(data);
        toast.success('Boutique order status synchronized!');
      }

    } catch (err) {
      console.error(err);
      toast.error('Logistics server synchronization error');
    } finally {
      setLoading(false);
    }
  };

  // Compute Active Step index
  const activeStepIdx = useMemo(() => {
    if (!orderResults || orderResults.length === 0) return -1;
    // Get status of the first item
    const status = orderResults[0].status || 'pending';
    
    if (status === 'pending') return 0;
    if (status === 'confirmed') return 1;
    if (status === 'shipped') return 2;
    if (status === 'delivered') return 3;
    return 0;
  }, [orderResults]);

  const handleContactHelp = () => {
    const wa = (shop.whatsapp || shop.whatsapp_number || '+263771234567').replace(/\D/g, '');
    const textMsg = `Hi ${shop.name}, I need assistance tracking my order details. Reference code: ${orderRef || 'Not Specified'}`;
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(textMsg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 px-5 pb-16 select-none text-left">
      <div className="space-y-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C6FF00] font-mono">Boutique Logistics</span>
        <h2 className="font-syne text-2xl font-black uppercase tracking-tight text-white">Track Order</h2>
      </div>

      {/* ----------------- TRACK SEARCH FORM ----------------- */}
      <form onSubmit={handleTrack} className="bg-neutral-900/40 border border-neutral-800/60 rounded-[24px] p-5 space-y-4 shadow-md">
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-mono font-bold tracking-widest text-neutral-400">Order Reference Number</label>
          <input
            type="text"
            required
            value={orderRef}
            onChange={(e) => setOrderRef(e.target.value)}
            placeholder="e.g. #CAP-1829"
            className="w-full text-xs font-bold uppercase font-mono bg-neutral-950 border border-neutral-850 rounded-xl focus:border-[#C6FF00] outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] uppercase font-mono font-bold tracking-widest text-neutral-400">WhatsApp Phone (Optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +263772123456"
            className="w-full text-xs bg-neutral-950 border border-neutral-850 rounded-xl focus:border-[#C6FF00] outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#C6FF00] text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#C6FF00]/5 hover:opacity-95"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Retrieving Coordinates...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" /> Sync Logistics Status
            </>
          )}
        </button>
      </form>

      {/* ----------------- STEPS TRACKER DISPLAY ----------------- */}
      {orderResults && orderResults.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="border-b border-neutral-900 pb-3">
            <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-500 font-bold block">Current Coordinates</span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="font-mono text-sm font-black text-white">{orderResults[0].order_reference}</span>
              <span className="text-[10px] text-neutral-400">Total Charged: <strong className="text-[#C6FF00] font-mono">${orderResults.reduce((acc, o) => acc + Number(o.total_price || 0), 0)} USD</strong></span>
            </div>
            {orderResults[0].note && (
              <p className="text-[10px] text-neutral-500 font-medium leading-relaxed mt-2 italic bg-neutral-900/30 p-2.5 rounded-lg border border-neutral-850">
                {orderResults[0].note}
              </p>
            )}
          </div>

          {/* MILISTONE STEPPER */}
          <div className="relative pl-8 space-y-8 pb-4">
            {/* Vertical connector line */}
            <div className="absolute left-[13px] top-3 bottom-3 w-[2px] bg-neutral-850" />

            {/* Glowing filled bar indicator */}
            <div 
              className="absolute left-[13px] top-3 w-[2px] bg-[#C6FF00] transition-all duration-1000" 
              style={{ height: `${(activeStepIdx / 3) * 100}%`, maxHeight: '100%' }}
            />

            {milestones.map((step, idx) => {
              const isPast = activeStepIdx >= idx;
              const isCurrent = activeStepIdx === idx;
              const IconComp = step.icon;

              return (
                <div key={idx} className="relative flex gap-4 text-left">
                  {/* Circle dot marker */}
                  <div 
                    className={`absolute -left-[27px] w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-500 ${
                      isPast 
                        ? 'bg-[#000] border-[#C6FF00] text-[#C6FF00] shadow-lg shadow-[#C6FF00]/10' 
                        : 'bg-[#111] border-neutral-800 text-neutral-600'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isCurrent ? 'animate-pulse text-[#C6FF00]' : ''}`} />
                  </div>

                  <div className="space-y-0.5">
                    <h4 className={`text-xs uppercase font-extrabold tracking-wider ${
                      isPast ? 'text-white' : 'text-neutral-500'
                    }`}>
                      {step.label}
                    </h4>
                    <p className={`text-[10.5px] leading-relaxed ${
                      isCurrent ? 'text-neutral-300' : 'text-neutral-500'
                    }`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Need help footer button */}
          <button
            onClick={handleContactHelp}
            className="w-full py-3.5 bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs font-extrabold uppercase tracking-widest rounded-xl hover:border-neutral-700 flex items-center justify-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#C6FF00]" /> Need Logistics Assistance?
          </button>
        </div>
      )}

      {/* Blank Empty Search results */}
      {orderResults === null && (
        <div className="py-12 text-center text-neutral-600 space-y-3.5">
          <HelpCircle className="w-12 h-12 mx-auto text-neutral-800 opacity-80" />
          <p className="text-xs font-mono uppercase tracking-widest">Awaiting Logistics Reference input</p>
        </div>
      )}
    </div>
  );
};

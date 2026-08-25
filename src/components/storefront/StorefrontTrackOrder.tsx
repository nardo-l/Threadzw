// src/components/storefront/StorefrontTrackOrder.tsx
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Loader2, HelpCircle, Package, MapPin, Truck, CheckCircle2 } from 'lucide-react';
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

  // Status mapping: 'pending', 'confirmed', 'shipped', 'delivered'
  const milestones = [
    { value: 'pending', label: 'Order Pending', desc: 'Awaiting shop agent confirmation.', icon: Package },
    { value: 'confirmed', label: 'Confirmed', desc: 'Boutique agents have validated and packed your items.', icon: MapPin },
    { value: 'shipped', label: 'Shipped / Dispatched', desc: 'Package dispatched with courier logistics.', icon: Truck },
    { value: 'delivered', label: 'Delivered', desc: 'Successfully collected or dropped at delivery coordinates.', icon: CheckCircle2 }
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
      // Threadzw does not create order records. Shops confirm delivery or collection directly on WhatsApp.
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone) localStorage.setItem(`threadzw_customer_phone_${shop.id}`, cleanPhone);
      setOrderResults([]);
      toast.info('Opening WhatsApp so the shop can confirm your order directly.');
      handleContactHelp();
    } finally {
      setLoading(false);
    }
  };

  // Compute Active Step index
  const activeStepIdx = useMemo(() => {
    if (!orderResults || orderResults.length === 0) return -1;
    const status = orderResults[0].status || 'pending';
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('visit') || lowerStatus.includes('merchant') || lowerStatus === 'pending') return 0;
    if (lowerStatus === 'confirmed') return 1;
    if (lowerStatus === 'shipped' || lowerStatus === 'processing') return 2;
    if (lowerStatus === 'completed' || lowerStatus === 'delivered') return 3;
    return 0;
  }, [orderResults]);

  const handleContactHelp = () => {
    const wa = (shop.whatsapp_number || shop.whatsapp || '+263771234567').replace(/\D/g, '');
    const textMsg = `Hi ${shop.name}, I need assistance tracking my order. Reference code: ${orderRef || 'Not Specified'}`;
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(textMsg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 px-5 pb-24 select-none text-left bg-white min-h-screen pt-4 font-sans">
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider store-accent-text font-sans">Track Shipments</span>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">Order Support</h2>
      </div>

      {/* ----------------- TRACK SEARCH FORM ----------------- */}
      <form onSubmit={handleTrack} className="bg-zinc-50 border border-zinc-150 rounded-[20px] p-5 space-y-4 shadow-xs">
        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Order Reference Number</label>
          <input
            type="text"
            required
            value={orderRef}
            onChange={(e) => setOrderRef(e.target.value)}
            placeholder="e.g. #CAP-1829"
            className="w-full text-xs font-bold uppercase font-mono bg-white border border-zinc-200 rounded-xl focus:ring-2 store-accent-ring outline-none p-3 text-zinc-800"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">WhatsApp Phone (Optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +263772123456"
            className="w-full text-xs bg-white border border-zinc-200 rounded-xl focus:ring-2 store-accent-ring outline-none p-3 text-zinc-800"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 store-accent-bg  text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Synchronizing...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" /> Sync Status
            </>
          )}
        </button>
      </form>

      {/* ----------------- STEPS TRACKER DISPLAY ----------------- */}
      {orderResults && orderResults.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="border-b border-zinc-100 pb-3">
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Shop confirmation via WhatsApp</span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="font-mono text-sm font-bold text-zinc-900">{orderResults[0].order_reference}</span>
              <span className="text-[11px] text-zinc-500 font-medium">Total: <strong className="text-zinc-900 font-bold font-mono">${orderResults.reduce((acc, o) => acc + Number(o.total_price || 0), 0)} USD</strong></span>
            </div>
            {orderResults[0].note && (
              <p className="text-[11px] text-zinc-600 leading-relaxed mt-2.5 italic bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                "{orderResults[0].note}"
              </p>
            )}
          </div>

          {/* MILESTONE STEPPER */}
          <div className="relative pl-8 space-y-8 pb-4">
            {/* Vertical connector line */}
            <div className="absolute left-[13px] top-3 bottom-3 w-[2px] bg-zinc-100" />

            {/* Glowing filled bar indicator */}
            <div 
              className="absolute left-[13px] top-3 w-[2px] store-accent-bg transition-all duration-1000"
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
                    className={`absolute -left-[27px] w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      isPast 
                        ? 'store-accent-bg store-accent-border text-white shadow-md shadow-store-accent'
                        : 'bg-white border-zinc-200 text-zinc-400'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isCurrent ? 'animate-pulse' : ''}`} />
                  </div>

                  <div className="space-y-0.5">
                    <h4 className={`text-xs font-bold ${
                      isPast ? 'text-zinc-900' : 'text-zinc-400'
                    }`}>
                      {step.label}
                    </h4>
                    <p className={`text-[11px] leading-relaxed ${
                      isCurrent ? 'text-zinc-700 font-medium' : 'text-zinc-400'
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
            className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            Need Assistance?
          </button>
        </div>
      )}

      {/* Blank Empty Search results */}
      {orderResults === null && (
        <div className="py-20 text-center text-zinc-300 space-y-3.5">
          <HelpCircle className="w-12 h-12 mx-auto text-zinc-200" />
          <p className="text-xs font-semibold tracking-wide text-zinc-400">Awaiting tracking reference input</p>
        </div>
      )}
    </div>
  );
};

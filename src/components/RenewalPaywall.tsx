// THREADZW PRICING: $5/month | 3-day trial — do not change without updating all instances
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Check, X, CreditCard, Clock, Loader2 } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { toast } from 'sonner';

export const RenewalPaywall: React.FC = () => {
  const { shop, setShowRenewalPaywall } = useSubscription();
  const { renewalDate } = useSubscriptionStatus();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRenew = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsProcessing(false);
    setShowRenewalPaywall(false);
    toast.info('Please follow the payment instructions in the Shop Centre.');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col overflow-y-auto no-scrollbar">
      {/* Top Section */}
      <div className="p-8 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 bg-[#f59e0b1a] rounded-2xl flex items-center justify-center text-[#f59e0b] mb-2">
          <AlertTriangle size={32} />
        </div>
        
        <h1 className="text-3xl font-bold text-white leading-tight">Your subscription<br />has expired</h1>
        <div className="px-4 py-1 bg-[#f59e0b1a] rounded-full mt-2">
          <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-widest">Ended {renewalDate || 'Recently'}</span>
        </div>
        
        <div className="flex flex-col gap-1 mt-4">
          <p className="text-sm text-white font-medium">{shop?.name} is currently paused.</p>
          <p className="text-sm text-[#888]">Renew your plan to bring your shop back online.</p>
        </div>
      </div>

      <div className="h-[3px] w-full bg-linear-to-r from-[#9B27AF] to-[#FF2D78]" />

      {/* What's Paused Card */}
      <div className="p-6">
        <div className="bg-[#111] rounded-[20px] border-l-4 border-[#ef4444] p-6 flex flex-col gap-4">
          <span className="text-[10px] font-bold text-[#ef4444] uppercase tracking-widest">While paused:</span>
          <ul className="flex flex-col gap-3">
            {[
              "Your products are hidden from the feed",
              "Buyers cannot find your shop",
              "New enquiries are disabled"
            ].map((text, i) => (
              <li key={`expired-note-${i}`} className="flex items-center gap-3 text-sm text-[#888]">
                <X size={16} className="text-[#ef4444]" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Plan Card */}
      <div className="px-6 flex flex-col gap-4 pb-12">
        <div 
          onClick={() => setShowConfirm(true)}
          className="bg-[#111] rounded-[24px] p-8 border border-[#FF2D78] shadow-[0_0_30px_#FF2D781A] transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-[#FF2D78] uppercase tracking-[0.2em] mb-1">Thread ZW Shop</span>
              <h3 className="text-[20px] font-black text-white">Unlimited Products</h3>
            </div>
            <div className="text-right">
              <span className="text-[28px] font-black text-white leading-none">$5</span>
              <span className="text-[12px] text-[#666] block">monthly</span>
            </div>
          </div>
          
          <div className="space-y-3 mb-8">
            {[
              "Active in global feed",
              "Unlimited product listings",
              "Direct WhatsApp connection",
              "Verified shop badge"
            ].map((feature, i) => (
              <div key={`plan-feature-${i}`} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF2D78] flex items-center justify-center">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-sm text-white font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
            className="w-full h-[60px] bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white font-bold rounded-[10px] shadow-xl flex items-center justify-center gap-2 group-active:scale-[0.98] transition-transform"
          >
            Renew Now →
          </button>
        </div>

        {/* Reassurance */}
        <div className="bg-[#111] rounded-[16px] border border-[#f59e0b1a] p-4 flex items-start gap-4">
          <div className="p-2 bg-[#f59e0b40] rounded-lg text-[#f59e0b]"><Clock size={16} /></div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-widest">No data lost</span>
            <p className="text-xs text-[#888] leading-relaxed">All products and shop details are saved and will go live immediately on renewal.</p>
          </div>
        </div>
      </div>

      {/* Confirm Payment Sheet */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[10001] bg-[#111] rounded-t-[32px] p-8 flex flex-col gap-6 max-w-[430px] mx-auto border-t border-[#222]"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full self-center" />
              <h3 className="text-2xl font-bold text-white">Confirm Renewal</h3>
              
              <div className="bg-[#1a1a1a] p-6 rounded-[20px] border border-white/5 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-[#888] uppercase tracking-widest">Plan</span>
                  <span className="text-sm font-bold text-white uppercase tracking-tight">Thread ZW Shop</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-[#888] uppercase tracking-widest">Monthly Amount</span>
                  <span className="text-[24px] font-black text-[#FF2D78]">$5.00</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-white font-bold">
                  <CreditCard size={18} className="text-[#FF2D78]" />
                  <span className="text-[15px]">EcoCash or InnBucks</span>
                </div>
                <p className="text-[12px] text-[#888] leading-relaxed">You will be redirected to the Shop Centre instructions to send your $5 verification payment.</p>
              </div>

              <button 
                onClick={handleRenew}
                disabled={isProcessing}
                className="w-full h-15 bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white font-black rounded-[10px] shadow-xl flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>Continue to Shop Centre →</>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Rocket, Lock, CreditCard } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UpgradeSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeSheet: React.FC<UpgradeSheetProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { shop, renewSubscription } = useSubscription();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    
    // Mock Paynow processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const amount = billing === 'monthly' ? 6 : 18;
    const { error } = await renewSubscription({
      plan: 'full',
      billingCycle: billing,
      amountPaid: amount,
      paynowReference: `TZW-UPGRADE-${Date.now()}`,
    });

    setIsProcessing(false);
    if (!error) {
      onClose();
      toast.success('Upgraded to Full Shop! 🚀 Add unlimited products now.');
      navigate('/new-listing');
    } else {
      toast.error('Upgrade failed. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 z-[1001] bg-card rounded-t-card p-8 flex flex-col gap-6 max-w-[430px] mx-auto overflow-y-auto no-scrollbar max-h-[90vh]"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full self-center" />
            
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-syne font-bold text-white flex items-center gap-2">
                  <Rocket className="text-primary" size={24} /> Launch Your Store
                </h3>
                <span className="text-[10px] font-mono text-amber uppercase tracking-widest">Trial Limit: 3 products max</span>
              </div>
              <button onClick={onClose} className="text-muted p-1 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Current Usage Card */}
            <div className="bg-elevated p-4 rounded-xl border-l-4 border-amber flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-amber uppercase tracking-widest font-bold">3 / 3 trial products used</span>
                <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Limit reached</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="w-full h-full gradient-pink-purple" />
              </div>
              <p className="text-xs text-muted leading-relaxed">Activate your full shop subscription to list unlimited products and appear in the feed.</p>
            </div>

            {/* Features List */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-mono text-primary uppercase tracking-widest">Activate your shop to get:</span>
              <ul className="flex flex-col gap-3">
                {[
                  "Unlimited product listings",
                  "Verified Badge on your profile",
                  "Featured on the feed for 5 days",
                  "Full dashboard analytics",
                  "Smart restock notifications"
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white">
                    <div className="p-0.5 bg-primary/10 rounded-full text-primary">
                      <Check size={14} />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Billing */}
            <div className="flex flex-col gap-6">
              <div className="bg-elevated p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-syne font-bold text-white">
                    $6/month
                  </span>
                  <span className="text-[10px] font-mono text-primary uppercase tracking-widest">
                    Thread ZW Shop
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <CreditCard size={14} />
                  <span className="text-[10px] font-mono uppercase tracking-widest">Pay via EcoCash / Paynow</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className="w-full py-4 gradient-pink-purple text-white font-syne font-bold rounded-pill shadow-xl flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Activate Full Shop →</>
                  )}
                </button>
                <button 
                  onClick={onClose}
                  className="text-xs font-mono text-muted uppercase tracking-widest text-center hover:text-white transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

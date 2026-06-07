import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  ChevronRight, 
  CreditCard, 
  AlertCircle, 
  X, 
  Rocket, 
  ShieldCheck,
  Clock,
  History,
  Trash2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useInventory } from '../context/InventoryContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { 
    subscription, 
    shop, 
    daysRemaining, 
    cancelSubscription, 
    renewSubscription,
    fetchShopAndSubscription
  } = useSubscription();

  const {
    isActive,
    isCancelled,
    isExpired,
    isExpiringSoon,
    renewalDate,
    isMonthly
  } = useSubscriptionStatus();
  
  const [history, setHistory] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!shop) return;
      
      const { data: payments } = await supabase
        .from('payment_records')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

      const { data: legacySubs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });
      
      const combinedHistory = [
        ...(payments || []).map(p => ({
          id: p.id,
          created_at: p.created_at,
          amount_paid: Number(p.amount) || 7.00,
          status: p.status === 'completed' ? 'Paid' : p.status,
          type: 'Payment Record'
        })),
        ...(legacySubs || []).map(s => ({
          id: s.id,
          created_at: s.created_at,
          amount_paid: Number(s.amount_paid) || 5.00,
          status: s.status === 'expired' ? 'Expired' : 'Paid',
          type: 'Subscription Log'
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setHistory(combinedHistory);
    };
    fetchHistory();
  }, [shop]);

  const handleRenew = async () => {
    setIsProcessing(true);
    // Mock Delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsProcessing(false);
    navigate('/paywall'); // Go to paywall to see payment instructions
  };

  const onCancel = async () => {
    setIsProcessing(true);
    const { error } = await cancelSubscription();
    setIsProcessing(false);
    if (!error) {
      setConfirmCancelOpen(false);
      toast.error('Subscription cancelled', {
        description: `Your shop stays live until ${renewalDate}`
      });
    } else {
      toast.error('Cancellation failed');
    }
  };

  const handleReactivate = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const { error } = await renewSubscription({
      plan: 'shop',
      billingCycle: 'monthly',
      amountPaid: 9,
      paynowReference: `TZW-REACTIVATE-${Date.now()}`,
    });

    setIsProcessing(false);
    if (!error) {
      toast.success('Subscription reactivated! ✓');
    } else {
      toast.error('Reactivation failed');
    }
  };

  if (!subscription || !shop) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-6 text-center">
        <h2 className="text-xl font-syne font-bold text-white mb-2">No active subscription</h2>
        <p className="text-sm text-muted mb-8">Launch your shop to manage your subscription.</p>
        <button onClick={() => navigate('/paywall')} className="px-8 py-4 bg-primary text-white font-bold rounded-pill">
          Launch Shop
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-[430px] mx-auto pb-12">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md p-6 flex items-center">
        <button onClick={() => navigate(-1)} className="text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-xl font-pacifico text-white mr-6">Subscription</h1>
      </header>

      <main className="flex flex-col p-6 gap-8">
        {/* Current Plan Card */}
        <div className="bg-card rounded-card border border-white/5 overflow-hidden flex flex-col">
          <div className="p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-syne font-bold text-white">Thread ZW Shop</h2>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase tracking-widest ${
                    isActive ? 'bg-green/10 text-green' : 
                    isCancelled ? 'bg-red/10 text-red' : 'bg-amber/10 text-amber'
                  }`}>
                    {subscription.status}
                  </div>
                </div>
              </div>
              <div className="text-3xl text-[#C6FF00]">⚡</div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-syne font-bold text-primary">
                $7
              </span>
              <span className="text-[10px] font-mono text-muted uppercase">
                /month
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{isCancelled ? 'Expires on:' : 'Next renewal:'}</span>
                <span className="text-sm font-syne text-white">{renewalDate}</span>
              </div>
              <div className="flex justify-end">
                <div className="px-2 py-0.5 bg-amber/10 rounded-full">
                  <span className="text-[10px] font-mono text-amber font-bold">{daysRemaining} days remaining</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/5 w-full my-2" />

            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Member since:</span>
              <span className="text-xs font-mono text-white">{new Date(subscription.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Plan Features */}
          <div className="bg-elevated p-6 flex flex-col gap-4">
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">Your privileges</span>
            <ul className="flex flex-col gap-3">
              {[
                "Unlimited product listings",
                "Featured on the feed",
                "Full dashboard analytics",
                "Direct WhatsApp connection",
                "Priority seller support"
              ].map((f, i) => (
                <li key={`sub-feature-${i}`} className="flex items-center gap-3 text-sm text-light font-sans font-light">
                  <Check size={16} className="text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Billing History */}
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest px-2">Payment History</span>
          <div className="bg-card rounded-card border border-white/5 overflow-hidden">
            {history.length > 0 ? history.map((inv, i) => (
              <div key={inv.id} className={`p-4 flex items-center justify-between ${i !== history.length - 1 ? 'border-b border-white/5' : ''}`}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-muted">{new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="text-xs text-white">{inv.type === 'Payment Record' ? 'Invoice Payment' : 'Legacy Plan'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-syne font-bold text-primary">${inv.amount_paid?.toFixed(2)}</span>
                  <div className={`px-2 py-0.5 rounded-full ${
                    inv.status?.toLowerCase() === 'paid' || inv.status?.toLowerCase() === 'completed'
                      ? 'bg-green/10 text-green'
                      : 'bg-amber/10 text-amber'
                  }`}>
                    <span className="text-[8px] font-mono font-bold uppercase tracking-widest block">
                      {inv.status}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-muted italic text-[13px]">
                No payment history yet
              </div>
            )}
          </div>
        </div>

        {/* Reactivate Banner */}
        {isCancelled ? (
          <div className="bg-amber/10 border-l-[3px] border-amber rounded-card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber" size={24} />
              <div className="flex flex-col">
                <h3 className="text-base font-syne font-bold text-amber">Your subscription is cancelled</h3>
                <p className="text-xs text-muted">Your shop will go offline on {renewalDate}</p>
              </div>
            </div>
            <button 
              onClick={handleReactivate}
              disabled={isProcessing}
              className="w-full h-12 bg-amber text-black font-bold uppercase text-[12px] tracking-widest rounded-pill flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={16} /> : 'Reactivate Now'}
            </button>
          </div>
        ) : (
          <button 
             onClick={() => setConfirmCancelOpen(true)}
             className="w-full h-14 bg-white/5 border border-white/10 text-red text-[12px] font-bold uppercase tracking-widest rounded-pill"
          >
            Cancel Subscription
          </button>
        )}
      </main>

      {/* Confirmation Sheets (Cancel) */}
      <AnimatePresence>
        {confirmCancelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmCancelOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-card rounded-t-card p-8 flex flex-col gap-6 max-w-[430px] mx-auto"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full self-center" />
              <h3 className="text-2xl font-syne font-bold text-white">Cancel your subscription?</h3>
              
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted">{shop.name} will stay live until {renewalDate}.</p>
                <p className="text-sm text-muted">After that your products will be hidden from the feed.</p>
              </div>

              <div className="bg-red/5 border border-red/10 rounded-xl p-4 flex flex-col gap-3">
                <span className="text-[10px] font-mono text-red uppercase tracking-widest">What you'll lose:</span>
                <ul className="flex flex-col gap-2">
                  <li className="text-xs text-muted flex items-center gap-2">
                    <X size={14} className="text-red" /> Products hidden from feed
                  </li>
                  <li className="text-xs text-muted flex items-center gap-2">
                    <X size={14} className="text-red" /> No direct WhatsApp enquiries
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setConfirmCancelOpen(false)}
                  className="w-full py-4 bg-primary text-white font-syne font-bold rounded-pill shadow-xl"
                >
                  Keep My Subscription
                </button>
                <button 
                  onClick={onCancel}
                  className="text-xs font-mono text-red uppercase tracking-widest text-center font-bold"
                >
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

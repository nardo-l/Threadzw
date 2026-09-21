import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, ExternalLink, Loader2, RefreshCw, Shirt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../hooks/useShop';
import { toast } from 'sonner';
import { subscriptionClient, THREADZW_NARDOPAY_MONTHLY_LINK, THREADZW_PREMIUM_PRICE, SubscriptionStatusResponse } from '../services/subscriptionClient';

export const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shop, refreshShop, loading: shopLoading } = useShop();
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const loadStatus = async () => {
    if (!user || !shop?.id) return;
    setLoading(true);
    try { setStatus(await subscriptionClient.getStatus(shop.id)); }
    catch (error: any) { console.warn('[SUBSCRIPTION] status:', error?.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user && shop?.id) loadStatus(); }, [user?.id, shop?.id]);

  const pro = status ? status.plan === 'premium' : shop?.plan === 'premium' || shop?.plan === 'pro';
  const pending = status?.paymentVerificationStatus === 'pending' || status?.status === 'pending' || shop?.account_status === 'pending_payment';

  const startPayment = async () => {
    if (!shop?.id) return toast.error('Shop details could not be loaded.');
    setPaying(true);
    window.location.assign(THREADZW_NARDOPAY_MONTHLY_LINK);
  };


  const refresh = async () => { await refreshShop(); await loadStatus(); };

  if (loading || shopLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8 font-sans">
      <div className="w-full max-w-xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-xs font-bold text-zinc-600 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200 text-zinc-800 text-[10px] font-bold tracking-wider mb-2"><Shirt size={12} /> CLOTHING MERCHANT</div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Make your shop live.</h1>
          <p className="text-sm text-zinc-500 mt-2">One payment. No monthly renewal.</p>
        </div>

        {trialActive && status?.trialEndsAt && <div className="bg-[#fff0e3] border border-orange-200 rounded-3xl p-5 mb-5"><div className="flex gap-3"><Clock className="text-[#F05A00] shrink-0" size={20} /><div><h2 className="text-sm font-black text-zinc-950">NARDO PROMO · PRO FREE FOR 30 DAYS</h2><p className="text-xs text-zinc-600 mt-1 leading-relaxed">Your Pro trial ends on <strong>{new Date(status.trialEndsAt).toLocaleDateString()}</strong>. No payment is required during the trial. After it expires, your shop returns to the unpaid state until you pay the normal $9 once-off price.</p></div></div></div>}

        {pending && !pro && <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-5"><div className="flex gap-3"><Clock className="text-amber-600 shrink-0" size={20} /><div><h2 className="text-sm font-black text-amber-950">PAYMENT AWAITING APPROVAL</h2><p className="text-xs text-amber-800 mt-1 leading-relaxed">Your shop is pending payment verification. The ThreadZW team will activate Pro after approval.</p><button onClick={refresh} className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-600 text-white text-[11px] font-bold"><RefreshCw size={13} /> Refresh status</button></div></div></div>}

          <div className="mt-6 pt-5 border-t border-zinc-800 space-y-3 text-sm font-semibold text-zinc-200">{['Unlimited products during Pro access','Your shop can be live','Premium storefront tools','Storefront analytics','No monthly renewal after paid activation'].map(feature => <div key={feature} className="flex gap-2"><Check size={16} className="text-[#C6FF00] shrink-0" /> {feature}</div>)}</div>
          {!pro && !pending && <button onClick={startPayment} disabled={paying} className="w-full mt-7 py-4 rounded-2xl bg-[#C6FF00] text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2">{paying ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />} Pay $9 once-off</button>}
          {pending && !pro && <div className="mt-7 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-center text-sm font-bold text-amber-200">Payment submitted — awaiting admin approval</div>}
          {pro && <div className="mt-7 p-4 rounded-2xl bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-center text-sm font-black text-[#C6FF00]">PREMIUM ACTIVE</div>}
        </div>
        <p className="text-center text-[11px] text-zinc-500 mt-5">ThreadZW Free includes up to 9 products with no time limit. Pay $9 once-off to unlock unlimited products.</p>
      </div>
    </div>
  );
};

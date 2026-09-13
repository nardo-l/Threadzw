import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, ExternalLink, Loader2, RefreshCw, Shirt } from 'lucide-react';
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

  const pro = shop?.plan === 'premium' || shop?.plan === 'pro';
  const pending = status?.paymentVerificationStatus === 'pending' || status?.status === 'pending' || shop?.account_status === 'pending_payment';

  const loadStatus = async () => {
    if (!user || !shop?.id) return;
    setLoading(true);
    try { setStatus(await subscriptionClient.getStatus(shop.id)); }
    catch (error: any) { console.warn('[SUBSCRIPTION] status:', error?.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user && shop?.id) loadStatus(); }, [user, shop?.id]);

  const startPayment = async () => {
    if (!shop?.id) return toast.error('Shop details could not be loaded.');
    setPaying(true);
    try {
      const result = await subscriptionClient.createPaymentLink(shop.id);
      await refreshShop();
      toast.info('Your shop is now pending payment. You can add up to 9 products while payment is checked.');
      window.location.assign(result.url || THREADZW_NARDOPAY_MONTHLY_LINK);
    } catch (error: any) {
      toast.error(error?.message || 'Could not start payment');
      setPaying(false);
    }
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

        {pending && !pro && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-5">
            <div className="flex gap-3"><Clock className="text-amber-600 shrink-0" size={20} /><div>
              <h2 className="text-sm font-black text-amber-950">PAYMENT AWAITING APPROVAL</h2>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">Your shop is pending payment verification. You can add up to <strong>9 products</strong> while the ThreadZW team checks your NardoPay payment.</p>
              <button onClick={refresh} className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-600 text-white text-[11px] font-bold"><RefreshCw size={13} /> Refresh status</button>
            </div></div>
          </div>
        )}

        <div className="bg-zinc-950 text-white p-7 rounded-3xl border border-zinc-800 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div><span className="text-[10px] font-black uppercase bg-[#C6FF00] text-zinc-900 px-3 py-1 rounded-full">Lifetime</span><h2 className="text-2xl font-black uppercase mt-3">ThreadZW Premium</h2></div>
            <div className="text-right"><span className="text-3xl font-black text-[#C6FF00]">${THREADZW_PREMIUM_PRICE}</span><span className="block text-xs text-zinc-400">once-off</span></div>
          </div>
          <div className="mt-6 pt-5 border-t border-zinc-800 space-y-3 text-sm font-semibold text-zinc-200">
            {['Unlimited products', 'Your shop becomes live after approval', 'No monthly renewal', 'Premium storefront tools', 'Storefront analytics'].map(feature => <div key={feature} className="flex gap-2"><Check size={16} className="text-[#C6FF00] shrink-0" /> {feature}</div>)}
          </div>
          {!pro && !pending && <button onClick={startPayment} disabled={paying} className="w-full mt-7 py-4 rounded-2xl bg-[#C6FF00] text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2">{paying ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />} Subscribe — $9 once-off</button>}
          {pending && !pro && <div className="mt-7 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-center text-sm font-bold text-amber-200">Payment submitted — awaiting admin approval</div>}
          {pro && <div className="mt-7 p-4 rounded-2xl bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-center text-sm font-black text-[#C6FF00]">PREMIUM ACTIVE</div>}
        </div>

        <p className="text-center text-[11px] text-zinc-500 mt-5">Payments are processed securely by NardoPay. ThreadZW activates Premium after the payment is approved.</p>
      </div>
    </div>
  );
};

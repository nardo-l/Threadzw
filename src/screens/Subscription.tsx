import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock, ExternalLink, Loader2, RefreshCw, Shirt, TicketPercent } from 'lucide-react';
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
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const loadStatus = async () => {
    if (!user || !shop?.id) return;
    setLoading(true);
    try { setStatus(await subscriptionClient.getStatus(shop.id)); }
    catch (error: any) { console.warn('[SUBSCRIPTION] status:', error?.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user && shop?.id) loadStatus(); }, [user?.id, shop?.id]);

  const trialActive = status?.status === 'trial' && !!status.trialEndsAt && new Date(status.trialEndsAt).getTime() > Date.now();
  const pro = status ? status.plan === 'premium' : shop?.plan === 'premium' || shop?.plan === 'pro';
  const pending = status?.paymentVerificationStatus === 'pending' || status?.status === 'pending' || shop?.account_status === 'pending_payment';

  const startPayment = async () => {
    if (!shop?.id) return toast.error('Shop details could not be loaded.');
    setPaying(true);
    window.location.assign(THREADZW_NARDOPAY_MONTHLY_LINK);
  };

  const redeemPromo = async () => {
    if (!shop?.id) return toast.error('Shop details could not be loaded.');
    const code = promoCode.trim().toUpperCase();
    if (!code) return toast.error('Enter a promo code.');
    setRedeeming(true);
    try {
      const result = await subscriptionClient.redeemPromoCode(shop.id, code);
      await refreshShop();
      await loadStatus();
      setPromoCode('');
      toast.success(`Promo applied — you have ${result.trialDays} days of Pro free.`);
    } catch (error: any) {
      toast.error(error?.message || 'Could not redeem promo code.');
    } finally { setRedeeming(false); }
  };

  const refresh = async () => { await refreshShop(); await loadStatus(); };

  if (loading || shopLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8 font-sans">
      <div className="w-full max-w-xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-xs font-bold text-zinc-600 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200 text-zinc-800 text-[10px] font-bold tracking-wider mb-2"><Shirt size={12} /> CLOTHING MERCHANT</div>
          <h1 className="text-3xl font-black uppercase tracking-tight">{trialActive ? 'Your Pro trial is live.' : 'Make your shop live.'}</h1>
          <p className="text-sm text-zinc-500 mt-2">{trialActive ? 'You have Pro free during your trial. After it ends, pay $9 once-off to keep Pro.' : 'One payment. No monthly renewal.'}</p>
        </div>

        {trialActive && status?.trialEndsAt && <div className="bg-[#fff0e3] border border-orange-200 rounded-3xl p-5 mb-5"><div className="flex gap-3"><Clock className="text-[#F05A00] shrink-0" size={20} /><div><h2 className="text-sm font-black text-zinc-950">NARDO PROMO · PRO FREE FOR 30 DAYS</h2><p className="text-xs text-zinc-600 mt-1 leading-relaxed">Your Pro trial ends on <strong>{new Date(status.trialEndsAt).toLocaleDateString()}</strong>. No payment is required during the trial. After it expires, your shop returns to the unpaid state until you pay the normal $9 once-off price.</p></div></div></div>}

        {pending && !pro && <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-5"><div className="flex gap-3"><Clock className="text-amber-600 shrink-0" size={20} /><div><h2 className="text-sm font-black text-amber-950">PAYMENT AWAITING APPROVAL</h2><p className="text-xs text-amber-800 mt-1 leading-relaxed">Your shop is pending payment verification. The ThreadZW team will activate Pro after approval.</p><button onClick={refresh} className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-600 text-white text-[11px] font-bold"><RefreshCw size={13} /> Refresh status</button></div></div></div>}

        {!pro && !pending && !trialActive && <div className="bg-white border border-zinc-200 rounded-3xl p-5 mb-5"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F05A00]/10 text-[#F05A00]"><TicketPercent size={19} /></div><div className="flex-1"><h2 className="text-sm font-black">Have a promo code?</h2><p className="text-xs text-zinc-500 mt-1">Enter a valid code to unlock a promotional Pro trial.</p><div className="mt-4 flex gap-2"><input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === 'Enter') redeemPromo(); }} placeholder="ENTER CODE" maxLength={32} autoCapitalize="characters" className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs font-black tracking-wider text-zinc-950 outline-none focus:border-[#F05A00]" /><button type="button" onClick={redeemPromo} disabled={redeeming} className="rounded-xl bg-zinc-950 px-4 py-3 text-xs font-black text-white disabled:opacity-60">{redeeming ? <Loader2 size={15} className="animate-spin" /> : 'REDEEM'}</button></div></div></div></div>}

        <div className="bg-zinc-950 text-white p-7 rounded-3xl border border-zinc-800 shadow-sm">
          <div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-black uppercase bg-[#C6FF00] text-zinc-900 px-3 py-1 rounded-full">{trialActive ? 'Promo Trial' : 'Lifetime'}</span><h2 className="text-2xl font-black uppercase mt-3">ThreadZW Premium</h2></div><div className="text-right">{trialActive ? <><span className="text-3xl font-black text-[#C6FF00]">$0</span><span className="block text-xs text-zinc-400">for 30 days</span></> : <><span className="text-3xl font-black text-[#C6FF00]">${THREADZW_PREMIUM_PRICE}</span><span className="block text-xs text-zinc-400">once-off</span></>}</div></div>
          <div className="mt-6 pt-5 border-t border-zinc-800 space-y-3 text-sm font-semibold text-zinc-200">{['Unlimited products during Pro access','Your shop can be live','Premium storefront tools','Storefront analytics','No monthly renewal after paid activation'].map(feature => <div key={feature} className="flex gap-2"><Check size={16} className="text-[#C6FF00] shrink-0" /> {feature}</div>)}</div>
          {trialActive && <div className="mt-7 p-4 rounded-2xl bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-center text-sm font-black text-[#C6FF00]">NARDO PROMO ACTIVE · PRO UNLOCKED</div>}
          {!pro && !pending && !trialActive && <button onClick={startPayment} disabled={paying} className="w-full mt-7 py-4 rounded-2xl bg-[#C6FF00] text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2">{paying ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />} Pay $9 once-off</button>}
          {pending && !pro && <div className="mt-7 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-center text-sm font-bold text-amber-200">Payment submitted — awaiting admin approval</div>}
          {pro && !trialActive && <div className="mt-7 p-4 rounded-2xl bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-center text-sm font-black text-[#C6FF00]">PREMIUM ACTIVE</div>}
        </div>
        <p className="text-center text-[11px] text-zinc-500 mt-5">NARDO promo access is limited to 20 users and provides 30 days of Pro at $0. The standard ThreadZW trial is 3 days with up to 3 products, then the normal $9 once-off activation applies.</p>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Check, Loader2, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';
import { subscriptionClient, SubscriptionStatusResponse } from '../services/subscriptionClient';
import { toast } from 'sonner';

export const Paywall: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shop } = useShopContext();
  const [loading, setLoading] = useState(false);
  const [loadingSub, setLoadingSub] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const premiumPrice = Number(import.meta.env.VITE_THREADZW_CLOTHING_PRO_PRICE_USD || 9);
  const visits = Number(shop?.lifetime_unique_visits || 0);
  const interests = Number(shop?.lifetime_interest_events || 0);

  const fetchSubscription = async () => {
    if (!user || !shop?.id) {
      setLoadingSub(false);
      return;
    }
    setLoadingSub(true);
    try {
      setStatus(await subscriptionClient.getStatus(shop.id));
    } catch {
      setStatus({
        success: true,
        shopId: shop.id,
        plan: 'free',
        category: 'clothing',
        status: 'inactive',
        billingCycle: 'none',
        amount: 0,
        currency: 'USD'
      });
    } finally {
      setLoadingSub(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user?.id, shop?.id]);

  useEffect(() => {
    if (!isVerifying || !shop?.id) return;
    const interval = window.setInterval(async () => {
      try {
        const nextStatus = await subscriptionClient.getStatus(shop.id);
        setStatus(nextStatus);
        if (nextStatus.plan === 'premium' && nextStatus.status === 'active') {
          window.clearInterval(interval);
          setIsVerifying(false);
          toast.success('Premium access is active.');
          navigate('/dashboard?payment=success');
        }
      } catch {
        // Keep polling while the signed webhook is being delivered.
      }
    }, 3500);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setIsVerifying(false);
    }, 120000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [isVerifying, shop?.id, navigate]);

  const handleStartCheckout = () => {
    navigate('/dashboard');
  };

  const handlePremiumCheckout = async () => {
    if (!shop?.id) {
      toast.error('Shop details could not be loaded. Please refresh.');
      return;
    }
    setLoading(true);
    try {
      const payment = await subscriptionClient.createPaymentLink(shop.id);
      setCheckoutUrl(payment.url);
      window.open(payment.url, '_blank', 'noopener,noreferrer');
      setIsVerifying(true);
      toast.info('NardoPay opened. Premium activates after our server verifies the signed webhook.');
    } catch (error: any) {
      toast.error(error?.message || 'Could not create the Premium payment link.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    if (!shop?.id) return;
    setLoading(true);
    try {
      const nextStatus = await subscriptionClient.getStatus(shop.id);
      setStatus(nextStatus);
      if (nextStatus.plan === 'premium' && nextStatus.status === 'active') {
        setIsVerifying(false);
        toast.success('Premium access is active.');
        navigate('/dashboard?payment=success');
      } else {
        toast.info('Still waiting for NardoPay’s verified webhook.');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Unable to check subscription status.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingSub) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#bef715]" />
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-[#121212] rounded-3xl border border-zinc-900 p-8 space-y-6 relative">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-[#bef715]" />
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-[#bef715]"><RefreshCw size={28} className="animate-spin" /></div>
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 font-mono text-[9px] tracking-widest uppercase font-black"><ShieldCheck size={11} className="text-[#bef715]" />NardoPay Secure Network</div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Checking Premium</h1>
            <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Your payment was sent to NardoPay. Threadzw is waiting for the signed webhook before changing your plan.</p>
          </div>
          <div className="rounded-2xl bg-[#181818] border border-zinc-900 p-4 text-center text-xs text-zinc-400">This page checks for up to two minutes. You can also return to the dashboard and continue setting up your shop.</div>
          <div className="space-y-3">
            <button onClick={handleManualCheck} disabled={loading} className="w-full h-13 bg-[#bef715] hover:bg-[#a6d910] text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={16} /> : <><span>Check Subscription Status</span><RefreshCw size={13} /></>}</button>
            {checkoutUrl && <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-xs font-bold text-[#bef715] hover:text-white">Reopen NardoPay checkout</a>}
            <button onClick={() => setIsVerifying(false)} className="w-full h-11 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-bold uppercase rounded-xl cursor-pointer">Return</button>
          </div>
        </div>
      </div>
    );
  }

  const premiumActive = status?.plan === 'premium' && status.status === 'active';
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-white font-sans selection:bg-[#bef715] selection:text-black">
      <div className="max-w-md w-full bg-[#121212] rounded-3xl border border-zinc-900 p-8 space-y-6 relative">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-[#bef715]" />
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-[#bef715]"><Lock size={24} /></div>
          <div className="flex items-center justify-center gap-1.5 text-zinc-400 font-mono text-[9px] tracking-widest uppercase font-black"><ShieldCheck size={11} className="text-[#bef715]" />Threadzw subscription</div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Keep your shop open</h1>
          <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Free clothing shops can list unlimited products. Premium keeps WhatsApp and directions enquiries open after the lifetime allowance.</p>
        </div>

        <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-3">
          <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Free allowance</span><span className="text-[#bef715] text-xs font-black">$0</span></div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-zinc-900 p-3"><span className="block text-zinc-500 text-[10px] uppercase font-bold">Unique visits</span><strong className="block mt-1 text-white">{visits} / 50</strong></div>
            <div className="rounded-xl bg-zinc-900 p-3"><span className="block text-zinc-500 text-[10px] uppercase font-bold">Interests</span><strong className="block mt-1 text-white">{interests} / 10</strong></div>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">Browsing remains available after either threshold. Only customer action buttons pause.</p>
        </div>

        <div className="space-y-2 text-xs text-zinc-400 font-semibold">
          <div className="flex items-center gap-2"><Check className="text-[#bef715]" size={14} />Unlimited clothing products</div>
          <div className="flex items-center gap-2"><Check className="text-[#bef715]" size={14} />WhatsApp and directions enquiries</div>
          <div className="flex items-center gap-2"><Check className="text-[#bef715]" size={14} />One-off Premium access for ${premiumPrice} USD</div>
        </div>

        {premiumActive ? (
          <div className="rounded-xl bg-[#bef715]/10 border border-[#bef715]/30 p-4 text-center text-sm font-black text-[#bef715]">Premium access is active.</div>
        ) : (
          <button onClick={handlePremiumCheckout} disabled={loading} className="w-full h-14 bg-[#bef715] hover:bg-[#a6d910] text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={16} /> : <><span>Upgrade to Premium — ${premiumPrice} one-off</span><ArrowRight size={14} /></>}</button>
        )}
        <button onClick={handleStartCheckout} className="w-full h-11 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-bold uppercase rounded-xl cursor-pointer">Return to Dashboard</button>
        <div className="flex items-start gap-2 text-[10px] text-zinc-600 font-bold leading-relaxed"><AlertCircle size={13} className="shrink-0 mt-0.5" />Premium is activated only by a verified server webhook; this screen never grants access from a redirect.</div>
        <button onClick={handleManualCheck} disabled={loading} className="mx-auto flex items-center gap-1.5 text-[11px] text-[#bef715] hover:text-white font-bold cursor-pointer"><RefreshCw size={11} className={loading ? 'animate-spin' : ''} />Check subscription status</button>
      </div>
    </div>
  );
};

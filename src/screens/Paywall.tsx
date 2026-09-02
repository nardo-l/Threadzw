import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Lock, Loader2, RefreshCw,
  ShieldCheck, Sparkles, X, Package, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';
import { subscriptionClient, SubscriptionStatusResponse } from '../services/subscriptionClient';
import { toast } from 'sonner';

type PaywallStep = 'limit' | 'plan' | 'summary' | 'verifying' | 'success';

const GREEN = '#C6FF00';

export const Paywall: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshSubscription } = useAuth();
  const { shop, refreshShop } = useShopContext();

  const [step, setStep] = useState<PaywallStep>('limit');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const price = 9;
  const productCount = Math.min(9, Number(shop?.products_count ?? 9));

  const refreshStatus = async () => {
    if (!shop?.id || !user) return null;
    const next = await subscriptionClient.getStatus(shop.id);
    setStatus(next);
    return next;
  };

  useEffect(() => {
    if (!shop?.id || !user || step !== 'verifying') return;

    let active = true;
    const check = async () => {
      try {
        const next = await refreshStatus();
        if (active && next?.plan === 'premium' && next.status === 'active') {
          setStep('success');
          await refreshShop();
          await refreshSubscription();
          localStorage.setItem('threadzw_just_subscribed', 'true');
        }
      } catch {
        // Webhook may still be processing.
      }
    };

    check();
    const interval = window.setInterval(check, 3500);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 120000);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [step, shop?.id, user?.id]);

  const startPayment = async () => {
    if (!shop?.id) {
      toast.error('Your shop could not be loaded. Please refresh.');
      return;
    }

    setLoading(true);
    try {
      const payment = await subscriptionClient.createPaymentLink(shop.id);
      if (!payment?.url) throw new Error('NardoPay did not return a checkout link.');
      setCheckoutUrl(payment.url);
      setStep('verifying');
      window.open(payment.url, '_blank', 'noopener,noreferrer');
      toast.info('NardoPay checkout opened. We will confirm your payment automatically.');
    } catch (error: any) {
      toast.error(error?.message || 'Could not start payment.');
    } finally {
      setLoading(false);
    }
  };

  const manualCheck = async () => {
    if (!shop?.id) return;
    setLoading(true);
    try {
      const next = await refreshStatus();
      if (next?.plan === 'premium' && next.status === 'active') {
        setStep('success');
        await refreshShop();
        await refreshSubscription();
        localStorage.setItem('threadzw_just_subscribed', 'true');
      } else {
        toast.info('Payment is not confirmed yet. If you just paid, give it a few seconds.');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Could not check payment status.');
    } finally {
      setLoading(false);
    }
  };

  const close = () => navigate('/dashboard');

  if (step === 'success') {
    return (
      <Shell onClose={close}>
        <div className="flex flex-1 flex-col items-center justify-center text-center px-2">
          <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-black text-[#C6FF00]">
            <Check size={40} strokeWidth={3} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Payment confirmed</p>
          <h1 className="mt-3 text-4xl font-black leading-none">You're Premium.</h1>
          <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-500">
            Your ThreadZW shop now has unlimited products and Premium features.
          </p>

          <div className="mt-8 w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left space-y-3">
            {['Unlimited products', 'Premium storefront features', 'No monthly fees', 'Lifetime access'].map(item => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold">
                <CheckCircle2 size={17} className="text-[#79A900]" />{item}
              </div>
            ))}
          </div>

          <div className="mt-auto w-full pt-8">
            <button onClick={close} className="flex w-full items-center justify-between rounded-2xl bg-black px-5 py-4 text-sm font-black text-white">
              <span>GO TO DASHBOARD</span><ArrowRight size={20} />
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (step === 'verifying') {
    return (
      <Shell onClose={close}>
        <div className="flex flex-1 flex-col">
          <button onClick={() => setStep('summary')} className="mb-7 flex w-fit items-center gap-2 text-sm font-bold text-zinc-500">
            <ArrowLeft size={17} /> Back
          </button>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="relative mb-7 flex h-24 w-24 items-center justify-center rounded-full border-8 border-zinc-100">
              <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-black animate-spin" />
              <Lock size={27} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Secure payment</p>
            <h1 className="mt-3 text-3xl font-black">Confirming your payment.</h1>
            <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-500">
              Complete payment in the NardoPay window. We only activate Premium after our server verifies the payment.
            </p>

            <div className="mt-8 w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left space-y-4">
              <StatusRow done label="Checkout opened" />
              <StatusRow active={!status || status.status !== 'active'} done={status?.status === 'active'} label="Waiting for verified payment" />
              <StatusRow active={status?.plan === 'premium'} done={status?.plan === 'premium'} label="Premium access" />
            </div>
          </div>

          <div className="space-y-3 pt-8">
            {checkoutUrl && <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 py-3.5 text-xs font-black"><ExternalLink size={15} /> REOPEN PAYMENT</a>}
            <button onClick={manualCheck} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C6FF00] py-4 text-sm font-black disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={17} />}
              {loading ? 'CHECKING...' : 'CHECK PAYMENT STATUS'}
            </button>
            <button onClick={close} className="w-full py-2 text-xs font-bold text-zinc-400">I'll check later</button>
          </div>
        </div>
      </Shell>
    );
  }

  if (step === 'summary') {
    return (
      <Shell onClose={close}>
        <div className="flex flex-1 flex-col">
          <BackButton onClick={() => setStep('plan')} />
          <Eyebrow>Order summary</Eyebrow>
          <h1 className="mt-2 text-4xl font-black leading-none">Ready to go Premium?</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-500">One payment. No monthly subscription.</p>

          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-black">ThreadZW Premium</p>
                <p className="mt-1 text-xs text-zinc-500">Lifetime access</p>
              </div>
              <p className="text-2xl font-black">$9</p>
            </div>
            <div className="my-5 h-px bg-zinc-100" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Premium access</span><span className="font-bold">$9.00 USD</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-base font-black">
              <span>Total</span><span>$9.00 USD</span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <Benefit icon={<Package size={17} />} title="Unlimited products" />
            <Benefit icon={<Sparkles size={17} />} title="Premium storefront features" />
            <Benefit icon={<ShieldCheck size={17} />} title="Secure payment via NardoPay" />
          </div>

          <div className="mt-auto pt-8">
            <button onClick={startPayment} disabled={loading} className="flex w-full items-center justify-between rounded-2xl bg-[#C6FF00] px-5 py-4 text-sm font-black disabled:opacity-50">
              <span>{loading ? 'OPENING NARDOPAY...' : 'PROCEED TO PAYMENT'}</span>
              {loading ? <Loader2 className="animate-spin" size={19} /> : <ArrowRight size={20} />}
            </button>
            <p className="mt-3 text-center text-[10px] font-semibold text-zinc-400">You’ll complete payment securely on NardoPay.</p>
          </div>
        </div>
      </Shell>
    );
  }

  if (step === 'plan') {
    return (
      <Shell onClose={close}>
        <div className="flex flex-1 flex-col">
          <BackButton onClick={() => setStep('limit')} />
          <Eyebrow>Choose your plan</Eyebrow>
          <h1 className="mt-2 text-4xl font-black leading-none">Upgrade once.<br />Grow forever.</h1>

          <div className="mt-8 rounded-3xl border-2 border-[#B7ED00] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex rounded-full bg-[#C6FF00] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider">One-time payment</span>
                <h2 className="mt-4 text-2xl font-black">Premium</h2>
              </div>
              <div className="text-right"><span className="text-4xl font-black">$9</span><span className="ml-1 text-xs font-bold text-zinc-400">USD</span></div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-500">Everything you need to build a serious clothing brand and sell more.</p>
            <div className="mt-6 space-y-3">
              {['Unlimited products', 'Premium storefront features', 'Remove ThreadZW branding', 'Advanced analytics', 'Lifetime access'].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold"><Check size={16} className="text-[#79A900]" />{item}</div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-zinc-50 p-3 text-xs font-semibold text-zinc-500">Pay once. There are no monthly fees.</div>
          </div>

          <div className="mt-auto pt-8">
            <button onClick={() => setStep('summary')} className="flex w-full items-center justify-between rounded-2xl bg-[#C6FF00] px-5 py-4 text-sm font-black">
              <span>CONTINUE</span><ArrowRight size={20} />
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell onClose={close}>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-end">
          <button onClick={close} className="rounded-full p-2 text-zinc-500"><X size={19} /></button>
        </div>
        <div className="pt-6">
          <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C6FF00]"><Lock size={28} /></div>
          <Eyebrow>Free plan limit</Eyebrow>
          <h1 className="mt-2 text-[3rem] font-black leading-[0.96] tracking-tight">You've reached<br />your limit.</h1>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-zinc-50 p-4">
            <Package size={22} />
            <div><p className="text-sm font-black">{productCount} / 9 products</p><p className="text-xs text-zinc-500">Free includes up to 9 active products.</p></div>
          </div>
          <p className="mt-5 text-sm leading-6 text-zinc-500">Your store stays yours. Upgrade when you need more room to grow.</p>
        </div>

        <div className="mt-7 rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs font-black uppercase tracking-wider">Premium unlocks</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {['Unlimited products', 'Premium storefronts', 'Remove branding', 'Advanced analytics'].map(item => (
              <div key={item} className="flex items-start gap-2 text-xs font-semibold"><Check size={14} className="mt-0.5 text-[#79A900]" />{item}</div>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-3 pt-8">
          <button onClick={() => setStep('plan')} className="flex w-full items-center justify-between rounded-2xl bg-[#C6FF00] px-5 py-4 text-sm font-black">
            <span>UPGRADE TO PREMIUM</span><ArrowRight size={20} />
          </button>
          <button onClick={close} className="w-full py-2 text-xs font-bold text-zinc-400">Maybe later</button>
        </div>
      </div>
    </Shell>
  );
};

const Shell: React.FC<{children: React.ReactNode; onClose: () => void}> = ({children}) => (
  <main className="min-h-screen bg-white text-black font-sans">
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-5">
      <header className="flex items-center justify-between">
        <div className="text-xl font-black tracking-tight">THREAD<span className="text-[#C6FF00]">ZW</span></div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1" aria-label="Payment flow progress">
            <span className="h-1.5 w-6 rounded-full bg-[#C6FF00]" /><span className="h-1.5 w-6 rounded-full bg-zinc-200" /><span className="h-1.5 w-6 rounded-full bg-zinc-200" />
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col pt-7">{children}</div>
    </div>
  </main>
);

const Eyebrow: React.FC<{children: React.ReactNode}> = ({children}) => (
  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{children}</p>
);

const BackButton: React.FC<{onClick: () => void}> = ({onClick}) => (
  <button onClick={onClick} className="mb-7 flex w-fit items-center gap-2 text-sm font-bold text-zinc-500"><ArrowLeft size={17} /> Back</button>
);

const Benefit: React.FC<{icon: React.ReactNode; title: string}> = ({icon, title}) => (
  <div className="flex items-center gap-3 text-sm font-semibold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100">{icon}</span>{title}</div>
);

const StatusRow: React.FC<{label: string; done?: boolean; active?: boolean}> = ({label, done, active}) => (
  <div className="flex items-center gap-3 text-sm font-semibold">
    <span className={`flex h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-[#C6FF00]' : active ? 'border-2 border-black' : 'bg-zinc-200'}`}>
      {done ? <Check size={14} /> : active ? <span className="h-2 w-2 animate-pulse rounded-full bg-black" /> : null}
    </span>
    <span className={active ? 'text-black' : 'text-zinc-500'}>{label}</span>
  </div>
);

export default Paywall;

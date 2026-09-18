import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../hooks/useShop';
import { subscriptionClient } from '../services/subscriptionClient';

type PaymentState = 'checking' | 'pending' | 'active';

export const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shop, refreshShop } = useShop();
  const [state, setState] = useState<PaymentState>('checking');
  const [refreshing, setRefreshing] = useState(false);

  const checkPaymentStatus = async () => {
    if (!user || !shop?.id) {
      setState('pending');
      return;
    }

    try {
      // Reaching this page means NardoPay sent the customer back after checkout.
      // This records the submission but never grants Pro. Admin approval remains authoritative.
      await subscriptionClient.markPaymentSubmitted(shop.id);
      const status = await subscriptionClient.getStatus(shop.id);

      const isPro =
        status.plan === 'premium' ||
        status.plan === 'pro' ||
        status.paymentVerificationStatus === 'approved';

      setState(isPro ? 'active' : 'pending');
    } catch (error) {
      console.warn('[SUBSCRIPTION SUCCESS] status check:', error);
      // Never show "approved" when the status check fails.
      setState('pending');
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await checkPaymentStatus();
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id, shop?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshShop();
      await checkPaymentStatus();
    } finally {
      setRefreshing(false);
    }
  };

  if (state === 'checking') {
    return (
      <main className="min-h-screen bg-[#f7f5ef] flex items-center justify-center px-5">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-950 text-[#F05A00]">
            <Loader2 size={28} className="animate-spin" />
          </div>
          <p className="mt-5 text-sm font-black text-zinc-950">Confirming your payment…</p>
          <p className="mt-1 text-xs text-zinc-500">Just a moment.</p>
        </div>
      </main>
    );
  }

  const active = state === 'active';

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-8 text-zinc-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col">
        <header className="flex items-center justify-center">
          <div className="text-lg font-black tracking-tight">
            THREAD<span className="text-[#F05A00]">ZW</span>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-8">
          <div className="text-center">
            <div
              className={[
                'mx-auto flex h-24 w-24 items-center justify-center rounded-full',
                active ? 'bg-[#F05A00] text-white' : 'bg-amber-100 text-amber-700',
              ].join(' ')}
            >
              {active ? <CheckCircle2 size={48} strokeWidth={2.2} /> : <Clock3 size={46} strokeWidth={2.2} />}
            </div>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.24em] text-[#F05A00]">
              {active ? 'PRO ACTIVATED' : 'PAYMENT RECEIVED'}
            </p>

            <h1 className="mt-3 text-[2.7rem] font-black leading-[0.94] tracking-tight">
              {active ? (
                <>
                  Your shop is <span className="text-[#F05A00]">ready to go.</span>
                </>
              ) : (
                <>
                  You're <span className="text-[#F05A00]">all paid up.</span>
                </>
              )}
            </h1>

            <p className="mt-5 text-sm leading-6 text-zinc-600">
              {active
                ? 'Your $9 once-off payment has been verified and ThreadZW Pro is now active on your shop.'
                : 'Your $9 once-off payment has been submitted successfully. Your shop is now waiting for ThreadZW verification.'}
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[2rem] bg-zinc-950 text-white shadow-xl">
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F05A00]">
                  {active ? <Check size={21} /> : <ShieldCheck size={21} />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    THREADZW PRO · $9
                  </p>
                  <p className="mt-0.5 text-sm font-black">
                    {active ? 'Payment verified' : 'Awaiting verification'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <StatusRow
                done
                number="01"
                title="Payment submitted"
                text="Your NardoPay checkout has been completed."
              />
              <StatusRow
                done={active}
                current={!active}
                number="02"
                title="Payment verification"
                text={active ? 'ThreadZW has approved the payment.' : 'The ThreadZW team will verify your payment.'}
              />
              <StatusRow
                done={active}
                number="03"
                title="Pro unlocked"
                text={active ? 'Unlimited products and live-store access are unlocked.' : 'Pro will unlock after approval.'}
              />
            </div>
          </div>

          {!active && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Clock3 size={18} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-xs font-black text-amber-950">Nothing else is required from you</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    Keep your shop as it is while we verify the payment. You can customise your storefront from the dashboard, but adding products is unlocked after approval.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="space-y-3">
          {!active && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-xs font-black uppercase tracking-wide text-zinc-900 transition active:scale-[.99] disabled:opacity-60"
            >
              {refreshing ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
              Refresh verification status
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex w-full items-center justify-between rounded-2xl bg-[#F05A00] px-5 py-4 text-sm font-black text-white shadow-lg shadow-orange-900/20 transition active:scale-[.99]"
          >
            <span>{active ? 'GO TO MY SHOP' : 'GO TO DASHBOARD'}</span>
            <ArrowRight size={20} />
          </button>

          <div className="flex items-center justify-center gap-2 pb-1 text-[10px] font-semibold text-zinc-500">
            <Store size={13} />
            <span>ThreadZW · $9 once-off · no monthly renewal</span>
          </div>
        </footer>
      </div>
    </main>
  );
};

const StatusRow: React.FC<{
  done: boolean;
  current?: boolean;
  number: string;
  title: string;
  text: string;
}> = ({ done, current, number, title, text }) => (
  <div className="flex items-start gap-3">
    <div
      className={[
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-black',
        done
          ? 'bg-[#F05A00] text-white'
          : current
            ? 'border border-amber-400 bg-amber-400/10 text-amber-300'
            : 'border border-white/10 bg-white/5 text-zinc-500',
      ].join(' ')}
    >
      {done ? <Check size={16} /> : number}
    </div>
    <div className="min-w-0 pt-0.5">
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{text}</p>
    </div>
  </div>
);

import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Grid2X2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
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
      // NardoPay redirects here after checkout. The redirect never grants Pro.
      // Admin approval remains authoritative.
      await subscriptionClient.markPaymentSubmitted(shop.id);
      const status = await subscriptionClient.getStatus(shop.id);

      const isPro =
        status.plan === 'premium' ||
        status.plan === 'pro' ||
        status.paymentVerificationStatus === 'approved';

      setState(isPro ? 'active' : 'pending');
    } catch (error) {
      console.warn('[SUBSCRIPTION SUCCESS] status check:', error);
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
      <main className="min-h-screen bg-[#faf9f5] px-5 py-8 text-zinc-950">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111214] text-[#F05A00]">
            <Loader2 size={28} className="animate-spin" />
          </div>
          <p className="mt-5 text-sm font-black">Checking your payment status…</p>
          <p className="mt-1 text-xs text-zinc-500">Just a moment.</p>
        </div>
      </main>
    );
  }

  const active = state === 'active';

  return (
    <main className="min-h-screen bg-[#faf9f5] px-4 py-5 text-zinc-950 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[430px] flex-col sm:min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between px-1">
          <div className="text-[25px] font-black tracking-[-0.07em] leading-none">
            THREAD<span className="text-[#F05A00]">ZW</span>
          </div>

          <button
            type="button"
            aria-label="Go to dashboard"
            onClick={() => navigate('/dashboard')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-zinc-950"
          >
            <X size={25} strokeWidth={2.2} />
          </button>
        </header>

        <section className="flex-1 pt-8 sm:pt-12">
          <div className="text-center">
            <div
              className={[
                'relative mx-auto flex h-[116px] w-[116px] items-center justify-center rounded-full',
                active ? 'bg-[#e7f8e9] text-[#179447]' : 'bg-[#fff0e3] text-[#F05A00]',
              ].join(' ')}
            >
              {active ? (
                <CheckCircle2 size={58} strokeWidth={1.8} />
              ) : (
                <>
                  <div className="absolute -right-1 top-3 h-2.5 w-8 rotate-[115deg] rounded-full bg-[#F05A00]" />
                  <div className="absolute right-[-7px] top-12 h-2.5 w-7 rotate-[160deg] rounded-full bg-[#F05A00]" />
                  <div className="absolute right-0 top-[70px] h-2.5 w-6 rounded-full bg-[#F05A00]" />
                  <div className="flex h-[60px] w-[76px] items-center justify-center rounded-[14px] border-[6px] border-current">
                    <div className="h-1.5 w-7 rounded-full bg-current" />
                    <div className="absolute ml-[64px] mt-[40px] flex h-10 w-10 items-center justify-center rounded-full bg-[#F05A00] text-white ring-[6px] ring-[#fff0e3]">
                      <Check size={22} strokeWidth={3} />
                    </div>
                  </div>
                </>
              )}
            </div>

            <p className="mt-7 text-[11px] font-black uppercase tracking-[0.22em] text-[#F05A00]">
              {active ? 'Payment verified' : 'Payment submitted'}
            </p>

            <h1 className="mt-3 text-[38px] font-black leading-[0.98] tracking-[-0.045em] sm:text-[42px]">
              {active ? (
                <>
                  Pro is <span className="text-[#F05A00]">unlocked.</span>
                </>
              ) : (
                <>
                  Payment <span className="text-[#F05A00]">submitted!</span>
                </>
              )}
            </h1>

            <p className="mx-auto mt-5 max-w-[370px] text-[15px] leading-6 text-[#697386]">
              {active
                ? 'Your $9 once-off payment has been verified and your Pro shop is now active.'
                : 'Your $9 once-off payment has been received and is now under review. You’ll be notified once your payment is verified and your Pro shop is activated.'}
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[22px] border border-[#e5e2db] bg-white">
            <div className="border-b border-[#ebe8e1] px-5 py-4">
              <span className="inline-flex rounded-full bg-[#fff0e3] px-3 py-1.5 text-[12px] font-black text-[#D84E00]">
                Next steps
              </span>
            </div>

            <div className="px-5 py-5">
              <StatusRow
                done
                title="Payment submitted"
                text="$9.00 (once-off) via NardoPay"
                right={!active ? 'Submitted' : 'Complete'}
              />
              <StatusConnector />
              <StatusRow
                done={active}
                current={!active}
                title="Payment verification"
                text={active ? 'Your payment has been approved.' : 'Our team is checking your payment details.'}
                right={active ? 'Approved' : 'In progress'}
              />
              <StatusConnector />
              <StatusRow
                done={active}
                title="Pro unlocked after approval"
                text={
                  active
                    ? 'Unlimited products and Pro features are now available.'
                    : 'Once verified, your shop will be upgraded to Pro with unlimited products.'
                }
                right={active ? 'Active' : 'Pending'}
              />
            </div>
          </div>

          {!active && (
            <div className="mt-4 rounded-[20px] bg-[#fff0e3] px-5 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#ffe2c8] text-[#D84E00]">
                  <ShieldCheck size={24} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[16px] font-black tracking-[-0.02em]">Admin verification required</p>
                  <p className="mt-1.5 text-[13px] leading-5 text-[#687386]">
                    Your payment needs to be manually verified by the ThreadZW admin team. You’ll be notified once it’s complete.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="mt-8 space-y-3 pb-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex w-full items-center justify-center gap-3 rounded-[17px] bg-[#111214] px-5 py-[17px] text-[15px] font-black text-white shadow-[0_10px_25px_rgba(17,18,20,0.14)] transition hover:bg-black active:scale-[.99]"
          >
            <Grid2X2 size={19} strokeWidth={2.5} />
            <span>Go to Dashboard</span>
            <ArrowRight size={21} strokeWidth={2.4} />
          </button>

          {!active && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex w-full items-center justify-center gap-3 rounded-[17px] border border-[#9da6b5] bg-transparent px-5 py-[16px] text-[15px] font-black text-zinc-950 transition hover:bg-white disabled:opacity-60"
            >
              {refreshing ? <Loader2 size={19} className="animate-spin" /> : <RefreshCw size={19} />}
              Refresh verification status
            </button>
          )}

          <p className="pt-1 text-center text-[12px] font-medium text-[#7b8493]">
            Need help?{' '}
            <button
              type="button"
              onClick={() => navigate('/support')}
              className="font-bold text-[#F05A00] hover:underline"
            >
              Contact support <span aria-hidden="true">→</span>
            </button>
          </p>
        </footer>
      </div>
    </main>
  );
};

const StatusConnector: React.FC = () => (
  <div className="ml-[17px] h-5 w-px bg-[#e5e2db]" aria-hidden="true" />
);

const StatusRow: React.FC<{
  done: boolean;
  current?: boolean;
  title: string;
  text: string;
  right: string;
}> = ({ done, current, title, text, right }) => (
  <div className="flex items-start gap-3">
    <div
      className={[
        'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
        done
          ? 'bg-[#22a657] text-white'
          : current
            ? 'bg-[#F05A00] text-white'
            : 'bg-[#e9edf2] text-[#7d8796]',
      ].join(' ')}
    >
      {done ? <Check size={17} strokeWidth={3} /> : current ? <Clock3 size={17} strokeWidth={2.4} /> : <span className="h-2.5 w-2.5 rounded-full bg-current" />}
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] font-black leading-5 text-zinc-950">{title}</p>
        <span
          className={[
            'shrink-0 rounded-full px-3 py-1 text-[10px] font-black',
            done
              ? 'bg-[#e9f8ed] text-[#188d45]'
              : current
                ? 'bg-[#fff0e3] text-[#D84E00]'
                : 'bg-[#eef0f3] text-[#758094]',
          ].join(' ')}
        >
          {right}
        </span>
      </div>
      <p className="mt-1 text-[12px] leading-5 text-[#697386]">{text}</p>
    </div>
  </div>
);

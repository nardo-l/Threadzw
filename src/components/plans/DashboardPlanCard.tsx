import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, Eye, Package, Sparkles } from 'lucide-react';
import { Shop } from '../../types';
import { resolveSellerCategory } from '../../config/sellerCategories';
import { getProductLimit, isPro, isShopViewOnly, isTrialActive } from '../../config/plans';
import { useNavigate } from 'react-router-dom';
import { ThemePickerLauncher } from '../dashboard/ThemePickerLauncher';

interface DashboardPlanCardProps {
  shop: Shop | null;
  productsCount: number;
  liveProductsCount: number;
  lifetimeUniqueVisitors?: number;
  lifetimeInterestEvents?: number;
}

export const DashboardPlanCard: React.FC<DashboardPlanCardProps> = ({ shop, liveProductsCount }) => {
  const navigate = useNavigate();
  if (!shop || resolveSellerCategory(shop.page_type) !== 'clothing') return null;

  const pro = isPro(shop);
  const trial = isTrialActive(shop);
  const viewOnly = isShopViewOnly(shop);
  const productLimit = getProductLimit(shop);

  if (pro) {
    return (
      <div className="space-y-3">
        <ThemePickerLauncher shop={shop} />
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-[#CCFF00]"><Sparkles size={18} /></div><div><span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Your plan</span><h3 className="text-sm font-bold text-zinc-900">ThreadZW Pro · Monthly</h3></div></div>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={13} /> Active</span>
          </div>
          <p className="mt-3 text-[11px] text-zinc-500">Unlimited products · $1.59/month · {liveProductsCount} active products</p>
          <button onClick={() => navigate('/subscription')} className="mt-3 text-xs font-black text-zinc-900 underline underline-offset-4">View subscription details</button>
        </div>
      </div>
    );
  }

  const pending = shop.payment_verification_status === 'pending' || shop.account_status === 'pending_payment';
  const limit = productLimit ?? 0;
  const used = Math.min(liveProductsCount, limit);
  const remaining = Math.max(0, limit - used);
  const trialEnd = shop.trial_ends_at ? new Date(shop.trial_ends_at) : null;
  const trialHours = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 3600000)) : 0;

  return (
    <div className="space-y-3">
      {!viewOnly && <ThemePickerLauncher shop={shop} />}
      <div className={`rounded-2xl border p-5 shadow-sm ${viewOnly ? 'border-amber-200 bg-amber-50 text-zinc-950' : 'border-zinc-800 bg-zinc-950 text-white'}`}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${viewOnly ? 'bg-amber-200 text-amber-950' : 'bg-[#CCFF00] text-black'}`}>
              {viewOnly ? <Eye size={18} /> : trial ? <Clock3 size={18} /> : <Package size={18} />}
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${viewOnly ? 'text-amber-800' : 'text-[#CCFF00]'}`}>
                {pending ? 'PAYMENT PENDING' : viewOnly ? 'VIEW-ONLY ACCESS' : trial ? '3-DAY FREE TRIAL' : 'TRIAL ACCESS'}
              </span>
              <h3 className="text-base font-black">
                {pending ? 'Your shop is waiting for payment verification.' : viewOnly ? 'Your storefront is online, but editing is paused.' : trial ? 'Unlimited Pro access is active.' : 'Start your unlimited trial.'}
              </h3>
              <p className={`mt-1 text-xs leading-relaxed ${viewOnly ? 'text-amber-900' : 'text-zinc-400'}`}>
                {pending
                  ? 'Your shop remains view-only while the ThreadZW team verifies your payment.'
                  : viewOnly
                    ? 'Customers can still browse your shop. Pay $1.59/month and wait for admin verification to restore editing and unlimited Pro access.'
                    : trial
                      ? `${trialHours > 24 ? Math.ceil(trialHours / 24) + ' days' : trialHours + ' hours'} left. After the trial, your shop becomes view-only until your monthly payment is verified.`
                      : 'Your 3-day unlimited trial begins when you finish onboarding.'}
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/subscription')} className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-5 py-3 text-xs font-black uppercase ${viewOnly ? 'bg-amber-900 text-white' : 'bg-[#CCFF00] text-black'}`}>
            <span>{pending ? 'VIEW PAYMENT STATUS' : viewOnly ? 'RESTORE PRO — $1.59/MO' : trial ? 'VIEW PLAN' : 'VIEW PRICING'}</span><ArrowRight size={14} />
          </button>
        </div>
        {!trial && viewOnly && <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-white/70 px-3 py-2.5 text-xs font-bold text-amber-950"><Eye size={15} /> View-only mode is active. Existing products are preserved.</div>}
        {trial && <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-bold text-zinc-400"><span>Unlimited products during trial</span><span>$1.59/month after trial</span></div>}
      </div>
    </div>
  );
};

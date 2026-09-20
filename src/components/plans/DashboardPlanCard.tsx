import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, Package, Shield, Sparkles } from 'lucide-react';
import { Shop } from '../../types';
import { resolveSellerCategory } from '../../config/sellerCategories';
import { getProductLimit, isPro, isTrialActive, getTrialDaysRemaining } from '../../config/plans';
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
  const promoTrial = isTrialActive(shop);
  const trialDays = getTrialDaysRemaining(shop);
  const productLimit = getProductLimit(shop);

  if (pro && promoTrial) {
    return (
      <div className="space-y-3">
        <ThemePickerLauncher shop={shop} />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CCFF00] text-black"><Sparkles size={18} /></div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#CCFF00]">NARDO PROMO · PRO ACTIVE</span>
                <h3 className="text-base font-black">Your Pro access is free right now.</h3>
                <p className="mt-1 text-xs text-zinc-400">Unlimited products during your promo period. After it ends, pay $9 once-off to keep Pro.</p>
              </div>
            </div>
            <button onClick={() => navigate('/subscription')} className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#CCFF00] px-5 py-3 text-xs font-black uppercase text-black">
              <span>VIEW PRO — $9</span><ArrowRight size={14} />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-zinc-500"><Clock3 size={13} /> {trialDays} {trialDays === 1 ? 'day' : 'days'} remaining · unlimited products</div>
        </div>
      </div>
    );
  }

  if (pro) {
    return (
      <div className="space-y-3">
        <ThemePickerLauncher shop={shop} />
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-[#CCFF00]"><Sparkles size={18} /></div><div><span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Your plan</span><h3 className="text-sm font-bold text-zinc-900">ThreadZW Pro · Lifetime</h3></div></div>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={13} /> Active</span>
          </div>
          <p className="mt-3 text-[11px] text-zinc-500">Unlimited products · $9 once-off · {liveProductsCount} active products</p>
        </div>
      </div>
    );
  }

  const used = Math.min(liveProductsCount, 3);
  const remaining = Math.max(0, 3 - used);

  return (
    <div className="space-y-3">
      <ThemePickerLauncher shop={shop} />
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CCFF00] text-black"><Package size={18} /></div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#CCFF00]">FREE PLAN</span>
              <h3 className="text-base font-black">Add up to 3 products for free.</h3>
              <p className="mt-1 text-xs text-zinc-400">Use your free storefront to test ThreadZW. Pay $9 once-off whenever you want unlimited products.</p>
            </div>
          </div>
          <button onClick={() => navigate('/subscription')} className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#CCFF00] px-5 py-3 text-xs font-black uppercase text-black">
            <span>START PRO — $9</span><ArrowRight size={14} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-white">Product limit</span>
            <span className="text-[11px] font-bold text-[#CCFF00]">{used}/3 products</span>
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, index) => {
              const filled = index < used;
              return (
                <div key={index} className="flex items-center gap-3 text-xs font-bold">
                  <span className={filled ? 'flex h-6 w-6 items-center justify-center rounded-full bg-[#CCFF00] text-black' : 'flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-zinc-500'}>
                    {filled ? '✓' : index + 1}
                  </span>
                  <span className={filled ? 'text-white' : 'text-zinc-400'}>{filled ? 'Product ' + (index + 1) + ' added' : 'Product ' + (index + 1) + ' available'}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-bold text-zinc-400">
            <span>{remaining} {remaining === 1 ? 'product' : 'products'} remaining</span>
            <span>Pro: unlimited products · $9 once-off</span>
          </div>
        </div>
      </div>
    </div>
  );
};

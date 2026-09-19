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
  if (!shop) return null;

  const category = resolveSellerCategory(shop.page_type);
  const pro = isPro(shop);
  const pending = !pro && (String((shop as any)?.payment_verification_status || '').toLowerCase() === 'pending' || String((shop as any)?.account_status || '').toLowerCase() === 'pending_payment');
  const productLimit = getProductLimit(shop);
  const trialActive = isTrialActive(shop);
  const trialDays = getTrialDaysRemaining(shop);

  if (category !== 'clothing') return null;

  if (pro) {
    return (
      <div className="space-y-3">
        <ThemePickerLauncher shop={shop} />
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-zinc-950 text-[#CCFF00] flex items-center justify-center"><Sparkles size={18} /></div><div><span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Your plan</span><h3 className="text-sm font-bold text-zinc-900">ThreadZW Premium · {trialActive ? 'NARDO Trial' : 'Lifetime'}</h3></div></div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold"><CheckCircle2 size={13} /> Active</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-3">{trialActive ? `Unlimited products · Free for 30 days · ends ${new Date((shop as any).trial_ends_at).toLocaleDateString()}` : `Unlimited products · $9 once-off · ${liveProductsCount} active products`}</p>
        </div>
      </div>
    );
  }

  if (pending) {
    return (
    <div className="space-y-3">
      <ThemePickerLauncher shop={shop} />
      <div className="bg-zinc-950 text-white rounded-2xl p-5 shadow-sm border border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-[#CCFF00] text-black flex items-center justify-center"><Package size={18} /></div><div><span className="text-[10px] font-black uppercase tracking-wider text-[#CCFF00]">{trialActive ? 'FREE TRIAL · 3 DAYS' : 'YOUR TRIAL HAS ENDED'}</span><h3 className="text-base font-black">{trialActive ? 'Start adding your products.' : 'Start Pro to keep selling.'}</h3><p className="text-xs text-zinc-400 mt-1">{trialActive ? 'Try ThreadZW Pro free for 3 days. Add up to 3 products and see your storefront in action.' : 'Your free trial has ended. Pay $9 once-off to unlock unlimited products.'}</p></div></div>
          <button onClick={() => trialActive ? navigate('/dashboard') : navigate('/subscription')} className="inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-[#CCFF00] text-black font-black text-xs uppercase rounded-xl whitespace-nowrap"><span>{trialActive ? 'START YOUR FREE TRIAL' : 'START PRO — $9'}</span><ArrowRight size={14} /></button>
        </div>
        {trialActive ? (
          <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3"><span className="text-[11px] font-black uppercase tracking-wider text-white">Product limit</span><span className="text-[11px] font-bold text-[#CCFF00]">{liveProductsCount}/3 products</span></div>
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, index) => { const filled = index < liveProductsCount; return <div key={index} className="flex items-center gap-3 text-xs font-bold"><span className={filled ? 'flex h-6 w-6 items-center justify-center rounded-full bg-[#CCFF00] text-black' : 'flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-zinc-500'}>{filled ? '✓' : index + 1}</span><span className={filled ? 'text-white' : 'text-zinc-400'}>{filled ? 'Product ' + (index + 1) + ' added' : 'Product ' + (index + 1) + ' available'}</span></div>; })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-bold text-zinc-400"><span>{trialDays} {trialDays === 1 ? 'day' : 'days'} remaining</span><span>After trial: $9 once-off · unlimited products</span></div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4 text-xs font-bold text-zinc-300"><div className="flex items-center gap-2 text-[#CCFF00]"><Shield size={14} /> Product access is locked until Pro is activated.</div><p className="mt-2 text-zinc-500">Your products remain in your account. Pay $9 once-off to reactivate product access and unlimited products.</p></div>
        )}
      </div>
    </div>
  );};

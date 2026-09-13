import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, Package, Shield, Sparkles } from 'lucide-react';
import { Shop } from '../../types';
import { resolveSellerCategory } from '../../config/sellerCategories';
import { getProductLimit, isPro } from '../../config/plans';
import { useNavigate } from 'react-router-dom';

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

  if (category !== 'clothing') return null;

  if (pro) {
    return (
      <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-zinc-950 text-[#CCFF00] flex items-center justify-center"><Sparkles size={18} /></div><div><span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Your plan</span><h3 className="text-sm font-bold text-zinc-900">ThreadZW Premium · Lifetime</h3></div></div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold"><CheckCircle2 size={13} /> Active</span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-3">Unlimited products · $9 once-off · {liveProductsCount} active products</p>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center"><Clock3 size={18} /></div><div><span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Payment pending</span><h3 className="text-sm font-black text-amber-950">You can add up to 9 products while we check your payment.</h3><p className="text-[11px] text-amber-800 mt-1">Once approved, your shop becomes live and products become unlimited.</p></div></div>
          <button onClick={() => navigate('/subscription/success')} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-950 text-white font-extrabold text-xs rounded-xl"><Clock3 size={13} /> Check payment</button>
        </div>
        <div className="mt-3 h-2 rounded-full bg-amber-100 overflow-hidden"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, ((shop as any).product_count || liveProductsCount) / 9 * 100)}%` }} /></div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 text-white rounded-2xl p-5 shadow-sm border border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-[#CCFF00] text-black flex items-center justify-center"><Package size={18} /></div><div><span className="text-[10px] font-black uppercase tracking-wider text-[#CCFF00]">Your shop is ready</span><h3 className="text-base font-black">Subscribe to start adding products.</h3><p className="text-xs text-zinc-400 mt-1">Pay $9 once-off. Your shop becomes live after we approve your NardoPay payment.</p></div></div>
        <button onClick={() => navigate('/subscription')} className="inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-[#CCFF00] text-black font-black text-xs uppercase rounded-xl whitespace-nowrap"><span>Subscribe — $9</span><ArrowRight size={14} /></button>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-zinc-500"><Shield size={13} /> No monthly renewal · NardoPay payment · Unlimited products after approval · Free to set up</div>
    </div>
  );
};

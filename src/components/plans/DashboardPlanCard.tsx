import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Shield, Sparkles, AlertCircle, Users, MessageCircle } from 'lucide-react';
import { Shop } from '../../types';
import { resolveSellerCategory } from '../../config/sellerCategories';
import { getEntitlements, isPro } from '../../config/plans';
import { UpgradePromptModal } from './UpgradePromptModal';

interface DashboardPlanCardProps {
  shop: Shop | null;
  productsCount: number;
  liveProductsCount: number;
}

const UsageMeter: React.FC<{
  label: string;
  value: number;
  limit: number;
  icon: React.ReactNode;
  helper: string;
}> = ({ label, value, limit, icon, helper }) => {
  const percentage = Math.min(100, (value / limit) * 100);
  const reached = value >= limit;
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-white border border-zinc-200 text-zinc-700 flex items-center justify-center shrink-0">{icon}</span>
          <span className="text-xs font-bold text-zinc-800 truncate">{label}</span>
        </div>
        <span className={`text-xs font-black tabular-nums ${reached ? 'text-amber-700' : 'text-zinc-900'}`}>{value} / {limit}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-200 overflow-hidden" aria-label={`${label}: ${value} of ${limit}`}>
        <div className={`h-full rounded-full transition-all duration-500 ${reached ? 'bg-amber-500' : 'bg-[#CCFF00]'}`} style={{ width: `${Math.max(3, percentage)}%` }} />
      </div>
      <p className="text-[10px] leading-relaxed text-zinc-500">{helper}</p>
    </div>
  );
};

export const DashboardPlanCard: React.FC<DashboardPlanCardProps> = ({
  shop,
  productsCount,
  liveProductsCount
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  if (!shop) return null;

  const category = resolveSellerCategory(shop.page_type);
  const pro = isPro(shop);
  const entitlements = getEntitlements(shop, { products: liveProductsCount, vehicles: liveProductsCount });
  const isVehicle = category === 'vehicles';
  const isClothing = category === 'clothing';
  const visits = Number(shop.lifetime_unique_visits || 0);
  const interests = Number(shop.lifetime_interest_events || 0);
  const usageReached = Boolean(shop.usage_quota_exceeded) || visits >= 50 || interests >= 10;

  const planTitle = isVehicle
    ? (pro ? 'Vehicle Premium' : 'Vehicle Free')
    : isClothing
      ? (pro ? 'Clothing Premium' : 'Clothing Free')
      : 'General Free';

  return (
    <>
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${pro ? 'bg-zinc-950 text-[#CCFF00]' : 'bg-zinc-100 text-zinc-700'}`}>
              {pro ? <Sparkles size={18} /> : <Shield size={18} />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Your Plan</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${pro ? 'bg-lime-100 text-lime-900 border border-lime-200' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'}`}>
                  {planTitle}
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mt-0.5">
                {isClothing && !pro ? `${productsCount} products · no product-count limit` : isClothing ? `${productsCount} products · customer actions open` : isVehicle ? `${liveProductsCount} active vehicles` : `${productsCount} active catalog items`}
              </h3>
            </div>
          </div>

          {!pro && category !== 'general' ? (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#CCFF00] hover:bg-[#bbf000] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-2xs active:scale-[0.98] cursor-pointer self-start sm:self-center"
            >
              <span>Upgrade to Premium</span>
              <ArrowRight size={13} className="stroke-[2.5]" />
            </button>
          ) : pro ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold self-start sm:self-center">
              <CheckCircle2 size={13} className="stroke-[2.5]" />
              <span>Premium Active</span>
            </div>
          ) : null}
        </div>

        {isClothing && !pro && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-zinc-900">Lifetime customer access</p>
                <p className="text-[11px] text-zinc-500">Products stay unlimited. These two meters protect the Free allowance.</p>
              </div>
              {usageReached && <AlertCircle size={16} className="text-amber-600 shrink-0" />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <UsageMeter label="Unique visitors" value={visits} limit={50} icon={<Users size={14} />} helper="One count per visitor for the shop’s lifetime." />
              <UsageMeter label="Customer interests" value={interests} limit={10} icon={<MessageCircle size={14} />} helper="WhatsApp clicks and directions opens for life." />
            </div>
            {usageReached && (
              <div className="flex items-start gap-1.5 text-[11px] text-amber-700 font-medium pt-0.5">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <span>Free customer actions are paused after a threshold. Browsing and product management remain available.</span>
              </div>
            )}
          </div>
        )}

        {isClothing && pro && (
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 p-3 text-xs text-emerald-800 font-semibold">
            Premium keeps WhatsApp enquiries, directions and storefront analytics open beyond the Free lifetime allowance.
          </div>
        )}

        {!isClothing && !pro && category !== 'general' && (
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-[#CCFF00] transition-all duration-500" style={{ width: `${Math.max(5, Math.min(100, (liveProductsCount / (entitlements.maxActiveVehicles || 1)) * 100))}%` }} />
            </div>
            <p className="text-[11px] text-zinc-500">Vehicle Free supports {entitlements.maxActiveVehicles || 1} active vehicle.</p>
          </div>
        )}
      </div>

      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        shop={shop}
        category={category}
        reason={isClothing ? 'usage_quota' : 'vehicle_limit'}
      />
    </>
  );
};

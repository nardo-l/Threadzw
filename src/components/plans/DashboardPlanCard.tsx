import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { Shop } from '../../types';
import { resolveSellerCategory } from '../../config/sellerCategories';
import { getEntitlements, isPro } from '../../config/plans';
import { UpgradePromptModal } from './UpgradePromptModal';

interface DashboardPlanCardProps {
  shop: Shop | null;
  productsCount: number;
  liveProductsCount: number;
}

export const DashboardPlanCard: React.FC<DashboardPlanCardProps> = ({
  shop,
  productsCount,
  liveProductsCount
}) => {
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!shop) return null;

  const category = resolveSellerCategory(shop.page_type);
  const pro = isPro(shop);

  const entitlements = getEntitlements(shop, {
    products: liveProductsCount,
    vehicles: liveProductsCount
  });

  const isVehicle = category === 'vehicles';
  const isClothing = category === 'clothing';

  // Compute usage display
  let planTitle = isVehicle
    ? (pro ? 'Vehicle Pro' : 'Vehicle Free')
    : isClothing
    ? (pro ? 'Clothing Pro' : 'Clothing Free')
    : 'General Free';

  let usageText = '';
  let progressPercentage = 0;
  let isNearOrAtLimit = false;

  if (isClothing) {
    if (pro) {
      usageText = `${liveProductsCount} active products • Unlimited listings`;
      progressPercentage = 100;
    } else {
      const limit = entitlements.maxActiveProducts ?? 2;
      usageText = `${liveProductsCount} / ${limit} products used`;
      progressPercentage = Math.min(100, (liveProductsCount / limit) * 100);
      isNearOrAtLimit = liveProductsCount >= limit;
    }
  } else if (isVehicle) {
    if (pro) {
      const limit = entitlements.maxActiveVehicles ?? 20;
      usageText = `${liveProductsCount} / ${limit} active vehicles in showroom`;
      progressPercentage = Math.min(100, (liveProductsCount / limit) * 100);
      isNearOrAtLimit = liveProductsCount >= limit;
    } else {
      const limit = entitlements.maxActiveVehicles ?? 1;
      usageText = `${liveProductsCount} / ${limit} active vehicle in showroom`;
      progressPercentage = Math.min(100, (liveProductsCount / limit) * 100);
      isNearOrAtLimit = liveProductsCount >= limit;
    }
  } else {
    usageText = `${liveProductsCount} active catalog items`;
    progressPercentage = 100;
  }

  return (
    <>
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              pro ? 'bg-zinc-950 text-[#CCFF00]' : 'bg-zinc-100 text-zinc-700'
            }`}>
              {pro ? <Sparkles size={18} /> : <Shield size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Your Plan
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  pro 
                    ? 'bg-lime-100 text-lime-900 border border-lime-200' 
                    : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                }`}>
                  {planTitle}
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mt-0.5 flex items-center gap-1.5">
                {usageText}
              </h3>
            </div>
          </div>

          {!pro && category !== 'general' && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#CCFF00] hover:bg-[#bbf000] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-2xs active:scale-[0.98] cursor-pointer self-start sm:self-center"
            >
              <span>Upgrade to Pro</span>
              <ArrowRight size={13} className="stroke-[2.5]" />
            </button>
          )}

          {pro && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold self-start sm:self-center">
              <CheckCircle2 size={13} className="stroke-[2.5]" />
              <span>Pro Active</span>
            </div>
          )}
        </div>

        {/* Usage Progress Bar for Free Plans */}
        {!pro && category !== 'general' && (
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isNearOrAtLimit ? 'bg-amber-500' : 'bg-[#CCFF00]'
                }`}
                style={{ width: `${Math.max(5, progressPercentage)}%` }}
              />
            </div>
            {isNearOrAtLimit && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium pt-0.5">
                <AlertCircle size={12} className="shrink-0" />
                <span>
                  {isClothing 
                    ? "Limit reached. Upgrade to add more products without listing restrictions." 
                    : "Dealership limit reached. Upgrade to Vehicle Pro to showcase up to 20 vehicles."}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        shop={shop}
        category={category}
        reason={isVehicle ? 'vehicle_limit' : 'product_limit'}
      />
    </>
  );
};

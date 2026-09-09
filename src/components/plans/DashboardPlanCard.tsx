import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import { Shop } from '../../types';
import { resolveSellerCategory } from '../../config/sellerCategories';
import { getEntitlements, isPro, getProductLimit } from '../../config/plans';
import { UpgradePromptModal } from './UpgradePromptModal';

interface DashboardPlanCardProps {
  shop: Shop | null;
  productsCount: number;
  liveProductsCount: number;
  lifetimeUniqueVisitors?: number;
  lifetimeInterestEvents?: number;
}

export const DashboardPlanCard: React.FC<DashboardPlanCardProps> = ({ shop, productsCount, liveProductsCount }) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  if (!shop) return null;

  const category = resolveSellerCategory(shop.page_type);
  const pro = isPro(shop);
  const entitlements = getEntitlements(shop, { products: liveProductsCount, vehicles: liveProductsCount });
  const isVehicle = category === 'vehicles';
  const isClothing = category === 'clothing';
  const productLimit = getProductLimit(shop);
  const paymentVerificationStatus = String((shop as any)?.payment_verification_status || '').toLowerCase();
  const awaitingPaymentVerification = isClothing && !pro && paymentVerificationStatus === 'pending';
  const clothingLimit = productLimit ?? 3;

  const planTitle = isVehicle
    ? (pro ? 'Vehicle Premium' : 'Vehicle Free')
    : isClothing
      ? (pro ? 'Clothing Premium' : 'Clothing Free')
      : 'General Free';

  const allowanceText = awaitingPaymentVerification
    ? `${productsCount} / 9 products`
    : `${productsCount} / ${clothingLimit} products`;

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
                {isClothing && !pro ? allowanceText : isClothing ? `${productsCount} products · unlimited` : isVehicle ? `${liveProductsCount} active vehicles` : `${productsCount} active catalog items`}
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
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
              <span>Product allowance</span>
              <span>{Math.min(productsCount, clothingLimit)} / {clothingLimit}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-[#CCFF00] transition-all duration-500" style={{ width: `${Math.min(100, (productsCount / clothingLimit) * 100)}%` }} />
            </div>
            <p className="text-[11px] text-zinc-500">
              {awaitingPaymentVerification
                ? 'Payment submitted. You can use up to 9 active products while we verify your payment.'
                : 'Free includes up to 3 active products. Upgrade to Pro for unlimited products.'}
            </p>
          </div>
        )}

        {isClothing && pro && (
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 p-3 text-xs text-emerald-800 font-semibold">
            Premium gives you unlimited products plus premium storefront and analytics features.
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
        reason={isClothing ? 'product_limit' : 'vehicle_limit'}
      />
    </>
  );
};

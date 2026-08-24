import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, X, ShieldAlert, ArrowRight, Layers, Car, ShoppingBag } from 'lucide-react';
import { Shop, SellerCategory } from '../../types';
import { resolveSellerCategory } from '../../config/sellerCategories';
import { getPlanForCategory } from '../../config/plans';

export type UpgradeTriggerReason = 
  | 'product_limit'
  | 'usage_quota'
  | 'vehicle_limit'
  | 'image_limit'
  | 'template_locked'
  | 'analytics_locked'
  | 'branding_locked';

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop?: Shop | null;
  category?: SellerCategory;
  reason?: UpgradeTriggerReason;
  customTitle?: string;
  customMessage?: string;
}

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  isOpen,
  onClose,
  shop,
  category: propCategory,
  reason = 'product_limit',
  customTitle,
  customMessage
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const category = propCategory || resolveSellerCategory(shop?.page_type);
  const proPlan = getPlanForCategory(category, 'premium');

  // Title and message resolution
  let title = customTitle;
  let message = customMessage;
  let icon = <Sparkles className="w-6 h-6 text-black" />;

  if (!title) {
    if (reason === 'product_limit') {
      title = "Your catalog is ready to grow";
      message = "Clothing storefronts have unlimited products on Free. Your upgrade unlocks premium branding and continued customer actions after the lifetime usage thresholds are reached.";
      icon = <ShoppingBag className="w-6 h-6 text-black" />;
    } else if (reason === 'usage_quota') {
      title = "Your free storefront usage is complete";
      message = "Free clothing shops include 50 unique visits and 10 WhatsApp or directions interests for life. Upgrade to Premium to keep receiving customer enquiries without usage gating.";
      icon = <ShieldAlert className="w-6 h-6 text-black" />;
    } else if (reason === 'vehicle_limit') {
      title = "You've reached the 1-vehicle limit on the Free plan";
      message = "Upgrade to Vehicle Pro to list up to 20 active vehicles in your digital showroom.";
      icon = <Car className="w-6 h-6 text-black" />;
    } else if (reason === 'image_limit') {
      title = "Maximum Photo Limit Reached";
      message = category === 'vehicles'
        ? "Free vehicle listings support up to 8 photos. Upgrade to Vehicle Pro for up to 20 photos per listing."
        : "Free product listings support up to 5 photos. Upgrade to Pro for up to 10 photos per listing.";
      icon = <Layers className="w-6 h-6 text-black" />;
    } else if (reason === 'branding_locked') {
      title = "Custom Branding is a Pro Feature";
      message = "Upgrade to Pro ($9 one-off) to remove ThreadZW branding and use custom themes, banners, and logos.";
      icon = <Sparkles className="w-6 h-6 text-black" />;
    } else if (reason === 'template_locked') {
      title = "Premium Theme Locked";
      message = "Access all premium storefront themes and customization options with a Pro plan ($9 one-off).";
      icon = <Sparkles className="w-6 h-6 text-black" />;
    } else {
      title = "Unlock Premium Features";
      message = "Keep your storefront open to customer enquiries with Premium branding and usage access.";
      icon = <ShieldAlert className="w-6 h-6 text-black" />;
    }
  }

  const handleUpgrade = () => {
    onClose();
    navigate('/subscription');
  };

  const isVehicle = category === 'vehicles';
  const priceDisplay = isVehicle ? '$30' : '$9';
  const periodDisplay = isVehicle ? '/year' : 'one-off';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200/80 relative space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Header with Icon */}
        <div className="flex items-start gap-4 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-[#CCFF00] flex items-center justify-center shrink-0 shadow-xs">
            {icon}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-900 text-[10px] font-extrabold uppercase tracking-wide mb-1.5">
              {isVehicle ? 'Vehicle Pro' : 'Pro Plan'}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-zinc-950 tracking-tight leading-snug">
              {title}
            </h3>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs sm:text-sm text-zinc-600 font-normal leading-relaxed">
          {message}
        </p>

        {/* Plan Value Card */}
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-baseline justify-between border-b border-zinc-200/70 pb-3">
            <div>
              <div className="text-xs font-bold text-zinc-900">{isVehicle ? 'Vehicle Pro' : 'ThreadZW Pro'}</div>
              <div className="text-[11px] text-zinc-500 font-medium">
                {isVehicle ? 'Full digital showroom for auto dealerships' : 'Lifetime usage access, unlimited products & premium seller branding'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black text-zinc-950">{priceDisplay}</span>
              <span className="text-xs text-zinc-500 font-bold ml-1">{periodDisplay}</span>
            </div>
          </div>

          {/* Benefits Checklist */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2.5 text-xs text-zinc-800 font-medium">
              <div className="w-4 h-4 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shrink-0">
                <Check size={10} strokeWidth={3} />
              </div>
              <span>{isVehicle ? 'Up to 20 active showroom vehicles' : 'Unlimited active products and customer enquiries'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-800 font-medium">
              <div className="w-4 h-4 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shrink-0">
                <Check size={10} strokeWidth={3} />
              </div>
              <span>{isVehicle ? '$30/year subscription' : '$9 USD one-off lifetime payment via NardoPay'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-800 font-medium">
              <div className="w-4 h-4 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shrink-0">
                <Check size={10} strokeWidth={3} />
              </div>
              <span>All storefront templates & custom color branding</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-800 font-medium">
              <div className="w-4 h-4 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shrink-0">
                <Check size={10} strokeWidth={3} />
              </div>
              <span>Continued WhatsApp ordering, directions and visitor analytics</span>
            </div>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            onClick={handleUpgrade}
            className="w-full sm:flex-1 py-3.5 px-5 bg-[#CCFF00] hover:bg-[#bbf000] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <span>Upgrade to Premium — {priceDisplay} {periodDisplay}</span>
            <ArrowRight size={15} className="stroke-[2.5]" />
          </button>
          
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3.5 px-5 text-zinc-500 hover:text-zinc-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Stay on Free
          </button>
        </div>
      </div>
    </div>
  );
};

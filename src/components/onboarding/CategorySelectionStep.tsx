import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { SellerCategory } from '../../types';
import { ONBOARDING_CATEGORY_OPTIONS } from '../../config/sellerCategories';

interface CategorySelectionStepProps {
  selectedCategory: SellerCategory | null;
  onSelectCategory: (category: SellerCategory) => void;
  onContinue: () => void;
  onBack?: () => void;
  loading?: boolean;
}

export const CategorySelectionStep: React.FC<CategorySelectionStepProps> = ({
  selectedCategory,
  onSelectCategory,
  onContinue,
  onBack,
  loading = false,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clothing is the only currently active category during onboarding
  const effectiveCategory: SellerCategory = 'clothing';

  const handleContinue = () => {
    setValidationError(null);
    onSelectCategory('clothing');
    onContinue();
  };

  const handleSelect = (categoryId: SellerCategory) => {
    if (categoryId !== 'clothing') {
      return; // Do nothing for disabled categories (Cars & Vehicles, Other Products)
    }
    setValidationError(null);
    onSelectCategory('clothing');
  };

  return (
    <motion.div
      key="categorySelectionStep"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col justify-between"
    >
      {/* Top Header Nav */}
      <div className="flex items-center justify-between pt-1 pb-3">
        {onBack ? (
          <button
            type="button"
            id="onboarding-category-back-btn"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <div className="w-8" />
        )}
        <div className="flex items-center gap-1.5 w-32 sm:w-40">
          <div className="h-1.5 rounded-full flex-1 bg-[#C6FF00] transition-all duration-300" />
          <div className="h-1.5 rounded-full flex-1 bg-[#C6FF00] transition-all duration-300" />
          <div className="h-1.5 rounded-full flex-1 bg-zinc-200 transition-all duration-300" />
          <div className="h-1.5 rounded-full flex-1 bg-zinc-200 transition-all duration-300" />
          <div className="h-1.5 rounded-full flex-1 bg-zinc-200 transition-all duration-300" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-5 pt-2">
        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-tight">
            What do you sell?
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal">
Threadzw is built for Zimbabwean clothing and drip shops first. More seller categories will follow.
          </p>
        </div>

        {/* Validation Error Banner (if any) */}
        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-600 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Category Cards List */}
        <div className="space-y-3 pt-1">
          {ONBOARDING_CATEGORY_OPTIONS.filter((option) => option.id === 'clothing').map((option) => {
            const isClothing = option.id === 'clothing';
            const isSelected = isClothing && effectiveCategory === 'clothing';
            const isDisabled = false;

            return (
              <div
                key={option.id}
                id={`category-card-${option.id}`}
                onClick={isDisabled ? undefined : () => handleSelect(option.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-3 relative ${
                  isSelected
                    ? 'bg-white border-2 border-black shadow-sm ring-1 ring-black/5 cursor-pointer'
                    : isDisabled
                    ? 'bg-zinc-50/60 border-zinc-200 opacity-60 cursor-not-allowed select-none'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform ${
                      isSelected
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-800'
                    }`}
                  >
                    <span>{option.icon}</span>
                  </div>
                  <div className="min-w-0 pr-1">
                    <h3 className="text-sm sm:text-base font-extrabold text-black tracking-tight uppercase">
                      {option.label}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-zinc-500 font-medium leading-snug mt-0.5 uppercase tracking-normal">
                      {option.sublabel}
                    </p>
                  </div>
                </div>

                {/* Right side: Badge if disabled, Checkbox / Radio if enabled */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {isDisabled && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-200/80 text-zinc-700 border border-zinc-300/60 shadow-2xs">
                      Coming Soon
                    </span>
                  )}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'border-black bg-black text-white'
                        : 'border-zinc-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Continue Action */}
      <div className="pt-6">
        <button
          type="button"
          id="onboarding-category-continue-btn"
          onClick={handleContinue}
          disabled={loading}
          className="w-full bg-black hover:bg-zinc-800 active:scale-[0.99] text-white font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          <span className="tracking-wider uppercase">Continue</span>
          <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" />
        </button>
      </div>
    </motion.div>
  );
};

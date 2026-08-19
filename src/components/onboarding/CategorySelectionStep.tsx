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

  const handleContinue = () => {
    if (!selectedCategory) {
      setValidationError('Please select a category to continue.');
      return;
    }
    setValidationError(null);
    onContinue();
  };

  const handleSelect = (categoryId: SellerCategory) => {
    setValidationError(null);
    onSelectCategory(categoryId);
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
            Choose what best describes your store to customize your experience.
          </p>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-600 text-xs font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Category Cards List */}
        <div className="space-y-3 pt-1">
          {ONBOARDING_CATEGORY_OPTIONS.map((option) => {
            const isSelected = selectedCategory === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group relative ${
                  isSelected
                    ? 'bg-zinc-50 border-black ring-2 ring-black/10 shadow-sm'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-105 ${
                      isSelected
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-800'
                    }`}
                  >
                    <span>{option.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-black tracking-tight">
                      {option.label}
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium leading-snug mt-0.5">
                      {option.sublabel}
                    </p>
                  </div>
                </div>

                {/* Selection Radio / Check indicator */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'border-black bg-black text-white'
                      : 'border-zinc-300 group-hover:border-zinc-400 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Continue Action */}
      <div className="pt-6">
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="w-full bg-black hover:bg-zinc-800 text-white font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-50"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" />
        </button>
      </div>
    </motion.div>
  );
};

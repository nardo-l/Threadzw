// src/components/design-system/screens/Screen2BusinessType.tsx

import React from 'react';
import { ArrowLeft, ArrowRight, Check, Shirt, ShoppingBag, Store, Car, Footprints } from 'lucide-react';

export type BusinessTypeId = 'clothing' | 'sneakers' | 'thrift' | 'boutique' | 'vehicles';

interface BusinessTypeOption {
  id: BusinessTypeId;
  label: string;
  icon: React.ReactNode;
}

interface Screen2BusinessTypeProps {
  selectedType?: BusinessTypeId;
  onSelectType?: (id: BusinessTypeId) => void;
  onBack?: () => void;
  onContinue?: () => void;
  interactive?: boolean;
}

export const BUSINESS_TYPES: BusinessTypeOption[] = [
  {
    id: 'clothing',
    label: 'Clothing Brand',
    icon: <Shirt className="w-4 h-4" />
  },
  {
    id: 'sneakers',
    label: 'Sneaker Store',
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        {/* Sneaker silhouette */}
        <path d="M21.5 14.5c-.8-.5-1.7-.8-2.6-.9l-3.2-.3-2.1-3.5c-.4-.7-1.1-1.1-1.9-1.2L8.2 8.1c-.8 0-1.6.4-2 1.1L3.4 14c-.6 1-.4 2.3.5 3.1l1.6 1.4c.7.6 1.6.9 2.5.9h11c1.1 0 2-.9 2-2v-1.5c.6-.3 1-.8 1-1.4 0-.4-.2-.8-.5-1zM5.5 17.5l-1.4-1.2c-.3-.3-.4-.7-.2-1l2.4-4.2c.1-.2.4-.4.7-.4l2.8.4 1.7 2.8-4.2 2.2c-.6.4-1.2.9-1.8 1.4zm13.5 0h-9.5c.4-.4.8-.8 1.3-1.1l4.8-2.5c.3-.2.7-.1.9.2l1.6 2.4c.2.3.5.5.9.5v.5z" />
      </svg>
    )
  },
  {
    id: 'thrift',
    label: 'Thrift Store',
    icon: <ShoppingBag className="w-4 h-4" />
  },
  {
    id: 'boutique',
    label: 'Fashion Boutique',
    icon: <Store className="w-4 h-4" />
  },
  {
    id: 'vehicles',
    label: 'Vehicle Dealership',
    icon: <Car className="w-4 h-4" />
  }
];

export const Screen2BusinessType: React.FC<Screen2BusinessTypeProps> = ({
  selectedType = 'sneakers',
  onSelectType,
  onBack,
  onContinue,
  interactive = false
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black">
      {/* Top Navigation & Step Indicator */}
      <div className="space-y-3 pt-1">
        <button
          onClick={onBack}
          className={`p-1.5 -ml-1.5 rounded-full text-black hover:bg-zinc-100 transition-colors ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <ArrowLeft size={18} className="stroke-[2.5]" />
        </button>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-black uppercase tracking-wider">
            Step 1 of 4
          </span>
          {/* 4-segment Progress Bar: Step 1 filled in lime */}
          <div className="flex items-center gap-1.5 w-28">
            <div className="h-1 rounded-full flex-1 bg-[#C6FF00]" />
            <div className="h-1 rounded-full flex-1 bg-zinc-200" />
            <div className="h-1 rounded-full flex-1 bg-zinc-200" />
            <div className="h-1 rounded-full flex-1 bg-zinc-200" />
          </div>
        </div>
      </div>

      {/* Headline & Subtext */}
      <div className="py-2 space-y-1">
        <h1 className="text-2xl sm:text-[28px] font-black text-black tracking-tight leading-tight">
          What do<br />you sell?
        </h1>
        <p className="text-xs text-zinc-500 font-medium">
          We'll personalize your store.
        </p>
      </div>

      {/* Business Type Selection Cards List */}
      <div className="space-y-2.5 my-auto py-1">
        {BUSINESS_TYPES.map((type) => {
          const isSelected = selectedType === type.id;
          return (
            <div
              key={type.id}
              onClick={() => interactive && onSelectType?.(type.id)}
              className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                isSelected
                  ? 'border-[#C6FF00] bg-white ring-1 ring-[#C6FF00] shadow-[0_4px_12px_rgba(198,255,0,0.15)]'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              } ${interactive ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-black text-[#C6FF00]' : 'bg-zinc-100 text-black'
                }`}>
                  {type.icon}
                </div>
                <span className="text-xs sm:text-[13px] font-bold text-black tracking-tight">
                  {type.label}
                </span>
              </div>

              {/* Radio check status indicator */}
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-[#C6FF00] text-black ring-2 ring-[#C6FF00]/30'
                  : 'border border-zinc-300 bg-white'
              }`}>
                {isSelected && <Check size={12} className="stroke-[3.5]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA Button */}
      <div className="pt-3">
        <button
          onClick={onContinue}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-6 rounded-2xl flex items-center justify-between transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <span className="font-extrabold tracking-wide">CONTINUE</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};

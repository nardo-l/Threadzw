// src/components/design-system/screens/Screen6FirstProductWizard.tsx

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, ChevronDown, Image as ImageIcon } from 'lucide-react';

interface Screen6FirstProductWizardProps {
  productName?: string;
  onProductNameChange?: (val: string) => void;
  price?: string;
  onPriceChange?: (val: string) => void;
  category?: string;
  onCategoryChange?: (val: string) => void;
  description?: string;
  onDescriptionChange?: (val: string) => void;
  photoCount?: number;
  onPhotosUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack?: () => void;
  onPublishProduct?: () => void;
  interactive?: boolean;
}

export const Screen6FirstProductWizard: React.FC<Screen6FirstProductWizardProps> = ({
  productName = '',
  onProductNameChange,
  price = '29.99',
  onPriceChange,
  category = '',
  onCategoryChange,
  description = '',
  onDescriptionChange,
  photoCount = 0,
  onPhotosUpload,
  onBack,
  onPublishProduct,
  interactive = false
}) => {
  const [internalName, setInternalName] = useState(productName || 'Vintage Nike Windbreaker');
  const [internalPrice, setInternalPrice] = useState(price || '29.99');
  const [internalCategory, setInternalCategory] = useState(category || 'Streetwear & Jackets');
  const [internalDesc, setInternalDesc] = useState(description || 'Rare 90s vintage windbreaker in mint condition.');
  const [internalPhotos, setInternalPhotos] = useState<string[]>([]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalName(e.target.value);
    onProductNameChange?.(e.target.value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalPrice(e.target.value);
    onPriceChange?.(e.target.value);
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 250) {
      setInternalDesc(e.target.value);
      onDescriptionChange?.(e.target.value);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newUrls = Array.from(files).map((f) => URL.createObjectURL(f));
      setInternalPhotos((prev) => [...prev, ...newUrls].slice(0, 10));
      onPhotosUpload?.(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black">
      {/* Top Back Nav & Step Progress Indicator */}
      <div className="space-y-2 pt-1">
        <button
          onClick={onBack}
          className={`p-1.5 -ml-1.5 rounded-full text-black hover:bg-zinc-100 transition-colors ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <ArrowLeft size={18} className="stroke-[2.5]" />
        </button>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-black">
            Step 4 of 4
          </span>
        </div>

        {/* 6-node segmented timeline */}
        <div className="flex items-center gap-1.5 w-full py-0.5">
          {[1, 2, 3, 4, 5, 6].map((node) => (
            <div key={node} className="flex-1 flex items-center">
              <div className="h-1 flex-1 bg-[#C6FF00] rounded-full" />
              <div className="w-2 h-2 rounded-full bg-[#C6FF00] -ml-1 shrink-0 ring-2 ring-white" />
            </div>
          ))}
        </div>
      </div>

      {/* Headline & Subtext */}
      <div className="py-1.5 space-y-0.5">
        <h1 className="text-2xl sm:text-[26px] font-black text-black tracking-tight leading-tight">
          Add your<br />first product.
        </h1>
        <p className="text-xs text-zinc-500 font-medium">
          Let's give customers something to buy.
        </p>
      </div>

      {/* Form Fields & Photo Upload Box */}
      <div className="space-y-2 my-auto py-1">
        
        {/* Photo Upload Container */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-black">
              Product Photos
            </label>
            <span className="text-[10px] text-zinc-400 font-mono font-medium">
              {internalPhotos.length} / 10 Photos
            </span>
          </div>

          <label className={`w-full py-3.5 px-4 border border-dashed border-zinc-300 hover:border-black rounded-2xl bg-zinc-50/70 flex flex-col items-center justify-center text-center transition-all ${
            interactive ? 'cursor-pointer active:bg-zinc-100' : 'cursor-default'
          }`}>
            <input
              type="file"
              multiple
              accept="image/png, image/jpeg"
              onChange={handleFileUpload}
              disabled={!interactive}
              className="hidden"
            />
            {internalPhotos.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
                {internalPhotos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Upload ${i}`}
                    className="w-10 h-10 rounded-lg object-cover border border-zinc-200"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-black flex items-center justify-center mb-1.5 shadow-2xs">
                  <Plus size={18} className="stroke-[3]" />
                </div>
                <span className="text-[11px] font-bold text-black">
                  Tap to upload photos
                </span>
                <span className="text-[9px] text-zinc-400 font-medium">
                  PNG, JPG up to 10MB
                </span>
              </>
            )}
          </label>
        </div>

        {/* Product Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Product Name
          </label>
          <input
            type="text"
            value={interactive ? internalName : ''}
            onChange={handleNameChange}
            placeholder="e.g. Vintage Nike Windbreaker"
            readOnly={!interactive}
            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        {/* Price (USD) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Price (USD)
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs font-bold text-zinc-500">$</span>
            <input
              type="text"
              value={interactive ? internalPrice : '29.99'}
              onChange={handlePriceChange}
              placeholder="29.99"
              readOnly={!interactive}
              className="w-full bg-white border border-zinc-200 rounded-xl pl-7 pr-3 py-2 text-xs font-semibold text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Category
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={interactive ? internalCategory : ''}
              onChange={(e) => {
                setInternalCategory(e.target.value);
                onCategoryChange?.(e.target.value);
              }}
              placeholder="Select category"
              readOnly={!interactive}
              className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors pr-8"
            />
            <ChevronDown size={14} className="absolute right-3 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-black">
              Description
            </label>
            <span className="text-[10px] text-zinc-400 font-mono">
              {internalDesc.length}/250
            </span>
          </div>
          <textarea
            value={internalDesc}
            onChange={handleDescChange}
            placeholder="Describe your product..."
            rows={2}
            readOnly={!interactive}
            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-medium text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors resize-none leading-relaxed"
          />
        </div>

      </div>

      {/* Bottom CTA Button */}
      <div className="pt-2">
        <button
          onClick={onPublishProduct}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-6 rounded-2xl flex items-center justify-between transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <span className="font-extrabold tracking-wide">PUBLISH PRODUCT</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};

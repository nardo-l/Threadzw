// src/components/design-system/screens/Screen4ShopSetup.tsx

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CloudUpload, Check, Image as ImageIcon } from 'lucide-react';

interface Screen4ShopSetupProps {
  storeName?: string;
  onStoreNameChange?: (val: string) => void;
  whatsappNumber?: string;
  onWhatsappNumberChange?: (val: string) => void;
  city?: string;
  onCityChange?: (val: string) => void;
  description?: string;
  onDescriptionChange?: (val: string) => void;
  logoPreview?: string | null;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack?: () => void;
  onCreateStore?: () => void;
  interactive?: boolean;
}

export const Screen4ShopSetup: React.FC<Screen4ShopSetupProps> = ({
  storeName = '',
  onStoreNameChange,
  whatsappNumber = '',
  onWhatsappNumberChange,
  city = '',
  onCityChange,
  description = '',
  onDescriptionChange,
  logoPreview = null,
  onLogoUpload,
  onBack,
  onCreateStore,
  interactive = false
}) => {
  const [internalStoreName, setInternalStoreName] = useState(storeName || 'Urban Vault');
  const [internalWhatsapp, setInternalWhatsapp] = useState(whatsappNumber || '+263 77 123 4567');
  const [internalCity, setInternalCity] = useState(city || 'Bulawayo');
  const [internalDesc, setInternalDesc] = useState(description || '');
  const [internalLogo, setInternalLogo] = useState<string | null>(logoPreview);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalStoreName(e.target.value);
    onStoreNameChange?.(e.target.value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalWhatsapp(e.target.value);
    onWhatsappNumberChange?.(e.target.value);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalCity(e.target.value);
    onCityChange?.(e.target.value);
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 150) {
      setInternalDesc(e.target.value);
      onDescriptionChange?.(e.target.value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setInternalLogo(url);
      onLogoUpload?.(e);
    }
  };

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
            Step 3 of 4
          </span>
          {/* 4-segment Progress Bar: Steps 1, 2, 3 filled in lime */}
          <div className="flex items-center gap-1.5 w-28">
            <div className="h-1 rounded-full flex-1 bg-[#C6FF00]" />
            <div className="h-1 rounded-full flex-1 bg-[#C6FF00]" />
            <div className="h-1 rounded-full flex-1 bg-[#C6FF00]" />
            <div className="h-1 rounded-full flex-1 bg-zinc-200" />
          </div>
        </div>
      </div>

      {/* Headline */}
      <div className="py-2 space-y-1">
        <h1 className="text-2xl sm:text-[26px] font-black text-black tracking-tight leading-tight">
          Tell customers<br />about your store.
        </h1>
      </div>

      {/* Form Fields List (Scrollable if compact) */}
      <div className="space-y-2.5 my-auto py-1">
        {/* Field 1: Store Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Store Name
          </label>
          <input
            type="text"
            value={interactive ? internalStoreName : ''}
            onChange={handleNameChange}
            placeholder="e.g. Urban Vault"
            readOnly={!interactive}
            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        {/* Field 2: WhatsApp Number */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            WhatsApp Number
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3 flex items-center pointer-events-none">
              <svg className="w-3.5 h-3.5 text-[#25D366] fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
            </div>
            <input
              type="text"
              value={interactive ? internalWhatsapp : ''}
              onChange={handlePhoneChange}
              placeholder="+263 77 123 4567"
              readOnly={!interactive}
              className="w-full bg-white border border-zinc-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* Field 3: City */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            City
          </label>
          <input
            type="text"
            value={interactive ? internalCity : ''}
            onChange={handleCityChange}
            placeholder="e.g. Bulawayo"
            readOnly={!interactive}
            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        {/* Field 4: Store Description with Counter */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-black">
              Store Description
            </label>
            <span className="text-[10px] text-zinc-400 font-mono">
              {internalDesc.length}/150
            </span>
          </div>
          <textarea
            value={internalDesc}
            onChange={handleDescChange}
            placeholder="Tell customers about your brand..."
            rows={2}
            readOnly={!interactive}
            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-medium text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Field 5: Upload Logo Container */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Upload Logo
          </label>
          <label className={`w-full py-3 px-4 border border-dashed border-zinc-300 hover:border-black rounded-xl bg-zinc-50/50 flex flex-col items-center justify-center text-center transition-all ${
            interactive ? 'cursor-pointer active:bg-zinc-100' : 'cursor-default'
          }`}>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              disabled={!interactive}
              className="hidden"
            />
            {internalLogo ? (
              <div className="flex items-center gap-2">
                <img src={internalLogo} alt="Logo Preview" className="w-8 h-8 rounded-lg object-cover border border-zinc-200" />
                <span className="text-[11px] font-bold text-black">Logo selected ✓</span>
              </div>
            ) : (
              <>
                <CloudUpload size={16} className="text-zinc-600 mb-1 stroke-[2]" />
                <span className="text-[11px] font-bold text-black">Tap to upload logo</span>
                <span className="text-[9px] text-zinc-400 font-medium">PNG or JPG. Max 2MB</span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="pt-2">
        <button
          onClick={onCreateStore}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-6 rounded-2xl flex items-center justify-between transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <span className="font-extrabold tracking-wide">CREATE MY STORE</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};

// src/components/design-system/screens/Screen14EditStore.tsx

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ChevronDown, 
  UploadCloud, 
  MessageCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface Screen14EditStoreProps {
  onBack?: () => void;
  onSaveChanges?: () => void;
  interactive?: boolean;
}

export const Screen14EditStore: React.FC<Screen14EditStoreProps> = ({
  onBack,
  onSaveChanges,
  interactive = false
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'branding' | 'pages' | 'settings'>('details');
  const [storeName, setStoreName] = useState('Urban Vault');
  const [category, setCategory] = useState('Clothing Brand');
  const [whatsapp, setWhatsapp] = useState('+263 77 123 4567');
  const [description, setDescription] = useState('Streetwear for the culture. Quality pieces that speak for you.');

  const handleSave = () => {
    toast.success('Store details updated successfully!');
    onSaveChanges?.();
  };

  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black -mx-1">
      
      {/* Top Header Bar */}
      <div className="flex items-center gap-2 pt-1 px-1">
        <button
          onClick={onBack}
          className={`p-1 -ml-1 rounded-full text-black hover:bg-zinc-100 transition-colors ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <ArrowLeft size={16} className="stroke-[2.5]" />
        </button>
        <span className="text-xs font-bold text-black tracking-tight">
          Edit Store
        </span>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-1.5 px-1 py-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => interactive && setActiveTab('details')}
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
            activeTab === 'details'
              ? 'bg-[#C6FF00] text-black shadow-2xs'
              : 'text-zinc-500 hover:text-black font-medium'
          } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        >
          Details
        </button>

        <button
          onClick={() => interactive && setActiveTab('branding')}
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
            activeTab === 'branding'
              ? 'bg-[#C6FF00] text-black shadow-2xs'
              : 'text-zinc-500 hover:text-black font-medium'
          } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        >
          Branding
        </button>

        <button
          onClick={() => interactive && setActiveTab('pages')}
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
            activeTab === 'pages'
              ? 'bg-[#C6FF00] text-black shadow-2xs'
              : 'text-zinc-500 hover:text-black font-medium'
          } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        >
          Pages
        </button>

        <button
          onClick={() => interactive && setActiveTab('settings')}
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-[#C6FF00] text-black shadow-2xs'
              : 'text-zinc-500 hover:text-black font-medium'
          } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        >
          Settings
        </button>
      </div>

      {/* Headline & Subtext */}
      <div className="py-1 px-1 space-y-0.5">
        <h1 className="text-2xl sm:text-[26px] font-black text-black tracking-tight leading-tight">
          Store details
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          Update your store information.
        </p>
      </div>

      {/* Form Fields Container */}
      <div className="space-y-2.5 px-1 my-auto py-1">
        
        {/* Store Name Field */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Store Name
          </label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => interactive && setStoreName(e.target.value)}
            disabled={!interactive}
            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-black focus:outline-none focus:border-black shadow-2xs"
            placeholder="Store Name"
          />
        </div>

        {/* Store Category Field */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Store Category
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => interactive && setCategory(e.target.value)}
              disabled={!interactive}
              className="w-full appearance-none bg-white border border-zinc-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-black focus:outline-none focus:border-black shadow-2xs cursor-pointer"
            >
              <option value="Clothing Brand">Clothing Brand</option>
              <option value="Sneaker Reseller">Sneaker Reseller</option>
              <option value="Vintage & Thrift">Vintage & Thrift</option>
              <option value="Auto Dealership">Auto Dealership</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* WhatsApp Number Field */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            WhatsApp Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => interactive && setWhatsapp(e.target.value)}
              disabled={!interactive}
              className="w-full bg-white border border-zinc-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-black focus:outline-none focus:border-black shadow-2xs"
              placeholder="+263..."
            />
            <MessageCircle size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>

        {/* Store Description Field */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Store Description
          </label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => interactive && setDescription(e.target.value)}
              disabled={!interactive}
              rows={2}
              maxLength={150}
              className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs font-medium text-black focus:outline-none focus:border-black shadow-2xs resize-none"
              placeholder="Tell customers what you sell..."
            />
            <span className="absolute right-2.5 bottom-2 text-[9px] font-mono text-zinc-400">
              {description.length}/150
            </span>
          </div>
        </div>

        {/* Store Logo Section */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Store Logo
          </label>
          <div className="flex items-center gap-2.5">
            {/* Current Logo Display */}
            <div className="w-14 h-14 rounded-xl bg-black text-white flex flex-col items-center justify-center p-1 shrink-0 border border-zinc-200 shadow-2xs">
              <span className="text-[9px] font-black tracking-tight leading-none text-center">
                URBAN<br />VAULT
              </span>
            </div>

            {/* Change Logo Upload Box */}
            <div 
              onClick={() => interactive && toast.info('Photo file picker triggered')}
              className={`flex-1 h-14 bg-white border border-dashed border-zinc-300 hover:border-zinc-500 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${
                interactive ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <UploadCloud size={16} className="text-zinc-500" />
              <span className="text-[10px] font-bold text-zinc-700">
                Change logo
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Save Changes CTA */}
      <div className="pt-2 px-1">
        <button
          onClick={interactive ? handleSave : onSaveChanges}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <span className="font-extrabold tracking-wide">SAVE CHANGES</span>
        </button>
      </div>

    </div>
  );
};

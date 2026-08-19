// src/components/design-system/screens/Screen13StorePreview.tsx

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Smartphone, 
  Monitor, 
  Edit3, 
  ExternalLink, 
  Search, 
  ShoppingBag, 
  Menu as MenuIcon 
} from 'lucide-react';

interface Screen13StorePreviewProps {
  onEditStore?: () => void;
  onOpenStore?: () => void;
  onBack?: () => void;
  interactive?: boolean;
}

export const Screen13StorePreview: React.FC<Screen13StorePreviewProps> = ({
  onEditStore,
  onOpenStore,
  onBack,
  interactive = false
}) => {
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');

  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black -mx-1">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className={`p-1 -ml-1 rounded-full text-black hover:bg-zinc-100 transition-colors ${
              interactive ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <ArrowLeft size={16} className="stroke-[2.5]" />
          </button>
          <span className="text-xs font-bold text-black tracking-tight">
            Preview Store
          </span>
        </div>

        {/* Mobile / Desktop Device Mode Toggles */}
        <div className="flex items-center gap-1.5 text-zinc-400">
          <button
            onClick={() => interactive && setDeviceMode('mobile')}
            className={`p-1 rounded-md transition-colors ${
              deviceMode === 'mobile' ? 'text-[#84cc00]' : 'text-zinc-400 hover:text-black'
            } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            title="Mobile View"
          >
            <Smartphone size={15} className="stroke-[2.5]" />
          </button>
          <button
            onClick={() => interactive && setDeviceMode('desktop')}
            className={`p-1 rounded-md transition-colors ${
              deviceMode === 'desktop' ? 'text-[#84cc00]' : 'text-zinc-400 hover:text-black'
            } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            title="Desktop View"
          >
            <Monitor size={15} />
          </button>
        </div>
      </div>

      {/* Headline & Subtext */}
      <div className="py-1 px-1 space-y-0.5">
        <h1 className="text-2xl sm:text-[26px] font-black text-black tracking-tight leading-tight">
          This is how your<br />store looks.
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          Your customers will see your store like this.
        </p>
      </div>

      {/* Large Storefront In-App Preview Container */}
      <div className="px-1 my-auto py-1">
        <div className="w-full bg-white border border-zinc-200 rounded-[22px] overflow-hidden shadow-sm relative">
          
          {/* Store Hero Banner */}
          <div className="relative bg-[#09090B] text-white p-3.5 overflow-hidden">
            {/* Background texture cutout */}
            <div className="absolute inset-0 opacity-40 mix-blend-luminosity">
              <img
                src="https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/save%20it%20for%20later.jfif"
                alt="Store background"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80';
                }}
              />
            </div>
            
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

            <div className="relative z-10 space-y-2">
              {/* Store Header Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  URBAN VAULT
                </span>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Search size={12} />
                  <ShoppingBag size={12} />
                  <MenuIcon size={12} />
                </div>
              </div>

              {/* Tagline */}
              <p className="text-[9px] text-zinc-300 font-medium">
                Streetwear For The Culture.
              </p>

              {/* WhatsApp Chat Button */}
              <div className="pt-0.5">
                <div className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-2.5 py-1 rounded-full text-[9px] font-bold shadow-xs">
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                  <span>Chat on WhatsApp</span>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Products Section in Preview */}
          <div className="p-3 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-black">
                Featured Products
              </span>
              <span className="text-[9px] font-bold text-[#84cc00]">
                View all
              </span>
            </div>

            {/* 2-Column Product Grid */}
            <div className="grid grid-cols-2 gap-2">
              
              {/* Product 1 */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-2 space-y-1">
                <div className="w-full h-16 rounded-lg overflow-hidden bg-white border border-zinc-200/60 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80"
                    alt="Vintage Graphic Hoodie"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-0.5">
                  <h5 className="text-[9px] font-black text-black truncate">
                    Vintage Graphic Hoodie
                  </h5>
                  <p className="text-[9px] font-bold text-black">
                    $29.99
                  </p>
                </div>
              </div>

              {/* Product 2 */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-2 space-y-1">
                <div className="w-full h-16 rounded-lg overflow-hidden bg-white border border-zinc-200/60 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=300&q=80"
                    alt="Retro Jordan 4 White Cement"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-0.5">
                  <h5 className="text-[9px] font-black text-black truncate">
                    Retro Jordan 4 White Cement
                  </h5>
                  <p className="text-[9px] font-bold text-black">
                    $179.99
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Dual Bottom Action Buttons */}
      <div className="space-y-2 pt-2 px-1">
        {/* EDIT STORE Button */}
        <button
          onClick={onEditStore}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <Edit3 size={15} className="stroke-[2.5]" />
          <span className="font-extrabold tracking-wide">EDIT STORE</span>
        </button>

        {/* OPEN STORE Button */}
        <button
          onClick={onOpenStore}
          className={`w-full bg-white hover:bg-zinc-50 border border-zinc-200 active:scale-[0.98] text-black font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-2xs ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <ExternalLink size={15} className="stroke-[2.5]" />
          <span className="font-extrabold tracking-wide">OPEN STORE</span>
        </button>
      </div>

    </div>
  );
};

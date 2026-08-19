// src/components/design-system/screens/Screen5StoreLinkCreated.tsx

import React, { useState } from 'react';
import { Copy, Share2, ArrowRight, Check, Search, Menu, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

interface Screen5StoreLinkCreatedProps {
  storeSlug?: string;
  storeName?: string;
  onCopyLink?: () => void;
  onShareStore?: () => void;
  onAddProducts?: () => void;
  interactive?: boolean;
}

export const Screen5StoreLinkCreated: React.FC<Screen5StoreLinkCreatedProps> = ({
  storeSlug = 'urbanvault',
  storeName = 'URBAN VAULT',
  onCopyLink,
  onShareStore,
  onAddProducts,
  interactive = false
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://threadzw.com/shop/${storeSlug}`);
    setCopied(true);
    toast.success('Store link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
    onCopyLink?.();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: storeName,
        text: `Check out ${storeName} on ThreadZW!`,
        url: `https://threadzw.com/shop/${storeSlug}`
      }).catch(() => {});
    } else {
      handleCopy();
    }
    onShareStore?.();
  };

  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black">
      {/* Top Step Indicator with 6 connected dots / segmented progress */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-black">
            Step 4 of 4
          </span>
        </div>

        {/* 6-node segmented timeline (fully filled in lime) */}
        <div className="flex items-center gap-1.5 w-full py-1">
          {[1, 2, 3, 4, 5, 6].map((node) => (
            <div key={node} className="flex-1 flex items-center">
              <div className="h-1 flex-1 bg-[#C6FF00] rounded-full" />
              <div className="w-2 h-2 rounded-full bg-[#C6FF00] -ml-1 shrink-0 ring-2 ring-white" />
            </div>
          ))}
        </div>
      </div>

      {/* Headline & Subtext */}
      <div className="py-2 space-y-1">
        <h1 className="text-2xl sm:text-[28px] font-black text-black tracking-tight leading-tight flex items-center gap-2">
          <span>🎉</span>
          <span>Your store<br />is ready.</span>
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          Your customers can now browse your products online.
        </p>
      </div>

      {/* Store Link Card & Actions */}
      <div className="space-y-2.5 my-auto py-1">
        
        {/* Link Box */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Your store link
          </label>
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-3.5 flex items-center justify-between font-mono text-xs shadow-2xs">
            <span className="font-bold text-black truncate">
              threadzw.com/shop/<span className="text-[#84cc00] font-black">{storeSlug}</span>
            </span>
          </div>
        </div>

        {/* 2 Equal Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Action 1: Copy Link */}
          <button
            onClick={interactive ? handleCopy : undefined}
            className={`py-3 px-3 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 flex flex-col items-center justify-center gap-1.5 transition-all text-black shadow-2xs ${
              interactive ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
            }`}
          >
            {copied ? (
              <Check size={16} className="text-black stroke-[3]" />
            ) : (
              <Copy size={16} className="text-black stroke-[2]" />
            )}
            <span className="text-[10px] font-black tracking-wider uppercase">
              {copied ? 'COPIED' : 'COPY LINK'}
            </span>
          </button>

          {/* Action 2: Share Store */}
          <button
            onClick={interactive ? handleShare : undefined}
            className={`py-3 px-3 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 flex flex-col items-center justify-center gap-1.5 transition-all text-black shadow-2xs ${
              interactive ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
            }`}
          >
            <svg className="w-4 h-4 text-black fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
            <span className="text-[10px] font-black tracking-wider uppercase">
              SHARE STORE
            </span>
          </button>
        </div>

        {/* Store Preview Banner Card */}
        <div className="space-y-1 pt-1">
          <label className="text-[11px] font-bold text-black block">
            Store preview
          </label>
          <div className="w-full bg-[#0E0E10] text-white rounded-2xl p-3.5 relative overflow-hidden shadow-md flex items-center justify-between border border-zinc-800">
            {/* Left Content */}
            <div className="space-y-2 max-w-[155px] z-10">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-black tracking-wider uppercase text-white">
                  {storeName}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-black leading-tight tracking-tight text-white">
                  Streetwear<br />For The Culture.
                </h4>
              </div>
              <div>
                <span className="inline-block bg-[#C6FF00] text-black font-extrabold text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-md">
                  SHOP NOW
                </span>
              </div>
            </div>

            {/* Right Header Icons & Streetwear imagery */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-zinc-400 z-10">
              <Search size={11} />
              <Menu size={11} />
              <ShoppingBag size={11} />
            </div>

            {/* Background Image / Cutout Graphic */}
            <div className="w-28 h-24 absolute right-0 bottom-0 overflow-hidden rounded-br-2xl pointer-events-none opacity-90">
              <img
                src="https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/save%20it%20for%20later.jfif"
                alt="Apparel Rack"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E10] via-transparent to-transparent" />
            </div>
          </div>
        </div>

      </div>

      {/* Bottom CTA Button */}
      <div className="pt-2">
        <button
          onClick={onAddProducts}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-6 rounded-2xl flex items-center justify-between transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <span className="font-extrabold tracking-wide">ADD PRODUCTS</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};

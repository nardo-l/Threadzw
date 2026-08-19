// src/components/design-system/screens/Screen10ShareStore.tsx

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ChevronRight, 
  Home, 
  Tag, 
  PlusCircle, 
  BarChart2, 
  Menu as MenuIcon 
} from 'lucide-react';
import { toast } from 'sonner';

interface Screen10ShareStoreProps {
  storeSlug?: string;
  storeName?: string;
  onBack?: () => void;
  onShareWhatsApp?: () => void;
  onCopyInstagramBio?: () => void;
  onCopyTikTokBio?: () => void;
  interactive?: boolean;
}

export const Screen10ShareStore: React.FC<Screen10ShareStoreProps> = ({
  storeSlug = 'urbanvault',
  storeName = 'URBAN VAULT',
  onBack,
  onShareWhatsApp,
  onCopyInstagramBio,
  onCopyTikTokBio,
  interactive = false
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInsta, setCopiedInsta] = useState(false);
  const [copiedTikTok, setCopiedTikTok] = useState(false);

  const fullUrl = `https://threadzw.com/shop/${storeSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toast.success('Store link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyInsta = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedInsta(true);
    toast.success('Instagram bio link copied!');
    setTimeout(() => setCopiedInsta(false), 2000);
    onCopyInstagramBio?.();
  };

  const handleCopyTikTok = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedTikTok(true);
    toast.success('TikTok bio link copied!');
    setTimeout(() => setCopiedTikTok(false), 2000);
    onCopyTikTokBio?.();
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Check out my store ${storeName} on ThreadZW: ${fullUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    onShareWhatsApp?.();
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
          Share Your Store
        </span>
      </div>

      {/* Headline & Subtext */}
      <div className="py-1 px-1 space-y-0.5">
        <h1 className="text-2xl sm:text-[26px] font-black text-black tracking-tight leading-tight">
          Get more eyes<br />on your store.
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          Share your store link everywhere your customers are.
        </p>
      </div>

      {/* Sharing Cards Container */}
      <div className="space-y-2 px-1 my-auto py-1">
        
        {/* Store Link Card */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Store Link
          </label>
          <div className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 flex items-center justify-between font-mono text-xs shadow-2xs">
            <span className="font-semibold text-black truncate text-[11px]">
              threadzw.com/shop/<span className="text-[#84cc00] font-black">{storeSlug}</span>
            </span>
            <button
              onClick={interactive ? handleCopyLink : undefined}
              className={`p-1 rounded-md hover:bg-zinc-100 text-zinc-700 transition-colors ${
                interactive ? 'cursor-pointer active:scale-95' : 'cursor-default'
              }`}
              title="Copy Link"
            >
              {copiedLink ? (
                <Check size={14} className="text-black stroke-[3]" />
              ) : (
                <Copy size={14} className="stroke-[2.2]" />
              )}
            </button>
          </div>
        </div>

        {/* Share on WhatsApp */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Share on WhatsApp
          </label>
          <div
            onClick={interactive ? handleWhatsApp : undefined}
            className={`w-full bg-white border border-zinc-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs hover:border-zinc-300 transition-all ${
              interactive ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xs shrink-0">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-black">
                Share your store with contacts
              </span>
            </div>
            <ChevronRight size={15} className="text-zinc-400" />
          </div>
        </div>

        {/* Instagram Bio */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            Instagram Bio
          </label>
          <div className="w-full bg-white border border-zinc-200 rounded-xl p-2 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 pl-1">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shadow-2xs shrink-0">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-black">
                Add link to your bio
              </span>
            </div>
            <button
              onClick={interactive ? handleCopyInsta : undefined}
              className={`bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-black text-[10px] uppercase px-3 py-1.5 rounded-lg transition-all shadow-2xs ${
                interactive ? 'cursor-pointer active:scale-95' : 'cursor-default'
              }`}
            >
              {copiedInsta ? 'COPIED' : 'COPY'}
            </button>
          </div>
        </div>

        {/* TikTok Bio */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-black block">
            TikTok Bio
          </label>
          <div className="w-full bg-white border border-zinc-200 rounded-xl p-2 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 pl-1">
              <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center shadow-2xs shrink-0">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.32V8.2a8.21 8.21 0 0 0 4.92 1.63v-3.14z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-black">
                Add link to your bio
              </span>
            </div>
            <button
              onClick={interactive ? handleCopyTikTok : undefined}
              className={`bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-black text-[10px] uppercase px-3 py-1.5 rounded-lg transition-all shadow-2xs ${
                interactive ? 'cursor-pointer active:scale-95' : 'cursor-default'
              }`}
            >
              {copiedTikTok ? 'COPIED' : 'COPY'}
            </button>
          </div>
        </div>

        {/* Share Preview Card */}
        <div className="space-y-1 pt-0.5">
          <label className="text-[11px] font-bold text-black block">
            Share Preview
          </label>
          <div className="w-full bg-[#0E0E10] text-white rounded-xl p-3 relative overflow-hidden shadow-sm flex items-center justify-between border border-zinc-800">
            {/* Cutout Photo */}
            <div className="w-16 h-14 rounded-lg overflow-hidden shrink-0 border border-zinc-700/60 mr-2.5">
              <img
                src="https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/save%20it%20for%20later.jfif"
                alt="Store preview"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80';
                }}
              />
            </div>

            {/* Text details */}
            <div className="space-y-0.5 flex-1 min-w-0">
              <h4 className="text-[11px] font-black text-white tracking-wider uppercase truncate">
                {storeName}
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium truncate">
                Streetwear For The Culture.
              </p>
              <p className="text-[9px] font-mono text-[#C6FF00] font-bold truncate">
                threadzw.com/shop/{storeSlug}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom App Navigation Bar */}
      <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between px-3 text-zinc-400">
        <div className="flex flex-col items-center hover:text-black">
          <Home size={16} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <Tag size={16} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <PlusCircle size={17} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <BarChart2 size={16} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <MenuIcon size={16} />
        </div>
      </div>

    </div>
  );
};

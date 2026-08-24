// src/components/storefront/StorefrontAccount.tsx
import React, { useState, useEffect } from 'react';
import { MapPin, Heart, Clipboard, Save, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface StorefrontAccountProps {
  shop: any;
  onNavigateToPage: (page: any, params?: any) => void;
  savedAddress: string;
  onSaveAddress: (address: string) => void;
}

export const StorefrontAccount: React.FC<StorefrontAccountProps> = ({
  shop,
  onNavigateToPage,
  savedAddress,
  onSaveAddress
}) => {
  const [addressInput, setAddressInput] = useState(savedAddress);
  useEffect(() => {
    setAddressInput(savedAddress);
  }, [savedAddress]);

  const handleSaveAddress = () => {
    if (!addressInput.trim()) {
      toast.error('Please input address before saving');
      return;
    }
    onSaveAddress(addressInput);
    toast.success('Delivery coordinates saved!');
  };

  return (
    <div className="space-y-6 px-5 pb-24 select-none text-left bg-white min-h-screen pt-4 font-sans">
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 font-sans">Customer Area</span>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">Your Account</h2>
      </div>

      {/* ----------------- SAVED ADDRESS SECTION ----------------- */}
      <div className="bg-zinc-50 border border-zinc-150 rounded-[20px] p-5 space-y-4 shadow-xs">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block flex items-center gap-1.5 font-sans">
          <MapPin className="w-4 h-4 text-green-600" /> Saved Delivery Coordinates
        </span>

        <div className="space-y-2.5 text-left">
          <textarea
            rows={2}
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="Configure your physical delivery address to prefill Checkout..."
            className="w-full text-xs bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none resize-none p-3 text-zinc-800 font-sans leading-relaxed"
          />
          <button
            onClick={handleSaveAddress}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <Save className="w-4 h-4" /> Save Address
          </button>
        </div>
      </div>

      {/* ----------------- WISHLIST ROUTING SHORTCUT ----------------- */}
      <div 
        onClick={() => onNavigateToPage('wishlist')}
        className="p-4 rounded-xl bg-zinc-50 border border-zinc-150 hover:border-green-200 cursor-pointer flex items-center justify-between transition-all shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
            <Heart className="w-4 h-4 fill-green-100" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-bold text-zinc-800 font-sans">Your Saved Wishlist</h3>
            <span className="text-[10px] text-zinc-400 font-sans font-medium">View bookmarked styles</span>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-400" />
      </div>

      {/* ----------------- WHATSAPP SUPPORT SECTION ----------------- */}
      <div className="bg-zinc-50 border border-zinc-150 rounded-[20px] p-5 space-y-3 shadow-xs">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block flex items-center gap-1.5 font-sans">
          <Clipboard className="w-4 h-4 text-green-600" /> Customer Support
        </span>
        <p className="text-xs text-zinc-600 leading-relaxed font-medium">
          Threadzw sends clothing enquiries directly to the shop on WhatsApp. Use the product buttons to ask about size, colour, stock, delivery or collection.
        </p>
        <a
          href={`https://wa.me/${(shop.whatsapp_number || shop.whatsapp || shop.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${shop.name}, I need help with an item from your Threadzw shop.`)}`}
          target="_blank"
          rel="noreferrer"
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
        >
          Message {shop.name} on WhatsApp <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

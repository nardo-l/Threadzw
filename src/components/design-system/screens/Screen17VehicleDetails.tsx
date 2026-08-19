// src/components/design-system/screens/Screen17VehicleDetails.tsx

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  Phone, 
  MessageCircle, 
  Fuel, 
  Settings2, 
  Compass, 
  Gauge, 
  Car, 
  PlusCircle, 
  User 
} from 'lucide-react';
import { toast } from 'sonner';

interface Screen17VehicleDetailsProps {
  onBack?: () => void;
  onCallDealer?: () => void;
  onChatWhatsApp?: () => void;
  onViewMorePhotos?: () => void;
  interactive?: boolean;
}

export const Screen17VehicleDetails: React.FC<Screen17VehicleDetailsProps> = ({
  onBack,
  onCallDealer,
  onChatWhatsApp,
  onViewMorePhotos,
  interactive = false
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText('https://threadzw.com/dealers/autovault/toyota-hilux-2022');
    toast.success('Vehicle link copied to clipboard!');
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(!isFavorite ? 'Saved to your favorites' : 'Removed from favorites');
  };

  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black -mx-1">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pt-1 px-1">
        <button
          onClick={onBack}
          className={`p-1 -ml-1 rounded-full text-black hover:bg-zinc-100 transition-colors ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <ArrowLeft size={16} className="stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={interactive ? handleShare : undefined}
            className={`p-1 text-black hover:bg-zinc-100 rounded-full transition-colors ${
              interactive ? 'cursor-pointer' : 'cursor-default'
            }`}
            title="Share Vehicle"
          >
            <Share2 size={16} className="stroke-[2]" />
          </button>
          <button
            onClick={interactive ? toggleFavorite : undefined}
            className={`p-1 rounded-full transition-colors ${
              isFavorite ? 'text-rose-500 fill-rose-500' : 'text-black hover:bg-zinc-100'
            } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            title="Favorite Vehicle"
          >
            <Heart size={16} className={isFavorite ? "fill-rose-500 stroke-rose-500" : "stroke-[2]"} />
          </button>
        </div>
      </div>

      {/* Main Vehicle Image Hero with 1/6 Photo Count Badge */}
      <div className="px-1 pt-1">
        <div 
          onClick={interactive ? onViewMorePhotos : undefined}
          className={`w-full h-44 rounded-2xl overflow-hidden relative shadow-2xs border border-zinc-200/80 bg-zinc-900 ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <img
            src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80"
            alt="Toyota Hilux 2022 Front Angle"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=600&q=80';
            }}
          />
          {/* Photo count pill */}
          <div className="absolute right-2.5 bottom-2.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
            1/6
          </div>
        </div>
      </div>

      {/* Vehicle Info & Price */}
      <div className="px-1 pt-1.5 space-y-1">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-black tracking-tight leading-tight">
              Toyota Hilux 2022
            </h2>
            <p className="text-sm font-black text-black">
              $28,500
            </p>
          </div>

          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-tight">
            In Stock
          </span>
        </div>

        {/* Specs Row */}
        <div className="flex items-center justify-between text-[9px] font-semibold text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-xl p-1.5 px-2.5 shadow-2xs">
          <span className="flex items-center gap-1">
            <Fuel size={11} className="text-zinc-500" />
            Diesel
          </span>
          <span className="flex items-center gap-1">
            <Settings2 size={11} className="text-zinc-500" />
            Automatic
          </span>
          <span className="flex items-center gap-1">
            <Compass size={11} className="text-zinc-500" />
            4x4
          </span>
          <span className="flex items-center gap-1">
            <Gauge size={11} className="text-zinc-500" />
            62,000 km
          </span>
        </div>
      </div>

      {/* About this car section */}
      <div className="px-1 py-1 space-y-0.5">
        <h4 className="text-[11px] font-black text-black">
          About this car
        </h4>
        <p className="text-[10px] text-zinc-600 font-medium leading-relaxed">
          Powerful, reliable and ready for any terrain. This 2022 Toyota Hilux is in excellent condition with full service history.
          {isExpanded && " Features genuine bullbar, rubberized tray, tinted windows, brand new all-terrain tyres, and single owner documentation verified."}
        </p>
        <button
          onClick={() => interactive && setIsExpanded(!isExpanded)}
          className={`text-[9px] font-bold text-[#84cc00] hover:underline ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      </div>

      {/* Features Chips */}
      <div className="px-1 py-0.5 space-y-1">
        <h4 className="text-[11px] font-black text-black">
          Features
        </h4>
        <div className="flex flex-wrap gap-1">
          {['Air Conditioning', 'Bluetooth', 'Reverse Camera', 'ABS', 'Airbags', 'Traction Control', 'More'].map((f) => (
            <span
              key={f}
              className="bg-white border border-zinc-200 text-zinc-700 text-[8.5px] font-semibold px-2 py-0.5 rounded-lg shadow-2xs"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Dual CTA Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1.5 px-1">
        {/* CALL DEALER Button */}
        <button
          onClick={() => {
            toast.info('Calling Auto Vault Motors at +263 77 345 6789');
            onCallDealer?.();
          }}
          className={`w-full bg-white hover:bg-zinc-50 border border-zinc-200 active:scale-[0.98] text-black font-black text-[10px] uppercase tracking-wider py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <Phone size={12} className="stroke-[2.5]" />
          <span className="font-extrabold tracking-wide">CALL DEALER</span>
        </button>

        {/* CHAT ON WHATSAPP Button */}
        <button
          onClick={() => {
            toast.success('Opening WhatsApp inquiry chat with dealer...');
            onChatWhatsApp?.();
          }}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-[10px] uppercase tracking-wider py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <MessageCircle size={12} className="stroke-[2.5]" />
          <span className="font-extrabold tracking-wide">CHAT ON WHATSAPP</span>
        </button>
      </div>

      {/* Customer Bottom Navigation Bar */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between px-3 text-zinc-400">
        <div className="flex flex-col items-center hover:text-black">
          <Car size={14} />
          <span className="text-[7.5px] font-medium">Home</span>
        </div>
        <div className="flex flex-col items-center text-black">
          <div className="w-5 h-5 rounded-md bg-[#C6FF00] flex items-center justify-center text-black shadow-2xs">
            <Car size={13} className="stroke-[2.5]" />
          </div>
          <span className="text-[7.5px] font-bold text-black">Cars</span>
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <PlusCircle size={14} />
          <span className="text-[7.5px] font-medium">Sell Car</span>
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <Heart size={14} />
          <span className="text-[7.5px] font-medium">Favorites</span>
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <User size={14} />
          <span className="text-[7.5px] font-medium">Profile</span>
        </div>
      </div>

    </div>
  );
};

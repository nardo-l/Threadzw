// src/components/design-system/screens/Screen20DealershipInfo.tsx

import React from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Navigation, 
  CheckCircle2, 
  Car, 
  PlusCircle, 
  Heart, 
  User 
} from 'lucide-react';
import { toast } from 'sonner';

interface Screen20DealershipInfoProps {
  onBack?: () => void;
  onGetDirections?: () => void;
  onCallOrWhatsApp?: () => void;
  interactive?: boolean;
}

export const Screen20DealershipInfo: React.FC<Screen20DealershipInfoProps> = ({
  onBack,
  onGetDirections,
  onCallOrWhatsApp,
  interactive = false
}) => {

  const handleDirections = () => {
    toast.success('Opening Google Maps route to 123 Auto Vault Road, Hillside, Bulawayo');
    onGetDirections?.();
  };

  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black -mx-1">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onBack}
            className={`p-1 -ml-1 rounded-full text-black hover:bg-zinc-100 transition-colors ${
              interactive ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <ArrowLeft size={16} className="stroke-[2.5]" />
          </button>
          <h3 className="text-xs font-black text-black tracking-tight">
            Store Information
          </h3>
        </div>
      </div>

      {/* Dealership Large Cover Photo */}
      <div className="px-1 pt-1">
        <div className="w-full h-32 rounded-2xl overflow-hidden relative shadow-2xs border border-zinc-200/80 bg-zinc-900">
          <img
            src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80"
            alt="Auto Vault Motors Dealership Showroom"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black tracking-widest text-white uppercase drop-shadow-md">
                AUTO VAULT <span className="text-[#C6FF00]">MOTORS</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Business Profile Card with Avatar & Verified Badge */}
      <div className="px-1 pt-1.5 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-black flex flex-col items-center justify-center text-white border border-zinc-800 shadow-2xs shrink-0">
          <span className="text-[8px] font-black tracking-tighter leading-tight text-center">
            AUTO<br/><span className="text-[#C6FF00]">VAULT</span>
          </span>
          <span className="text-[5px] tracking-widest text-zinc-400 -mt-0.5">MOTORS</span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black text-black tracking-tight flex items-center gap-1 leading-tight">
            Auto Vault Motors
          </h4>
          <div className="flex items-center gap-1 mt-0.5">
            <CheckCircle2 size={10} className="text-emerald-500 fill-emerald-500 stroke-white" />
            <span className="text-[8.5px] font-bold text-emerald-600">
              Verified Dealer
            </span>
          </div>
          <p className="text-[8px] text-zinc-500 font-medium truncate">
            Quality Cars. Trusted Deals.
          </p>
        </div>
      </div>

      {/* Business Information List / Card */}
      <div className="px-1 py-1 space-y-1">
        <div className="bg-white border border-zinc-200/80 rounded-xl divide-y divide-zinc-100 text-[9px] shadow-2xs">
          
          {/* Location */}
          <div className="p-2 flex items-start gap-2">
            <MapPin size={13} className="text-zinc-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-black leading-tight">Bulawayo, Zimbabwe</p>
              <p className="text-zinc-500 text-[8px] truncate">123 Auto Vault Road, Hillside</p>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="p-2 flex items-start gap-2">
            <Clock size={13} className="text-zinc-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-black leading-tight">Open today</p>
              <p className="text-zinc-500 text-[8px]">8:00 AM - 5:00 PM</p>
            </div>
          </div>

          {/* Phone / WhatsApp */}
          <div 
            onClick={interactive ? onCallOrWhatsApp : undefined}
            className={`p-2 flex items-start gap-2 ${interactive ? 'cursor-pointer hover:bg-zinc-50' : ''}`}
          >
            <Phone size={13} className="text-zinc-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-black leading-tight">+263 77 345 6789</p>
              <p className="text-zinc-500 text-[8px]">Call or WhatsApp</p>
            </div>
          </div>

          {/* Website */}
          <div className="p-2 flex items-start gap-2">
            <Globe size={13} className="text-zinc-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-black leading-tight">autovaultmotors.co.zw</p>
              <p className="text-zinc-500 text-[8px]">Visit our website</p>
            </div>
          </div>

          {/* Social Links */}
          <div className="p-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-black font-extrabold text-[8.5px]">
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-100 flex items-center justify-center font-bold">@</span>
              Auto Vault Motors
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[8px] font-black">f</span>
              <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-[8px] font-black">ig</span>
              <span className="w-5 h-5 rounded-full bg-zinc-100 text-black flex items-center justify-center text-[8px] font-black">tk</span>
            </div>
          </div>

        </div>
      </div>

      {/* Primary CTA: DIRECTIONS */}
      <div className="px-1 pb-1 pt-0.5">
        <button
          onClick={handleDirections}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-[11px] uppercase tracking-wider py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <Navigation size={13} className="stroke-[2.5]" />
          <span className="font-extrabold tracking-wide">DIRECTIONS</span>
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

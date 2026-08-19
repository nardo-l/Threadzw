// src/components/design-system/screens/Screen18VehicleGallery.tsx

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Car, 
  PlusCircle, 
  User 
} from 'lucide-react';
import { toast } from 'sonner';

interface Screen18VehicleGalleryProps {
  onBack?: () => void;
  onChatInquire?: () => void;
  interactive?: boolean;
}

export const Screen18VehicleGallery: React.FC<Screen18VehicleGalleryProps> = ({
  onBack,
  onChatInquire,
  interactive = false
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  const photos = [
    {
      title: 'Dashboard & Steering',
      url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Leather Interior Seats',
      url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Exterior Front Grille',
      url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Side Profile',
      url: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Rear Tailgate',
      url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Engine Bay',
      url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    },
  ];

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
            More Photos
          </h3>
        </div>

        <button
          onClick={interactive ? () => setIsFavorite(!isFavorite) : undefined}
          className={`p-1 rounded-full transition-colors ${
            isFavorite ? 'text-rose-500 fill-rose-500' : 'text-black hover:bg-zinc-100'
          } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          title="Favorite Vehicle"
        >
          <Heart size={16} className={isFavorite ? "fill-rose-500 stroke-rose-500" : "stroke-[2]"} />
        </button>
      </div>

      {/* Main Large Hero Angle (Rear 3/4 View) */}
      <div className="px-1 pt-1">
        <div className="w-full h-36 rounded-2xl overflow-hidden relative shadow-2xs border border-zinc-200/80 bg-zinc-900">
          <img
            src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80"
            alt="Toyota Hilux Exterior Rear"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80';
            }}
          />
        </div>
      </div>

      {/* 2-Column Photo Grid (6 detailed shots) */}
      <div className="px-1 py-1.5 flex-1">
        <div className="grid grid-cols-2 gap-1.5 h-full">
          {photos.map((p, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (interactive) {
                  setSelectedPhoto(idx);
                  toast.info(`Viewing ${p.title} (High-res)`);
                }
              }}
              className={`rounded-xl overflow-hidden border border-zinc-200/80 bg-zinc-100 relative group h-[4.5rem] shadow-2xs transition-transform ${
                interactive ? 'cursor-pointer active:scale-95' : 'cursor-default'
              } ${selectedPhoto === idx ? 'ring-2 ring-[#C6FF00]' : ''}`}
            >
              <img
                src={p.url}
                alt={p.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Primary CTA Action */}
      <div className="px-1 pb-1 pt-0.5">
        <button
          onClick={() => {
            toast.success('Inquiring about Toyota Hilux 2022 on WhatsApp...');
            onChatInquire?.();
          }}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-[11px] uppercase tracking-wider py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <MessageCircle size={13} className="stroke-[2.5]" />
          <span className="font-extrabold tracking-wide">CHAT TO INQUIRE</span>
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

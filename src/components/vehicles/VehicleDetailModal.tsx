// src/components/vehicles/VehicleDetailModal.tsx
import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Phone, 
  Share2, 
  MapPin, 
  Calendar, 
  Gauge, 
  Fuel, 
  Cog, 
  ShieldCheck, 
  Check, 
  Car, 
  Sparkles,
  Info,
  ExternalLink
} from 'lucide-react';
import { Vehicle, Shop } from '../../types';
import { 
  formatVehiclePrice, 
  formatMileage, 
  formatFuelType, 
  formatTransmission, 
  formatCondition,
  formatBodyType 
} from '../../services/vehicleService';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  shop: Shop | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  shop,
  isOpen,
  onClose
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!isOpen || !vehicle) return null;

  const images = vehicle.images && vehicle.images.length > 0 
    ? vehicle.images.map(img => typeof img === 'string' ? img : img.image_url)
    : (vehicle.primary_image ? [vehicle.primary_image] : []);

  const totalImages = images.length > 0 ? images.length : 1;
  const currentImage = images[activeImageIndex] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop&q=80';

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  // WhatsApp Enquiry Builder
  const handleWhatsAppEnquiry = () => {
    const rawPhone = shop?.whatsapp_number || shop?.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const message = `Hi ${shop?.name || 'Seller'}, I am interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model} (${formatVehiclePrice(vehicle.price, vehicle.currency)}) listed on your ThreadZW showroom: ${currentUrl}\n\nIs it still available?`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Call Seller
  const handleCallSeller = () => {
    const rawPhone = shop?.whatsapp_number || shop?.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
    if (cleanPhone) {
      window.location.href = `tel:${cleanPhone}`;
    }
  };

  // Share Vehicle Link
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${vehicle.title} - ${shop?.name || 'Showroom'}`,
        text: `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} for ${formatVehiclePrice(vehicle.price, vehicle.currency)} on ThreadZW!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const statusBadge = () => {
    switch (vehicle.status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Available For Sale
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs tracking-wider uppercase">
            Reserved
          </span>
        );
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 shadow-xs tracking-wider uppercase">
            Sold
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Car className="text-zinc-900" size={20} />
            <span className="text-sm font-bold text-zinc-900 truncate max-w-xs sm:max-w-md">
              {vehicle.make} {vehicle.model}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
              title="Share listing"
            >
              {copiedLink ? <Check size={18} className="text-emerald-600" /> : <Share2 size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {/* Photo Gallery Hero */}
          <div className="space-y-3">
            <div className="relative aspect-16/10 bg-zinc-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center group">
              <img
                src={currentImage}
                alt={vehicle.title}
                className="w-full h-full object-contain sm:object-cover transition-opacity duration-200"
                referrerPolicy="no-referrer"
              />

              {/* Prev / Next buttons */}
              {totalImages > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-md"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-md"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              {/* Photo Counter Pill */}
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-semibold">
                {activeImageIndex + 1} / {totalImages}
              </div>
            </div>

            {/* Thumbnails Strip */}
            {totalImages > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-18 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx 
                        ? 'border-[#85B800] ring-2 ring-[#CCFF00]/40 scale-102' 
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Title & Price Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div className="space-y-1">
              <div>{statusBadge()}</div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                {vehicle.title}
              </h1>
              {vehicle.location && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <MapPin size={14} className="text-zinc-400" />
                  <span>{vehicle.location}</span>
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Price</div>
              <div className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                {formatVehiclePrice(vehicle.price, vehicle.currency)}
              </div>
            </div>
          </div>

          {/* Vehicle Specifications Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Vehicle Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/60">
                <span className="text-[11px] font-medium text-zinc-400 block">Make & Model</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-900">{vehicle.make} {vehicle.model}</span>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/60">
                <span className="text-[11px] font-medium text-zinc-400 block">Year</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-900">{vehicle.year}</span>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/60">
                <span className="text-[11px] font-medium text-zinc-400 block">Mileage</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-900">{formatMileage(vehicle.mileage, vehicle.mileage_unit)}</span>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/60">
                <span className="text-[11px] font-medium text-zinc-400 block">Condition</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-900">{formatCondition(vehicle.condition)}</span>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/60">
                <span className="text-[11px] font-medium text-zinc-400 block">Fuel Type</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-900">{formatFuelType(vehicle.fuel_type)}</span>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/60">
                <span className="text-[11px] font-medium text-zinc-400 block">Transmission</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-900">{formatTransmission(vehicle.transmission)}</span>
              </div>

              {vehicle.engine && (
                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/60">
                  <span className="text-[11px] font-medium text-zinc-400 block">Engine</span>
                  <span className="text-xs sm:text-sm font-bold text-zinc-900">{vehicle.engine}</span>
                </div>
              )}

              {vehicle.body_type && (
                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/60">
                  <span className="text-[11px] font-medium text-zinc-400 block">Body Type</span>
                  <span className="text-xs sm:text-sm font-bold text-zinc-900">{formatBodyType(vehicle.body_type)}</span>
                </div>
              )}

              {vehicle.colour && (
                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/60">
                  <span className="text-[11px] font-medium text-zinc-400 block">Exterior Colour</span>
                  <span className="text-xs sm:text-sm font-bold text-zinc-900">{vehicle.colour}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {vehicle.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Seller's Description
              </h3>
              <div className="bg-zinc-50/70 rounded-2xl p-4 border border-zinc-100 text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                {vehicle.description}
              </div>
            </div>
          )}

          {/* Dealer Showroom Card */}
          {shop && (
            <div className="bg-zinc-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {shop.logo_url ? (
                  <img 
                    src={shop.logo_url} 
                    alt={shop.name} 
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-lg text-[#CCFF00] shrink-0">
                    {shop.name ? shop.name.charAt(0) : 'D'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-white">{shop.name}</h4>
                    <ShieldCheck size={16} className="text-[#CCFF00]" />
                  </div>
                  <p className="text-xs text-zinc-400">
                    {shop.city || shop.location || 'Verified Dealership on ThreadZW'}
                  </p>
                </div>
              </div>

              <div className="text-xs text-zinc-300">
                Direct inquiry with no dealer brokerage fees.
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 bg-white border-t border-zinc-100 sticky bottom-0 z-20 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleWhatsAppEnquiry}
            className="w-full sm:flex-1 h-12 bg-[#CCFF00] hover:bg-[#bbf000] text-black font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <MessageSquare size={18} className="stroke-[2.5]" />
            <span>Chat On WhatsApp</span>
          </button>

          {(shop?.whatsapp_number || shop?.phone) && (
            <button
              onClick={handleCallSeller}
              className="w-full sm:w-auto px-6 h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Phone size={16} />
              <span>Call Dealer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

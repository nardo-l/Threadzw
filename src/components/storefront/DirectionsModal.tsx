import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Store, Map, Phone, MessageCircle } from 'lucide-react';
import { trackMapOpen } from '../../lib/analytics';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: any;
}

export const DirectionsModal: React.FC<DirectionsModalProps> = ({
  isOpen,
  onClose,
  shop
}) => {
  if (!isOpen) return null;

  const shopName = shop?.name || 'Our Shop';
  const address = shop?.shop_address || shop?.location || shop?.address || 'Main Street, Bulawayo, Zimbabwe';
  const city = shop?.city || shop?.town || 'Bulawayo, Zimbabwe';
  const building = shop?.building_name;
  const floor = shop?.floor;
  const shopNumber = shop?.shop_number;
  const landmark = shop?.landmark;
  const rawDirections = shop?.directions || shop?.shop_config?.directions;
  const hours = shop?.opening_hours || shop?.hours || 'Mon - Sat: 8:00 AM - 5:30 PM';

  // Get exact directions provided by the shop owner
  const getDirectionSteps = () => {
    if (rawDirections && rawDirections.trim().length > 0) {
      const splitSteps = rawDirections
        .split(/\r?\n/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      if (splitSteps.length > 0) {
        return splitSteps;
      }
    }

    // Simple fallback if no custom directions entered yet
    if (address) {
      return [address, city].filter(Boolean);
    }
    return ['Visit our store during operating hours.'];
  };

  const directionSteps = getDirectionSteps();

  const handleOpenGoogleMaps = () => {
    if (shop?.id) {
      trackMapOpen(shop.id);
    }
    const query = `${shopName}, ${address}, ${city}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(mapsUrl, '_blank');
  };

  const handleCallShop = () => {
    const phone = shop?.whatsapp_number || shop?.whatsapp || shop?.phone || '';
    if (phone) {
      window.open(`tel:${phone.replace(/\D/g, '')}`, '_self');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
        {/* Dark backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-zinc-100 p-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon + Title */}
          <div className="flex flex-col items-center text-center mt-2 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#f4fde8] border border-[#bef715]/40 flex items-center justify-center text-green-700 mb-3 shadow-2xs">
              <MapPin className="w-6 h-6 text-green-700 fill-green-100" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">Visit our shop</h2>
            <p className="text-xs font-medium text-zinc-500 mt-0.5">Find us easily.</p>
          </div>

          {/* Green Showroom Card */}
          <div className="bg-[#f7fee7] border border-[#bef715]/50 rounded-2xl p-4 flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#bef715]/60 flex items-center justify-center text-zinc-800 shrink-0 shadow-2xs">
              <Store className="w-6 h-6 text-zinc-800" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-800 block">
                {shopName.toUpperCase()} SHOWROOM
              </span>
              <p className="text-xs font-bold text-zinc-900 truncate">{address}</p>
              <p className="text-[11px] text-zinc-600 font-medium">{city}</p>
            </div>
          </div>

          {/* Directions Steps */}
          <div className="space-y-3 mb-6 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Directions</h3>

            <div className="space-y-2.5 pl-1">
              {directionSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center mt-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-600 border-2 border-white ring-1 ring-green-600" />
                    {idx < directionSteps.length - 1 && (
                      <div className="w-0.5 bg-green-200 h-6 -mb-2 mt-0.5" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-zinc-700 leading-snug pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Opening Hours if available */}
          {hours && (
            <div className="mb-4 text-left px-1">
              <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Opening Hours</p>
              <p className="text-xs font-semibold text-zinc-800">{hours}</p>
            </div>
          )}

          {/* Tip Callout */}
          <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-3.5 mb-6 text-left flex items-center gap-2.5">
            <span className="text-base shrink-0">💡</span>
            <p className="text-xs text-zinc-600 font-medium leading-relaxed">
              Tip: You can call or WhatsApp us if you need help finding the shop.
            </p>
          </div>

          {/* Open in Maps Button */}
          <button
            onClick={handleOpenGoogleMaps}
            className="w-full py-4 bg-[#bef715] hover:bg-[#aef000] text-black font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer font-sans"
          >
            <Map className="w-5 h-5 stroke-[2.5]" />
            <span>Open in Maps</span>
          </button>

          {/* Optional Call shop fallback */}
          {(shop?.whatsapp_number || shop?.whatsapp || shop?.phone) && (
            <button
              onClick={handleCallShop}
              className="w-full mt-2.5 py-2.5 text-zinc-500 hover:text-zinc-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Shop Directly</span>
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

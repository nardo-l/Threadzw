// src/components/vehicles/VehicleCard.tsx
import React from 'react';
import { 
  Fuel, 
  Gauge, 
  Calendar, 
  Sparkles, 
  MapPin, 
  Camera, 
  MessageSquare, 
  Phone,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Vehicle } from '../../types';
import { 
  formatVehiclePrice, 
  formatMileage, 
  formatFuelType, 
  formatTransmission, 
  formatCondition 
} from '../../services/vehicleService';

interface VehicleCardProps {
  vehicle: Vehicle;
  onViewDetails?: (vehicle: Vehicle) => void;
  onWhatsAppInquiry?: (vehicle: Vehicle) => void;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
  onStatusChange?: (vehicle: Vehicle, newStatus: 'available' | 'reserved' | 'sold') => void;
  mode?: 'storefront' | 'dashboard';
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onViewDetails,
  onWhatsAppInquiry,
  onEdit,
  onDelete,
  onStatusChange,
  mode = 'storefront'
}) => {
  const images = vehicle.images && vehicle.images.length > 0 
    ? vehicle.images.map(img => typeof img === 'string' ? img : img.image_url)
    : (vehicle.primary_image ? [vehicle.primary_image] : []);

  const primaryImage = images[0] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80';
  const photoCount = images.length;

  const statusBadge = () => {
    switch (vehicle.status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-xs tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Available
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs tracking-wide uppercase">
            Reserved
          </span>
        );
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-300 shadow-xs tracking-wide uppercase">
            Sold
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
    >
      {/* Image Banner */}
      <div 
        onClick={() => onViewDetails?.(vehicle)}
        className="relative aspect-16/10 bg-zinc-900 cursor-pointer overflow-hidden"
      >
        <img 
          src={primaryImage} 
          alt={vehicle.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Top Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div>{statusBadge()}</div>

          {photoCount > 1 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-medium">
              <Camera size={12} />
              {photoCount}
            </span>
          )}
        </div>

        {/* Condition Tag if available */}
        {vehicle.condition && (
          <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-zinc-100 text-[10px] font-semibold tracking-wide">
              {formatCondition(vehicle.condition)}
            </span>
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 
              onClick={() => onViewDetails?.(vehicle)}
              className="text-base font-bold text-zinc-900 leading-snug line-clamp-2 hover:text-[#7ba900] transition-colors cursor-pointer"
            >
              {vehicle.title}
            </h3>
          </div>

          {/* Prominent Price */}
          <div className="text-xl font-extrabold text-zinc-950 tracking-tight">
            {formatVehiclePrice(vehicle.price, vehicle.currency)}
          </div>
        </div>

        {/* Key Specification Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-zinc-600">
          <div className="inline-flex items-center gap-1 bg-zinc-100/80 px-2 py-1 rounded-md text-[11px] font-medium text-zinc-700">
            <Calendar size={12} className="text-zinc-400" />
            <span>{vehicle.year}</span>
          </div>

          <div className="inline-flex items-center gap-1 bg-zinc-100/80 px-2 py-1 rounded-md text-[11px] font-medium text-zinc-700">
            <Gauge size={12} className="text-zinc-400" />
            <span>{formatMileage(vehicle.mileage, vehicle.mileage_unit)}</span>
          </div>

          {vehicle.fuel_type && (
            <div className="inline-flex items-center gap-1 bg-zinc-100/80 px-2 py-1 rounded-md text-[11px] font-medium text-zinc-700">
              <Fuel size={12} className="text-zinc-400" />
              <span>{formatFuelType(vehicle.fuel_type)}</span>
            </div>
          )}

          {vehicle.transmission && (
            <div className="inline-flex items-center gap-1 bg-zinc-100/80 px-2 py-1 rounded-md text-[11px] font-medium text-zinc-700">
              <span>{formatTransmission(vehicle.transmission)}</span>
            </div>
          )}
        </div>

        {/* Card Footer / Action Buttons */}
        <div className="pt-2 border-t border-zinc-100">
          {mode === 'storefront' ? (
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onViewDetails?.(vehicle)}
                className="w-full py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>View Details</span>
                <ChevronRight size={14} />
              </button>

              <button 
                onClick={() => onWhatsAppInquiry?.(vehicle)}
                className="w-full py-2.5 px-3 bg-[#CCFF00] hover:bg-[#bbf000] text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
              >
                <MessageSquare size={14} className="stroke-[2.2]" />
                <span>Inquire</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onEdit?.(vehicle)}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                >
                  Edit
                </button>
                {vehicle.status !== 'sold' ? (
                  <button
                    onClick={() => onStatusChange?.(vehicle, 'sold')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Mark Sold
                  </button>
                ) : (
                  <button
                    onClick={() => onStatusChange?.(vehicle, 'available')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Mark Available
                  </button>
                )}
              </div>

              {onDelete && (
                <button
                  onClick={() => onDelete(vehicle)}
                  className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete vehicle listing"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// src/utils/vehicleHelpers.ts

export function formatVehiclePrice(price: number | undefined | null, currency: string = 'USD'): string {
  if (price === undefined || price === null || isNaN(price)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage: number | undefined | null, unit: string = 'km'): string {
  if (mileage === undefined || mileage === null || isNaN(mileage)) return `0 ${unit || 'km'}`;
  return `${new Intl.NumberFormat('en-US').format(mileage)} ${unit || 'km'}`;
}

export function getStatusBadgeClass(status: string | undefined): string {
  switch (status) {
    case 'available':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'reserved':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'sold':
      return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20';
  }
}

export function getConditionLabel(condition: string | undefined): string {
  switch (condition) {
    case 'brand_new':
      return 'Brand New';
    case 'foreign_used':
      return 'Foreign Used';
    case 'local_used':
      return 'Local Used';
    default:
      return condition || 'Used';
  }
}

export function getTransmissionLabel(transmission: string | undefined): string {
  switch (transmission) {
    case 'automatic':
      return 'Automatic';
    case 'manual':
      return 'Manual';
    case 'cvt':
      return 'CVT';
    case 'semi_automatic':
      return 'Semi-Auto';
    default:
      return transmission || 'Automatic';
  }
}

export function getFuelTypeLabel(fuelType: string | undefined): string {
  switch (fuelType) {
    case 'petrol':
      return 'Petrol';
    case 'diesel':
      return 'Diesel';
    case 'hybrid':
      return 'Hybrid';
    case 'electric':
      return 'Electric';
    default:
      return fuelType || 'Petrol';
  }
}

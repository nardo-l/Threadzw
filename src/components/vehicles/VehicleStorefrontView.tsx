// src/components/vehicles/VehicleStorefrontView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Car, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Share2,
  Check
} from 'lucide-react';
import { Vehicle, Shop, VehicleFilters, VehicleStatus } from '../../types';
import { getShopVehicles, seedVehiclesIfEmpty } from '../../services/vehicleService';
import { VehicleCard } from './VehicleCard';
import { VehicleDetailModal } from './VehicleDetailModal';

interface VehicleStorefrontViewProps {
  shop: Shop;
}

export const VehicleStorefrontView: React.FC<VehicleStorefrontViewProps> = ({ shop }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMake, setSelectedMake] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus | 'all'>('all');
  const [priceRange, setPriceRange] = useState<string>('all'); // 'under_10k' | '10k_20k' | '20k_35k' | '35k_plus'
  const [yearFilter, setYearFilter] = useState<string>('all'); // '2022_plus' | '2020_plus' | '2017_plus' | '2012_plus'
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc'>('newest');

  // Load Vehicles
  const loadVehicles = async () => {
    setLoading(true);
    try {
      let list = await getShopVehicles(shop.id);
      
      // If shop has no vehicles at all, seed sample showcase vehicles so the showroom is rich and functional
      if (!list || list.length === 0) {
        list = await seedVehiclesIfEmpty(shop.id, shop.owner_id);
      }
      
      setVehicles(list);

      // Deep link to vehicle if url contains vehicle query parameter
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const vehicleId = urlParams.get('vehicle') || urlParams.get('vehicleId');
        if (vehicleId) {
          const found = list.find(v => v.id === vehicleId);
          if (found) {
            setSelectedVehicle(found);
            setIsModalOpen(true);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load vehicle showroom:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shop?.id) {
      loadVehicles();
    }
  }, [shop?.id]);

  // Distinct Makes for Dropdown
  const availableMakes = useMemo(() => {
    const makes = new Set<string>();
    vehicles.forEach(v => {
      if (v.make) makes.add(v.make);
    });
    return Array.from(makes).sort();
  }, [vehicles]);

  // Filtered & Sorted Vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = v.title?.toLowerCase().includes(q);
        const matchesMake = v.make?.toLowerCase().includes(q);
        const matchesModel = v.model?.toLowerCase().includes(q);
        const matchesYear = v.year?.toString().includes(q);
        const matchesDesc = v.description?.toLowerCase().includes(q);
        const matchesLoc = v.location?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMake && !matchesModel && !matchesYear && !matchesDesc && !matchesLoc) {
          return false;
        }
      }

      // 2. Make
      if (selectedMake !== 'all' && v.make.toLowerCase() !== selectedMake.toLowerCase()) {
        return false;
      }

      // 3. Status
      if (selectedStatus !== 'all' && v.status !== selectedStatus) {
        return false;
      }

      // 4. Price Range
      if (priceRange === 'under_10k' && v.price >= 10000) return false;
      if (priceRange === '10k_20k' && (v.price < 10000 || v.price > 20000)) return false;
      if (priceRange === '20k_35k' && (v.price < 20000 || v.price > 35000)) return false;
      if (priceRange === '35k_plus' && v.price <= 35000) return false;

      // 5. Year Filter
      if (yearFilter === '2022_plus' && v.year < 2022) return false;
      if (yearFilter === '2020_plus' && v.year < 2020) return false;
      if (yearFilter === '2017_plus' && v.year < 2017) return false;
      if (yearFilter === '2012_plus' && v.year < 2012) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'year_desc') return b.year - a.year;
      if (sortBy === 'mileage_asc') return (a.mileage || 999999) - (b.mileage || 999999);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [vehicles, searchQuery, selectedMake, selectedStatus, priceRange, yearFilter, sortBy]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMake('all');
    setSelectedStatus('all');
    setPriceRange('all');
    setYearFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery !== '' || selectedMake !== 'all' || selectedStatus !== 'all' || priceRange !== 'all' || yearFilter !== 'all';

  // Open Vehicle Detail
  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('vehicle', vehicle.id);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Close Vehicle Detail
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('vehicle');
      url.searchParams.delete('vehicleId');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // WhatsApp Inquiry from Card
  const handleCardWhatsAppInquiry = (vehicle: Vehicle) => {
    const rawPhone = shop?.whatsapp_number || shop?.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

    const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname + `?vehicle=${vehicle.id}` : '';
    const message = `Hi ${shop?.name || 'Seller'}, I saw your ${vehicle.year} ${vehicle.make} ${vehicle.model} listed for $${vehicle.price.toLocaleString()} on ThreadZW (${currentUrl}). Is this vehicle still available for viewing?`;

    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Share Showroom Link
  const handleShareShowroom = () => {
    if (navigator.share) {
      navigator.share({
        title: `${shop.name} | Vehicle Showroom`,
        text: `Browse quality cars & vehicles from ${shop.name} on ThreadZW!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans pb-24">
      {/* Dealer Header / Hero Banner */}
      <header className="bg-zinc-950 text-white relative overflow-hidden border-b border-zinc-800">
        {/* Background Image / Pattern */}
        {shop.banner_url ? (
          <div className="absolute inset-0 opacity-25">
            <img 
              src={shop.banner_url} 
              alt="Banner" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#CCFF00_1px,transparent_1px)] [background-size:16px_16px]" />
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Dealer Profile */}
            <div className="flex items-start sm:items-center gap-4">
              {shop.logo_url ? (
                <img
                  src={shop.logo_url}
                  alt={shop.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-zinc-900 border-2 border-zinc-700 shadow-xl shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-2xl font-black text-[#CCFF00] shrink-0 shadow-xl">
                  {shop.name ? shop.name.charAt(0) : <Car size={32} />}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {shop.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] text-[11px] font-bold border border-[#CCFF00]/30">
                    <ShieldCheck size={13} />
                    Verified Dealership
                  </span>
                </div>

                {shop.description && (
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-xl line-clamp-2 leading-relaxed">
                    {shop.description}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1 text-xs text-zinc-400">
                  {(shop.city || shop.location) && (
                    <div className="flex items-center gap-1">
                      <MapPin size={13} className="text-[#CCFF00]" />
                      <span>{shop.city || shop.location}</span>
                    </div>
                  )}
                  <span>•</span>
                  <span>{vehicles.filter(v => v.status === 'available').length} Vehicles in stock</span>
                </div>
              </div>
            </div>

            {/* Header Contact Actions */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={handleShareShowroom}
                className="px-4 h-11 bg-zinc-800/90 hover:bg-zinc-800 text-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-zinc-700 transition-all cursor-pointer shrink-0"
              >
                {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                <span>Share</span>
              </button>

              {(shop.whatsapp_number || shop.phone) && (
                <a
                  href={`https://wa.me/${(shop.whatsapp_number || shop.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${shop.name}, I am browsing your vehicle showroom on ThreadZW.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none px-5 h-11 bg-[#CCFF00] hover:bg-[#bbf000] text-black text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <MessageSquare size={16} className="stroke-[2.5]" />
                  <span>WhatsApp Dealer</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Showroom Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-4">
          {/* Top Row: Search input + Sort By */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by make, model, year, or keyword (e.g. Hilux, BMW, 2021)..."
                className="w-full h-11 pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#85B800] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-700 p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-zinc-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#85B800] cursor-pointer"
              >
                <option value="newest">Latest Additions</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="year_desc">Year: Newest First</option>
                <option value="mileage_asc">Lowest Mileage</option>
              </select>
            </div>
          </div>

          {/* Bottom Row: Filter Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-100">
            {/* Make Filter */}
            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                Make
              </label>
              <select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                className="w-full h-9 px-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
              >
                <option value="all">All Makes</option>
                {availableMakes.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                Budget Range
              </label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full h-9 px-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
              >
                <option value="all">Any Price</option>
                <option value="under_10k">Under $10,000</option>
                <option value="10k_20k">$10,000 - $20,000</option>
                <option value="20k_35k">$20,000 - $35,000</option>
                <option value="35k_plus">$35,000+</option>
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                Year
              </label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full h-9 px-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
              >
                <option value="all">All Years</option>
                <option value="2022_plus">2022 & Newer</option>
                <option value="2020_plus">2020 & Newer</option>
                <option value="2017_plus">2017 & Newer</option>
                <option value="2012_plus">2012 & Newer</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                Availability
              </label>
              <select
                value={selectedStatus}
                onChange={(e: any) => setSelectedStatus(e.target.value)}
                className="w-full h-9 px-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
              >
                <option value="all">All Inventory</option>
                <option value="available">Available for Sale</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          {/* Active Filter Clear Bar */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 text-xs text-zinc-500">
              <span>Showing filtered showroom results</span>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 font-semibold text-[#85B800] hover:underline cursor-pointer"
              >
                <RotateCcw size={12} />
                Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Results Count & Quick Status Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm font-bold text-zinc-800">
            {filteredVehicles.length} {filteredVehicles.length === 1 ? 'Vehicle' : 'Vehicles'} Listed
          </div>

          {/* Quick status chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'all' 
                  ? 'bg-zinc-900 text-white shadow-xs' 
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus('available')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'available' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              Available ({vehicles.filter(v => v.status === 'available').length})
            </button>
            <button
              onClick={() => setSelectedStatus('reserved')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'reserved' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              Reserved ({vehicles.filter(v => v.status === 'reserved').length})
            </button>
            <button
              onClick={() => setSelectedStatus('sold')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'sold' 
                  ? 'bg-zinc-800 text-white shadow-xs' 
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              Sold ({vehicles.filter(v => v.status === 'sold').length})
            </button>
          </div>
        </div>

        {/* Vehicles Grid / Empty States */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-zinc-200 h-80 animate-pulse p-4 space-y-4">
                <div className="w-full aspect-16/10 bg-zinc-200 rounded-xl" />
                <div className="h-5 bg-zinc-200 rounded w-3/4" />
                <div className="h-6 bg-zinc-200 rounded w-1/3" />
                <div className="h-4 bg-zinc-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                mode="storefront"
                onViewDetails={handleViewVehicle}
                onWhatsAppInquiry={handleCardWhatsAppInquiry}
              />
            ))}
          </div>
        ) : (
          /* Clean Empty Showroom State */
          <div className="bg-white rounded-3xl border border-zinc-200 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
              <Car size={32} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-zinc-900">
                {hasActiveFilters ? 'No vehicles match your search' : 'Showroom inventory is currently empty'}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto">
                {hasActiveFilters 
                  ? 'Try broadening your budget, make, or year filters to view more vehicles.'
                  : 'The dealer has not listed any vehicles in this showroom yet. Check back soon!'}
              </p>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Vehicle Detail Modal View */}
      <VehicleDetailModal
        vehicle={selectedVehicle}
        shop={shop}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

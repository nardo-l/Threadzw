// src/components/vehicles/VehicleInventoryView.tsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Car, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Check, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  Gauge, 
  Fuel, 
  Eye, 
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Vehicle, VehicleStatus, Shop } from '../../types';
import { getShopVehicles, updateVehicleStatus, deleteVehicle } from '../../services/vehicleService';
import { formatVehiclePrice, formatMileage, getStatusBadgeClass } from '../../utils/vehicleHelpers';
import { toast } from 'sonner';
import { canAddVehicle, getEntitlements, isPro } from '../../config/plans';
import { UpgradePromptModal } from '../plans/UpgradePromptModal';

interface VehicleInventoryViewProps {
  shop: Shop;
}

export const VehicleInventoryView: React.FC<VehicleInventoryViewProps> = ({ shop }) => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Vehicle | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Fetch vehicles
  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await getShopVehicles(shop.id);
      setVehicles(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load vehicle showroom inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [shop.id]);

  // Status toggle
  const handleStatusChange = async (vehicleId: string, newStatus: VehicleStatus) => {
    try {
      await updateVehicleStatus(vehicleId, shop.id, newStatus);
      setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, status: newStatus } : v));
      toast.success(`Vehicle marked as ${newStatus}`);
      setActiveMenuId(null);
    } catch (err: any) {
      toast.error('Failed to update vehicle status.');
    }
  };

  // Delete
  const handleDeleteConfirm = async () => {
    if (!showDeleteModal) return;
    setDeletingId(showDeleteModal.id);
    try {
      await deleteVehicle(showDeleteModal.id, shop.id);
      setVehicles(prev => prev.filter(v => v.id !== showDeleteModal.id));
      setShowDeleteModal(null);
      toast.success('Vehicle removed from showroom.');
    } catch (err: any) {
      toast.error('Failed to delete vehicle listing.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filters
  const filteredVehicles = vehicles.filter(v => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || 
      v.title.toLowerCase().includes(query) ||
      v.make.toLowerCase().includes(query) ||
      v.model.toLowerCase().includes(query) ||
      v.year.toString().includes(query) ||
      (v.location && v.location.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableCount = vehicles.filter(v => v.status === 'available').length;
  const reservedCount = vehicles.filter(v => v.status === 'reserved').length;
  const soldCount = vehicles.filter(v => v.status === 'sold').length;

  const publicShopUrl = `/shop/${shop.slug || shop.handle || shop.id}?page=home`;

  return (
    <div className="space-y-6">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight leading-none uppercase">
              Showroom Inventory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-800 text-[10px] font-extrabold uppercase">
              Vehicles
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1.5 font-medium">
            Manage your dealership listings, specs, pricing, and availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {(() => {
            const pro = isPro(shop);
            const activeVehiclesCount = vehicles.filter(v => v.status === 'available').length;
            const max = pro ? 20 : 1;

            return (
              <span className="px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-xl text-[11px] font-bold text-zinc-700">
                {activeVehiclesCount} / {max} active used
              </span>
            );
          })()}

          <button
            onClick={() => {
              const activeCount = vehicles.filter(v => v.status === 'available').length;
              const check = canAddVehicle(shop, activeCount);
              if (!check.allowed) {
                setShowUpgradeModal(true);
                return;
              }
              navigate('/add-vehicle');
            }}
            className="px-5 py-3 rounded-2xl bg-[#CCFF00] hover:bg-[#bbf000] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase">Total Listed</div>
          <div className="text-xl font-bold text-zinc-950 mt-1">{vehicles.length}</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase">Available</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{availableCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-600 uppercase">Reserved</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{reservedCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase">Sold</div>
          <div className="text-xl font-bold text-zinc-700 mt-1">{soldCount}</div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search make, model, year, location..."
            className="w-full h-11 bg-white border border-zinc-200/80 rounded-2xl pl-10 pr-4 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-zinc-200 overflow-x-auto no-scrollbar gap-4">
          {[
            { id: 'all', label: 'All Vehicles', count: vehicles.length },
            { id: 'available', label: 'Available', count: availableCount },
            { id: 'reserved', label: 'Reserved', count: reservedCount },
            { id: 'sold', label: 'Sold', count: soldCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`py-3 px-1 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'text-zinc-950 font-bold border-zinc-950'
                  : 'text-zinc-400 border-transparent hover:text-zinc-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5 font-bold">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Grid / Empty State */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-[#85B800]" size={28} />
          <span className="text-xs text-zinc-400 font-medium">Loading vehicle inventory...</span>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
            <Car size={32} />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-base font-bold text-zinc-900">
              {search || statusFilter !== 'all' ? 'No matching vehicles found' : 'Your vehicle showroom is empty'}
            </h3>
            <p className="text-xs text-zinc-500">
              {search || statusFilter !== 'all'
                ? 'Try clearing your search query or selecting a different filter.'
                : 'List your cars, SUVs, pickups, and trucks with complete specs and photos.'}
            </p>
          </div>

          <button
            onClick={() => {
              const activeCount = vehicles.filter(v => v.status === 'available').length;
              const check = canAddVehicle(shop, activeCount);
              if (!check.allowed) {
                setShowUpgradeModal(true);
                return;
              }
              navigate('/add-vehicle');
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#CCFF00] hover:bg-[#bbf000] text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>List Your First Vehicle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map(vehicle => {
            const coverImage = vehicle.primary_image || 
              (vehicle.images && vehicle.images[0] ? (typeof vehicle.images[0] === 'string' ? vehicle.images[0] : vehicle.images[0].image_url) : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80');

            return (
              <div
                key={vehicle.id}
                className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Image & Status Badge */}
                  <div className="relative aspect-16/10 bg-zinc-100 overflow-hidden group">
                    <img
                      src={coverImage}
                      alt={vehicle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-xs ${getStatusBadgeClass(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </div>

                    {/* Quick Menu / Actions */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/edit-vehicle/${vehicle.id}`)}
                        className="p-2 bg-white/90 hover:bg-white text-zinc-800 rounded-xl shadow-xs backdrop-blur-xs transition-colors cursor-pointer"
                        title="Edit vehicle"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 line-clamp-1">
                        {vehicle.title}
                      </h3>
                      <div className="text-base font-extrabold text-zinc-950 mt-0.5">
                        {formatVehiclePrice(vehicle.price, vehicle.currency)}
                      </div>
                    </div>

                    {/* Key Specs Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-600 font-medium">
                      {vehicle.mileage !== null && vehicle.mileage !== undefined && (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 flex items-center gap-1">
                          <Gauge size={11} className="text-zinc-400" />
                          {formatMileage(vehicle.mileage, vehicle.mileage_unit)}
                        </span>
                      )}
                      {vehicle.transmission && (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 capitalize">
                          {vehicle.transmission}
                        </span>
                      )}
                      {vehicle.fuel_type && (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 capitalize">
                          {vehicle.fuel_type}
                        </span>
                      )}
                      {vehicle.location && (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 flex items-center gap-1">
                          <MapPin size={11} className="text-zinc-400" />
                          {vehicle.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls & Quick Status Switcher */}
                <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-2">
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStatusChange(vehicle.id, 'available')}
                      className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors ${
                        vehicle.status === 'available' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      Avail
                    </button>
                    <button
                      onClick={() => handleStatusChange(vehicle.id, 'reserved')}
                      className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors ${
                        vehicle.status === 'reserved' ? 'bg-amber-500 text-white' : 'text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      Reserved
                    </button>
                    <button
                      onClick={() => handleStatusChange(vehicle.id, 'sold')}
                      className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors ${
                        vehicle.status === 'sold' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      Sold
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowDeleteModal(vehicle)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete listing"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-zinc-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-900">Remove Vehicle Listing?</h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to delete <span className="font-bold text-zinc-800">{showDeleteModal.title}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deletingId ? <Loader2 size={14} className="animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        shop={shop}
        category="vehicles"
        reason="vehicle_limit"
      />
    </div>
  );
};

// src/screens/EditVehicle.tsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Car, 
  Upload, 
  X, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Save,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shop, Vehicle, VehicleFuelType, VehicleTransmission, VehicleCondition, VehicleBodyType, VehicleStatus } from '../types';
import { getVehicleById, updateVehicle, deleteVehicle, uploadVehicleImages } from '../services/vehicleService';

const POPULAR_MAKES = [
  'Toyota', 'BMW', 'Mercedes-Benz', 'Nissan', 'Ford', 'Honda', 
  'Volkswagen', 'Mazda', 'Hyundai', 'Kia', 'Audi', 'Land Rover', 
  'Subaru', 'Isuzu', 'Mitsubishi', 'Chevrolet', 'Jeep', 'Volvo', 'Lexus'
];

interface EditVehicleProps {
  vehicleId?: string;
}

export const EditVehicle: React.FC<EditVehicleProps> = ({ vehicleId: propVehicleId }) => {
  const navigate = useNavigate();
  const [vehicleId, setVehicleId] = useState<string>(propVehicleId || '');
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [make, setMake] = useState<string>('');
  const [customMake, setCustomMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [mileage, setMileage] = useState<string>('');
  const [mileageUnit, setMileageUnit] = useState<'km' | 'mi'>('km');
  const [fuelType, setFuelType] = useState<VehicleFuelType | ''>('petrol');
  const [transmission, setTransmission] = useState<VehicleTransmission | ''>('automatic');
  const [condition, setCondition] = useState<VehicleCondition | ''>('foreign_used');
  const [bodyType, setBodyType] = useState<VehicleBodyType | ''>('suv');
  const [engine, setEngine] = useState<string>('');
  const [colour, setColour] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<VehicleStatus>('available');
  const [isFeatured, setIsFeatured] = useState<boolean>(false);

  // Existing Photos & New Photo Files
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);

  // Resolve ID from path if not provided in props
  useEffect(() => {
    if (!vehicleId && typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/edit-vehicle\/([^\/]+)/);
      if (match && match[1]) {
        setVehicleId(match[1]);
      }
    }
  }, [vehicleId]);

  // Load Vehicle & Shop
  useEffect(() => {
    async function loadData() {
      if (!vehicleId) return;
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: userShop } = await supabase
          .from('shops')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        setShop(userShop || null);

        const v = await getVehicleById(vehicleId, userShop?.id);
        if (!v) {
          setError('Vehicle listing not found.');
          setLoading(false);
          return;
        }

        // Pre-fill form
        setTitle(v.title || '');
        if (POPULAR_MAKES.includes(v.make)) {
          setMake(v.make);
        } else {
          setMake('other');
          setCustomMake(v.make || '');
        }
        setModel(v.model || '');
        setYear(v.year || new Date().getFullYear());
        setPrice(v.price ? v.price.toString() : '');
        setCurrency(v.currency || 'USD');
        setMileage(v.mileage !== null && v.mileage !== undefined ? v.mileage.toString() : '');
        setMileageUnit(v.mileage_unit || 'km');
        setFuelType(v.fuel_type || '');
        setTransmission(v.transmission || '');
        setCondition(v.condition || '');
        setBodyType(v.body_type || '');
        setEngine(v.engine || '');
        setColour(v.colour || '');
        setLocation(v.location || '');
        setDescription(v.description || '');
        setStatus(v.status || 'available');
        setIsFeatured(!!v.is_featured);

        const imgs = v.images && v.images.length > 0
          ? v.images.map(img => typeof img === 'string' ? img : img.image_url)
          : (v.primary_image ? [v.primary_image] : []);
        setExistingPhotos(imgs);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load vehicle data.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [vehicleId]);

  // Handle Photo Select
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewPhotoFiles(prev => [...prev, ...filesArray]);
      const newUrls = filesArray.map(file => URL.createObjectURL(file));
      setNewPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  const handleRemoveExistingPhoto = (index: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewPhoto = (index: number) => {
    setNewPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryExisting = (index: number) => {
    if (index === 0) return;
    const url = existingPhotos[index];
    setExistingPhotos(prev => [url, ...prev.filter((_, i) => i !== index)]);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !vehicleId) return;
    setError(null);

    const activeMake = make === 'other' ? customMake.trim() : make.trim();
    if (!activeMake) {
      setError('Please select or enter the vehicle make.');
      return;
    }
    if (!model.trim()) {
      setError('Please enter the vehicle model.');
      return;
    }
    const parsedYear = Number(year);
    if (isNaN(parsedYear) || parsedYear < 1950 || parsedYear > new Date().getFullYear() + 1) {
      setError('Please enter a valid year.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid listing price.');
      return;
    }

    setSubmitting(true);
    setUploadProgress('Saving updates...');

    try {
      let newlyUploadedUrls: string[] = [];
      if (newPhotoFiles.length > 0) {
        newlyUploadedUrls = await uploadVehicleImages(
          shop.id,
          newPhotoFiles,
          (current, total) => setUploadProgress(`Uploading new photo ${current} of ${total}...`)
        );
      }

      const combinedPhotos = [...existingPhotos, ...newlyUploadedUrls];
      if (combinedPhotos.length === 0) {
        combinedPhotos.push('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop&q=80');
      }

      const generatedTitle = `${parsedYear} ${activeMake} ${model.trim()}${engine ? ` ${engine.trim()}` : ''}`;

      await updateVehicle(
        vehicleId,
        shop.id,
        {
          title: generatedTitle,
          make: activeMake,
          model: model.trim(),
          year: parsedYear,
          price: parsedPrice,
          currency: currency || 'USD',
          mileage: mileage ? parseInt(mileage, 10) : null,
          mileage_unit: mileageUnit,
          fuel_type: (fuelType as VehicleFuelType) || null,
          transmission: (transmission as VehicleTransmission) || null,
          condition: (condition as VehicleCondition) || null,
          body_type: (bodyType as VehicleBodyType) || null,
          engine: engine.trim() || null,
          colour: colour.trim() || null,
          location: location.trim() || null,
          description: description.trim() || null,
          status: status || 'available',
          is_featured: isFeatured
        },
        combinedPhotos
      );

      setSuccess(true);
      setTimeout(() => {
        navigate('/inventory');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update vehicle listing.');
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!shop || !vehicleId) return;
    setDeleting(true);
    try {
      await deleteVehicle(vehicleId, shop.id);
      navigate('/inventory');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to delete vehicle listing.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#85B800]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans pb-24">
      {/* Top Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Showroom Inventory</span>
          </button>

          <h1 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5 truncate max-w-xs">
            <Car size={18} className="text-[#85B800] shrink-0" />
            <span>Edit Vehicle Listing</span>
          </h1>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Delete vehicle listing"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Success Alert */}
        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold">Changes Saved Successfully!</h3>
              <p className="text-xs text-emerald-700">Redirecting to showroom inventory...</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 animate-in fade-in">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block mb-0.5">Notice:</span>
              {error}
            </div>
          </div>
        )}

        {/* Status Switcher Banner */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Vehicle Availability Status</h3>
            <p className="text-xs text-zinc-500">
              Update whether this vehicle is available for sale, reserved, or sold.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatus('available')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                status === 'available'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Available
            </button>
            <button
              type="button"
              onClick={() => setStatus('reserved')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                status === 'reserved'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Reserved
            </button>
            <button
              type="button"
              onClick={() => setStatus('sold')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                status === 'sold'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Sold
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Photos */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <ImageIcon size={18} className="text-zinc-600" />
                <span>Vehicle Photos</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                The primary image will be displayed on the showroom catalog cards.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Existing Photos */}
              {existingPhotos.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative aspect-4/3 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 group">
                  <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  
                  {idx === 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-md text-[#CCFF00] text-[10px] font-bold px-2 py-0.5 rounded">
                      PRIMARY
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryExisting(idx)}
                        className="p-1.5 bg-white/90 text-zinc-900 rounded-lg text-[10px] font-bold hover:bg-white"
                      >
                        Set Main
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(idx)}
                      className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Newly Added Photos */}
              {newPreviewUrls.map((url, idx) => (
                <div key={`new-${idx}`} className="relative aspect-4/3 rounded-xl overflow-hidden bg-zinc-100 border-2 border-emerald-500 group">
                  <img src={url} alt={`New Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    NEW
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveNewPhoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/70 text-white rounded-md hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Add Photo Button */}
              <label className="aspect-4/3 rounded-xl border-2 border-dashed border-zinc-300 hover:border-[#85B800] bg-zinc-50 hover:bg-zinc-100/70 flex flex-col items-center justify-center gap-1.5 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer">
                <Upload size={20} />
                <span className="text-xs font-semibold">Add Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Core Details */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-zinc-900">Vehicle Make, Model & Price</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Make <span className="text-red-500">*</span>
                </label>
                <select
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  required
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                >
                  {POPULAR_MAKES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="other">Other / Custom Make...</option>
                </select>
                {make === 'other' && (
                  <input
                    type="text"
                    value={customMake}
                    onChange={(e) => setCustomMake(e.target.value)}
                    placeholder="Enter custom make..."
                    className="w-full h-10 px-3 mt-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  required
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      className="w-full h-11 pl-8 pr-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                    />
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="ZAR">ZAR (R)</option>
                    <option value="ZiG">ZiG</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Technical Specs */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-zinc-900">Technical Specifications</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Mileage (Odometer)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm"
                  />
                  <select
                    value={mileageUnit}
                    onChange={(e: any) => setMileageUnit(e.target.value)}
                    className="h-11 px-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="km">km</option>
                    <option value="mi">miles</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e: any) => setCondition(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm"
                >
                  <option value="foreign_used">Foreign Used (Import)</option>
                  <option value="locally_used">Locally Used</option>
                  <option value="brand_new">Brand New</option>
                  <option value="certified_pre_owned">Certified Pre-Owned</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Transmission
                </label>
                <select
                  value={transmission}
                  onChange={(e: any) => setTransmission(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm"
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="semi_automatic">Semi-Automatic</option>
                  <option value="cvt">CVT</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Fuel Type
                </label>
                <select
                  value={fuelType}
                  onChange={(e: any) => setFuelType(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm"
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Body Type
                </label>
                <select
                  value={bodyType}
                  onChange={(e: any) => setBodyType(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm"
                >
                  <option value="suv">SUV</option>
                  <option value="sedan">Sedan</option>
                  <option value="pickup">Pickup / Bakkie</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van / Minibus</option>
                  <option value="coupe">Coupe</option>
                  <option value="wagon">Station Wagon</option>
                  <option value="convertible">Convertible</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Engine / Trim
                </label>
                <input
                  type="text"
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  placeholder="e.g. 2.8L GD-6"
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Exterior Colour
                </label>
                <input
                  type="text"
                  value={colour}
                  onChange={(e) => setColour(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 h-12 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={16} />
              <span>Delete Listing</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="px-5 h-12 rounded-xl text-xs font-bold text-zinc-600 hover:text-black bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 h-12 bg-[#CCFF00] hover:bg-[#bbf000] text-black rounded-xl text-sm font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>{uploadProgress || 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-zinc-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-900">Delete Vehicle Listing?</h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to delete this vehicle listing? This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

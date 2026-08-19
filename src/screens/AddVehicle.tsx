// src/screens/AddVehicle.tsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Car, 
  Upload, 
  X, 
  Sparkles, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  Gauge, 
  Fuel, 
  Cog, 
  Info,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shop, VehicleFuelType, VehicleTransmission, VehicleCondition, VehicleBodyType, VehicleStatus } from '../types';
import { createVehicle, uploadVehicleImages, getShopVehicles } from '../services/vehicleService';
import { canAddVehicle, getVehicleImageLimit } from '../config/plans';
import { UpgradePromptModal } from '../components/plans/UpgradePromptModal';

const POPULAR_MAKES = [
  'Toyota', 'BMW', 'Mercedes-Benz', 'Nissan', 'Ford', 'Honda', 
  'Volkswagen', 'Mazda', 'Hyundai', 'Kia', 'Audi', 'Land Rover', 
  'Subaru', 'Isuzu', 'Mitsubishi', 'Chevrolet', 'Jeep', 'Volvo', 'Lexus'
];

export const AddVehicle: React.FC = () => {
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  // Form Fields
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

  // Photos
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Load User & Shop
  useEffect(() => {
    async function loadUserShop() {
      setLoadingShop(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: userShop, error: shopErr } = await supabase
          .from('shops')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (shopErr || !userShop) {
          setError('Could not find an active shop. Please create your shop first.');
          return;
        }

        setShop(userShop);
        if (userShop.city || userShop.location) {
          setLocation(userShop.city || userShop.location);
        }

        // Check active available vehicles count
        const existingVehicles = await getShopVehicles(userShop.id);
        const activeCount = existingVehicles.filter(v => v.status === 'available').length;
        const check = canAddVehicle(userShop, activeCount);
        if (!check.allowed) {
          setShowUpgradeModal(true);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to initialize vehicle form.');
      } finally {
        setLoadingShop(false);
      }
    }

    loadUserShop();
  }, []);

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const maxPhotos = getVehicleImageLimit(shop);
      const filesArray = Array.from(e.target.files);
      const combined = [...photoFiles, ...filesArray];
      if (combined.length > maxPhotos) {
        setError(`Your plan allows up to ${maxPhotos} photos per vehicle listing.`);
        return;
      }
      setPhotoFiles(combined);

      const newUrls = filesArray.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  // Remove Photo
  const handleRemovePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Set as Primary Photo (move to index 0)
  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const file = photoFiles[index];
    const url = previewUrls[index];
    
    setPhotoFiles(prev => [file, ...prev.filter((_, i) => i !== index)]);
    setPreviewUrls(prev => [url, ...prev.filter((_, i) => i !== index)]);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setError(null);

    const activeMake = make === 'other' ? customMake.trim() : make.trim();
    if (!activeMake) {
      setError('Please select or enter the vehicle make (e.g. Toyota).');
      return;
    }
    if (!model.trim()) {
      setError('Please enter the vehicle model (e.g. Hilux, 320i, C200).');
      return;
    }
    const parsedYear = Number(year);
    if (isNaN(parsedYear) || parsedYear < 1950 || parsedYear > new Date().getFullYear() + 1) {
      setError(`Please enter a valid year between 1950 and ${new Date().getFullYear() + 1}.`);
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid listing price.');
      return;
    }

    setSubmitting(true);
    setUploadProgress('Checking showroom limits...');

    try {
      // Check active limit
      const existingVehicles = await getShopVehicles(shop.id);
      const activeCount = existingVehicles.filter(v => v.status === 'available').length;
      const check = canAddVehicle(shop, activeCount);
      if (!check.allowed) {
        setShowUpgradeModal(true);
        setSubmitting(false);
        return;
      }

      setUploadProgress('Uploading vehicle photos...');

      // 1. Upload photos if any
      let uploadedUrls: string[] = [];
      if (photoFiles.length > 0) {
        uploadedUrls = await uploadVehicleImages(
          shop.id,
          photoFiles,
          (current, total) => {
            setUploadProgress(`Uploading photo ${current} of ${total}...`);
          }
        );
      }

      // If no photos uploaded, use a default automotive placeholder
      if (uploadedUrls.length === 0) {
        uploadedUrls = ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop&q=80'];
      }

      setUploadProgress('Saving vehicle listing...');

      // 2. Save vehicle record
      const generatedTitle = `${parsedYear} ${activeMake} ${model.trim()}${engine ? ` ${engine.trim()}` : ''}`;

      await createVehicle(
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
        uploadedUrls
      );

      setSuccess(true);
      setTimeout(() => {
        navigate('/inventory');
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create vehicle listing. Please check your connection.');
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  };

  if (loadingShop) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#85B800]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans pb-24">
      {/* Top Header Navigation */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Showroom</span>
          </button>

          <h1 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
            <Car size={18} className="text-[#85B800]" />
            <span>List a New Vehicle</span>
          </h1>

          <div className="w-16" />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Success Alert */}
        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold">Vehicle Listed Successfully!</h3>
              <p className="text-xs text-emerald-700">Redirecting to your vehicle showroom inventory...</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 animate-in fade-in">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block mb-0.5">Please correct the following:</span>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Photos */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <ImageIcon size={18} className="text-zinc-600" />
                <span>Vehicle Photos</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Upload clear exterior, interior, and engine photos. The first image will be your main listing cover.
              </p>
            </div>

            {/* Photo Grid & Upload Area */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-4/3 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 group">
                  <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  
                  {idx === 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-md text-[#CCFF00] text-[10px] font-bold px-2 py-0.5 rounded">
                      PRIMARY
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="p-1.5 bg-white/90 text-zinc-900 rounded-lg text-[10px] font-bold hover:bg-white transition-colors"
                        title="Set as primary cover"
                      >
                        Set Main
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Remove photo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Photo Button */}
              <label className="aspect-4/3 rounded-xl border-2 border-dashed border-zinc-300 hover:border-[#85B800] bg-zinc-50 hover:bg-zinc-100/70 flex flex-col items-center justify-center gap-1.5 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer">
                <Upload size={20} />
                <span className="text-xs font-semibold">Upload Photos</span>
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

          {/* Section 2: Core Vehicle Details (Make, Model, Year, Price) */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-zinc-900">Essential Vehicle Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Make */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Make <span className="text-red-500">*</span>
                </label>
                <select
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  required
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800] focus:bg-white transition-all"
                >
                  <option value="">Select Make</option>
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
                    placeholder="Enter manufacturer make (e.g. Porsche, Bentley)..."
                    className="w-full h-10 px-3 mt-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                  />
                )}
              </div>

              {/* Model */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Hilux, 320i, C200, Ranger, Golf"
                  required
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800] focus:bg-white transition-all"
                />
              </div>

              {/* Year */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Year of Manufacture <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  required
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800] focus:bg-white transition-all"
                />
              </div>

              {/* Price & Currency */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Listing Price <span className="text-red-500">*</span>
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
                      placeholder="e.g. 28500"
                      required
                      className="w-full h-11 pl-8 pr-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800] focus:bg-white transition-all"
                    />
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="ZAR">ZAR (R)</option>
                    <option value="ZiG">ZiG</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Technical Specs & Condition */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-zinc-900">Technical Specifications & Condition</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Mileage */}
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
                    placeholder="e.g. 85000"
                    className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                  />
                  <select
                    value={mileageUnit}
                    onChange={(e: any) => setMileageUnit(e.target.value)}
                    className="h-11 px-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 shrink-0"
                  >
                    <option value="km">km</option>
                    <option value="mi">miles</option>
                  </select>
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e: any) => setCondition(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                >
                  <option value="foreign_used">Foreign Used (Import)</option>
                  <option value="locally_used">Locally Used</option>
                  <option value="brand_new">Brand New</option>
                  <option value="certified_pre_owned">Certified Pre-Owned</option>
                </select>
              </div>

              {/* Transmission */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Transmission
                </label>
                <select
                  value={transmission}
                  onChange={(e: any) => setTransmission(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="semi_automatic">Semi-Automatic</option>
                  <option value="cvt">CVT</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Fuel Type */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Fuel Type
                </label>
                <select
                  value={fuelType}
                  onChange={(e: any) => setFuelType(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Body Type */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Body Type
                </label>
                <select
                  value={bodyType}
                  onChange={(e: any) => setBodyType(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
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

              {/* Engine */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Engine / Trim
                </label>
                <input
                  type="text"
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  placeholder="e.g. 2.8L GD-6, 2.0L Turbo"
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                />
              </div>

              {/* Exterior Colour */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Exterior Colour
                </label>
                <input
                  type="text"
                  value={colour}
                  onChange={(e) => setColour(e.target.value)}
                  placeholder="e.g. Pearl White, Obsidian Black"
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Vehicle Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Harare, Bulawayo"
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                />
              </div>

              {/* Availability Status */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Listing Status
                </label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800]"
                >
                  <option value="available">Available for Sale</option>
                  <option value="reserved">Reserved / Deposit Paid</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                Vehicle Description & Features
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Mention key selling points, service history, features (sunroof, leather, reverse camera), duty status, etc."
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-normal text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#85B800] focus:bg-white transition-all leading-relaxed"
              />
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
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
                  <span>{uploadProgress || 'Saving Vehicle...'}</span>
                </>
              ) : (
                <>
                  <Plus size={18} className="stroke-[2.5]" />
                  <span>Publish Vehicle Listing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

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

// src/services/vehicleService.ts
import { supabase } from '../lib/supabase';
import { 
  Vehicle, 
  VehicleImage, 
  VehicleStatus, 
  VehicleFilters, 
  VehicleFuelType, 
  VehicleTransmission, 
  VehicleCondition, 
  VehicleBodyType 
} from '../types';
import { uploadImage } from '../utils/uploadImage';

const LOCAL_STORAGE_KEY_PREFIX = 'threadzw_vehicles_';

// Helper to get local fallback storage
const getLocalVehicles = (shopId: string): Vehicle[] => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${shopId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

// Helper to save local fallback storage
const saveLocalVehicles = (shopId: string, vehicles: Vehicle[]): void => {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${shopId}`, JSON.stringify(vehicles));
  } catch (_) {}
};

/**
 * Format vehicle price with currency symbol and thousands commas
 * e.g. 28500 -> "$28,500"
 */
export const formatVehiclePrice = (price: number, currency = 'USD'): string => {
  const symbol = currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${Number(price || 0).toLocaleString('en-US')}`;
};

/**
 * Format mileage with units and thousands commas
 * e.g. 120000 -> "120,000 km"
 */
export const formatMileage = (mileage?: number | null, unit = 'km'): string => {
  if (mileage === undefined || mileage === null || isNaN(mileage)) {
    return 'Mileage unlisted';
  }
  return `${Number(mileage).toLocaleString('en-US')} ${unit}`;
};

/**
 * Format readable fuel type
 */
export const formatFuelType = (fuel?: VehicleFuelType | string | null): string => {
  if (!fuel) return 'Fuel N/A';
  const map: Record<string, string> = {
    petrol: 'Petrol',
    diesel: 'Diesel',
    hybrid: 'Hybrid',
    electric: 'Electric',
    lpg: 'LPG',
    cng: 'CNG',
    other: 'Other'
  };
  return map[fuel.toLowerCase()] || fuel;
};

/**
 * Format readable transmission
 */
export const formatTransmission = (trans?: VehicleTransmission | string | null): string => {
  if (!trans) return 'Transmission N/A';
  const map: Record<string, string> = {
    automatic: 'Automatic',
    manual: 'Manual',
    semi_automatic: 'Semi-Auto',
    cvt: 'CVT',
    other: 'Other'
  };
  return map[trans.toLowerCase()] || trans;
};

/**
 * Format readable vehicle condition
 */
export const formatCondition = (cond?: VehicleCondition | string | null): string => {
  if (!cond) return 'Condition N/A';
  const map: Record<string, string> = {
    brand_new: 'Brand New',
    foreign_used: 'Foreign Used',
    locally_used: 'Locally Used',
    certified_pre_owned: 'Certified Pre-Owned'
  };
  return map[cond.toLowerCase()] || cond;
};

/**
 * Format readable body type
 */
export const formatBodyType = (body?: VehicleBodyType | string | null): string => {
  if (!body) return 'Body Type N/A';
  const map: Record<string, string> = {
    suv: 'SUV',
    sedan: 'Sedan',
    hatchback: 'Hatchback',
    pickup: 'Pickup / Bakkie',
    coupe: 'Coupe',
    truck: 'Truck',
    van: 'Van',
    wagon: 'Station Wagon',
    convertible: 'Convertible',
    motorcycle: 'Motorcycle',
    other: 'Other'
  };
  return map[body.toLowerCase()] || body;
};

/**
 * Fetch all vehicles belonging to a shop with optional filtering
 */
export async function getShopVehicles(shopId: string, filters?: VehicleFilters): Promise<Vehicle[]> {
  if (!shopId) return [];

  let resultVehicles: Vehicle[] = [];

  try {
    // 1. Try querying Supabase
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_images (
          id,
          vehicle_id,
          image_url,
          sort_order,
          created_at
        )
      `)
      .eq('shop_id', shopId);

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.make) {
      query = query.ilike('make', `%${filters.make}%`);
    }
    if (filters?.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters?.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters?.minYear !== undefined) {
      query = query.gte('year', filters.minYear);
    }
    if (filters?.maxYear !== undefined) {
      query = query.lte('year', filters.maxYear);
    }

    // Sort order
    if (filters?.sortBy === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (filters?.sortBy === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else if (filters?.sortBy === 'year_desc') {
      query = query.order('year', { ascending: false });
    } else if (filters?.sortBy === 'mileage_asc') {
      query = query.order('mileage', { ascending: true, nullsFirst: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (!error && data) {
      resultVehicles = data.map((v: any) => {
        const sortedImages: VehicleImage[] = Array.isArray(v.vehicle_images)
          ? [...v.vehicle_images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          : [];
        const primaryImg = sortedImages.length > 0 ? sortedImages[0].image_url : undefined;
        return {
          ...v,
          price: Number(v.price),
          year: Number(v.year),
          mileage: v.mileage !== null ? Number(v.mileage) : null,
          images: sortedImages,
          primary_image: primaryImg
        };
      });

      // Synchronize with local storage cache
      if (resultVehicles.length > 0) {
        saveLocalVehicles(shopId, resultVehicles);
      }
    } else {
      // Fallback to local storage
      console.warn("Supabase vehicle query fallback note:", error?.message);
      resultVehicles = getLocalVehicles(shopId);
    }
  } catch (err) {
    console.warn("Vehicle fetch fallback note:", err);
    resultVehicles = getLocalVehicles(shopId);
  }

  // If Supabase returned empty but local has records, merge
  if (resultVehicles.length === 0) {
    resultVehicles = getLocalVehicles(shopId);
  }

  // In-memory filter processing if local fallback was used
  let processed = [...resultVehicles];

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    processed = processed.filter(v => 
      v.title?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.year?.toString().includes(q) ||
      v.description?.toLowerCase().includes(q) ||
      v.location?.toLowerCase().includes(q)
    );
  }

  if (filters?.status && filters.status !== 'all') {
    processed = processed.filter(v => v.status === filters.status);
  }
  if (filters?.make && filters.make !== 'all') {
    processed = processed.filter(v => v.make.toLowerCase() === filters.make!.toLowerCase());
  }
  if (filters?.minPrice !== undefined) {
    processed = processed.filter(v => v.price >= filters.minPrice!);
  }
  if (filters?.maxPrice !== undefined) {
    processed = processed.filter(v => v.price <= filters.maxPrice!);
  }
  if (filters?.minYear !== undefined) {
    processed = processed.filter(v => v.year >= filters.minYear!);
  }
  if (filters?.maxYear !== undefined) {
    processed = processed.filter(v => v.year <= filters.maxYear!);
  }

  return processed;
}

/**
 * Get a single vehicle by ID
 */
export async function getVehicleById(vehicleId: string, shopId?: string): Promise<Vehicle | null> {
  if (!vehicleId) return null;

  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_images (
          id,
          vehicle_id,
          image_url,
          sort_order,
          created_at
        )
      `)
      .eq('id', vehicleId)
      .maybeSingle();

    if (!error && data) {
      const sortedImages: VehicleImage[] = Array.isArray(data.vehicle_images)
        ? [...data.vehicle_images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        : [];
      return {
        ...data,
        price: Number(data.price),
        year: Number(data.year),
        mileage: data.mileage !== null ? Number(data.mileage) : null,
        images: sortedImages,
        primary_image: sortedImages.length > 0 ? sortedImages[0].image_url : undefined
      };
    }
  } catch (err) {
    console.warn("getVehicleById error:", err);
  }

  // Fallback to local storage search
  if (shopId) {
    const local = getLocalVehicles(shopId);
    const found = local.find(v => v.id === vehicleId);
    if (found) return found;
  } else {
    // Search all local vehicle caches
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_STORAGE_KEY_PREFIX)) {
        try {
          const list: Vehicle[] = JSON.parse(localStorage.getItem(key) || '[]');
          const match = list.find(v => v.id === vehicleId);
          if (match) return match;
        } catch (_) {}
      }
    }
  }

  return null;
}

/**
 * Create a new vehicle listing and insert associated images
 */
export async function createVehicle(
  shopId: string,
  vehicleData: {
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    currency?: string;
    mileage?: number | null;
    mileage_unit?: 'km' | 'mi';
    fuel_type?: VehicleFuelType | null;
    transmission?: VehicleTransmission | null;
    engine?: string | null;
    body_type?: VehicleBodyType | null;
    condition?: VehicleCondition | null;
    colour?: string | null;
    location?: string | null;
    description?: string | null;
    status?: VehicleStatus;
    is_featured?: boolean;
  },
  imageUrls: string[] = []
): Promise<Vehicle> {
  if (!shopId) throw new Error('Shop ID is required to create a vehicle.');
  if (!vehicleData.make || !vehicleData.model) throw new Error('Vehicle make and model are required.');
  if (!vehicleData.year || isNaN(vehicleData.year)) throw new Error('Valid vehicle year is required.');
  if (vehicleData.price === undefined || isNaN(vehicleData.price) || vehicleData.price < 0) {
    throw new Error('Valid positive vehicle price is required.');
  }

  const nowIso = new Date().toISOString();
  const vehicleId = crypto.randomUUID ? crypto.randomUUID() : `veh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const newVehicle: Vehicle = {
    id: vehicleId,
    shop_id: shopId,
    title: vehicleData.title.trim() || `${vehicleData.year} ${vehicleData.make.trim()} ${vehicleData.model.trim()}`,
    make: vehicleData.make.trim(),
    model: vehicleData.model.trim(),
    year: Number(vehicleData.year),
    price: Number(vehicleData.price),
    currency: vehicleData.currency || 'USD',
    mileage: vehicleData.mileage !== undefined && vehicleData.mileage !== null ? Number(vehicleData.mileage) : null,
    mileage_unit: vehicleData.mileage_unit || 'km',
    fuel_type: vehicleData.fuel_type || null,
    transmission: vehicleData.transmission || null,
    engine: vehicleData.engine?.trim() || null,
    body_type: vehicleData.body_type || null,
    condition: vehicleData.condition || null,
    colour: vehicleData.colour?.trim() || null,
    location: vehicleData.location?.trim() || null,
    description: vehicleData.description?.trim() || null,
    status: vehicleData.status || 'available',
    is_featured: !!vehicleData.is_featured,
    view_count: 0,
    created_at: nowIso,
    updated_at: nowIso,
    images: imageUrls.map((url, idx) => ({
      id: `img_${Date.now()}_${idx}`,
      vehicle_id: vehicleId,
      image_url: url,
      sort_order: idx,
      created_at: nowIso
    })),
    primary_image: imageUrls[0] || undefined
  };

  try {
    // 1. Insert into Supabase vehicles table
    const { data: dbVehicle, error: vehErr } = await supabase
      .from('vehicles')
      .insert({
        shop_id: newVehicle.shop_id,
        title: newVehicle.title,
        make: newVehicle.make,
        model: newVehicle.model,
        year: newVehicle.year,
        price: newVehicle.price,
        currency: newVehicle.currency,
        mileage: newVehicle.mileage,
        mileage_unit: newVehicle.mileage_unit,
        fuel_type: newVehicle.fuel_type,
        transmission: newVehicle.transmission,
        engine: newVehicle.engine,
        body_type: newVehicle.body_type,
        condition: newVehicle.condition,
        colour: newVehicle.colour,
        location: newVehicle.location,
        description: newVehicle.description,
        status: newVehicle.status,
        is_featured: newVehicle.is_featured
      })
      .select()
      .single();

    if (!vehErr && dbVehicle) {
      newVehicle.id = dbVehicle.id;

      // 2. Insert into vehicle_images table
      if (imageUrls.length > 0) {
        const imageRows = imageUrls.map((url, index) => ({
          vehicle_id: dbVehicle.id,
          image_url: url,
          sort_order: index
        }));

        const { error: imgErr } = await supabase
          .from('vehicle_images')
          .insert(imageRows);

        if (imgErr) {
          console.warn("vehicle_images insert warning:", imgErr.message);
        }
      }
    } else {
      console.warn("Supabase vehicles insert fallback note:", vehErr?.message);
    }
  } catch (err) {
    console.warn("createVehicle Supabase execution note:", err);
  }

  // Always update local storage cache
  const localList = getLocalVehicles(shopId);
  const updatedList = [newVehicle, ...localList.filter(v => v.id !== newVehicle.id)];
  saveLocalVehicles(shopId, updatedList);

  return newVehicle;
}

/**
 * Update an existing vehicle
 */
export async function updateVehicle(
  vehicleId: string,
  shopId: string,
  updates: Partial<Vehicle>,
  newImageUrls?: string[]
): Promise<Vehicle> {
  if (!vehicleId) throw new Error('Vehicle ID is required to update.');

  const nowIso = new Date().toISOString();

  try {
    const dbPayload: any = { ...updates, updated_at: nowIso };
    delete dbPayload.id;
    delete dbPayload.images;
    delete dbPayload.primary_image;

    const { error: updateErr } = await supabase
      .from('vehicles')
      .update(dbPayload)
      .eq('id', vehicleId);

    if (updateErr) {
      console.warn("Supabase updateVehicle warning:", updateErr.message);
    }

    if (newImageUrls && Array.isArray(newImageUrls)) {
      // Re-sync vehicle images
      await supabase.from('vehicle_images').delete().eq('vehicle_id', vehicleId);
      if (newImageUrls.length > 0) {
        const rows = newImageUrls.map((url, idx) => ({
          vehicle_id: vehicleId,
          image_url: url,
          sort_order: idx
        }));
        await supabase.from('vehicle_images').insert(rows);
      }
    }
  } catch (err) {
    console.warn("updateVehicle error:", err);
  }

  // Update local storage
  const localList = getLocalVehicles(shopId);
  const existingIdx = localList.findIndex(v => v.id === vehicleId);
  let updatedVehicle: Vehicle;

  if (existingIdx >= 0) {
    const existing = localList[existingIdx];
    const finalImages = newImageUrls
      ? newImageUrls.map((url, idx) => ({
          id: `img_${Date.now()}_${idx}`,
          vehicle_id: vehicleId,
          image_url: url,
          sort_order: idx
        }))
      : existing.images;

    updatedVehicle = {
      ...existing,
      ...updates,
      updated_at: nowIso,
      images: finalImages,
      primary_image: finalImages && finalImages[0] ? finalImages[0].image_url : existing.primary_image
    };
    localList[existingIdx] = updatedVehicle;
  } else {
    updatedVehicle = {
      id: vehicleId,
      shop_id: shopId,
      title: updates.title || 'Vehicle',
      make: updates.make || '',
      model: updates.model || '',
      year: updates.year || new Date().getFullYear(),
      price: updates.price || 0,
      currency: updates.currency || 'USD',
      status: updates.status || 'available',
      created_at: nowIso,
      updated_at: nowIso,
      ...updates,
      images: newImageUrls?.map((url, idx) => ({
        id: `img_${Date.now()}_${idx}`,
        vehicle_id: vehicleId,
        image_url: url,
        sort_order: idx
      })),
      primary_image: newImageUrls?.[0]
    };
    localList.unshift(updatedVehicle);
  }

  saveLocalVehicles(shopId, localList);
  return updatedVehicle;
}

/**
 * Quick toggle of vehicle status ('available' | 'reserved' | 'sold')
 */
export async function updateVehicleStatus(
  vehicleId: string,
  shopId: string,
  status: VehicleStatus
): Promise<boolean> {
  if (!vehicleId || !status) return false;

  try {
    const { error } = await supabase
      .from('vehicles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', vehicleId);

    if (error) {
      console.warn("Supabase updateVehicleStatus warning:", error.message);
    }
  } catch (err) {
    console.warn("updateVehicleStatus note:", err);
  }

  // Update local storage
  const localList = getLocalVehicles(shopId);
  const found = localList.find(v => v.id === vehicleId);
  if (found) {
    found.status = status;
    found.updated_at = new Date().toISOString();
    saveLocalVehicles(shopId, localList);
  }

  return true;
}

/**
 * Delete a vehicle listing
 */
export async function deleteVehicle(vehicleId: string, shopId: string): Promise<boolean> {
  if (!vehicleId) return false;

  try {
    // Delete cascaded images and vehicle
    await supabase.from('vehicle_images').delete().eq('vehicle_id', vehicleId);
    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
    if (error) {
      console.warn("Supabase deleteVehicle warning:", error.message);
    }
  } catch (err) {
    console.warn("deleteVehicle note:", err);
  }

  // Update local storage
  const localList = getLocalVehicles(shopId);
  const filtered = localList.filter(v => v.id !== vehicleId);
  saveLocalVehicles(shopId, filtered);

  return true;
}

/**
 * Upload multiple vehicle images to Supabase storage
 */
export async function uploadVehicleImages(
  userId: string,
  files: File[],
  onProgress?: (index: number, total: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) onProgress(i + 1, files.length);

    try {
      const publicUrl = await uploadImage({
        supabase,
        file,
        bucket: 'product-images',
        folder: 'vehicles',
        userId
      });
      uploadedUrls.push(publicUrl);
    } catch (err) {
      console.warn(`Failed to upload vehicle image ${file.name}, using data URL fallback:`, err);
      // Fallback: convert to base64 data URL if storage upload failed
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      uploadedUrls.push(base64);
    }
  }

  return uploadedUrls;
}

/**
 * Helper to seed initial sample vehicles for a new automotive dealer showroom
 */
export async function seedVehiclesIfEmpty(shopId: string, ownerId: string): Promise<Vehicle[]> {
  const existing = await getShopVehicles(shopId);
  if (existing && existing.length > 0) return existing;

  const sampleVehicles: Array<Parameters<typeof createVehicle>[1] & { images: string[] }> = [
    {
      title: '2021 Toyota Hilux 2.8 GD-6 Legend 4x4 Double Cab',
      make: 'Toyota',
      model: 'Hilux',
      year: 2021,
      price: 34500,
      currency: 'USD',
      mileage: 68000,
      mileage_unit: 'km',
      fuel_type: 'diesel',
      transmission: 'automatic',
      engine: '2.8L GD-6 Turbo Diesel',
      body_type: 'pickup',
      condition: 'foreign_used',
      colour: 'Pearl White',
      location: 'Harare, Zimbabwe',
      description: 'Clean foreign used Toyota Hilux Legend RS Double Cab. Full service history, leather interior, touch screen infotainment with Apple CarPlay, nudge bar, roll bar, and tonneau cover. Duty fully paid, ready for registration.',
      status: 'available',
      is_featured: true,
      images: [
        'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop&q=80'
      ]
    },
    {
      title: '2020 BMW 320i M Sport (G20)',
      make: 'BMW',
      model: '3 Series (320i)',
      year: 2020,
      price: 26800,
      currency: 'USD',
      mileage: 45000,
      mileage_unit: 'km',
      fuel_type: 'petrol',
      transmission: 'automatic',
      engine: '2.0L TwinPower Turbo',
      body_type: 'sedan',
      condition: 'foreign_used',
      colour: 'Portimao Blue Metallic',
      location: 'Harare, Zimbabwe',
      description: 'Mint condition BMW 320i M Sport package with sunroof, ambient lighting, digital cockpit, M Sport 19-inch alloys, Harmon Kardon surround sound, reverse camera and parking sensors. Immaculate vehicle.',
      status: 'available',
      is_featured: true,
      images: [
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&auto=format&fit=crop&q=80'
      ]
    },
    {
      title: '2018 Mercedes-Benz C200 AMG Line',
      make: 'Mercedes-Benz',
      model: 'C-Class (C200)',
      year: 2018,
      price: 21500,
      currency: 'USD',
      mileage: 79000,
      mileage_unit: 'km',
      fuel_type: 'petrol',
      transmission: 'automatic',
      engine: '1.5L Turbo EQ Boost',
      body_type: 'sedan',
      condition: 'foreign_used',
      colour: 'Obsidian Black',
      location: 'Harare, Zimbabwe',
      description: 'Well-maintained C200 AMG Line with panoramic sunroof, red leather sport seats, LED high-performance headlights, keyless start, and new Michelin tyres.',
      status: 'reserved',
      is_featured: false,
      images: [
        'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1200&auto=format&fit=crop&q=80'
      ]
    }
  ];

  const createdVehicles: Vehicle[] = [];

  for (const sample of sampleVehicles) {
    const { images, ...vData } = sample;
    try {
      const v = await createVehicle(shopId, vData, images);
      createdVehicles.push(v);
    } catch (e) {
      console.warn("Sample vehicle creation note:", e);
    }
  }

  return createdVehicles.length > 0 ? createdVehicles : [];
}

-- Phase 4 Migration: Create vehicles and vehicle_images tables for Vehicle Sales System
-- Supports page_type = 'vehicles'

-- 1. Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    mileage INTEGER DEFAULT NULL CHECK (mileage IS NULL OR mileage >= 0),
    mileage_unit TEXT DEFAULT 'km',
    fuel_type TEXT DEFAULT NULL CHECK (fuel_type IS NULL OR fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric', 'lpg', 'cng', 'other')),
    transmission TEXT DEFAULT NULL CHECK (transmission IS NULL OR transmission IN ('automatic', 'manual', 'semi_automatic', 'cvt', 'other')),
    engine TEXT DEFAULT NULL,
    body_type TEXT DEFAULT NULL CHECK (body_type IS NULL OR body_type IN ('suv', 'sedan', 'hatchback', 'pickup', 'coupe', 'truck', 'van', 'wagon', 'convertible', 'motorcycle', 'other')),
    condition TEXT DEFAULT NULL CHECK (condition IS NULL OR condition IN ('brand_new', 'foreign_used', 'locally_used', 'certified_pre_owned')),
    colour TEXT DEFAULT NULL,
    location TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create vehicle_images table
CREATE TABLE IF NOT EXISTS public.vehicle_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_shop_id ON public.vehicles(shop_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON public.vehicles(make);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON public.vehicles(year);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON public.vehicles(price);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON public.vehicles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON public.vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_sort_order ON public.vehicle_images(vehicle_id, sort_order ASC);

-- 4. Enable Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for vehicles table
DO $$
BEGIN
    -- Public Read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Allow public read of vehicles'
    ) THEN
        CREATE POLICY "Allow public read of vehicles"
        ON public.vehicles FOR SELECT
        USING (true);
    END IF;

    -- Shop Owner Insert
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Allow shop owners to insert vehicles'
    ) THEN
        CREATE POLICY "Allow shop owners to insert vehicles"
        ON public.vehicles FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.shops
                WHERE public.shops.id = vehicles.shop_id
                AND public.shops.owner_id = auth.uid()
            )
        );
    END IF;

    -- Shop Owner Update
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Allow shop owners to update vehicles'
    ) THEN
        CREATE POLICY "Allow shop owners to update vehicles"
        ON public.vehicles FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM public.shops
                WHERE public.shops.id = vehicles.shop_id
                AND public.shops.owner_id = auth.uid()
            )
        );
    END IF;

    -- Shop Owner Delete
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Allow shop owners to delete vehicles'
    ) THEN
        CREATE POLICY "Allow shop owners to delete vehicles"
        ON public.vehicles FOR DELETE
        USING (
            EXISTS (
                SELECT 1 FROM public.shops
                WHERE public.shops.id = vehicles.shop_id
                AND public.shops.owner_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 6. RLS Policies for vehicle_images table
DO $$
BEGIN
    -- Public Read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_images' AND policyname = 'Allow public read of vehicle images'
    ) THEN
        CREATE POLICY "Allow public read of vehicle images"
        ON public.vehicle_images FOR SELECT
        USING (true);
    END IF;

    -- Shop Owner Insert Images
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_images' AND policyname = 'Allow vehicle owners to insert images'
    ) THEN
        CREATE POLICY "Allow vehicle owners to insert images"
        ON public.vehicle_images FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.vehicles
                JOIN public.shops ON public.shops.id = vehicles.shop_id
                WHERE vehicles.id = vehicle_images.vehicle_id
                AND public.shops.owner_id = auth.uid()
            )
        );
    END IF;

    -- Shop Owner Update Images
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_images' AND policyname = 'Allow vehicle owners to update images'
    ) THEN
        CREATE POLICY "Allow vehicle owners to update images"
        ON public.vehicle_images FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM public.vehicles
                JOIN public.shops ON public.shops.id = vehicles.shop_id
                WHERE vehicles.id = vehicle_images.vehicle_id
                AND public.shops.owner_id = auth.uid()
            )
        );
    END IF;

    -- Shop Owner Delete Images
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_images' AND policyname = 'Allow vehicle owners to delete images'
    ) THEN
        CREATE POLICY "Allow vehicle owners to delete images"
        ON public.vehicle_images FOR DELETE
        USING (
            EXISTS (
                SELECT 1 FROM public.vehicles
                JOIN public.shops ON public.shops.id = vehicles.shop_id
                WHERE vehicles.id = vehicle_images.vehicle_id
                AND public.shops.owner_id = auth.uid()
            )
        );
    END IF;
END $$;

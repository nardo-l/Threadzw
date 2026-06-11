interface UploadImageParams {
  supabase?: any;
  file: File;
  bucket?: string;
  folder?: string;
  userId: string;
}

const compressAndConvertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxResolution = 800; // Perfect sizing for high speed loading and beautiful catalog layout
        if (width > maxResolution || height > maxResolution) {
          if (width > height) {
            height = Math.round((height * maxResolution) / width);
            width = maxResolution;
          } else {
            width = Math.round((width * maxResolution) / height);
            height = maxResolution;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // compress to JPG 70% quality, compact & fast!
          resolve(dataUrl);
        } else {
          resolve(e.target?.result as string || '');
        }
      };
      img.src = e.target?.result as string || '';
    };
    reader.readAsDataURL(file);
  });
};

export const uploadImage = async ({
  supabase,
  file,
  bucket = 'product-images',
  folder = 'product',
  userId,
}: UploadImageParams): Promise<string> => {
  // Validate size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image too large. Max 5MB.');
  }

  // Validate type
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new Error('Please use JPG, PNG or WebP.');
  }

  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not logged in');
    }

    const ext = file.name.split('.').pop() || 'jpg';
    // Always use userId (which is the Shop ID) as the first folder segment to satisfy RLS policies
    const path = `${userId}/${folder}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (error: any) {
    console.error("Upload to Supabase storage failed:", error);

    // Print clear instructions in console for the merchant
    console.warn(`
============================================================
⚠️ SUPABASE STORAGE ERROR: "${error.message}"
This usually means your Supabase storage buckets or policies are not fully configured yet.

To fix this and make cloud uploads work permanently:
Go to your Supabase Dashboard -> SQL Editor and run this:

-- 1. Create Public Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('product-images', 'product-images', true),
  ('shop-avatars', 'shop-avatars', true),
  ('shop-banners', 'shop-banners', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create Public Policies
CREATE POLICY "Public Access for product-images" ON storage.objects FOR ALL USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Public Access for shop-avatars" ON storage.objects FOR ALL USING (bucket_id = 'shop-avatars') WITH CHECK (bucket_id = 'shop-avatars');
CREATE POLICY "Public Access for shop-banners" ON storage.objects FOR ALL USING (bucket_id = 'shop-banners') WITH CHECK (bucket_id = 'shop-banners');
CREATE POLICY "Public Access for avatars" ON storage.objects FOR ALL USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
============================================================
    `);

    // Import sonner toast dynamically to avoid dependency load issues
    import('sonner').then(({ toast }) => {
      toast.warning("Storage fallback active (local preview). To enable permanent cloud saves, please configure your Supabase Storage policies.", {
        duration: 8000
      });
    }).catch(() => {});

    // Gracefully fallback to local URL preview so user workflow is uninterrupted
    return compressAndConvertToBase64(file);
  }
};

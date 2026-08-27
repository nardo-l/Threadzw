interface UploadImageParams {
  supabase?: any;
  file: File;
  bucket?: string;
  folder?: string;
  userId: string;
}

// Accept typical phone-camera originals, then compress them before transmission.
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const MAX_UPLOAD_DIMENSION = 1600;
const MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 30_000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Reduce phone photos before upload while preserving a browser-readable File. */
async function optimizeImageForUpload(file: File): Promise<File> {
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    // Avoid re-encoding already-small images unnecessarily.
    if (file.size <= MAX_UPLOAD_BYTES && scale === 1) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.82)
    );
    if (!blob) return file;

    const optimizedName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], optimizedName, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (error) {
    // Upload the original if a browser cannot decode or compress the image.
    console.warn('Image optimization skipped:', error);
    return file;
  }
}

async function uploadWithRetry(storage: any, path: string, file: File) {
  let lastError: any;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await Promise.race([
        storage.upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg'
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Image upload timed out. Check your connection and try again.')), UPLOAD_TIMEOUT_MS)
        )
      ]);
    } catch (error) {
      lastError = error;
      if (attempt < 2) await sleep(700 * (attempt + 1));
    }
  }
  throw lastError;
}

export const uploadImage = async ({
  supabase,
  file,
  bucket = 'product-images',
  folder = 'product',
  userId,
}: UploadImageParams): Promise<string> => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Image too large. Max 12MB. Try selecting a smaller photo.');
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowed.includes(file.type.toLowerCase())) {
    throw new Error('Please use JPG, PNG or WebP.');
  }

  if (!supabase) {
    throw new Error('Supabase client is not initialized');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not logged in. Authentic session required.');
  }

  const uploadFile = await optimizeImageForUpload(file);
  const path = `${userId}/${folder}_${Date.now()}.jpg`;
  const { error: uploadError } = await uploadWithRetry(
    supabase.storage.from(bucket),
    path,
    uploadFile
  );

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const imageUploadLimits = {
  maxFileSize: MAX_FILE_SIZE,
  maxDimension: MAX_UPLOAD_DIMENSION,
  maxOptimizedBytes: MAX_UPLOAD_BYTES,
};

export default uploadImage;

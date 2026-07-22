// src/utils/imageEnhancer.ts

export async function cropToSquare(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const minDim = Math.min(img.width, img.height);
      canvas.width = minDim;
      canvas.height = minDim;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context unavailable');

      const startX = (img.width - minDim) / 2;
      const startY = (img.height - minDim) / 2;

      ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, minDim, minDim);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });
}

export async function enhanceLighting(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context unavailable');

      ctx.filter = 'contrast(1.12) brightness(1.06) saturate(1.08)';
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });
}

export async function compressAndOptimize(imageSrc: string, maxDimension = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context unavailable');

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });
}

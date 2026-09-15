import { STOREFRONT_THEME_MAP } from '../config/storefrontThemes';

export interface StorefrontTheme {
  id: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  mode: 'light' | 'dark';
  radius: string;
  buttonRadius: string;
  font: 'editorial' | 'modern' | 'mono' | 'soft';
  accentText: string;
  accentRgb: string;
}

const DEFAULT_ID = 'editorial-noir';

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const channels = [r, g, b].map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first: ReturnType<typeof hexToRgb>, second: ReturnType<typeof hexToRgb>) {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function themeFromId(themeId?: string | null): StorefrontTheme | null {
  const definition = STOREFRONT_THEME_MAP[themeId || ''];
  if (!definition) return null;
  const rgb = hexToRgb(definition.accent);
  const accentText = contrastRatio(rgb, { r: 16, g: 16, b: 16 }) >= 4.5 ? '#101010' : '#ffffff';

  return {
    ...definition,
    id: definition.id,
    accentText,
    accentRgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`
  };
}

export const DEFAULT_STOREFRONT_THEME = themeFromId(DEFAULT_ID)!;

type Rgb = { r: number; g: number; b: number };

function clamp(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mix(first: Rgb, second: Rgb, weight: number): Rgb {
  return {
    r: clamp(first.r * (1 - weight) + second.r * weight),
    g: clamp(first.g * (1 - weight) + second.g * weight),
    b: clamp(first.b * (1 - weight) + second.b * weight)
  };
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b].map(value => clamp(value).toString(16).padStart(2, '0')).join('')}`;
}

function logoAccentTheme(imageData: ImageData): StorefrontTheme {
  const buckets = new Map<string, { color: Rgb; score: number }>();

  for (let i = 0; i < imageData.data.length; i += 16) {
    if (imageData.data[i + 3] < 150) continue;
    const color = { r: imageData.data[i], g: imageData.data[i + 1], b: imageData.data[i + 2] };
    const max = Math.max(color.r, color.g, color.b);
    const min = Math.min(color.r, color.g, color.b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const brightness = max / 255;
    if (brightness > 0.93 || brightness < 0.08 || saturation < 0.18) continue;
    const bucket = {
      r: Math.round(color.r / 16) * 16,
      g: Math.round(color.g / 16) * 16,
      b: Math.round(color.b / 16) * 16
    };
    const key = `${bucket.r}-${bucket.g}-${bucket.b}`;
    const score = saturation * 0.75 + (1 - Math.abs(brightness - 0.48)) * 0.25;
    const current = buckets.get(key);
    if (current) current.score += score;
    else buckets.set(key, { color: bucket, score });
  }

  const winner = [...buckets.values()].sort((a, b) => b.score - a.score)[0]?.color;
  if (!winner) return DEFAULT_STOREFRONT_THEME;

  const accent = rgbToHex(winner);
  const closest = Object.values(STOREFRONT_THEME_MAP).find(theme => theme.accent.toLowerCase() === accent.toLowerCase());
  if (closest) return themeFromId(closest.id)!;

  return {
    ...DEFAULT_STOREFRONT_THEME,
    accent,
    accentStrong: rgbToHex(mix(winner, { r: 0, g: 0, b: 0 }, 0.16)),
    accentSoft: rgbToHex(mix(winner, { r: 255, g: 255, b: 255 }, 0.9)),
    accentText: contrastRatio(winner, { r: 16, g: 16, b: 16 }) >= 4.5 ? '#101010' : '#ffffff',
    accentRgb: `${winner.r}, ${winner.g}, ${winner.b}`
  };
}

const themeCache = new Map<string, Promise<StorefrontTheme>>();

/**
 * themeId is deliberately accepted from the loaded shop object. This avoids
 * querying Supabase again and fixes stale themeCache values after a merchant
 * changes their theme.
 */
export function extractLogoTheme(source?: string | null, themeId?: string | null): Promise<StorefrontTheme> {
  const savedTheme = themeFromId(themeId);
  if (savedTheme) return Promise.resolve(savedTheme);
  if (!source || typeof window === 'undefined') return Promise.resolve(DEFAULT_STOREFRONT_THEME);

  const cacheKey = source;
  const cached = themeCache.get(cacheKey);
  if (cached) return cached;

  const promise = new Promise<StorefrontTheme>(resolve => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return resolve(DEFAULT_STOREFRONT_THEME);
        context.drawImage(image, 0, 0, 48, 48);
        resolve(logoAccentTheme(context.getImageData(0, 0, 48, 48)));
      } catch {
        resolve(DEFAULT_STOREFRONT_THEME);
      }
    };
    image.onerror = () => resolve(DEFAULT_STOREFRONT_THEME);
    image.src = source;
  });

  themeCache.set(cacheKey, promise);
  return promise;
}

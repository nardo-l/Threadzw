import { supabase } from '../lib/supabase';

export interface StorefrontTheme {
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentSoftStrong: string;
  accentText: string;
  accentRgb: string;
}

export const DEFAULT_STOREFRONT_THEME: StorefrontTheme = {
  accent: '#bef715',
  accentStrong: '#91bd00',
  accentSoft: '#f4fde8',
  accentSoftStrong: '#e6f8b8',
  accentText: '#172000',
  accentRgb: '190, 247, 21'
};

const SAVED_THEME_ACCENTS: Record<string, string> = {
  'editorial-noir': '#111111',
  'soft-studio': '#b88a62',
  'gallery-minimal': '#6b7280',
  'street-archive': '#d92d20',
  'cobalt-club': '#2457ff',
  'sage-atelier': '#6f7f63',
  'cherry-pop': '#e5485d',
  'earth-utility': '#6f6a45'
};

type Rgb = { r: number; g: number; b: number };

function clamp(value: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map(value => clamp(value).toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex: string): Rgb {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function mix(first: Rgb, second: Rgb, secondWeight: number): Rgb {
  return {
    r: clamp(first.r * (1 - secondWeight) + second.r * secondWeight),
    g: clamp(first.g * (1 - secondWeight) + second.g * secondWeight),
    b: clamp(first.b * (1 - secondWeight) + second.b * secondWeight)
  };
}

function darken(color: Rgb, amount: number): Rgb {
  return mix(color, { r: 0, g: 0, b: 0 }, amount);
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channels = [r, g, b].map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first: Rgb, second: Rgb): number {
  const brighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (brighter + 0.05) / (darker + 0.05);
}

function toTheme(accent: Rgb): StorefrontTheme {
  const accentHex = rgbToHex(accent);
  const strong = darken(accent, 0.16);
  const soft = mix(accent, { r: 255, g: 255, b: 255 }, 0.9);
  const softStrong = mix(accent, { r: 255, g: 255, b: 255 }, 0.78);
  const text = contrastRatio(accent, { r: 16, g: 16, b: 16 }) >= 4.5 ? '#101010' : '#ffffff';

  return {
    accent: accentHex,
    accentStrong: rgbToHex(strong),
    accentSoft: rgbToHex(soft),
    accentSoftStrong: rgbToHex(softStrong),
    accentText: text,
    accentRgb: `${accent.r}, ${accent.g}, ${accent.b}`
  };
}

function themeFromId(themeId?: string | null): StorefrontTheme | null {
  if (!themeId) return null;
  const accent = SAVED_THEME_ACCENTS[themeId];
  return accent ? toTheme(hexToRgb(accent)) : null;
}

async function getSavedThemeFromCurrentStorefront(): Promise<StorefrontTheme | null> {
  if (typeof window === 'undefined') return null;

  const path = window.location.pathname.replace(/\/$/, '');
  const segments = path.split('/').filter(Boolean);
  let slug = '';

  if (segments[0] === 'shop' || segments[0] === 'store') slug = segments[1] || '';
  else if (segments[0] === 's') slug = segments[1] || '';
  else if (segments[0] && segments[0] !== 'demo') slug = segments[0];

  slug = slug.replace(/^@/, '').trim().toLowerCase();
  if (!slug) return null;

  // Permanent links may be slug--uuid. In that case the public page already
  // supports the UUID fallback, so use the same lookup here.
  let query = supabase.from('shops').select('page_config, slug').eq('slug', slug).maybeSingle();
  const { data } = await query;

  if (data?.page_config?.theme_id) {
    return themeFromId(data.page_config.theme_id);
  }

  if (slug.includes('--')) {
    const possibleId = slug.slice(slug.lastIndexOf('--') + 2);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(possibleId)) {
      const { data: byId } = await supabase.from('shops').select('page_config').eq('id', possibleId).maybeSingle();
      if (byId?.page_config?.theme_id) return themeFromId(byId.page_config.theme_id);
    }
  }

  return null;
}

function chooseAccent(imageData: ImageData): Rgb | null {
  const buckets = new Map<string, { color: Rgb; score: number }>();

  for (let index = 0; index < imageData.data.length; index += 16) {
    const alpha = imageData.data[index + 3];
    if (alpha < 150) continue;

    const color: Rgb = {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2]
    };
    const max = Math.max(color.r, color.g, color.b);
    const min = Math.min(color.r, color.g, color.b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const brightness = max / 255;

    if (brightness > 0.93 || brightness < 0.08 || saturation < 0.18) continue;

    const midTonePreference = 1 - Math.min(1, Math.abs(brightness - 0.48) / 0.48);
    const score = saturation * 0.72 + midTonePreference * 0.28;
    const bucketColor: Rgb = {
      r: Math.round(color.r / 16) * 16,
      g: Math.round(color.g / 16) * 16,
      b: Math.round(color.b / 16) * 16
    };
    const key = `${bucketColor.r}-${bucketColor.g}-${bucketColor.b}`;
    const current = buckets.get(key);
    if (current) current.score += score;
    else buckets.set(key, { color: bucketColor, score });
  }

  const winner = [...buckets.values()].sort((first, second) => second.score - first.score)[0];
  return winner?.color || null;
}

function chooseNeutralAccent(imageData: ImageData): Rgb | null {
  const buckets = new Map<string, { color: Rgb; score: number }>();

  for (let index = 0; index < imageData.data.length; index += 16) {
    const alpha = imageData.data[index + 3];
    if (alpha < 150) continue;

    const color: Rgb = {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2]
    };
    const max = Math.max(color.r, color.g, color.b);
    const min = Math.min(color.r, color.g, color.b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const brightness = max / 255;

    if (brightness > 0.93 || saturation >= 0.18) continue;

    const darknessPreference = 1 - brightness;
    const midTonePreference = 1 - Math.min(1, Math.abs(brightness - 0.42) / 0.42);
    const score = darknessPreference * 0.72 + midTonePreference * 0.28;
    const bucketColor: Rgb = {
      r: Math.round(color.r / 16) * 16,
      g: Math.round(color.g / 16) * 16,
      b: Math.round(color.b / 16) * 16
    };
    const key = `${bucketColor.r}-${bucketColor.g}-${bucketColor.b}`;
    const current = buckets.get(key);
    if (current) current.score += score;
    else buckets.set(key, { color: bucketColor, score });
  }

  const winner = [...buckets.values()].sort((first, second) => second.score - first.score)[0];
  return winner?.color || null;
}

const themeCache = new Map<string, Promise<StorefrontTheme>>();

export function extractLogoTheme(source?: string | null): Promise<StorefrontTheme> {
  if (!source || typeof window === 'undefined') return Promise.resolve(DEFAULT_STOREFRONT_THEME);
  const cached = themeCache.get(source);
  if (cached) return cached;

  const promise = new Promise<StorefrontTheme>(resolve => {
    getSavedThemeFromCurrentStorefront().then(savedTheme => {
      if (savedTheme) {
        resolve(savedTheme);
        return;
      }

      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        try {
          const size = 48;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (!context) return resolve(DEFAULT_STOREFRONT_THEME);
          context.drawImage(image, 0, 0, size, size);
          const imageData = context.getImageData(0, 0, size, size);
          const accent = chooseAccent(imageData) || chooseNeutralAccent(imageData);
          resolve(accent ? toTheme(accent) : DEFAULT_STOREFRONT_THEME);
        } catch {
          resolve(DEFAULT_STOREFRONT_THEME);
        }
      };
      image.onerror = () => resolve(DEFAULT_STOREFRONT_THEME);
      image.src = source;
    }).catch(() => resolve(DEFAULT_STOREFRONT_THEME));
  });

  themeCache.set(source, promise);
  return promise;
}

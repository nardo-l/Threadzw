import { supabase } from '../lib/supabase';
import { STOREFRONT_THEME_MAP } from '../config/storefrontThemes';

export interface StorefrontTheme {
  id: string; accent: string; accentStrong: string; accentSoft: string; background: string; surface: string; surfaceAlt: string; text: string; muted: string; border: string; mode: 'light' | 'dark'; radius: string; buttonRadius: string; font: 'editorial' | 'modern' | 'mono' | 'soft'; accentText: string; accentRgb: string;
}
const DEFAULT_ID = 'editorial-noir';
function hexToRgb(hex: string) { const value = hex.replace('#', ''); return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16) }; }
function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) { const channels = [r, g, b].map(channel => { const normalized = channel / 255; return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4); }); return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]; }
function contrastRatio(first: ReturnType<typeof hexToRgb>, second: ReturnType<typeof hexToRgb>) { const a = relativeLuminance(first); const b = relativeLuminance(second); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); }
export function themeFromId(themeId?: string | null): StorefrontTheme | null { const definition = STOREFRONT_THEME_MAP[themeId || '']; if (!definition) return null; const rgb = hexToRgb(definition.accent); return { ...definition, accentText: contrastRatio(rgb, { r: 16, g: 16, b: 16 }) >= 4.5 ? '#101010' : '#ffffff', accentRgb: `${rgb.r}, ${rgb.g}, ${rgb.b}` }; }
export const DEFAULT_STOREFRONT_THEME = themeFromId(DEFAULT_ID)!;
type Rgb = { r: number; g: number; b: number };
function clamp(value: number) { return Math.max(0, Math.min(255, Math.round(value))); }
function mix(first: Rgb, second: Rgb, weight: number): Rgb { return { r: clamp(first.r * (1 - weight) + second.r * weight), g: clamp(first.g * (1 - weight) + second.g * weight), b: clamp(first.b * (1 - weight) + second.b * weight) }; }
function rgbToHex({ r, g, b }: Rgb) { return `#${[r, g, b].map(value => clamp(value).toString(16).padStart(2, '0')).join('')}`; }
function logoAccentTheme(imageData: ImageData): StorefrontTheme { const buckets = new Map<string, { color: Rgb; score: number }>(); for (let i = 0; i < imageData.data.length; i += 16) { if (imageData.data[i + 3] < 150) continue; const color = { r: imageData.data[i], g: imageData.data[i + 1], b: imageData.data[i + 2] }; const max = Math.max(color.r, color.g, color.b); const min = Math.min(color.r, color.g, color.b); const saturation = max === 0 ? 0 : (max - min) / max; const brightness = max / 255; if (brightness > 0.93 || brightness < 0.08 || saturation < 0.18) continue; const bucket = { r: Math.round(color.r / 16) * 16, g: Math.round(color.g / 16) * 16, b: Math.round(color.b / 16) * 16 }; const key = `${bucket.r}-${bucket.g}-${bucket.b}`; const score = saturation * 0.75 + (1 - Math.abs(brightness - 0.48)) * 0.25; const current = buckets.get(key); if (current) current.score += score; else buckets.set(key, { color: bucket, score }); } const winner = [...buckets.values()].sort((a, b) => b.score - a.score)[0]?.color; if (!winner) return DEFAULT_STOREFRONT_THEME; const accent = rgbToHex(winner); const closest = Object.values(STOREFRONT_THEME_MAP).find(theme => theme.accent.toLowerCase() === accent.toLowerCase()); if (closest) return themeFromId(closest.id)!; return { ...DEFAULT_STOREFRONT_THEME, accent, accentStrong: rgbToHex(mix(winner, { r: 0, g: 0, b: 0 }, 0.16)), accentSoft: rgbToHex(mix(winner, { r: 255, g: 255, b: 255 }, 0.9)), accentText: contrastRatio(winner, { r: 16, g: 16, b: 16 }) >= 4.5 ? '#101010' : '#ffffff', accentRgb: `${winner.r}, ${winner.g}, ${winner.b}` }; }
function applyThemeStyles(theme: StorefrontTheme) { if (typeof document === 'undefined') return; const existing = document.getElementById('threadzw-storefront-theme'); if (existing) existing.remove(); const dark = theme.mode === 'dark'; const rootBg = theme.background; const surface = theme.surface; const surfaceAlt = theme.surfaceAlt; const text = theme.text; const muted = theme.muted; const border = theme.border; const radius = theme.radius; const buttonRadius = theme.buttonRadius; const style = document.createElement('style'); style.id = 'threadzw-storefront-theme'; style.textContent = `
.storefront-root { background:${rootBg} !important; color:${text} !important; }
.storefront-root > div { background:${surface} !important; border-color:${border} !important; }
.storefront-root header { background:${surface}ee !important; border-color:${border} !important; }
.storefront-root main { background:${rootBg} !important; }
.storefront-root footer { background:${surfaceAlt} !important; border-color:${border} !important; }
.storefront-root nav { background:${surface}f2 !important; border-color:${border} !important; }
.storefront-root .bg-white { background-color:${surface} !important; }
.storefront-root .bg-zinc-50 { background-color:${surfaceAlt} !important; }
.storefront-root .bg-zinc-100 { background-color:${surfaceAlt} !important; }
.storefront-root .text-zinc-900, .storefront-root .text-zinc-950, .storefront-root .text-zinc-800 { color:${text} !important; }
.storefront-root .text-zinc-700, .storefront-root .text-zinc-600, .storefront-root .text-zinc-500, .storefront-root .text-zinc-400 { color:${muted} !important; }
.storefront-root .border-zinc-100, .storefront-root .border-zinc-200, .storefront-root .border-zinc-150, .storefront-root .border-zinc-150\\/70, .storefront-root .border-zinc-150\\/80 { border-color:${border} !important; }
.storefront-root input { background:${surfaceAlt} !important; color:${text} !important; border-color:${border} !important; }
.storefront-root button:not(.store-accent-bg), .storefront-root a { border-radius:${buttonRadius}; }
.storefront-root #home-hero-header { background:${surface} !important; border-color:${border} !important; }
.storefront-root #home-highlight-cards .rounded-2xl { border-radius:${radius} !important; }
.storefront-root #home-products-section .rounded-2xl { border-radius:${radius} !important; }
.storefront-root #home-products-section .bg-zinc-50 { background:${surfaceAlt} !important; }
.storefront-root .store-accent-bg { border-radius:${buttonRadius} !important; }
.storefront-root .store-accent-soft-bg { background:${theme.accentSoft} !important; }
.storefront-root .store-accent-soft-strong-bg { background:${theme.accentSoft} !important; }
.storefront-root .store-accent-soft-border { border-color:${theme.accentSoft} !important; }
.storefront-root .shadow-xs, .storefront-root .shadow-sm, .storefront-root .shadow-md { box-shadow:0 8px 28px ${dark ? 'rgba(0,0,0,.28)' : `${theme.accent}18`} !important; }
.storefront-root img { border-radius:${theme.id === 'street-archive' ? '2px' : radius} !important; }
.storefront-root h1, .storefront-root h2, .storefront-root h3, .storefront-root h4 { font-family:${theme.font === 'mono' ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : theme.font === 'editorial' ? 'Georgia, Times New Roman, serif' : theme.font === 'soft' ? 'ui-rounded, "Trebuchet MS", sans-serif' : 'DM Sans, system-ui, sans-serif'} !important; }
.storefront-root .bg-rose-500, .storefront-root .bg-red-500 { background:${theme.accent} !important; }
.storefront-root .text-rose-500, .storefront-root .text-red-600 { color:${theme.accent} !important; }
.storefront-root .bg-red-50 { background:${theme.accentSoft} !important; }
.storefront-root .border-red-200 { border-color:${theme.accentSoft} !important; }
${dark ? `.storefront-root .bg-black\\/10 { background:rgba(0,0,0,.28) !important; }.storefront-root .bg-zinc-50\\/50 { background:${surfaceAlt} !important; }.storefront-root .text-white { color:#fff !important; }.storefront-root .bg-white\\/80,.storefront-root .bg-white\\/90,.storefront-root .bg-white\\/95 { background:${surface}f2 !important; }.storefront-root .border-white { border-color:${border} !important; }` : ''}
${theme.id === 'editorial-noir' ? `.storefront-root #home-hero-header > div:first-child { height:220px !important; }.storefront-root #home-products-section > div:last-child > div { border-radius:4px !important; padding:3px !important; }` : ''}
${theme.id === 'street-archive' ? `.storefront-root { background:#080809 !important; }.storefront-root #home-hero-header { background:#080809 !important; color:#fff !important; }.storefront-root #home-products-section .bg-white { background:#151517 !important; }.storefront-root #home-products-section > div:last-child > div { border-color:#343438 !important; }` : ''}
${theme.id === 'cobalt-club' ? `.storefront-root #home-hero-header { border-bottom:3px solid ${theme.accent} !important; }.storefront-root #home-products-section > div:last-child > div { border-radius:16px !important; }` : ''}
${theme.id === 'cherry-pop' ? `.storefront-root #home-hero-header { background:linear-gradient(180deg,${theme.accentSoft} 0%,${surface} 65%) !important; }.storefront-root .store-accent-bg { box-shadow:0 8px 18px ${theme.accent}30 !important; }` : ''}
${theme.id === 'earth-utility' ? `.storefront-root #home-hero-header { border-top:6px solid ${theme.accent} !important; }.storefront-root #home-products-section > div:last-child > div { border-radius:5px !important; }` : ''}
${theme.id === 'sage-atelier' ? `.storefront-root #home-hero-header { background:${theme.surfaceAlt} !important; }.storefront-root #home-products-section > div:last-child > div { box-shadow:0 8px 24px rgba(55,75,45,.08) !important; }` : ''}
${theme.id === 'soft-studio' ? `.storefront-root #home-hero-header { background:${theme.background} !important; }.storefront-root #home-products-section > div:last-child > div { box-shadow:0 10px 26px rgba(120,80,45,.08) !important; }` : ''}
${theme.id === 'gallery-minimal' ? `.storefront-root #home-products-section > div:last-child > div { box-shadow:none !important; border-width:1px !important; }.storefront-root #home-hero-header { border-bottom:1px solid ${border} !important; }` : ''}
`; document.head.appendChild(style); }

async function getSavedThemeFromCurrentStorefront(): Promise<StorefrontTheme | null> { if (typeof window === 'undefined') return null; const path = window.location.pathname.replace(/\/$/, ''); const segments = path.split('/').filter(Boolean); let slug = ''; if (segments[0] === 'shop' || segments[0] === 'store' || segments[0] === 's') slug = segments[1] || ''; else if (segments[0] && segments[0] !== 'demo') slug = segments[0]; slug = slug.replace(/^@/, '').trim().toLowerCase(); if (!slug) return null; const { data } = await supabase.from('shops').select('id,page_config,slug').eq('slug', slug).maybeSingle(); if (data?.page_config?.theme_id) return themeFromId(data.page_config.theme_id); if (slug.includes('--')) { const possibleId = slug.slice(slug.lastIndexOf('--') + 2); if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(possibleId)) { const { data: byId } = await supabase.from('shops').select('page_config').eq('id', possibleId).maybeSingle(); if (byId?.page_config?.theme_id) return themeFromId(byId.page_config.theme_id); } } return null; }

const themeCache = new Map<string, Promise<StorefrontTheme>>();
export function extractLogoTheme(source?: string | null, themeId?: string | null): Promise<StorefrontTheme> {
  const directTheme = themeFromId(themeId);
  if (directTheme) { applyThemeStyles(directTheme); return Promise.resolve(directTheme); }
  if (typeof window === 'undefined') return Promise.resolve(DEFAULT_STOREFRONT_THEME);
  const cacheKey = `${window.location.pathname}|${source || 'no-logo'}`;
  const cached = themeCache.get(cacheKey); if (cached) return cached;
  const promise = new Promise<StorefrontTheme>(resolve => {
    // Always check the persisted merchant theme first. This is important for shops without logos.
    getSavedThemeFromCurrentStorefront().then(savedTheme => {
      if (savedTheme) { applyThemeStyles(savedTheme); resolve(savedTheme); return; }
      if (!source) { applyThemeStyles(DEFAULT_STOREFRONT_THEME); resolve(DEFAULT_STOREFRONT_THEME); return; }
      const image = new Image(); image.crossOrigin = 'anonymous';
      image.onload = () => { try { const canvas = document.createElement('canvas'); canvas.width = 48; canvas.height = 48; const context = canvas.getContext('2d', { willReadFrequently: true }); if (!context) return resolve(DEFAULT_STOREFRONT_THEME); context.drawImage(image, 0, 0, 48, 48); resolve(logoAccentTheme(context.getImageData(0, 0, 48, 48))); } catch { resolve(DEFAULT_STOREFRONT_THEME); } };
      image.onerror = () => resolve(DEFAULT_STOREFRONT_THEME); image.src = source;
    }).catch(() => resolve(DEFAULT_STOREFRONT_THEME));
  });
  themeCache.set(cacheKey, promise); return promise;
}

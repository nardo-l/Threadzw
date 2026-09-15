export type StorefrontThemeDefinition = {
  id: string;
  name: string;
  description: string;
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
};

export const STOREFRONT_THEMES: StorefrontThemeDefinition[] = [
  {
    id: 'editorial-noir',
    name: 'Editorial Noir',
    description: 'High-fashion magazine energy with sharp black-and-white contrast.',
    accent: '#111111', accentStrong: '#000000', accentSoft: '#eeeeec',
    background: '#f4f3ef', surface: '#ffffff', surfaceAlt: '#e8e7e2', text: '#111111', muted: '#66645f', border: '#d9d7d0',
    mode: 'light', radius: '8px', buttonRadius: '4px', font: 'editorial'
  },
  {
    id: 'soft-studio',
    name: 'Soft Studio',
    description: 'Warm cream tones, rounded cards and an intimate boutique feel.',
    accent: '#a96f43', accentStrong: '#84512e', accentSoft: '#f0dfcd',
    background: '#f6eee4', surface: '#fffaf4', surfaceAlt: '#ead9c6', text: '#30271f', muted: '#806f60', border: '#e1d0bd',
    mode: 'light', radius: '22px', buttonRadius: '18px', font: 'soft'
  },
  {
    id: 'gallery-minimal',
    name: 'Gallery Minimal',
    description: 'Quiet gallery styling that keeps product photography in focus.',
    accent: '#555b63', accentStrong: '#353a40', accentSoft: '#e5e7e9',
    background: '#eceeef', surface: '#ffffff', surfaceAlt: '#e0e2e4', text: '#17191c', muted: '#747980', border: '#d2d5d8',
    mode: 'light', radius: '12px', buttonRadius: '8px', font: 'modern'
  },
  {
    id: 'street-archive',
    name: 'Street Archive',
    description: 'Dark streetwear attitude with red accents and hard edges.',
    accent: '#ef3340', accentStrong: '#c51624', accentSoft: '#3a1115',
    background: '#0d0d0e', surface: '#171719', surfaceAlt: '#232326', text: '#f7f7f5', muted: '#a5a5a7', border: '#343438',
    mode: 'dark', radius: '6px', buttonRadius: '3px', font: 'mono'
  },
  {
    id: 'cobalt-club',
    name: 'Cobalt Club',
    description: 'Electric cobalt blue with a bold contemporary fashion look.',
    accent: '#2457ff', accentStrong: '#1640d6', accentSoft: '#dce6ff',
    background: '#eef3ff', surface: '#ffffff', surfaceAlt: '#dfe8ff', text: '#101a38', muted: '#63719a', border: '#cdd9f7',
    mode: 'light', radius: '16px', buttonRadius: '999px', font: 'modern'
  },
  {
    id: 'sage-atelier',
    name: 'Sage Atelier',
    description: 'Natural sage and ivory tones for calm, elevated collections.',
    accent: '#65795a', accentStrong: '#4c603f', accentSoft: '#dfe8d9',
    background: '#edf1e9', surface: '#fbfcf8', surfaceAlt: '#dce4d5', text: '#20271e', muted: '#707b69', border: '#d1dacb',
    mode: 'light', radius: '20px', buttonRadius: '12px', font: 'soft'
  },
  {
    id: 'cherry-pop',
    name: 'Cherry Pop',
    description: 'Playful cherry red and blush with a confident fashion-pop mood.',
    accent: '#e73555', accentStrong: '#b91f3c', accentSoft: '#ffdce3',
    background: '#fff0f3', surface: '#ffffff', surfaceAlt: '#ffe0e6', text: '#30131a', muted: '#8c6870', border: '#f3cbd3',
    mode: 'light', radius: '24px', buttonRadius: '999px', font: 'soft'
  },
  {
    id: 'earth-utility',
    name: 'Earth Utility',
    description: 'Olive, stone and workwear details for a grounded street look.',
    accent: '#6c6845', accentStrong: '#4e4b30', accentSoft: '#ddd9bb',
    background: '#e9e4d5', surface: '#f8f5ec', surfaceAlt: '#d8d1bd', text: '#29291f', muted: '#74715f', border: '#cfc8b3',
    mode: 'light', radius: '10px', buttonRadius: '5px', font: 'mono'
  }
];

export const STOREFRONT_THEME_MAP = Object.fromEntries(
  STOREFRONT_THEMES.map(theme => [theme.id, theme])
) as Record<string, StorefrontThemeDefinition>;

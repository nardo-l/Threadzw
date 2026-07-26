export interface CategoryConfig {
  name: string;
  type: 'tops' | 'bottoms' | 'shoes' | 'hats' | 'accessories' | 'phones' | 'general';
  sizes: string[];
  skipSizes?: boolean;
  isStorage?: boolean;
}

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  // Tops
  'Tops': { name: 'Tops', type: 'tops', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] },
  'T-Shirts': { name: 'T-Shirts', type: 'tops', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] },
  'Hoodies': { name: 'Hoodies', type: 'tops', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] },
  'Sweaters': { name: 'Sweaters', type: 'tops', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] },
  'Jackets': { name: 'Jackets', type: 'tops', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] },
  'Jerseys': { name: 'Jerseys', type: 'tops', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] },
  'Polo Shirts': { name: 'Polo Shirts', type: 'tops', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] },
  'Shirts': { name: 'Shirts', type: 'tops', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] },

  // Bottoms
  'Bottoms': { name: 'Bottoms', type: 'bottoms', sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46'] },
  'Jeans': { name: 'Jeans', type: 'bottoms', sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46'] },
  'Cargo Pants': { name: 'Cargo Pants', type: 'bottoms', sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46'] },
  'Shorts': { name: 'Shorts', type: 'bottoms', sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46'] },
  'Joggers': { name: 'Joggers', type: 'bottoms', sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46'] },
  'Trousers': { name: 'Trousers', type: 'bottoms', sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46'] },

  // Shoes
  'Shoes': { name: 'Shoes', type: 'shoes', sizes: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'] },
  'Sneakers': { name: 'Sneakers', type: 'shoes', sizes: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'] },
  'Footwear': { name: 'Footwear', type: 'shoes', sizes: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'] },

  // Hats
  'Hats': { name: 'Hats', type: 'hats', sizes: ['One Size', 'S/M', 'M/L', 'L/XL', 'Adjustable'] },
  'Headwear': { name: 'Headwear', type: 'hats', sizes: ['One Size', 'S/M', 'M/L', 'L/XL', 'Adjustable'] },

  // Accessories (Skip Sizes)
  'Accessories': { name: 'Accessories', type: 'accessories', sizes: ['One Size'], skipSizes: true },
  'Bags': { name: 'Bags', type: 'accessories', sizes: ['One Size'], skipSizes: true },
  'Watches': { name: 'Watches', type: 'accessories', sizes: ['One Size'], skipSizes: true },
  'Chains': { name: 'Chains', type: 'accessories', sizes: ['One Size'], skipSizes: true },
  'Belts': { name: 'Belts', type: 'accessories', sizes: ['One Size'], skipSizes: true },
  'Wallets': { name: 'Wallets', type: 'accessories', sizes: ['One Size'], skipSizes: true },
  'Bracelets': { name: 'Bracelets', type: 'accessories', sizes: ['One Size'], skipSizes: true },
  'Earrings': { name: 'Earrings', type: 'accessories', sizes: ['One Size'], skipSizes: true },
  'Sunglasses': { name: 'Sunglasses', type: 'accessories', sizes: ['One Size'], skipSizes: true },

  // Phones (Storage Options)
  'Phones': { name: 'Phones', type: 'phones', sizes: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'], isStorage: true },
  'Mobile': { name: 'Mobile', type: 'phones', sizes: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'], isStorage: true },
};

export function getCategoryConfig(categoryName: string): CategoryConfig {
  const normalized = (categoryName || 'Tops').trim();
  if (CATEGORY_CONFIGS[normalized]) {
    return CATEGORY_CONFIGS[normalized];
  }
  
  // Fuzzy fallback
  const lower = normalized.toLowerCase();
  for (const [key, config] of Object.entries(CATEGORY_CONFIGS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return config;
    }
  }

  // Fallback to Tops
  return {
    name: normalized,
    type: 'tops',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
  };
}

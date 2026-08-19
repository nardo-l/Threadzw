import { SellerCategory, SellerCategoryConfig } from '../types';

/**
 * Central Configuration for Seller Categories
 * 
 * Defines customer-facing metadata, supported features, listing types,
 * and onboarding configuration for all seller categories on the platform.
 */
export const SELLER_CATEGORIES: Record<SellerCategory, SellerCategoryConfig> = {
  clothing: {
    id: 'clothing',
    label: 'Clothing',
    description: 'Sell clothing, fashion and accessories',
    icon: '👕',
    listingType: 'product',
    badgeLabel: 'Fashion & Apparel',
    supportedFeatures: {
      sizes: true,
      colors: true,
      variants: true,
    },
    defaultCategoryName: 'Streetwear & Fashion',
  },
  vehicles: {
    id: 'vehicles',
    label: 'Cars & Vehicles',
    description: 'Showcase and sell vehicles',
    icon: '🚗',
    listingType: 'vehicle',
    badgeLabel: 'Cars & Automotive',
    supportedFeatures: {
      vehicleSpecs: true,
    },
    defaultCategoryName: 'Vehicles',
  },
  general: {
    id: 'general',
    label: 'Other Products',
    description: 'Sell products of any kind',
    icon: '🛍️',
    listingType: 'product',
    badgeLabel: 'General Products',
    supportedFeatures: {
      variants: false,
    },
    defaultCategoryName: 'General Products',
  },
};

/**
 * Array list of all available seller categories for UI selectors, onboarding, and filters
 */
export const SELLER_CATEGORY_LIST: SellerCategoryConfig[] = Object.values(SELLER_CATEGORIES);

/**
 * Onboarding Options ready for next-phase "What do you sell?" picker
 */
export const ONBOARDING_CATEGORY_OPTIONS = [
  {
    id: 'clothing' as SellerCategory,
    label: 'Clothing',
    icon: '👕',
    sublabel: 'Clothing, fashion and accessories',
  },
  {
    id: 'vehicles' as SellerCategory,
    label: 'Cars & Vehicles',
    icon: '🚗',
    sublabel: 'Cars, motorcycles and other vehicles',
  },
  {
    id: 'general' as SellerCategory,
    label: 'Other Products',
    icon: '🛍️',
    sublabel: 'Electronics, furniture, cosmetics and other products',
  },
];

/**
 * Checks whether a given string is a valid SellerCategory.
 */
export function isSellerCategory(val: string | null | undefined): val is SellerCategory {
  if (!val) return false;
  return val === 'clothing' || val === 'vehicles' || val === 'general';
}

/**
 * Resolves any raw page_type or category string to an active SellerCategory.
 * 
 * Backward Compatibility Strategy:
 * - 'storefront' and null/undefined safely resolve to 'clothing' because existing
 *   ThreadZW shops are clothing/fashion storefronts.
 * - Legacy bio types ('service', 'creator', 'professional', 'community') gracefully
 *   fallback to 'general' (or retain their transitional views in BioPageView).
 */
export function resolveSellerCategory(rawType: string | null | undefined): SellerCategory {
  if (!rawType) return 'clothing';
  const lower = rawType.toLowerCase().trim();
  
  if (lower === 'clothing' || lower === 'storefront') {
    return 'clothing';
  }
  if (lower === 'vehicles' || lower === 'vehicle' || lower === 'cars') {
    return 'vehicles';
  }
  if (lower === 'general' || lower === 'other' || lower === 'products') {
    return 'general';
  }
  
  // Legacy transitional types map to general products category
  if (['service', 'creator', 'professional', 'community'].includes(lower)) {
    return 'general';
  }

  return 'clothing';
}

/**
 * Retrieves the full category configuration for a given raw page type.
 */
export function getSellerCategoryConfig(rawType: string | null | undefined): SellerCategoryConfig {
  const categoryId = resolveSellerCategory(rawType);
  return SELLER_CATEGORIES[categoryId];
}

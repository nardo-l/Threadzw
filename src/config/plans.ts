import { SellerCategory, Shop, Product, Vehicle } from '../types';
import { resolveSellerCategory } from './sellerCategories';
export { resolveSellerCategory };

export type SellerPlan = 'free' | 'premium';
export type BillingCycle = 'none' | 'monthly' | 'yearly';

export interface PlanConfig {
  id: SellerPlan;
  name: string;
  category: SellerCategory;
  price: number;
  currency: 'USD';
  billingCycle: BillingCycle;
  maxActiveListings: number | null; // null = unlimited
  maxImagesPerListing: number;
  features: string[];
  badge?: string;
  description: string;
  popular?: boolean;
}

export interface ShopEntitlements {
  category: SellerCategory;
  plan: SellerPlan;
  isPro: boolean;
  maxActiveProducts: number | null;
  maxActiveVehicles: number | null;
  maxImagesPerVehicle: number;
  canAddMoreProducts: boolean;
  canAddMoreVehicles: boolean;
  canUseCustomBranding: boolean;
  canRemoveBranding: boolean;
  canViewAnalytics: boolean;
  canUseAdvancedFiltering: boolean;
  canFeatureListings: boolean;
  activeProductsCount: number;
  activeVehiclesCount: number;
  productLimitReached: boolean;
  vehicleLimitReached: boolean;
}

/**
 * Official launch plan definitions by seller category and tier.
 */
export const PLANS_CONFIG: Record<SellerCategory, Record<SellerPlan, PlanConfig>> = {
  clothing: {
    free: {
      id: 'free',
      name: 'Clothing Free',
      category: 'clothing',
      price: 0,
      currency: 'USD',
      billingCycle: 'none',
      maxActiveListings: null,
      maxImagesPerListing: 5,
      description: 'Launch a free fashion storefront with unlimited products and lifetime usage thresholds',
      features: [
        'Unlimited active products',
        '50 unique storefront visits for life',
        '10 WhatsApp and directions interests for life',
        '1 basic storefront template',
        'Basic inventory management',
        'ThreadZW branding badge'
      ]
    },
    premium: {
      id: 'premium',
      name: 'Clothing Premium',
      category: 'clothing',
      price: 9,
      currency: 'USD',
      billingCycle: 'none',
      maxActiveListings: null, // Unlimited
      maxImagesPerListing: 10,
      badge: 'Most Popular',
      popular: true,
      description: 'Unlimited listings & premium branding for fashion stores ($9 one-off)',
      features: [
        'Unlimited active products',
        '$9 USD one-off lifetime access',
        'All clothing storefront templates',
        'Custom storefront colours & branding',
        'Remove ThreadZW branding',
        'Featured products promotion',
        'Advanced order & inventory tracking',
        'Storefront visitor analytics'
      ]
    }
  },
  vehicles: {
    free: {
      id: 'free',
      name: 'Vehicle Free',
      category: 'vehicles',
      price: 0,
      currency: 'USD',
      billingCycle: 'none',
      maxActiveListings: 1,
      maxImagesPerListing: 8,
      description: 'Test drive ThreadZW for your car dealership',
      features: [
        '1 active vehicle in showroom',
        'Unlimited sold/reserved history',
        'Maximum 8 photos per vehicle',
        'Complete automotive spec sheet',
        'WhatsApp & direct phone inquiries',
        'Basic showroom filtering',
        'ThreadZW branding badge'
      ]
    },
    premium: {
      id: 'premium',
      name: 'Vehicle Premium',
      category: 'vehicles',
      price: 30,
      currency: 'USD',
      billingCycle: 'yearly',
      maxActiveListings: 20,
      maxImagesPerListing: 20,
      badge: 'Annual Plan',
      popular: true,
      description: 'Full digital showroom power for auto dealerships',
      features: [
        'Up to 20 active showroom vehicles',
        'Unlimited sold/reserved history',
        'Maximum 20 photos per vehicle',
        'Multiple showroom themes & layouts',
        'Custom branding, logo & banner',
        'Remove ThreadZW branding',
        'Featured vehicle badges',
        'Advanced multi-spec filter & sorting',
        'Showroom views & lead analytics'
      ]
    }
  },
  general: {
    free: {
      id: 'free',
      name: 'General Free',
      category: 'general',
      price: 0,
      currency: 'USD',
      billingCycle: 'none',
      maxActiveListings: 9,
      maxImagesPerListing: 8,
      description: 'Essential tools to sell products of any kind',
      features: [
        'Up to 9 active products',
        'Custom storefront link',
        'WhatsApp direct inquiries',
        'Storefront customization',
        'Order logging'
      ]
    },
    premium: {
      id: 'premium',
      name: 'General Premium',
      category: 'general',
      price: 9,
      currency: 'USD',
      billingCycle: 'none',
      maxActiveListings: null,
      maxImagesPerListing: 10,
      description: 'Unlimited catalog and custom seller branding ($9 one-off)',
      features: [
        'Unlimited active products',
        '$9 USD one-off lifetime access',
        'Custom storefront link',
        'WhatsApp direct inquiries',
        'Storefront customization'
      ]
    }
  }
};

/**
 * Normalizes raw database plan strings ('free', legacy 'pro', and 'premium') into SellerPlan.
 */
export function normalizePlan(rawPlan: string | null | undefined): SellerPlan {
  if (!rawPlan) return 'free';
  const lower = rawPlan.toLowerCase().trim();
  if (lower === 'pro' || lower === 'premium') {
    return 'premium';
  }
  return 'free';
}

/**
 * Checks if a shop is on the Premium plan.
 */
export function isPro(shop: Shop | null | undefined): boolean {
  if (!shop) return false;
  return normalizePlan(shop.plan) === 'premium';
}

/**
 * Returns the PlanConfig for a given seller category and plan tier.
 */
export function getPlanForCategory(category: SellerCategory, plan: SellerPlan = 'free'): PlanConfig {
  const catPlans = PLANS_CONFIG[category] || PLANS_CONFIG.clothing;
  return catPlans[plan] || catPlans.free;
}

/**
 * Returns available plans for a category (e.g. [Free, Premium] for clothing/vehicles, [Free] for general).
 */
export function getPlansForCategory(category: SellerCategory): PlanConfig[] {
  if (category === 'general') {
    return [PLANS_CONFIG.general.free];
  }
  return [PLANS_CONFIG[category].free, PLANS_CONFIG[category].premium];
}

/**
 * Resolves the active PlanConfig for a specific shop.
 */
export function getPlanConfig(shop: Shop | null | undefined): PlanConfig {
  const category = resolveSellerCategory(shop?.page_type);
  const plan = normalizePlan(shop?.plan);
  return getPlanForCategory(category, plan);
}

/**
 * Clothing products are not quota-limited by count.
 * Free clothing shops are gated by lifetime usage in Supabase instead.
 */
export function getProductLimit(shop: Shop | null | undefined): number | null {
  const category = resolveSellerCategory(shop?.page_type);
  if (category === 'clothing' || isPro(shop)) return null;
  return 9;
}

/**
 * Active listing limit for vehicles.
 * - Vehicles Free: 1 active vehicle
 * - Vehicles Pro: 20 active vehicles
 */
export function getVehicleLimit(shop: Shop | null | undefined): number | null {
  const category = resolveSellerCategory(shop?.page_type);
  if (category !== 'vehicles') return null;
  return isPro(shop) ? 20 : 1;
}

/**
 * Maximum photos allowed per vehicle.
 * - Vehicles Free: 8 photos
 * - Vehicles Pro: 20 photos
 */
export function getVehicleImageLimit(shop: Shop | null | undefined): number {
  return isPro(shop) ? 20 : 8;
}

/**
 * Maximum photos allowed per clothing/general product.
 */
export function getProductImageLimit(shop: Shop | null | undefined): number {
  return isPro(shop) ? 10 : 5;
}

/**
 * Checks whether a product counts towards the active limit.
 * Drafts, paused, or deleted items do not count.
 */
export function isProductActive(product: { is_published?: boolean; status?: string; total_stock?: number }): boolean {
  if (product.is_published === false) return false;
  if (product.status === 'draft' || product.status === 'paused' || product.status === 'archived') return false;
  return true;
}

/**
 * Checks whether a vehicle counts towards the active limit.
 * - Available: counts
 * - Reserved: counts
 * - Sold: does NOT count
 */
export function isVehicleActive(vehicle: { status?: string }): boolean {
  const status = vehicle.status?.toLowerCase();
  if (status === 'sold') return false;
  return status === 'available' || status === 'reserved';
}

/**
 * Counts active products in a list.
 */
export function getActiveProductCount(products: Product[]): number {
  return products.filter(isProductActive).length;
}

/**
 * Counts active vehicles in a list (available + reserved).
 */
export function getActiveVehicleCount(vehicles: Vehicle[]): number {
  return vehicles.filter(isVehicleActive).length;
}

/**
 * Checks if a shop can add another active product.
 */
export function canAddProduct(
  shop: Shop | null | undefined,
  currentActiveCount: number
): { allowed: boolean; limit: number | null; count: number; reason?: string } {
  const limit = getProductLimit(shop);
  if (limit === null) {
    return { allowed: true, limit: null, count: currentActiveCount };
  }
  const allowed = currentActiveCount < limit;
  return {
    allowed,
    limit,
    count: currentActiveCount,
    reason: allowed
      ? undefined
      : `You've reached the ${limit}-product limit. Upgrade to Premium ($9 one-off) for unlimited products.`
  };
}

/**
 * Checks if a shop can add another active vehicle.
 */
export function canAddVehicle(
  shop: Shop | null | undefined,
  currentActiveCount: number
): { allowed: boolean; limit: number; count: number; reason?: string } {
  const limit = getVehicleLimit(shop) ?? 1;
  const allowed = currentActiveCount < limit;
  const plan = normalizePlan(shop?.plan);

  let reason: string | undefined;
  if (!allowed) {
    if (plan === 'free') {
      reason = `You've reached the ${limit}-vehicle limit on the Free plan. Upgrade to Vehicle Pro to list up to 20 vehicles.`;
    } else {
      reason = `You've reached the ${limit}-vehicle limit on Vehicle Pro.`;
    }
  }

  return {
    allowed,
    limit,
    count: currentActiveCount,
    reason
  };
}

/**
 * Feature Entitlement Checks
 */
export function canUseCustomBranding(shop: Shop | null | undefined): boolean {
  return isPro(shop);
}

export function canRemoveBranding(shop: Shop | null | undefined): boolean {
  return isPro(shop);
}

export function canViewAnalytics(shop: Shop | null | undefined): boolean {
  return true; // Basic analytics enabled for all, advanced for Pro
}

export function canUseTemplate(shop: Shop | null | undefined, templateId: string): boolean {
  if (isPro(shop)) return true;
  return templateId === 'default' || templateId === 'basic' || templateId === 'minimal';
}

/**
 * Aggregates all shop entitlements into a single clean object.
 */
export function getEntitlements(
  shop: Shop | null | undefined,
  counts?: { products?: number; vehicles?: number }
): ShopEntitlements {
  const category = resolveSellerCategory(shop?.page_type);
  const plan = normalizePlan(shop?.plan);
  const pro = isPro(shop);

  const activeProducts = counts?.products ?? 0;
  const activeVehicles = counts?.vehicles ?? 0;

  const maxProducts = getProductLimit(shop);
  const maxVehicles = getVehicleLimit(shop);

  const productCheck = canAddProduct(shop, activeProducts);
  const vehicleCheck = canAddVehicle(shop, activeVehicles);

  return {
    category,
    plan,
    isPro: pro,
    maxActiveProducts: maxProducts,
    maxActiveVehicles: maxVehicles,
    maxImagesPerVehicle: getVehicleImageLimit(shop),
    canAddMoreProducts: productCheck.allowed,
    canAddMoreVehicles: vehicleCheck.allowed,
    canUseCustomBranding: canUseCustomBranding(shop),
    canRemoveBranding: canRemoveBranding(shop),
    canViewAnalytics: canViewAnalytics(shop),
    canUseAdvancedFiltering: pro,
    canFeatureListings: pro,
    activeProductsCount: activeProducts,
    activeVehiclesCount: activeVehicles,
    productLimitReached: !productCheck.allowed,
    vehicleLimitReached: !vehicleCheck.allowed
  };
}

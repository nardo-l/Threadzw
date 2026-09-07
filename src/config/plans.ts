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
  maxActiveListings: number | null;
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

export const PLANS_CONFIG: Record<SellerCategory, Record<SellerPlan, PlanConfig>> = {
  clothing: {
    free: {
      id: 'free', name: 'Clothing Free', category: 'clothing', price: 0, currency: 'USD', billingCycle: 'none',
      maxActiveListings: 3, maxImagesPerListing: 5,
      description: 'Launch a free fashion storefront with up to 3 active products',
      features: ['Up to 3 active products', 'Storefront visits', 'WhatsApp customer interests', '1 basic storefront template', 'Basic inventory management', 'ThreadZW branding badge']
    },
    premium: {
      id: 'premium', name: 'Clothing Pro', category: 'clothing', price: 1.59, currency: 'USD', billingCycle: 'monthly',
      maxActiveListings: null, maxImagesPerListing: 10, badge: 'Most Popular', popular: true,
      description: 'Unlimited products and premium storefront features for $1.59/month',
      features: ['Unlimited active products', '$1.59 USD per month', 'All clothing storefront templates', 'Custom storefront colours & branding', 'Remove ThreadZW branding', 'Featured products promotion', 'Advanced order & inventory tracking', 'Storefront visitor analytics']
    }
  },
  vehicles: {
    free: {
      id: 'free', name: 'Vehicle Free', category: 'vehicles', price: 0, currency: 'USD', billingCycle: 'none',
      maxActiveListings: 1, maxImagesPerListing: 8,
      description: 'Test drive ThreadZW for your car dealership',
      features: ['1 active vehicle in showroom', 'Unlimited sold/reserved history', 'Maximum 8 photos per vehicle', 'Complete automotive spec sheet', 'WhatsApp & direct phone inquiries', 'Basic showroom filtering', 'ThreadZW branding badge']
    },
    premium: {
      id: 'premium', name: 'Vehicle Pro', category: 'vehicles', price: 30, currency: 'USD', billingCycle: 'yearly',
      maxActiveListings: 20, maxImagesPerListing: 20, badge: 'Annual Plan', popular: true,
      description: 'Full digital showroom power for auto dealerships',
      features: ['Up to 20 active showroom vehicles', 'Unlimited sold/reserved history', 'Maximum 20 photos per vehicle', 'Multiple showroom themes & layouts', 'Custom branding, logo & banner', 'Remove ThreadZW branding', 'Featured vehicle badges', 'Advanced multi-spec filter & sorting', 'Showroom views & lead analytics']
    }
  },
  general: {
    free: {
      id: 'free', name: 'General Free', category: 'general', price: 0, currency: 'USD', billingCycle: 'none',
      maxActiveListings: 9, maxImagesPerListing: 8, description: 'Essential tools to sell products of any kind',
      features: ['Up to 9 active products', 'Custom storefront link', 'WhatsApp direct inquiries', 'Storefront customization', 'Order logging']
    },
    premium: {
      id: 'premium', name: 'General Pro', category: 'general', price: 9, currency: 'USD', billingCycle: 'none',
      maxActiveListings: null, maxImagesPerListing: 10, description: 'Unlimited catalog and custom seller branding',
      features: ['Unlimited active products', 'Custom storefront link', 'WhatsApp direct inquiries', 'Storefront customization']
    }
  }
};

export function normalizePlan(rawPlan: string | null | undefined): SellerPlan {
  if (!rawPlan) return 'free';
  const lower = rawPlan.toLowerCase().trim();
  return lower === 'pro' || lower === 'premium' ? 'premium' : 'free';
}

export function isPro(shop: Shop | null | undefined): boolean {
  return !!shop && normalizePlan(shop.plan) === 'premium';
}

export function getPlanForCategory(category: SellerCategory, plan: SellerPlan = 'free'): PlanConfig {
  const catPlans = PLANS_CONFIG[category] || PLANS_CONFIG.clothing;
  return catPlans[plan] || catPlans.free;
}

export function getPlansForCategory(category: SellerCategory): PlanConfig[] {
  if (category === 'general') return [PLANS_CONFIG.general.free];
  return [PLANS_CONFIG[category].free, PLANS_CONFIG[category].premium];
}

export function getPlanConfig(shop: Shop | null | undefined): PlanConfig {
  return getPlanForCategory(resolveSellerCategory(shop?.page_type), normalizePlan(shop?.plan));
}

export function getProductLimit(shop: Shop | null | undefined): number | null {
  if (isPro(shop)) return null;
  const category = resolveSellerCategory(shop?.page_type);
  if (category === 'clothing') {
    const verificationStatus = String((shop as any)?.payment_verification_status || '').toLowerCase();
    return verificationStatus === 'pending' ? 9 : 3;
  }
  return 9;
}

export function getVehicleLimit(shop: Shop | null | undefined): number | null {
  if (resolveSellerCategory(shop?.page_type) !== 'vehicles') return null;
  return isPro(shop) ? 20 : 1;
}

export function getVehicleImageLimit(shop: Shop | null | undefined): number { return isPro(shop) ? 20 : 8; }
export function getProductImageLimit(shop: Shop | null | undefined): number { return isPro(shop) ? 10 : 5; }

export function isProductActive(product: { is_published?: boolean; status?: string; total_stock?: number }): boolean {
  if (product.is_published === false) return false;
  return !['draft', 'paused', 'archived'].includes(product.status || '');
}

export function isVehicleActive(vehicle: { status?: string }): boolean {
  const status = vehicle.status?.toLowerCase();
  return status === 'available' || status === 'reserved';
}

export function getActiveProductCount(products: Product[]): number { return products.filter(isProductActive).length; }
export function getActiveVehicleCount(vehicles: Vehicle[]): number { return vehicles.filter(isVehicleActive).length; }

export function canAddProduct(shop: Shop | null | undefined, currentActiveCount: number) {
  const limit = getProductLimit(shop);
  if (limit === null) return { allowed: true, limit: null, count: currentActiveCount };
  const allowed = currentActiveCount < limit;
  const pending = String((shop as any)?.payment_verification_status || '').toLowerCase() === 'pending';
  return {
    allowed, limit, count: currentActiveCount,
    reason: allowed ? undefined : pending
      ? 'Payment received. Your payment is being verified. You can use up to 9 products while we review it.'
      : `You've reached the ${limit}-product Free plan limit. Upgrade to Pro for unlimited products.`
  };
}

export function canAddVehicle(shop: Shop | null | undefined, currentActiveCount: number) {
  const limit = getVehicleLimit(shop) ?? 1;
  const allowed = currentActiveCount < limit;
  const plan = normalizePlan(shop?.plan);
  return { allowed, limit, count: currentActiveCount, reason: allowed ? undefined : plan === 'free' ? `You've reached the ${limit}-vehicle limit on the Free plan. Upgrade to Vehicle Pro to list up to 20 vehicles.` : `You've reached the ${limit}-vehicle limit on Vehicle Pro.` };
}

export function canUseCustomBranding(shop: Shop | null | undefined): boolean { return isPro(shop); }
export function canRemoveBranding(shop: Shop | null | undefined): boolean { return isPro(shop); }
export function canViewAnalytics(_shop: Shop | null | undefined): boolean { return true; }
export function canUseTemplate(shop: Shop | null | undefined, templateId: string): boolean { return isPro(shop) || ['default', 'basic', 'minimal'].includes(templateId); }

export function getEntitlements(shop: Shop | null | undefined, counts?: { products?: number; vehicles?: number }): ShopEntitlements {
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
    category, plan, isPro: pro, maxActiveProducts: maxProducts, maxActiveVehicles: maxVehicles,
    maxImagesPerVehicle: getVehicleImageLimit(shop), canAddMoreProducts: productCheck.allowed, canAddMoreVehicles: vehicleCheck.allowed,
    canUseCustomBranding: canUseCustomBranding(shop), canRemoveBranding: canRemoveBranding(shop), canViewAnalytics: canViewAnalytics(shop),
    canUseAdvancedFiltering: pro, canFeatureListings: pro, activeProductsCount: activeProducts, activeVehiclesCount: activeVehicles,
    productLimitReached: !productCheck.allowed, vehicleLimitReached: !vehicleCheck.allowed
  };
}

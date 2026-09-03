// server/services/planResolver.ts

import { SellerCategory, SellerPlan } from '../../src/types.js';

export interface ResolvedPlanDetails {
  category: SellerCategory;
  plan: SellerPlan;
  amount: number;
  currency: 'USD';
  billing_cycle: 'none' | 'monthly' | 'yearly';
  planName: string;
  description: string;
}

export function resolveServerSellerCategory(pageType?: string | null): SellerCategory {
  if (!pageType) return 'clothing';
  const normalized = String(pageType).toLowerCase().trim();

  if (['vehicle', 'vehicles', 'car', 'dealership', 'auto'].includes(normalized)) {
    return 'vehicles';
  }

  if (['clothing', 'fashion', 'apparel', 'boutique'].includes(normalized)) {
    return 'clothing';
  }

  if (['general', 'standard', 'store'].includes(normalized)) {
    return 'general';
  }

  return 'clothing';
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`INVALID_CONFIGURATION: ${name} must be a positive number`);
  }
  return value;
}

function envCurrency(): 'USD' {
  const currency = (process.env.THREADZW_CLOTHING_PRO_CURRENCY || 'USD').toUpperCase();
  if (currency !== 'USD') {
    throw new Error('INVALID_CONFIGURATION: THREADZW_CLOTHING_PRO_CURRENCY must be USD');
  }
  return 'USD';
}

/**
 * Server-authoritative plan resolution. Client-submitted prices and billing
 * cycles are never accepted. Paid database entitlements use `premium`.
 */
export function resolveProPlanForShop(shop: {
  id: string;
  page_type?: string | null;
  owner_id?: string | null;
}): ResolvedPlanDetails {
  const category = resolveServerSellerCategory(shop.page_type);

  if (category === 'clothing') {
    return {
      category: 'clothing',
      plan: 'premium' as SellerPlan,
      amount: envNumber('THREADZW_CLOTHING_PRO_PRICE_USD', 9),
      currency: envCurrency(),
      billing_cycle: 'none',
      planName: 'Threadzw Premium',
      description: 'Unlimited clothing products and advanced storefront tools with lifetime access'
    };
  }

  if (category === 'vehicles') {
    return {
      category: 'vehicles',
      plan: 'premium' as SellerPlan,
      amount: envNumber('THREADZW_VEHICLES_PRO_PRICE_USD', 30),
      currency: 'USD',
      billing_cycle: 'yearly',
      planName: 'Threadzw Premium',
      description: 'Premium seller tools for vehicle showrooms'
    };
  }

  if (category === 'general') {
    return {
      category: 'general',
      plan: 'premium' as SellerPlan,
      amount: envNumber('THREADZW_GENERAL_PRO_PRICE_USD', 9),
      currency: 'USD',
      billing_cycle: 'none',
      planName: 'Threadzw Premium',
      description: 'Premium seller tools for general stores'
    };
  }

  throw new Error('PLAN_UNAVAILABLE: Unsupported seller category');
}

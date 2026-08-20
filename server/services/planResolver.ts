// server/services/planResolver.ts

import { SellerCategory, SellerPlan } from '../../src/types';

export interface ResolvedPlanDetails {
  category: SellerCategory;
  plan: SellerPlan;
  amount: number;
  currency: 'USD';
  billing_cycle: 'monthly' | 'yearly';
  planName: string;
  description: string;
}

/**
 * Normalizes shop page_type to standard SellerCategory
 */
export function resolveServerSellerCategory(pageType?: string | null): SellerCategory {
  if (!pageType) return 'clothing';
  const normalized = String(pageType).toLowerCase().trim();

  if (
    normalized === 'vehicle' ||
    normalized === 'vehicles' ||
    normalized === 'car' ||
    normalized === 'dealership' ||
    normalized === 'auto'
  ) {
    return 'vehicles';
  }

  if (
    normalized === 'clothing' ||
    normalized === 'fashion' ||
    normalized === 'apparel' ||
    normalized === 'boutique'
  ) {
    return 'clothing';
  }

  if (normalized === 'general' || normalized === 'standard' || normalized === 'store') {
    return 'general';
  }

  return 'clothing';
}

/**
 * Authoritative Server-Side Plan Resolution for Upgrades.
 * NEVER trusts client-submitted amount, billing cycle, or prices.
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
      plan: 'pro',
      amount: 9.00,
      currency: 'USD',
      billing_cycle: 'monthly',
      planName: 'ThreadZW Clothing Pro',
      description: 'Unlimited products, advanced storefront branding, and priority WhatsApp ordering'
    };
  }

  if (category === 'vehicles') {
    return {
      category: 'vehicles',
      plan: 'pro',
      amount: 30.00,
      currency: 'USD',
      billing_cycle: 'yearly',
      planName: 'ThreadZW Vehicle Pro',
      description: 'Up to 20 active vehicle showroom listings, 20 HD photos per car, and custom dealer branding'
    };
  }

  if (category === 'general') {
    return {
      category: 'general',
      plan: 'pro',
      amount: 9.00,
      currency: 'USD',
      billing_cycle: 'monthly',
      planName: 'ThreadZW Store Pro',
      description: 'Unlimited inventory catalog and custom seller branding'
    };
  }

  throw new Error('PLAN_UNAVAILABLE: Unsupported seller category');
}

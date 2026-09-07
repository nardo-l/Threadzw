import { supabase } from '../lib/supabase';
import { SubscriptionStatus, BillingCycle, SellerCategory, SellerPlan } from '../types';

export const THREADZW_NARDOPAY_MONTHLY_LINK = 'https://threadzw.nardopay.com/pay/threadzwmonthlysubscriptions';

export interface CreatePaymentLinkResponse {
  success: boolean;
  linkCode: string;
  url: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  billingCycle: 'none' | 'monthly' | 'yearly';
  category: SellerCategory;
  error?: string;
  message?: string;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  shopId: string;
  plan: SellerPlan;
  category: SellerCategory;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  gracePeriodEnd?: string | null;
  cancelledAt?: string | null;
  nardopayLinkCode?: string | null;
  paymentVerificationStatus?: string | null;
  paymentSubmittedAt?: string | null;
  error?: string;
}

class SubscriptionClientService {
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  public async createPaymentLink(shopId: string): Promise<CreatePaymentLinkResponse> {
    const token = await this.getAuthToken();
    if (!token) throw new Error('Please sign in to upgrade your subscription.');
    const response = await fetch('/api/subscriptions/create-payment-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ shopId })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || data.error || 'Failed to start subscription');
    return data as CreatePaymentLinkResponse;
  }

  public async getStatus(shopId: string): Promise<SubscriptionStatusResponse> {
    const token = await this.getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`/api/subscriptions/status?shopId=${encodeURIComponent(shopId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || 'Failed to fetch subscription status');
    return data as SubscriptionStatusResponse;
  }

  public async verifyFallback(shopId: string, linkCode?: string): Promise<{ verified: boolean; plan?: string; reason?: string }> {
    const token = await this.getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch('/api/subscriptions/verify-fallback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ shopId, linkCode })
    });
    return await response.json();
  }
}

export const subscriptionClient = new SubscriptionClientService();

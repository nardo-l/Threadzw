import { supabase } from '../lib/supabase';

export interface ShopPayment {
  id: string;
  shop_id: string;
  user_id: string;
  amount: number;
  currency: string;
  provider: string;
  payment_reference: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  created_at: string;
  paid_at?: string | null;
}

export interface CreatePaymentParams {
  shopId: string;
  userId: string;
  amount?: number;
  currency?: string;
  provider?: string;
  paymentReference?: string;
}

export interface ActivatePaymentParams {
  shopId: string;
  userId: string;
  paymentReference?: string;
}

/**
 * Clean payment-service abstraction for ThreadZW one-time storefront activation ($20 USD).
 * Designed so Nardo Pay API/webhooks can seamlessly replace redirect flows in the future.
 */
export const paymentService = {
  /**
   * Creates or updates a pending $20 payment session for a shop.
   */
  async createPaymentSession(params: CreatePaymentParams): Promise<ShopPayment | null> {
    const {
      shopId,
      userId,
      amount = 20.0,
      currency = 'USD',
      provider = 'nardopay',
      paymentReference = `NARDOPAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    } = params;

    const now = new Date().toISOString();

    const paymentPayload = {
      shop_id: shopId,
      user_id: userId,
      amount,
      currency,
      provider,
      payment_reference: paymentReference,
      status: 'pending',
      created_at: now
    };

    console.log('[PaymentService] Creating payment session:', paymentPayload);

    try {
      // 1. Try upserting into shop_payments table
      const { data, error } = await supabase
        .from('shop_payments')
        .upsert(paymentPayload, { onConflict: 'shop_id' })
        .select('*')
        .maybeSingle();

      if (error) {
        console.warn('[PaymentService] shop_payments table insert warning:', error.message);
        // Fallback insertion without onConflict if RLS or primary key differs
        const { data: fallbackData } = await supabase
          .from('shop_payments')
          .insert(paymentPayload)
          .select('*')
          .maybeSingle();
        return fallbackData as ShopPayment | null;
      }

      return data as ShopPayment | null;
    } catch (err) {
      console.error('[PaymentService] Error creating payment session:', err);
      return null;
    }
  },

  /**
   * Retrieves payment record for a given shop ID.
   */
  async getPaymentByShop(shopId: string): Promise<ShopPayment | null> {
    if (!shopId) return null;
    try {
      const { data, error } = await supabase
        .from('shop_payments')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('[PaymentService] Error fetching payment by shop:', error.message);
        return null;
      }
      return data as ShopPayment | null;
    } catch (err) {
      console.error('[PaymentService] Error in getPaymentByShop:', err);
      return null;
    }
  },

  /**
   * Idempotently activates payment for a shop.
   * Marks shop_payments as 'paid' and updates shop record (is_active = true, subscription_status = 'active', plan_type = 'lifetime').
   */
  async activateShopPayment(params: ActivatePaymentParams): Promise<{ success: boolean; shopPayment?: any; error?: string }> {
    const { shopId, userId, paymentReference } = params;
    const now = new Date().toISOString();

    console.log('[PaymentService] Activating shop payment for shopId:', shopId, 'userId:', userId);

    try {
      // 1. Record/Update shop_payments status to 'paid'
      try {
        const paymentPayload = {
          shop_id: shopId,
          user_id: userId,
          amount: 20.0,
          currency: 'USD',
          provider: 'nardopay',
          payment_reference: paymentReference || `NARDOPAY-PAID-${Date.now()}`,
          status: 'paid',
          created_at: now,
          paid_at: now
        };

        const { error: subErr } = await supabase
          .from('shop_payments')
          .upsert(paymentPayload, { onConflict: 'shop_id' });

        if (subErr) {
          console.warn('[PaymentService] shop_payments upsert error (continuing shop activation):', subErr.message);
        }
      } catch (pErr) {
        console.warn('[PaymentService] Exception recording in shop_payments:', pErr);
      }

      // 2. Activate shop storefront access permanently
      const shopUpdatePayload = {
        owner_id: userId,
        is_active: true,
        subscription_status: 'active',
        plan_type: 'lifetime',
        paid_at: now,
        setup_complete: true,
        setup_completed_at: now
      };

      const { error: shopErr } = await supabase
        .from('shops')
        .update(shopUpdatePayload)
        .eq('id', shopId);

      if (shopErr) {
        console.error('[PaymentService] Failed to update shop record:', shopErr);
        return { success: false, error: shopErr.message };
      }

      console.log('[PaymentService] Shop payment successfully activated for shopId:', shopId);
      return { success: true };
    } catch (err: any) {
      console.error('[PaymentService] Exception during activateShopPayment:', err);
      return { success: false, error: err.message || 'Unknown activation error' };
    }
  },

  /**
   * Returns whether a shop has completed its $20 activation payment.
   */
  async getShopPaymentStatus(shopId: string): Promise<{ isPaid: boolean; status: string }> {
    if (!shopId) return { isPaid: false, status: 'unpaid' };
    try {
      const { data: shop } = await supabase
        .from('shops')
        .select('is_active, subscription_status, plan_type, paid_at')
        .eq('id', shopId)
        .maybeSingle();

      if (shop && (shop.is_active || shop.subscription_status === 'active' || shop.plan_type === 'lifetime')) {
        return { isPaid: true, status: 'paid' };
      }

      const payment = await this.getPaymentByShop(shopId);
      if (payment && payment.status === 'paid') {
        return { isPaid: true, status: 'paid' };
      }

      return { isPaid: false, status: payment?.status || 'unpaid' };
    } catch (err) {
      return { isPaid: false, status: 'unpaid' };
    }
  }
};

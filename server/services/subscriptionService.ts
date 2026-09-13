import { serverSupabase } from '../middleware/auth.js';
import { resolveServerSellerCategory } from './planResolver.js';

const FIXED_NARDOPAY_LINK = 'https://threadzw.nardopay.com/pay/threadzwmonthlysubscriptions';
const SUCCESS_REDIRECT = 'https://threadzw.vercel.app/subscription/success';
const PREMIUM_AMOUNT = 9;

export class SubscriptionService {
  public async createPaymentLink(params: { userId: string; shopId: string; origin?: string }) {
    const { userId, shopId } = params;
    if (!userId) throw new Error('UNAUTHORIZED: Authentication is required');
    if (!shopId) throw new Error('INVALID_SHOP: shopId is required');

    const { data: shop, error: shopError } = await serverSupabase
      .from('shops')
      .select('id, owner_id, name, page_type, plan, subscription_status, payment_verification_status')
      .eq('id', shopId)
      .maybeSingle();
    if (shopError || !shop) throw new Error('INVALID_SHOP: Shop not found');
    if (shop.owner_id !== userId) throw new Error('UNAUTHORIZED: You do not own this shop');

    const category = resolveServerSellerCategory(shop.page_type);
    if (category !== 'clothing') throw new Error('UNSUPPORTED_CATEGORY: Clothing subscriptions are currently supported here');
    if (shop.plan === 'premium') throw new Error('ALREADY_SUBSCRIBED: This shop already has Pro');

    const now = new Date().toISOString();
    const internalReference = `NP-${shop.id.slice(0, 8).toUpperCase()}-${Date.now()}`;

    const { data: existingSubscription, error: existingError } = await serverSupabase
      .from('subscriptions')
      .select('id')
      .eq('shop_id', shop.id)
      .maybeSingle();
    if (existingError) throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: ${existingError.message}`);

    const subscriptionData = {
      profile_id: userId,
      owner_id: userId,
      shop_id: shop.id,
      category: 'clothing',
      plan: 'premium',
      billing_cycle: 'none',
      amount: PREMIUM_AMOUNT,
      currency: 'USD',
      status: 'pending',
      provider: 'nardopay',
      nardopay_link_code: null,
      current_period_start: null,
      current_period_end: null,
      updated_at: now
    };

    let subscriptionId: string;
    if (existingSubscription) {
      const { data, error } = await serverSupabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id)
        .select('id')
        .single();
      if (error || !data) throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: ${error?.message || 'Unable to update subscription'}`);
      subscriptionId = data.id;
    } else {
      const { data, error } = await serverSupabase
        .from('subscriptions')
        .insert({ ...subscriptionData, created_at: now })
        .select('id')
        .single();
      if (error || !data) throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: ${error?.message || 'Unable to create subscription'}`);
      subscriptionId = data.id;
    }

    const { error: shopUpdateError } = await serverSupabase.from('shops').update({
      account_status: 'pending_payment',
      subscription_status: 'pending',
      payment_required: true,
      payment_status: 'pending',
      payment_verification_status: 'pending',
      payment_submitted_at: now,
      payment_reference: internalReference,
      payment_amount: PREMIUM_AMOUNT,
      payment_currency: 'USD',
      product_limit: 9,
      is_active: false,
      storefront_published: false,
      published_at: null,
      updated_at: now
    }).eq('id', shop.id);
    if (shopUpdateError) throw new Error(`PAYMENT_STATE_UPDATE_FAILED: ${shopUpdateError.message}`);

    return {
      success: true,
      url: FIXED_NARDOPAY_LINK,
      linkCode: '',
      subscriptionId,
      amount: PREMIUM_AMOUNT,
      currency: 'USD',
      billingCycle: 'none' as const,
      category: 'clothing' as const,
      redirectUrl: SUCCESS_REDIRECT,
      message: 'Payment started. Your shop is pending payment verification.'
    };
  }

  /** Manual admin verification is authoritative for the fixed NardoPay link flow. */
  public async handleWebhook(_params: { rawBody: string; signatureHeader?: string | string[] | null; payload: any }) {
    return { success: true, ignored: true, reason: 'MANUAL_VERIFICATION_REQUIRED' };
  }

  public async getStatus(params: { userId: string; shopId: string }) {
    const { userId, shopId } = params;
    const { data: shop, error: shopError } = await serverSupabase
      .from('shops')
      .select('id, owner_id, plan, subscription_status, page_type, payment_reference, paid_at, payment_verification_status, payment_submitted_at, payment_verified_at')
      .eq('id', shopId).maybeSingle();
    if (shopError || !shop) throw new Error('INVALID_SHOP: Shop not found');
    if (shop.owner_id !== userId) throw new Error('UNAUTHORIZED: Shop access denied');

    const { data: subscription } = await serverSupabase
      .from('subscriptions')
      .select('id, plan, status, amount, currency, billing_cycle, current_period_start, current_period_end, grace_period_end, cancelled_at, nardopay_link_code')
      .eq('shop_id', shopId).order('created_at', { ascending: false }).limit(1).maybeSingle();

    return {
      success: true,
      shopId,
      category: resolveServerSellerCategory(shop.page_type),
      plan: shop.plan === 'premium' || shop.plan === 'pro' ? 'premium' : 'free',
      status: subscription?.status || (shop.plan === 'premium' || shop.plan === 'pro' ? 'active' : shop.payment_verification_status === 'pending' ? 'pending' : 'inactive'),
      amount: subscription?.amount || PREMIUM_AMOUNT,
      currency: subscription?.currency || 'USD',
      billingCycle: subscription?.billing_cycle || 'none',
      currentPeriodStart: subscription?.current_period_start || null,
      currentPeriodEnd: subscription?.current_period_end || null,
      gracePeriodEnd: subscription?.grace_period_end || null,
      cancelledAt: subscription?.cancelled_at || null,
      nardopayLinkCode: subscription?.nardopay_link_code || null,
      paymentVerificationStatus: shop.payment_verification_status || null,
      paymentSubmittedAt: shop.payment_submitted_at || null,
      paymentVerifiedAt: shop.payment_verified_at || null
    };
  }

  public async verifyPaymentFallback(params?: { userId?: string; shopId?: string; linkCode?: string }) {
    return { verified: false, reason: 'MANUAL_ADMIN_VERIFICATION_REQUIRED', shopId: params?.shopId || null };
  }
}

export const subscriptionService = new SubscriptionService();

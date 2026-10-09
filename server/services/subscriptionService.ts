import { getUserSupabaseClient, serverSupabase } from '../middleware/auth.js';
import { resolveServerSellerCategory } from './planResolver.js';
import { nardopayClient } from '../lib/nardopayClient.js';

const SUCCESS_REDIRECT = 'https://threadzw.vercel.app/subscription/success';
const PREMIUM_AMOUNT = 1.59;

export class SubscriptionService {
  public async createPaymentLink(params: { userId: string; shopId: string; origin?: string }) {
    const { userId, shopId } = params;
    if (!userId) throw new Error('UNAUTHORIZED: Authentication is required');
    if (!shopId) throw new Error('INVALID_SHOP: shopId is required');

    const { data: shop, error: shopError } = await serverSupabase
      .from('shops')
      .select('id, owner_id, name, page_type, plan, account_status, trial_ends_at, subscription_status, payment_verification_status')
      .eq('id', shopId)
      .maybeSingle();
    if (shopError || !shop) throw new Error('INVALID_SHOP: Shop not found');
    if (shop.owner_id !== userId) throw new Error('UNAUTHORIZED: You do not own this shop');

    const category = resolveServerSellerCategory(shop.page_type);
    if (category !== 'clothing') throw new Error('UNSUPPORTED_CATEGORY: Clothing subscriptions are currently supported here');
    const { data: currentSub } = await serverSupabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const periodEnd = currentSub?.current_period_end ? new Date(currentSub.current_period_end).getTime() : 0;
    const hasUnexpiredPro = ['premium', 'pro'].includes(String(shop.plan || '').toLowerCase())
      && shop.account_status === 'active'
      && (!currentSub?.current_period_end || periodEnd > Date.now());
    if (hasUnexpiredPro) throw new Error('ALREADY_SUBSCRIBED: This shop already has an active Pro month');

    const now = new Date().toISOString();
    const internalReference = `NP-${shop.id.slice(0, 8).toUpperCase()}-${Date.now()}`;

    let { data: existingSubscription, error: existingError } = await serverSupabase
      .from('subscriptions')
      .select('id')
      .eq('shop_id', shop.id)
      .maybeSingle();
    if (existingError) throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: ${existingError.message}`);
    if (!existingSubscription) {
      const { data: profileSubscription, error: profileSubscriptionError } = await serverSupabase
        .from('subscriptions')
        .select('id')
        .eq('profile_id', userId)
        .maybeSingle();
      if (profileSubscriptionError) throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: ${profileSubscriptionError.message}`);
      existingSubscription = profileSubscription;
    }

    const subscriptionData = {
      profile_id: userId,
      owner_id: userId,
      shop_id: shop.id,
      category: 'clothing',
      plan: 'premium',
      billing_cycle: 'monthly',
      amount: PREMIUM_AMOUNT,
      currency: 'USD',
      status: 'pending',
      provider: 'nardopay',
      nardopay_link_code: null,
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

    const appOrigin = (params.origin || process.env.APP_URL || SUCCESS_REDIRECT.replace('/subscription/success', '')).replace(/\/$/, '');
    const redirectUrl = `${appOrigin}/subscription/success?shopId=${encodeURIComponent(shop.id)}`;
    const webhookUrl = `${appOrigin}/api/subscriptions/webhook`;
    const paymentLink = await nardopayClient.createPaymentLink({
      link_type: 'subscription',
      product_name: 'ThreadZW Pro',
      amount: PREMIUM_AMOUNT,
      currency: 'USD',
      description: 'ThreadZW Pro — one month of unlimited clothing products and premium storefront tools',
      webhook_url: webhookUrl,
      redirect_url: redirectUrl,
      metadata: {
        profile_id: userId,
        shop_id: shop.id,
        subscription_id: subscriptionId,
        category: 'clothing',
        billing_cycle: 'monthly',
        amount: String(PREMIUM_AMOUNT),
        currency: 'USD'
      },
      plan_name: 'ThreadZW Pro',
      billing_cycle: 'monthly'
    });

    const { error: linkSaveError } = await serverSupabase
      .from('subscriptions')
      .update({ nardopay_link_code: paymentLink.link_code, updated_at: new Date().toISOString() })
      .eq('id', subscriptionId);
    if (linkSaveError) throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: Could not save payment link reference: ${linkSaveError.message}`);

    return {
      success: true,
      url: paymentLink.url,
      linkCode: paymentLink.link_code,
      subscriptionId,
      amount: PREMIUM_AMOUNT,
      currency: 'USD',
      billingCycle: 'monthly' as const,
      category: 'clothing' as const,
      redirectUrl,
      message: 'Payment link created. After payment, your shop will enter pending verification until an admin approves it.'
    };
  }

  public async markPaymentSubmitted(params: { userId: string; shopId: string }) {
    const { userId, shopId } = params;
    if (!userId) throw new Error('UNAUTHORIZED: Authentication is required');
    if (!shopId) throw new Error('INVALID_SHOP: shopId is required');

    const { data: shop, error: shopError } = await serverSupabase
      .from('shops')
      .select('id, owner_id, name, page_type, plan, account_status, payment_verification_status')
      .eq('id', shopId)
      .maybeSingle();
    if (shopError || !shop) throw new Error('INVALID_SHOP: Shop not found');
    if (shop.owner_id !== userId) throw new Error('UNAUTHORIZED: You do not own this shop');

    const category = resolveServerSellerCategory(shop.page_type);
    if (category !== 'clothing') throw new Error('UNSUPPORTED_CATEGORY: Clothing payments are currently supported here');
    const { data: activeSub } = await serverSupabase
      .from('subscriptions')
      .select('current_period_end, status')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const paidUntil = activeSub?.current_period_end ? new Date(activeSub.current_period_end).getTime() : 0;
    if (['premium', 'pro'].includes(String(shop.plan || '').toLowerCase())
      && shop.account_status === 'active'
      && activeSub?.status !== 'pending'
      && (!activeSub?.current_period_end || paidUntil > Date.now())) {
      return { success: true, message: 'Your shop already has an active Pro period.' };
    }

    const now = new Date().toISOString();
    const internalReference = `NP-${shop.id.slice(0, 8).toUpperCase()}-${Date.now()}`;
    let { data: existingSubscription, error: existingError } = await serverSupabase
      .from('subscriptions').select('id').eq('shop_id', shop.id).maybeSingle();
    if (existingError) throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: ${existingError.message}`);
    if (!existingSubscription) {
      const { data: profileSubscription, error: profileSubscriptionError } = await serverSupabase
        .from('subscriptions').select('id').eq('profile_id', userId).maybeSingle();
      if (profileSubscriptionError) throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: ${profileSubscriptionError.message}`);
      existingSubscription = profileSubscription;
    }

    const subscriptionData = {
      profile_id: userId, owner_id: userId, shop_id: shop.id, category: 'clothing', plan: 'premium',
      billing_cycle: 'monthly', amount: PREMIUM_AMOUNT, currency: 'USD', status: 'pending', provider: 'nardopay',
      nardopay_link_code: null, current_period_start: null, current_period_end: null, updated_at: now
    };

    if (existingSubscription) {
      const { error } = await serverSupabase.from('subscriptions').update(subscriptionData).eq('id', existingSubscription.id);
      if (error) throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: ${error.message}`);
    } else {
      const { error } = await serverSupabase.from('subscriptions').insert({ ...subscriptionData, created_at: now });
      if (error) throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: ${error.message}`);
    }

    const { error: shopUpdateError } = await serverSupabase.from('shops').update({
      account_status: 'pending_payment', subscription_status: 'pending', payment_required: true,
      payment_status: 'pending', payment_verification_status: 'pending', payment_submitted_at: now,
      payment_reference: internalReference, payment_amount: PREMIUM_AMOUNT, payment_currency: 'USD',
      product_limit: 0, updated_at: now
    }).eq('id', shop.id);
    if (shopUpdateError) throw new Error(`PAYMENT_STATE_UPDATE_FAILED: ${shopUpdateError.message}`);

    return { success: true, message: 'Payment submitted. Your shop is pending verification.' };
  }

  /** Manual admin verification is authoritative for the fixed NardoPay link flow. */
  public async handleWebhook(_params: { rawBody: string; signatureHeader?: string | string[] | null; payload: any }) {
    return { success: true, ignored: true, reason: 'MANUAL_VERIFICATION_REQUIRED' };
  }

  public async redeemPromoCode(params: { userId: string; shopId: string; code: string; accessToken?: string }) {
    const { userId, shopId, code, accessToken } = params;
    if (!userId) throw new Error('UNAUTHORIZED: Authentication is required');
    if (!shopId) throw new Error('INVALID_SHOP: shopId is required');
    if (!code?.trim()) throw new Error('INVALID_PROMO_CODE: Promo code is required');

    // Verify ownership before calling the promo RPC. The RPC also relies on auth.uid(),
    // so it must receive the authenticated user's Supabase JWT rather than the service-role context.
    const { data: shop, error: shopError } = await serverSupabase
      .from('shops')
      .select('id, owner_id, page_type, plan')
      .eq('id', shopId)
      .maybeSingle();

    if (shopError || !shop) throw new Error('INVALID_SHOP: Shop not found');
    if (shop.owner_id !== userId) throw new Error('UNAUTHORIZED: You do not own this shop');

    const category = resolveServerSellerCategory(shop.page_type);
    if (category !== 'clothing') {
      throw new Error('UNSUPPORTED_CATEGORY: Clothing promo codes are currently supported here');
    }

    if (shop.plan === 'premium' || shop.plan === 'pro') {
      throw new Error('ALREADY_PRO: This shop already has Pro access.');
    }

    const userSupabase = getUserSupabaseClient(accessToken);
    const { data, error } = await userSupabase.rpc('redeem_threadzw_promo', {
      p_shop_id: shopId,
      p_code: code.trim().toUpperCase()
    });

    if (error) throw new Error(`PROMO_REDEMPTION_FAILED: ${error.message}`);
    if (!data?.success) throw new Error('PROMO_REDEMPTION_FAILED: Promo code could not be redeemed');
    return data;
  }

  public async getStatus(params: { userId: string; shopId: string }) {
    const { userId, shopId } = params;

    const { data: shop, error: shopError } = await serverSupabase
      .from('shops')
      .select('id, owner_id, plan, account_status, trial_started_at, trial_ends_at, subscription_status, page_type, payment_reference, paid_at, payment_verification_status, payment_submitted_at, payment_verified_at, payment_required')
      .eq('id', shopId).maybeSingle();
    if (shopError || !shop) throw new Error('INVALID_SHOP: Shop not found');
    if (shop.owner_id !== userId) throw new Error('UNAUTHORIZED: Shop access denied');

    const { data: subscription } = await serverSupabase
      .from('subscriptions')
      .select('id, plan, status, amount, currency, billing_cycle, current_period_start, current_period_end, grace_period_end, cancelled_at, nardopay_link_code, provider')
      .eq('shop_id', shopId).order('created_at', { ascending: false }).limit(1).maybeSingle();

    const nowMs = Date.now();
    const trialEndMs = shop.trial_ends_at ? new Date(shop.trial_ends_at).getTime() : 0;
    const periodEndMs = subscription?.current_period_end ? new Date(subscription.current_period_end).getTime() : 0;
    const isProPlan = ['premium', 'pro'].includes(String(shop.plan || '').toLowerCase());
    const isPaidPeriodActive = isProPlan && shop.account_status === 'active'
      && (!subscription?.current_period_end || periodEndMs > nowMs);
    const isTrialActive = !isProPlan && Boolean(shop.trial_ends_at) && trialEndMs > nowMs
      && ['trial', 'free'].includes(String(shop.account_status || '').toLowerCase())
      && !['pending', 'rejected'].includes(String(shop.payment_verification_status || '').toLowerCase());
    const computedStatus = shop.payment_verification_status === 'pending'
      ? 'pending'
      : isPaidPeriodActive
        ? 'active'
        : isTrialActive
          ? 'trial'
          : 'expired';

    return {
      success: true,
      shopId,
      category: resolveServerSellerCategory(shop.page_type),
      plan: isPaidPeriodActive ? 'premium' : isTrialActive ? 'trial' : 'inactive',
      status: computedStatus,
      amount: subscription?.amount ?? PREMIUM_AMOUNT,
      currency: subscription?.currency || 'USD',
      billingCycle: subscription?.billing_cycle || 'monthly',
      currentPeriodStart: subscription?.current_period_start || null,
      currentPeriodEnd: subscription?.current_period_end || null,
      gracePeriodEnd: subscription?.grace_period_end || null,
      cancelledAt: subscription?.cancelled_at || null,
      nardopayLinkCode: subscription?.nardopay_link_code || null,
      paymentVerificationStatus: shop.payment_verification_status || null,
      paymentSubmittedAt: shop.payment_submitted_at || null,
      paymentVerifiedAt: shop.payment_verified_at || null,
      paymentRequired: !isPaidPeriodActive,
      trialStartedAt: shop.trial_started_at || null,
      trialEndsAt: shop.trial_ends_at || null,
      trialDays: 3,
      viewOnly: computedStatus === 'expired' || computedStatus === 'pending',
    };
  }

  public async verifyPaymentFallback(params?: { userId?: string; shopId?: string; linkCode?: string }) {
    return { verified: false, reason: 'MANUAL_ADMIN_VERIFICATION_REQUIRED', shopId: params?.shopId || null };
  }
}

export const subscriptionService = new SubscriptionService();

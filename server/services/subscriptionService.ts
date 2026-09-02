import { serverSupabase } from '../middleware/auth.js';
import { nardopayClient } from '../lib/nardopayClient.js';
import { resolveProPlanForShop, resolveServerSellerCategory } from './planResolver.js';
import { createNotification } from './notificationService.js';

// NardoPay's settled payment status is exactly `successful`.
// Generic, missing, or gateway-specific states such as `paid` or `completed` must not activate entitlements.
const SUCCESS_STATUSES = new Set(['successful']);

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function asString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

export class SubscriptionService {
  public async createPaymentLink(params: { userId: string; shopId: string; origin?: string }) {
    const { userId, shopId } = params;
    if (!userId) throw new Error('UNAUTHORIZED: Authentication is required');
    if (!shopId) throw new Error('INVALID_SHOP: shopId is required');

    const { data: shop, error: shopError } = await serverSupabase
      .from('shops')
      .select('id, owner_id, name, page_type, plan, subscription_status')
      .eq('id', shopId)
      .maybeSingle();

    if (shopError || !shop) throw new Error('INVALID_SHOP: Shop not found');
    if (shop.owner_id !== userId) throw new Error('UNAUTHORIZED: You do not own this shop');

    const category = resolveServerSellerCategory(shop.page_type);
    if (category !== 'clothing') {
      throw new Error('UNSUPPORTED_CATEGORY: Clothing subscriptions are the only supported paid flow');
    }

    const planDetails = resolveProPlanForShop(shop);

    const { data: activeSubscription, error: activeSubscriptionError } = await serverSupabase
      .from('subscriptions')
      .select('id, status, current_period_end')
      .eq('shop_id', shopId)
      .eq('status', 'active')
      .maybeSingle();

    if (activeSubscriptionError) {
      console.warn('[SubscriptionService] Active subscription lookup failed:', activeSubscriptionError.message);
    }
    if (activeSubscription) {
      throw new Error('ALREADY_SUBSCRIBED: This shop already has an active subscription');
    }

    const nowISO = new Date().toISOString();
    const internalReference = `NP-${shop.id.slice(0, 8).toUpperCase()}-${Date.now()}`;

    const { data: existingSubscription, error: existingSubscriptionError } = await serverSupabase
      .from('subscriptions')
      .select('id')
      .eq('shop_id', shop.id)
      .eq('category', 'clothing')
      .maybeSingle();

    if (existingSubscriptionError) {
      throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: ${existingSubscriptionError.message}`);
    }

    const subscriptionData = {
      owner_id: userId,
      shop_id: shop.id,
      category: 'clothing',
      plan: 'premium',
      billing_cycle: planDetails.billing_cycle,
      amount: planDetails.amount,
      currency: planDetails.currency,
      status: 'pending',
      provider: 'nardopay',
      nardopay_link_code: null,
      created_at: nowISO,
      updated_at: nowISO
    };

    let subscriptionId: string | null = null;
    if (existingSubscription) {
      const { data, error } = await serverSupabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id)
        .select('id')
        .single();
      if (error || !data) throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: ${error?.message || 'Unable to update subscription reference'}`);
      subscriptionId = data.id;
    } else {
      const { data, error } = await serverSupabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select('id')
        .single();
      if (error || !data) throw new Error(`SUBSCRIPTION_ATTEMPT_FAILED: ${error?.message || 'Unable to create subscription reference'}`);
      subscriptionId = data.id;
    }

    const appOrigin = (process.env.APP_URL || 'https://threadzw.vercel.app').replace(/\/$/, '');
    const webhookUrl = `${appOrigin}/api/subscriptions/webhook`;
    const redirectUrl = `${appOrigin}/payment/success`;

    const linkResponse = await nardopayClient.createPaymentLink({
      link_type: 'payment',
      product_name: planDetails.planName,
      amount: planDetails.amount,
      currency: planDetails.currency,
      description: planDetails.description,
      webhook_url: webhookUrl,
      redirect_url: redirectUrl,
      metadata: {
        profile_id: userId,
        shop_id: shop.id,
        category: planDetails.category,
        plan: 'premium',
        subscription_id: String(subscriptionId),
        payment_reference: internalReference
      }
    });

    const linkCode = linkResponse.link_code;
    const checkoutUrl = linkResponse.url;
    const providerMetadata = {
      billing_cycle: planDetails.billing_cycle,
      internal_reference: internalReference,
      subscription_id: String(subscriptionId),
      link_code: linkCode
    };

    const { error: subscriptionLinkUpdateError } = await serverSupabase
      .from('subscriptions')
      .update({ nardopay_link_code: linkCode, updated_at: new Date().toISOString() })
      .eq('id', subscriptionId);
    if (subscriptionLinkUpdateError) throw new Error(`SUBSCRIPTION_ATTEMPT_UPDATE_FAILED: ${subscriptionLinkUpdateError.message}`);

    return {
      success: true,
      url: checkoutUrl,
      linkCode,
      subscriptionId,
            amount: planDetails.amount,
      currency: planDetails.currency,
      billingCycle: planDetails.billing_cycle,
      category: 'clothing'
    };
  }

  public async handleWebhook(params: { rawBody: string; signatureHeader?: string | string[] | null; payload: any }) {
    const { rawBody, signatureHeader, payload } = params;
    if (!nardopayClient.verifyWebhookSignature(rawBody, signatureHeader)) {
      throw new Error('INVALID_SIGNATURE');
    }

    const eventType = String(payload.event || payload.event_type || payload.type || '').toLowerCase().trim();
    const normalizedEvent = eventType === 'payment.succeeded' || eventType === 'payment.successful' ? 'payment.completed' : eventType;
    const data = payload.data || {};
    const metadata = payload.metadata || data.metadata || {};
    const transactionId = asString(payload.transaction_id || payload.transactionId || data.transaction_id);
    const providerEventId = asString(payload.event_id || payload.provider_event_id || payload.id || data.event_id);
    const reference = asString(payload.reference || payload.link_code || payload.linkCode || data.reference || data.link_code);
    const shopIdFromMetadata = asString(metadata.shop_id || payload.shop_id || data.shop_id);
    const subscriptionIdFromMetadata = asString(metadata.subscription_id || payload.subscription_id || data.subscription_id);
    const linkCode = asString(metadata.link_code || reference);
    const stableId = providerEventId || transactionId || reference || subscriptionIdFromMetadata;

    if (!stableId) throw new Error('UNPROCESSABLE_WEBHOOK: No stable event, transaction, payment reference, or subscription');

    const idempotencyKey = `${stableId}:${normalizedEvent || 'payment.completed'}`;

    let targetShop: any = null;
    let targetSubscription: any = null;

    if (subscriptionIdFromMetadata) {
      const { data: subscription } = await serverSupabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionIdFromMetadata)
        .maybeSingle();
      targetSubscription = subscription;
    }

    if (shopIdFromMetadata) {
      const { data } = await serverSupabase
        .from('shops')
        .select('*')
        .eq('id', shopIdFromMetadata)
        .maybeSingle();
      targetShop = data;
    }

    if (linkCode && !targetSubscription) {
      const { data: subscription } = await serverSupabase
        .from('subscriptions')
        .select('*')
        .eq('nardopay_link_code', linkCode)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      targetSubscription = subscription;
    }

    if (!targetShop && targetSubscription) {
      const { data } = await serverSupabase.from('shops').select('*').eq('id', targetSubscription.shop_id).maybeSingle();
      targetShop = data;
    }

    if (!targetShop) throw new Error('PAYMENT_SHOP_NOT_FOUND');
    if (resolveServerSellerCategory(targetShop.page_type) !== 'clothing') throw new Error('UNSUPPORTED_CATEGORY');

    const normalizedType = normalizedEvent || 'payment.completed';
    const amount = asNumber(payload.amount ?? data.amount);
    const currency = String(payload.currency || data.currency || 'USD').toUpperCase();
    const eventStatus = String(payload.status || data.status || '').toLowerCase();
    const resolvedLinkCode = linkCode || targetSubscription?.nardopay_link_code || null;
    const now = new Date();

    const { data: insertedEvent, error: eventInsertError } = await serverSupabase
      .from('payment_events')
      .insert({
        shop_id: targetShop.id,
        subscription_id: targetSubscription?.id || null,
        owner_id: targetShop.owner_id,
        provider: 'nardopay',
        event_type: normalizedType,
        provider_event_id: idempotencyKey,
        link_code: resolvedLinkCode,
        amount,
        currency,
        payload,
        signature_verified: true,
        processed: false,
        created_at: now.toISOString()
      })
      .select('id')
      .single();

    if (eventInsertError) {
      if (eventInsertError.code === '23505') return { success: true, duplicate: true, event: normalizedType };
      throw new Error(`PAYMENT_EVENT_LOG_FAILED: ${eventInsertError.message}`);
    }

    try {
      if (normalizedType !== 'payment.completed') {
        await serverSupabase.from('payment_events').update({ processed: true, processed_at: now.toISOString() }).eq('id', insertedEvent.id);
        return { success: true, ignored: true, event: normalizedType };
      }

      if (!SUCCESS_STATUSES.has(eventStatus)) {
        await serverSupabase.from('payment_events').update({ processed: true, processed_at: now.toISOString() }).eq('id', insertedEvent.id);
        return { success: true, paymentRejected: true, event: normalizedType };
      }

      if (!targetSubscription) throw new Error('SUBSCRIPTION_NOT_FOUND');
      const expectedAmount = Number(targetSubscription.amount);
      if (amount === null || Math.abs(amount - expectedAmount) > 0.005) throw new Error('PAYMENT_AMOUNT_MISMATCH');
      if (currency !== String(targetSubscription.currency).toUpperCase()) throw new Error('PAYMENT_CURRENCY_MISMATCH');

      const { data: activeSubscription, error: subscriptionError } = await serverSupabase
        .from('subscriptions')
        .update({
          status: 'active',
          plan: 'premium',
          amount: expectedAmount,
          currency: String(targetSubscription.currency).toUpperCase(),
          billing_cycle: 'none',
          nardopay_link_code: resolvedLinkCode,
          current_period_start: null,
          current_period_end: null,
          grace_period_end: null,
          cancelled_at: null,
          updated_at: now.toISOString()
        })
        .eq('id', targetSubscription?.id || '')
        .select('id')
        .maybeSingle();
      if (subscriptionError) throw new Error(`SUBSCRIPTION_UPDATE_FAILED: ${subscriptionError.message}`);

      const subscriptionId = activeSubscription?.id || targetSubscription?.id;
      const { error: shopUpdateError } = await serverSupabase
        .from('shops')
        .update({
          plan: 'premium',
          subscription_status: 'active',
          payment_status: 'paid',
          payment_reference: resolvedLinkCode || transactionId,
          payment_amount: expectedAmount,
          payment_currency: String(targetSubscription.currency).toUpperCase(),
          paid_at: now.toISOString()
        })
        .eq('id', targetShop.id);
      if (shopUpdateError) throw new Error(`SHOP_ENTITLEMENT_UPDATE_FAILED: ${shopUpdateError.message}`);

      await serverSupabase.from('payment_events').update({ processed: true, processed_at: now.toISOString() }).eq('id', insertedEvent.id);

      try {
        await createNotification(targetShop.owner_id, {
          title: 'Premium activated',
          body: 'Your Threadzw Premium access is active for life.',
          type: 'subscription_activated',
          target_url: '/subscription'
        });
      } catch (notificationError) {
        console.warn('[SubscriptionService] Notification failed:', notificationError);
      }

      return { success: true, event: normalizedType, shopId: targetShop.id, subscriptionId };
    } catch (processingError: any) {
      await serverSupabase.from('payment_events').update({ processing_error: processingError.message }).eq('id', insertedEvent.id);
      throw processingError;
    }
  }

  public async getStatus(params: { userId: string; shopId: string }) {
    const { userId, shopId } = params;
    const { data: shop, error: shopError } = await serverSupabase
      .from('shops')
      .select('id, owner_id, plan, subscription_status, page_type, payment_reference, paid_at')
      .eq('id', shopId)
      .maybeSingle();
    if (shopError || !shop) throw new Error('INVALID_SHOP: Shop not found');
    if (shop.owner_id !== userId) throw new Error('UNAUTHORIZED: Shop access denied');

    const { data: subscription } = await serverSupabase
      .from('subscriptions')
      .select('id, plan, status, amount, currency, billing_cycle, current_period_start, current_period_end, grace_period_end, cancelled_at, nardopay_link_code')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      shopId,
      category: resolveServerSellerCategory(shop.page_type),
      plan: shop.plan === 'premium' ? 'premium' : 'free',
      status: subscription?.status || (shop.plan === 'premium' ? 'active' : 'inactive'),
      amount: subscription?.amount || Number(process.env.THREADZW_CLOTHING_PRO_PRICE_USD || 9),
      currency: subscription?.currency || 'USD',
      billingCycle: subscription?.billing_cycle || 'none',
      currentPeriodStart: subscription?.current_period_start || null,
      currentPeriodEnd: subscription?.current_period_end || null,
      gracePeriodEnd: subscription?.grace_period_end || null,
      cancelledAt: subscription?.cancelled_at || null,
      nardopayLinkCode: subscription?.nardopay_link_code || null
    };
  }

  public async verifyPaymentFallback(_params?: { userId?: string; shopId?: string; linkCode?: string }) {
    return { verified: false, reason: 'WEBHOOK_REQUIRED' };
  }
}

export const subscriptionService = new SubscriptionService();

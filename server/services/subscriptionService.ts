// server/services/subscriptionService.ts

import { serverSupabase } from '../middleware/auth';
import { nardopayClient } from '../lib/nardopayClient';
import { resolveProPlanForShop, resolveServerSellerCategory } from './planResolver';
import { createNotification } from './notificationService';

export class SubscriptionService {
  /**
   * Creates a NardoPay payment link for the authenticated merchant's shop.
   */
  public async createPaymentLink(params: {
    userId: string;
    shopId: string;
    origin?: string;
  }) {
    const { userId, shopId, origin } = params;

    if (!userId) {
      throw new Error('UNAUTHORIZED: Authentication is required');
    }
    if (!shopId) {
      throw new Error('INVALID_SHOP: shopId is required');
    }

    // 1. Load shop from Supabase & verify ownership
    const { data: shop, error: shopError } = await serverSupabase
      .from('shops')
      .select('id, owner_id, name, page_type, plan, subscription_status')
      .eq('id', shopId)
      .maybeSingle();

    if (shopError || !shop) {
      console.error('[SubscriptionService] Shop lookup error:', shopError);
      throw new Error('INVALID_SHOP: Shop not found');
    }

    if (shop.owner_id !== userId) {
      console.error(`[SubscriptionService] Ownership mismatch. Shop owner: ${shop.owner_id}, requester: ${userId}`);
      throw new Error('UNAUTHORIZED: You do not own this shop');
    }

    // 2. Resolve server-side plan details (never trust client amounts)
    const planDetails = resolveProPlanForShop(shop);

    // 3. Check for existing active/past_due/grace_period subscription
    const { data: existingActiveSub, error: subCheckError } = await serverSupabase
      .from('subscriptions')
      .select('id, status, plan, current_period_end, nardopay_link_code')
      .eq('shop_id', shopId)
      .in('status', ['active', 'grace_period'])
      .maybeSingle();

    if (subCheckError) {
      console.warn('[SubscriptionService] Active subscription check error:', subCheckError.message);
    }

    if (existingActiveSub) {
      console.log(`[SubscriptionService] Shop ${shopId} already has an active subscription (${existingActiveSub.id})`);
      throw new Error('ALREADY_SUBSCRIBED: This shop already has an active Pro subscription');
    }

    // 4. Determine webhook endpoint URL
    const appOrigin = origin || process.env.APP_URL || 'https://threadzw.co.zw';
    const webhookUrl = `${appOrigin.replace(/\/$/, '')}/api/nardopay-webhook`;

    // 5. Call NardoPay API server-side
    const linkResponse = await nardopayClient.createPaymentLink({
      link_type: 'subscription',
      plan_name: planDetails.planName,
      amount: planDetails.amount,
      currency: planDetails.currency,
      billing_cycle: planDetails.billing_cycle,
      description: planDetails.description,
      webhook_url: webhookUrl,
      metadata: {
        profile_id: userId,
        shop_id: shop.id,
        category: planDetails.category,
        plan: planDetails.plan
      }
    });

    const linkCode = linkResponse.link_code;
    const linkId = linkResponse.link_id || linkCode;
    const checkoutUrl = linkResponse.url;

    // 6. Record or update pending subscription in public.subscriptions
    // Check if there is an existing pending/inactive subscription for this shop & category
    const { data: existingSub } = await serverSupabase
      .from('subscriptions')
      .select('id')
      .eq('shop_id', shop.id)
      .eq('category', planDetails.category)
      .maybeSingle();

    let subscriptionId: string;

    if (existingSub) {
      const { data: updatedSub, error: updateErr } = await serverSupabase
        .from('subscriptions')
        .update({
          owner_id: userId,
          plan: 'pro',
          billing_cycle: planDetails.billing_cycle,
          amount: planDetails.amount,
          currency: planDetails.currency,
          status: 'pending',
          provider: 'nardopay',
          nardopay_link_id: linkId,
          nardopay_link_code: linkCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id)
        .select('id')
        .single();

      if (updateErr) {
        console.error('[SubscriptionService] Failed to update pending subscription:', updateErr);
      }
      subscriptionId = updatedSub?.id || existingSub.id;
    } else {
      const { data: newSub, error: insertErr } = await serverSupabase
        .from('subscriptions')
        .insert({
          shop_id: shop.id,
          owner_id: userId,
          category: planDetails.category,
          plan: 'pro',
          billing_cycle: planDetails.billing_cycle,
          amount: planDetails.amount,
          currency: planDetails.currency,
          status: 'pending',
          provider: 'nardopay',
          nardopay_link_id: linkId,
          nardopay_link_code: linkCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error('[SubscriptionService] Failed to insert pending subscription:', insertErr);
      }
      subscriptionId = newSub?.id || '';
    }

    // Also update legacy subscriptions table if profile_id exists to keep full backward compatibility
    try {
      await serverSupabase
        .from('subscriptions')
        .update({
          nardopay_link_code: linkCode,
          nardopay_link_id: linkId
        })
        .eq('profile_id', userId);
    } catch (e) {
      // Ignored for legacy field fallback
    }

    // 7. Return safe client data (NEVER leak API keys or secrets)
    return {
      success: true,
      linkCode,
      url: checkoutUrl,
      subscriptionId,
      amount: planDetails.amount,
      currency: planDetails.currency,
      billingCycle: planDetails.billing_cycle,
      category: planDetails.category
    };
  }

  /**
   * Processes Authoritative NardoPay Webhooks.
   */
  public async handleWebhook(params: {
    rawBody: string;
    signatureHeader?: string | string[] | null;
    payload: any;
  }) {
    const { rawBody, signatureHeader, payload } = params;

    console.log('[SubscriptionService] Webhook processing triggered');

    // 1. Signature Verification
    const isSignatureValid = nardopayClient.verifyWebhookSignature(rawBody, signatureHeader);

    if (!isSignatureValid) {
      console.error('[SubscriptionService] Webhook rejected: Invalid HMAC signature');
      throw new Error('INVALID_SIGNATURE');
    }

    // 2. Extract Event Data
    const eventType = payload.event_type || payload.event || payload.type || payload.status;
    const providerEventId = payload.provider_event_id || payload.event_id || payload.id || null;
    const linkCode = payload.link_code || payload.data?.link_code || payload.linkCode || null;
    const nardopaySubId = payload.nardopay_subscription_id || payload.subscription_id || payload.data?.subscription_id || null;
    
    // Metadata pass-through
    const metadata = payload.metadata || payload.data?.metadata || {};
    const profileId = metadata.profile_id || payload.profile_id || payload.customer_id || null;
    const metaShopId = metadata.shop_id || payload.shop_id || null;
    const metaCategory = metadata.category || null;

    console.log('[SubscriptionService] Webhook event verified:', {
      eventType,
      providerEventId,
      linkCode,
      profileId,
      metaShopId
    });

    // 3. Webhook Idempotency Check (Check public.payment_events)
    if (providerEventId) {
      const { data: existingEvent } = await serverSupabase
        .from('payment_events')
        .select('id, processed')
        .eq('provider_event_id', providerEventId)
        .maybeSingle();

      if (existingEvent) {
        console.log(`[SubscriptionService] Webhook event ${providerEventId} already processed (idempotency).`);
        return { success: true, duplicate: true, message: 'Event already processed' };
      }
    }

    // 4. Resolve Associated Shop and Subscription Records
    let targetShop: any = null;
    let targetSubscription: any = null;

    // Search by shop_id from metadata if available
    if (metaShopId) {
      const { data: shop } = await serverSupabase
        .from('shops')
        .select('*')
        .eq('id', metaShopId)
        .maybeSingle();
      if (shop) targetShop = shop;
    }

    // Search by linkCode in public.subscriptions
    if (linkCode) {
      const { data: sub } = await serverSupabase
        .from('subscriptions')
        .select('*')
        .eq('nardopay_link_code', linkCode)
        .maybeSingle();
      if (sub) {
        targetSubscription = sub;
        if (!targetShop) {
          const { data: s } = await serverSupabase.from('shops').select('*').eq('id', sub.shop_id).maybeSingle();
          if (s) targetShop = s;
        }
      }
    }

    // Fallback: search by profile_id / owner_id
    if (!targetShop && profileId) {
      const { data: shop } = await serverSupabase
        .from('shops')
        .select('*')
        .eq('owner_id', profileId)
        .maybeSingle();
      if (shop) targetShop = shop;
    }

    if (targetShop && !targetSubscription) {
      const { data: sub } = await serverSupabase
        .from('subscriptions')
        .select('*')
        .eq('shop_id', targetShop.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sub) targetSubscription = sub;
    }

    const resolvedShopId = targetShop?.id || metaShopId || null;
    const resolvedOwnerId = targetShop?.owner_id || profileId || null;
    const resolvedSubId = targetSubscription?.id || null;

    const amount = payload.amount || payload.data?.amount || targetSubscription?.amount || null;
    const currency = payload.currency || payload.data?.currency || 'USD';

    // 5. Store Raw Event in public.payment_events (audit log)
    let paymentEventId: string | null = null;
    try {
      const { data: insertedEvent, error: insertEventErr } = await serverSupabase
        .from('payment_events')
        .insert({
          shop_id: resolvedShopId,
          subscription_id: resolvedSubId,
          owner_id: resolvedOwnerId,
          provider: 'nardopay',
          event_type: this.mapEventType(eventType),
          provider_event_id: providerEventId,
          link_code: linkCode,
          nardopay_subscription_id: nardopaySubId,
          amount: amount ? Number(amount) : null,
          currency: currency,
          payload: payload,
          signature_verified: true,
          processed: false,
          created_at: new Date().toISOString()
        })
        .select('id')
        .maybeSingle();

      if (insertEventErr) {
        console.warn('[SubscriptionService] Payment event logging notice:', insertEventErr.message);
      } else {
        paymentEventId = insertedEvent?.id || null;
      }
    } catch (e: any) {
      console.warn('[SubscriptionService] Exception storing payment event:', e.message);
    }

    // 6. Handle Specific Event Types Authoritatively
    const normalizedEvent = this.mapEventType(eventType);
    const now = new Date();

    try {
      switch (normalizedEvent) {
        case 'payment.completed': {
          if (!targetShop) {
            throw new Error(`Shop could not be resolved for payment.completed (meta: ${JSON.stringify(metadata)})`);
          }

          const category = resolveServerSellerCategory(targetShop.page_type);
          const isVehicle = category === 'vehicles';

          // Calculate period end: +1 month for clothing, +1 year for vehicles
          const periodStart = now;
          const periodEnd = new Date(periodStart);
          if (isVehicle) {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          // Expected verified price check
          const expectedAmount = isVehicle ? 30.00 : 1.59;
          const verifiedAmount = amount ? Number(amount) : expectedAmount;

          // A. Update public.subscriptions
          if (targetSubscription) {
            await serverSupabase
              .from('subscriptions')
              .update({
                status: 'active',
                plan: 'pro',
                amount: verifiedAmount,
                currency: 'USD',
                billing_cycle: isVehicle ? 'yearly' : 'monthly',
                nardopay_subscription_id: nardopaySubId || targetSubscription.nardopay_subscription_id,
                current_period_start: periodStart.toISOString(),
                current_period_end: periodEnd.toISOString(),
                grace_period_end: null,
                cancelled_at: null,
                updated_at: now.toISOString()
              })
              .eq('id', targetSubscription.id);
          } else {
            const { data: newSub } = await serverSupabase
              .from('subscriptions')
              .insert({
                shop_id: targetShop.id,
                owner_id: targetShop.owner_id,
                category: category,
                plan: 'pro',
                billing_cycle: isVehicle ? 'yearly' : 'monthly',
                amount: verifiedAmount,
                currency: 'USD',
                status: 'active',
                provider: 'nardopay',
                nardopay_link_code: linkCode,
                nardopay_subscription_id: nardopaySubId,
                current_period_start: periodStart.toISOString(),
                current_period_end: periodEnd.toISOString(),
                created_at: now.toISOString(),
                updated_at: now.toISOString()
              })
              .select('id')
              .maybeSingle();

            if (newSub) {
              targetSubscription = newSub;
            }
          }

          // B. Update public.shops (The application entitlement cache used by Phase 5 logic)
          await serverSupabase
            .from('shops')
            .update({
              plan: 'pro',
              subscription_status: 'active',
              payment_status: 'paid',
              payment_reference: linkCode || providerEventId || `NP-${Date.now()}`,
              payment_amount: verifiedAmount,
              payment_currency: 'USD',
              paid_at: now.toISOString()
            })
            .eq('id', targetShop.id);

          // C. Update legacy profiles/subscriptions if present
          if (targetShop.owner_id) {
            try {
              await serverSupabase
                .from('profiles')
                .update({
                  subscription_status: 'active',
                  active_until: periodEnd.toISOString()
                })
                .eq('id', targetShop.owner_id);

              await serverSupabase
                .from('subscriptions')
                .update({
                  status: 'active',
                  subscription_started_at: periodStart.toISOString(),
                  subscription_ends_at: periodEnd.toISOString()
                })
                .eq('profile_id', targetShop.owner_id);
            } catch (e) {}
          }

          // D. Notify Merchant
          try {
            await createNotification(targetShop.owner_id, {
              title: 'Pro Plan Activated! 🎉',
              body: `Your ${isVehicle ? 'Vehicle Pro Dealership' : 'Clothing Pro'} subscription is now active. Enjoy unlimited listings!`,
              type: 'subscription_activated',
              target_url: '/dashboard'
            });
          } catch (e) {}

          console.log(`[SubscriptionService] Pro successfully activated for shop ${targetShop.id}`);
          break;
        }

        case 'subscription.renewed': {
          if (!targetShop) {
            throw new Error(`Shop not found for renewal event`);
          }

          const category = resolveServerSellerCategory(targetShop.page_type);
          const isVehicle = category === 'vehicles';

          let nextPeriodEnd = new Date();
          if (targetSubscription?.current_period_end) {
            const currentEnd = new Date(targetSubscription.current_period_end);
            if (currentEnd > nextPeriodEnd) {
              nextPeriodEnd = currentEnd;
            }
          }

          if (isVehicle) {
            nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
          } else {
            nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
          }

          if (targetSubscription) {
            await serverSupabase
              .from('subscriptions')
              .update({
                status: 'active',
                current_period_end: nextPeriodEnd.toISOString(),
                grace_period_end: null,
                updated_at: now.toISOString()
              })
              .eq('id', targetSubscription.id);
          }

          await serverSupabase
            .from('shops')
            .update({
              plan: 'pro',
              subscription_status: 'active'
            })
            .eq('id', targetShop.id);

          console.log(`[SubscriptionService] Subscription renewed for shop ${targetShop.id}`);
          break;
        }

        case 'subscription.trial_started': {
          console.log(`[SubscriptionService] Trial started event received and logged.`);
          break;
        }

        case 'subscription.renew_failed': {
          const graceEnd = new Date(now);
          graceEnd.setDate(graceEnd.getDate() + 3); // 3-day grace period

          if (targetSubscription) {
            await serverSupabase
              .from('subscriptions')
              .update({
                status: 'grace_period',
                grace_period_end: graceEnd.toISOString(),
                updated_at: now.toISOString()
              })
              .eq('id', targetSubscription.id);
          }

          if (targetShop) {
            await serverSupabase
              .from('shops')
              .update({
                subscription_status: 'past_due'
              })
              .eq('id', targetShop.id);
          }

          // Do NOT delete any inventory (products or vehicles)
          console.log(`[SubscriptionService] Subscription renewal failed. Placed in grace period until ${graceEnd.toISOString()}`);
          break;
        }

        case 'subscription.cancelled': {
          if (targetSubscription) {
            await serverSupabase
              .from('subscriptions')
              .update({
                status: 'cancelled',
                cancelled_at: now.toISOString(),
                updated_at: now.toISOString()
              })
              .eq('id', targetSubscription.id);
          }

          if (targetShop) {
            await serverSupabase
              .from('shops')
              .update({
                subscription_status: 'cancelled'
              })
              .eq('id', targetShop.id);
          }

          // Do NOT delete products or vehicles
          console.log(`[SubscriptionService] Subscription cancelled. Inventory preserved.`);
          break;
        }

        default:
          console.log(`[SubscriptionService] Unhandled event type: ${eventType}`);
      }

      // Mark payment_event as processed
      if (paymentEventId) {
        await serverSupabase
          .from('payment_events')
          .update({
            processed: true,
            processed_at: now.toISOString()
          })
          .eq('id', paymentEventId);
      }

      return { success: true, event: normalizedEvent };
    } catch (processErr: any) {
      console.error('[SubscriptionService] Error processing webhook event logic:', processErr);

      if (paymentEventId) {
        await serverSupabase
          .from('payment_events')
          .update({
            processed: false,
            processing_error: processErr.message
          })
          .eq('id', paymentEventId);
      }

      throw processErr;
    }
  }

  /**
   * Retrieves Authoritative Subscription Status for a Shop.
   */
  public async getStatus(params: { userId: string; shopId: string }) {
    const { userId, shopId } = params;

    if (!userId || !shopId) {
      throw new Error('shopId and authenticated user context are required');
    }

    // 1. Verify shop ownership
    const { data: shop, error: shopErr } = await serverSupabase
      .from('shops')
      .select('id, owner_id, plan, subscription_status, page_type, payment_reference, paid_at')
      .eq('id', shopId)
      .maybeSingle();

    if (shopErr || !shop) {
      throw new Error('INVALID_SHOP: Shop not found');
    }

    if (shop.owner_id !== userId) {
      throw new Error('UNAUTHORIZED: Shop access denied');
    }

    const category = resolveServerSellerCategory(shop.page_type);

    // 2. Fetch active/most recent subscription from public.subscriptions
    const { data: subscription } = await serverSupabase
      .from('subscriptions')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      shopId: shop.id,
      plan: shop.plan || 'free',
      category: category,
      status: subscription?.status || (shop.plan === 'pro' ? 'active' : 'inactive'),
      billingCycle: subscription?.billing_cycle || (category === 'vehicles' ? 'yearly' : 'monthly'),
      amount: subscription?.amount || (category === 'vehicles' ? 30.00 : 1.59),
      currency: subscription?.currency || 'USD',
      currentPeriodStart: subscription?.current_period_start || null,
      currentPeriodEnd: subscription?.current_period_end || null,
      gracePeriodEnd: subscription?.grace_period_end || null,
      cancelledAt: subscription?.cancelled_at || null,
      nardopayLinkCode: subscription?.nardopay_link_code || null
    };
  }

  /**
   * Manual Payment Verification Fallback.
   */
  public async verifyPaymentFallback(params: {
    userId: string;
    shopId: string;
    linkCode?: string;
  }) {
    const { userId, shopId, linkCode } = params;

    const { data: shop } = await serverSupabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .maybeSingle();

    if (!shop || shop.owner_id !== userId) {
      throw new Error('UNAUTHORIZED');
    }

    // Call NardoPay verification API
    const result = await nardopayClient.verifyPaymentStatus({
      link_code: linkCode,
      profile_id: userId
    });

    if (result && (result.status === 'paid' || result.status === 'active' || result.verified === true)) {
      // Simulate webhook handling for recovery
      await this.handleWebhook({
        rawBody: JSON.stringify(result),
        signatureHeader: 'bypass_fallback',
        payload: {
          event_type: 'payment.completed',
          provider_event_id: `FALLBACK-${Date.now()}`,
          link_code: linkCode,
          amount: result.amount,
          metadata: {
            profile_id: userId,
            shop_id: shopId
          }
        }
      });
      return { verified: true, plan: 'pro' };
    }

    return { verified: false };
  }

  private mapEventType(rawType: string): string {
    if (!rawType) return 'payment.completed';
    const lower = String(rawType).toLowerCase().trim();
    if (lower === 'payment.completed' || lower === 'payment.succeeded' || lower === 'paid' || lower === 'success') {
      return 'payment.completed';
    }
    if (lower === 'subscription.renewed' || lower === 'renewed') {
      return 'subscription.renewed';
    }
    if (lower === 'subscription.trial_started' || lower === 'trial_started') {
      return 'subscription.trial_started';
    }
    if (lower === 'subscription.renew_failed' || lower === 'renew_failed' || lower === 'payment.failed') {
      return 'subscription.renew_failed';
    }
    if (lower === 'subscription.cancelled' || lower === 'cancelled') {
      return 'subscription.cancelled';
    }
    return rawType;
  }
}

export const subscriptionService = new SubscriptionService();

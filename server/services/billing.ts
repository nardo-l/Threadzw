// server/services/billing.ts

import { serverSupabase, getUserSupabaseClient } from '../middleware/auth';
import { createNotification } from './notificationService';

export class BillingService {
  /**
   * Activates/renews a merchant subscription backend-side.
   * Writes the payment transaction to 'payments' and updates 'subscriptions' to 'active'.
   */
  public async activateSubscription(
    userId: string,
    amount: number,
    transactionId: string | null,
    provider: string = 'nardopay',
    userToken?: string
  ) {
    console.log(`[BillingService] Attempting to activate subscription for user ${userId} with transactionId: ${transactionId}`);
    const db = getUserSupabaseClient(userToken);

    // 1. Implement Idempotency: Check if payment already exists with this transactionId
    if (transactionId) {
      const { data: existingPayment, error: payCheckError } = await db
        .from('payments')
        .select('id')
        .eq('provider_transaction_id', transactionId)
        .maybeSingle();

      if (payCheckError) {
        console.error('[BillingService] Error checking duplicate payment:', payCheckError);
      }

      if (existingPayment) {
        console.log(`[BillingService] Idempotency match: Payment with transactionId ${transactionId} already processed. Returning success.`);
        return { success: true };
      }
    }

    // 2. Fetch user's shop to get shop_id
    const { data: userShop } = await db
      .from('shops')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    const shopId = userShop?.id || null;

    // 3. Load current subscription to see if it exists
    const { data: currentSub, error: subFetchError } = await db
      .from('subscriptions')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    if (subFetchError) {
      console.error('[BillingService] Error fetching subscription in service:', subFetchError);
    }

    // 4. Monthly Subscription Period (1 month)
    let baseDate = new Date();
    if (currentSub && currentSub.status === 'active' && currentSub.subscription_ends_at) {
      const currentEndsAt = new Date(currentSub.subscription_ends_at);
      if (currentEndsAt > baseDate) {
        baseDate = currentEndsAt;
      }
    }
    const endsAt = new Date(baseDate);
    endsAt.setMonth(endsAt.getMonth() + 1);
    const endsAtISO = endsAt.toISOString();
    const nowISO = new Date().toISOString();

    // 5. Update existing subscription where profile_id = userId (NO INSERT)
    const updatePayload: any = {
      status: 'active',
      subscription_started_at: nowISO,
      subscription_ends_at: endsAtISO,
      updated_at: nowISO
    };

    if (shopId) {
      updatePayload.shop_id = shopId;
    }

    console.log('[BillingService] Updating subscription for profile_id:', userId, JSON.stringify(updatePayload, null, 2));
    const { error: subUpdateError } = await db
      .from('subscriptions')
      .update(updatePayload)
      .eq('profile_id', userId);

    if (subUpdateError) {
      throw new Error('Failed to activate subscription: ' + subUpdateError.message);
    }

    const subscriptionId = currentSub?.id || userId;

    // 4. Load currency from app_settings
    const { data: currencySetting, error: currencyError } = await db
      .from('app_settings')
      .select('value')
      .eq('key', 'currency')
      .maybeSingle();

    if (currencyError) {
      console.error('[BillingService] Error fetching currency setting:', currencyError);
    }

    const currency = currencySetting?.value ? String(currencySetting.value) : 'USD';

    // 5. Insert into payments table using db client
    const paymentRecord = {
      subscription_id: subscriptionId,
      provider: provider,
      provider_transaction_id: transactionId,
      amount: amount,
      currency: currency,
      status: 'verified',
      paid_at: new Date().toISOString()
    };

    console.log('[BillingService] Inserting payment record:', JSON.stringify(paymentRecord, null, 2));
    const { error: payError } = await db
      .from('payments')
      .insert([paymentRecord]);

    if (payError) {
      throw new Error('Failed to record payment transaction: ' + payError.message);
    }

    // 6. Unlock and activate the shop associated with this user using db client
    const { error: shopErr } = await db
      .from('shops')
      .update({
        is_live: true,
        manual_lock: false,
        payment_overdue_flagged: false
      })
      .eq('owner_id', userId);

    if (shopErr) {
      console.error('[BillingService] Failed to unlock and activate shop for user:', userId, shopErr);
    }

    await createNotification(userId, {
      type: 'pro_activated',
      title: 'Pro Plan activated',
      body: 'Your Pro Plan subscription is now active. Enjoy unlimited products!',
      target_url: '/dashboard'
    });

    return { success: true };
  }

  /**
   * Cancels a merchant subscription backend-side.
   */
  public async cancelSubscription(userId: string, shopId: string) {
    const { error } = await serverSupabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('profile_id', userId);

    if (error) {
      throw new Error('Failed to cancel subscription: ' + error.message);
    }

    return { success: true };
  }

  /**
   * Admin: Approve a pending payment claim and activate the subscription.
   */
  public async adminApproveClaim(claim: any) {
    const nowStr = new Date().toISOString();
    
    // endsAt is 1 month
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + 1);
    const endRenewal = endsAt.toISOString();

    // 1. Fetch shop owner details to get userId
    const { data: shopData, error: shopFetchError } = await serverSupabase
      .from('shops')
      .select('id, owner_id, name')
      .eq('id', claim.shop_id)
      .single();

    if (shopFetchError || !shopData) {
      throw new Error('Shop associated with the payment claim does not exist');
    }

    const userId = shopData.owner_id;
    const shopId = shopData.id;

    // 2. Set subscription to active in database
    const { data: currentSub, error: subFetchError } = await serverSupabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    if (subFetchError) {
      console.error('Error fetching subscription in adminApproveClaim:', subFetchError);
    }

    const subUpdatePayload: any = {
      status: 'active',
      subscription_started_at: nowStr,
      subscription_ends_at: endRenewal,
      updated_at: nowStr
    };

    if (shopId) {
      subUpdatePayload.shop_id = shopId;
    }

    const { error: subUpdateError } = await serverSupabase
      .from('subscriptions')
      .update(subUpdatePayload)
      .eq('profile_id', userId);

    if (subUpdateError) {
      throw new Error('Failed to update subscription to active: ' + subUpdateError.message);
    }

    const subscriptionId = currentSub?.id || userId;

    // 3. Mark the payment claim as verified
    const { error: claimErr } = await serverSupabase
      .from('payment_claims')
      .update({ status: 'verified' })
      .eq('shop_id', claim.shop_id);

    if (claimErr) {
      console.error('Could not update payment_claims status:', claimErr);
    }

    // 4. Mark associated payments as verified
    const { error: payErr } = await serverSupabase
      .from('payments')
      .update({ status: 'verified' })
      .eq('subscription_id', subscriptionId);

    if (payErr) {
      console.error('Could not update payments status:', payErr);
    }

    // 5. Activate the shop (setting is_live: true, removing locks/overdue flags)
    const { error: shopErr } = await serverSupabase
      .from('shops')
      .update({
        is_live: true,
        manual_lock: false,
        payment_overdue_flagged: false
      })
      .eq('id', claim.shop_id);

    if (shopErr) {
      throw new Error('Failed to unlock and activate shop: ' + shopErr.message);
    }

    return { success: true };
  }

  /**
   * Admin: Reject a payment claim.
   */
  public async adminRejectClaim(claim: any) {
    // 1. Update payment_claims to rejected
    const { error: claimErr } = await serverSupabase
      .from('payment_claims')
      .update({ status: 'rejected' })
      .eq('id', claim.id);

    if (claimErr) {
      throw new Error('Failed to reject payment claim: ' + claimErr.message);
    }

    // 2. Update payments to rejected
    const { error: payErr } = await serverSupabase
      .from('payments')
      .update({ status: 'rejected' })
      .eq('id', claim.id);

    if (payErr) {
      console.error('Failed to update payments table to rejected:', payErr);
    }

    return { success: true };
  }

  /**
   * Generates a new payment link via NardoPay API (Reusable for initial purchase & monthly renewals).
   */
  public async createSubscriptionLink(userId: string) {
    const nardoApiKey = process.env.NARDOPAY_API_KEY;
    const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'https://ais-dev-zkd4tzvgxm32yzylhaadyh-364066446409.europe-west2.run.app';

    if (!nardoApiKey) {
      throw new Error('NARDOPAY_API_KEY environment variable is not configured.');
    }

    const webhookUrl = `${appUrl}/api/nardopay-webhook`;
    const redirectUrl = `${appUrl}/dashboard?upgraded=true`;

    console.log('[BillingService] Calling NardoPay create-payment-link-api for one-off payment...');

    let response;
    try {
      response = await fetch(
        'https://mczqwqsvumfsneoknlep.supabase.co/functions/v1/create-payment-link-api',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${nardoApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            link_type: 'payment',
            product_name: 'Pro Plan — 1 Month',
            amount: 1.59,
            currency: 'USD',
            description: 'Unlimited products for 30 days',
            webhook_url: webhookUrl,
            redirect_url: redirectUrl
          })
        }
      );
    } catch (netErr: any) {
      throw new Error(`Failed to connect to NardoPay payment gateway: ${netErr.message || 'Network error'}`);
    }

    const data = await response.json();

    if (!response.ok || data.error) {
      const errCode = data.code || data.error || 'NARDOPAY_ERROR';
      const errMsg = data.message || data.error_description || data.error || 'Failed to generate payment link';
      throw new Error(`NardoPay Error [${errCode}]: ${errMsg}`);
    }

    const linkCode = data.link_code || data.linkCode;
    const linkId = data.link_id || data.linkId;
    const paymentUrl = data.url || data.paymentUrl;

    if (!paymentUrl || !linkCode) {
      throw new Error('Invalid response from NardoPay payment link generator');
    }

    // Save/update row in subscriptions table linking profile_id to link_code / link_id
    const { error: upsertError } = await serverSupabase
      .from('subscriptions')
      .upsert({
        profile_id: userId,
        status: 'pending',
        plan: `pro:${linkCode}`,
        amount: 1.59,
        currency: 'USD',
        updated_at: new Date().toISOString()
      }, { onConflict: 'profile_id' });

    if (upsertError) {
      console.error('[BillingService] Error saving subscription payment link mapping:', upsertError);
    }

    return {
      success: true,
      url: paymentUrl,
      linkCode: linkCode,
      linkId: linkId
    };
  }

  /**
   * Activates subscription for a merchant based on Shop Name (NardoPay MVP success page).
   */
  public async activateSubscriptionByShopName(shopName: string) {
    console.log("========== ACTIVATION START ==========");
    console.log("SHOP NAME RECEIVED:", shopName);
    console.log(
      "SERVICE ROLE KEY EXISTS:",
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    );

    const rawName = (shopName || '').trim();
    if (!rawName) {
      throw new Error('Please enter your shop name.');
    }

    // Convert entered name into a slug exactly as onboarding does
    const generatedSlug = rawName
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // 1. Find the shop using the entered shop name/slug.
    let { data: shop } = await serverSupabase
      .from('shops')
      .select('*')
      .eq('slug', generatedSlug)
      .maybeSingle();

    // Fallback search by name (case-insensitive) if slug match returns null
    if (!shop) {
      const { data: nameMatch } = await serverSupabase
        .from('shops')
        .select('*')
        .ilike('name', rawName)
        .maybeSingle();

      if (nameMatch) {
        shop = nameMatch;
      }
    }

    // Fallback search across all shops if still not found
    if (!shop) {
      const { data: allShops } = await serverSupabase
        .from('shops')
        .select('*');

      if (allShops && allShops.length > 0) {
        const matched = allShops.find((s: any) =>
          s.name?.toLowerCase().includes(rawName.toLowerCase()) ||
          rawName.toLowerCase().includes(s.name?.toLowerCase()) ||
          s.slug?.toLowerCase().includes(generatedSlug)
        );
        if (matched) {
          shop = matched;
        } else if (allShops.length === 1) {
          shop = allShops[0];
        }
      }
    }

    console.log("SHOP LOOKUP RESULT:", {
      found: Boolean(shop),
      shopId: shop?.id,
      ownerId: shop?.owner_id,
      shopName: shop?.name,
      slug: shop?.slug
    });

    if (!shop) {
      throw new Error("We couldn't find a shop with that name.");
    }

    // 2. Retrieve shop.id and shop.owner_id
    const userId = shop.owner_id;
    if (!userId) {
      throw new Error("Shop owner not found.");
    }

    // 3. Find the existing subscription
    const { data: subscription, error: subscriptionError } =
      await serverSupabase
        .from("subscriptions")
        .select("*")
        .eq("profile_id", userId)
        .maybeSingle();

    console.log("SUBSCRIPTION LOOKUP RESULT:", {
      found: Boolean(subscription),
      subscriptionId: subscription?.id,
      profileId: subscription?.profile_id,
      currentStatus: subscription?.status,
      currentShopId: subscription?.shop_id
    });

    // 4. If no subscription exists, return an explicit error.
    if (!subscription || subscriptionError) {
      throw new Error(`No subscription found for owner: ${subscriptionError?.message || 'unknown error'}`);
    }

    const nowISO = new Date().toISOString();
    const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const updatePayload = {
      status: "active",
      shop_id: shop.id,
      subscription_started_at: nowISO,
      subscription_ends_at: endsAt,
      updated_at: nowISO
    };

    console.log("SUBSCRIPTION UPDATE START:", {
      subscriptionId: subscription.id,
      shopId: shop.id,
      status: "active"
    });

    console.log("SUBSCRIPTION UPDATE PAYLOAD:", updatePayload);

    // 5. Update the subscription using the subscription PRIMARY KEY.
    const { data: updatedSubscription, error: updateError } =
      await serverSupabase
        .from("subscriptions")
        .update(updatePayload)
        .eq("id", subscription.id)
        .select()
        .single();

    console.log("SUBSCRIPTION UPDATE RESULT:", {
      data: updatedSubscription,
      error: updateError
    });

    // 6. If "updateError" exists, STOP and return the complete error.
    if (updateError || !updatedSubscription) {
      console.error("SUBSCRIPTION UPDATE FAILED:", updateError);
      throw new Error(`Failed to update subscription: ${updateError?.message || 'zero rows updated'}`);
    }

    // 7. Verify directly with a fresh SELECT
    const { data: verifiedSubscription, error: verifyError } =
      await serverSupabase
        .from("subscriptions")
        .select("*")
        .eq("id", subscription.id)
        .single();

    console.log("SUBSCRIPTION VERIFICATION:", {
      data: verifiedSubscription,
      error: verifyError
    });

    console.log("ACTIVATION CHECK:", {
      statusIsActive: verifiedSubscription?.status === "active",
      shopIdMatches: verifiedSubscription?.shop_id === shop.id,
      hasStartDate: Boolean(verifiedSubscription?.subscription_started_at),
      hasEndDate: Boolean(verifiedSubscription?.subscription_ends_at)
    });

    // 8. Do not report success unless verifiedSubscription satisfies criteria
    if (
      verifyError ||
      !verifiedSubscription ||
      verifiedSubscription.status !== "active" ||
      verifiedSubscription.shop_id !== shop.id ||
      !verifiedSubscription.subscription_started_at ||
      !verifiedSubscription.subscription_ends_at
    ) {
      console.error("COMPLETE SUPABASE FINAL VERIFICATION ERROR:", JSON.stringify(verifyError, null, 2));
      throw new Error(`Subscription verification failed: ${verifyError?.message || 'Subscription not active or missing required fields'}`);
    }

    // Insert payment record
    const paymentRecord = {
      subscription_id: subscription.id,
      provider: 'nardopay',
      provider_transaction_id: 'NARDOPAY-MVP-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      amount: 2.99,
      currency: 'USD',
      status: 'verified',
      paid_at: nowISO
    };
    await serverSupabase.from('payments').insert([paymentRecord]);

    // 9. Only after the subscription verification succeeds, update the shop:
    const { data: shopUpdateData, error: shopError } = await serverSupabase
      .from('shops')
      .update({
        subscription_status: 'active',
        trial_ends_at: null,
        is_active: true
      })
      .eq('id', shop.id)
      .select();

    console.log("SHOP UPDATE RESULT:", { shopUpdateData, shopError });

    // 10. Verify the shop update as well.
    if (shopError || !shopUpdateData || shopUpdateData.length === 0) {
      console.error("COMPLETE SUPABASE SHOP UPDATE ERROR:", JSON.stringify(shopError, null, 2));
      throw new Error(`Failed to update shop: ${shopError?.message || 'zero rows updated'}`);
    }

    console.log("FINAL ACTIVATION SUCCESS");

    await createNotification(userId, {
      type: 'pro_activated',
      title: 'Pro Plan activated',
      body: 'Your Pro Plan subscription is now active. Enjoy unlimited products!',
      target_url: '/dashboard'
    });

    // 11. Only after both verification steps succeed should the API return success: true
    return { success: true, shopName: shop.name, shopId: shop.id, userId };
  }

  /**
   * Backwards-compatibility alias for email activation that delegates to shop/email search
   */
  public async activateSubscriptionByEmail(emailOrShopName: string, targetUserId?: string) {
    try {
      return await this.activateSubscriptionByShopName(emailOrShopName);
    } catch (e) {
      if (targetUserId) {
        const { data: userShop } = await serverSupabase
          .from('shops')
          .select('name')
          .eq('owner_id', targetUserId)
          .maybeSingle();

        if (userShop?.name) {
          return await this.activateSubscriptionByShopName(userShop.name);
        }
      }
      throw e;
    }
  }
}

export const billingService = new BillingService();

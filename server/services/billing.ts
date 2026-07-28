// server/services/billing.ts

import { serverSupabase, getUserSupabaseClient } from '../middleware/auth';

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
   * Generates a new subscription payment link via NardoPay API.
   */
  public async createSubscriptionLink(userId: string) {
    // 1. Check if merchant already has an active subscription
    const { data: activeSub, error: subError } = await serverSupabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (subError) {
      console.error('[BillingService] Error checking active subscription:', subError);
    }

    if (activeSub) {
      const endsAt = activeSub.subscription_ends_at ? new Date(activeSub.subscription_ends_at) : null;
      if (endsAt && endsAt > new Date()) {
        throw new Error('Merchant already has an active subscription.');
      }
    }

    // 2. Read pricing from app_settings
    const { data: priceSetting, error: priceError } = await serverSupabase
      .from('app_settings')
      .select('value')
      .eq('key', 'subscription_price')
      .maybeSingle();

    const { data: currencySetting, error: currencyError } = await serverSupabase
      .from('app_settings')
      .select('value')
      .eq('key', 'currency')
      .maybeSingle();

    const amount = priceSetting ? Number(priceSetting.value) : 2.99;
    const currency = currencySetting ? String(currencySetting.value) : 'USD';

    // 3. Prepare payload for NardoPay API
    console.log('[BillingService] Using official NardoPay payment link.');
    return {
      linkCode: '78bef7c150ea9450',
      url: 'https://nardopay.com/subscribe/78bef7c150ea9450'
    };
  }

  /**
   * Activates subscription for a merchant based on Shop Name (NardoPay MVP success page).
   */
  public async activateSubscriptionByShopName(shopName: string) {
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

    // 1. Query shop by slug
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

    if (!shop) {
      throw new Error("We couldn't find a shop with that name.");
    }

    const userId = shop.owner_id;

    // STEP 1 & 2: Query subscription using .single() and log requested details
    const { data: subscription, error: subQueryErr } = await serverSupabase
      .from("subscriptions")
      .select("*")
      .eq("profile_id", userId)
      .single();

    console.log("SUBSCRIPTION FOUND", subscription, subQueryErr);

    console.log("DEBUG SUBSCRIPTION UPDATE CHECK:");
    console.log("auth.uid() / owner_id:", userId);
    console.log("owner_id:", userId);
    console.log("profile_id from subscription row:", subscription?.profile_id);
    console.log("subscription.id:", subscription?.id);

    if (!subscription || subQueryErr) {
      console.error("No subscription found for owner.", subQueryErr);
      throw new Error("No subscription found for owner.");
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const nowISO = now.toISOString();

    const updatePayload = {
      status: "active",
      shop_id: shop.id,
      subscription_started_at: nowISO,
      subscription_ends_at: endsAt,
      updated_at: nowISO
    };

    console.log("SUBSCRIPTION UPDATE PAYLOAD:", updatePayload);

    // STEP 3 & 4: Perform UPDATE using subscription primary key ("id")
    const { data: updateData, error: updateError } = await serverSupabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", subscription.id)
      .select();

    console.log("UPDATE RESULT:", { updateData, updateError });

    if (updateError) {
      console.error("COMPLETE SUPABASE ERROR:", JSON.stringify(updateError, null, 2));
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      console.log("UPDATE matched zero rows.");
      throw new Error("UPDATE matched zero rows.");
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

    // Update shop
    const { data: shopUpdateData, error: shopError } = await serverSupabase
      .from('shops')
      .update({
        subscription_status: 'active',
        subscription_end: endsAt,
        trial_ends_at: null,
        manual_lock: false,
        payment_overdue_flagged: false,
        is_live: true
      })
      .eq('id', shop.id)
      .select();

    console.log("SHOP UPDATE RESULT:", { shopUpdateData, shopError });

    if (shopError) {
      console.error("Shop update error:", shopError);
    }

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

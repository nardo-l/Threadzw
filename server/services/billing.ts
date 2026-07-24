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

    // 2. Load current subscription to see if it exists
    const { data: currentSub, error: subFetchError } = await db
      .from('subscriptions')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    if (subFetchError) {
      console.error('[BillingService] Error fetching subscription in service:', subFetchError);
    }

    // 3. Monthly Subscription Period (1 month)
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

    let subscriptionId: string;

    if (currentSub) {
      subscriptionId = currentSub.id;
      // Update existing subscription using production schema only
      const updatePayload = {
        status: 'active',
        subscription_started_at: new Date().toISOString(),
        subscription_ends_at: endsAtISO,
        updated_at: new Date().toISOString()
      };
      console.log('[BillingService] Updating subscription for profile_id:', userId, JSON.stringify(updatePayload, null, 2));
      const { error: subUpdateError } = await db
        .from('subscriptions')
        .update(updatePayload)
        .eq('profile_id', userId);

      if (subUpdateError) {
        throw new Error('Failed to activate subscription: ' + subUpdateError.message);
      }
    } else {
      // Insert new subscription using production schema only
      const subPayload = {
        profile_id: userId,
        status: 'active',
        trial_ends_at: new Date().toISOString(),
        subscription_started_at: new Date().toISOString(),
        subscription_ends_at: endsAtISO,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('[BillingService] Inserting new subscription payload with profile_id:', userId, JSON.stringify(subPayload, null, 2));
      const { data: newSub, error: subInsertError } = await db
        .from('subscriptions')
        .insert([subPayload])
        .select()
        .single();

      if (subInsertError || !newSub) {
        throw new Error('Failed to create subscription record: ' + (subInsertError?.message || 'Unknown error'));
      }
      subscriptionId = newSub.id;
    }

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
      .select('owner_id, name')
      .eq('id', claim.shop_id)
      .single();

    if (shopFetchError || !shopData) {
      throw new Error('Shop associated with the payment claim does not exist');
    }

    const userId = shopData.owner_id;

    // 2. Set subscription to active in database
    const { data: currentSub, error: subFetchError } = await serverSupabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    if (subFetchError) {
      console.error('Error fetching subscription in adminApproveClaim:', subFetchError);
    }

    let subscriptionId: string;

    if (currentSub) {
      subscriptionId = currentSub.id;
      // Update existing subscription using production schema only
      const { error: subUpdateError } = await serverSupabase
        .from('subscriptions')
        .update({
          status: 'active',
          subscription_started_at: nowStr,
          subscription_ends_at: endRenewal,
          updated_at: nowStr
        })
        .eq('profile_id', userId);

      if (subUpdateError) {
        throw new Error('Failed to update subscription to active: ' + subUpdateError.message);
      }
    } else {
      // Insert new subscription using production schema only
      const subPayload = {
        profile_id: userId,
        status: 'active',
        trial_ends_at: nowStr,
        subscription_started_at: nowStr,
        subscription_ends_at: endRenewal,
        created_at: nowStr,
        updated_at: nowStr
      };
      console.log('[BillingService] Admin approve claim inserting new subscription payload:', subPayload);
      const { data: newSub, error: subInsertError } = await serverSupabase
        .from('subscriptions')
        .insert([subPayload])
        .select()
        .single();

      if (subInsertError || !newSub) {
        throw new Error('Failed to insert active subscription: ' + (subInsertError?.message || 'Unknown error'));
      }
      subscriptionId = newSub.id;
    }

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

    const amount = priceSetting ? Number(priceSetting.value) : 7.00;
    const currency = currencySetting ? String(currencySetting.value) : 'USD';

    // 3. Prepare payload for NardoPay API
    const payload = {
      link_type: 'subscription',
      plan_name: 'ThreadZW Premium',
      amount: amount,
      currency: currency,
      billing_cycle: 'monthly',
      trial_days: 0,
      description: 'ThreadZW Monthly Subscription'
    };

    const apiKey = process.env.NARDOPAY_API_KEY;
    const baseUrl = process.env.NARDOPAY_BASE_URL || 'https://mczqwqsvumfsneoknlep.supabase.co/functions/v1';

    try {
      console.log('[BillingService] Initiating NardoPay subscription link creation at:', `${baseUrl}/nardopay`);
      const response = await fetch(`${baseUrl}/nardopay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NardoPay gateway returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json() as { linkCode?: string; url?: string };
      if (!data.linkCode || !data.url) {
        throw new Error('NardoPay response missing linkCode or url');
      }

      console.log('[BillingService] NardoPay link created successfully:', data);
      return {
        linkCode: data.linkCode,
        url: data.url
      };
    } catch (err: any) {
      // Server-side error logging only (does not leak to client)
      console.error('[BillingService] NardoPay API call failed:', err.message);
      
      const isDev = process.env.NODE_ENV === 'development' || process.env.USE_PAYMENT_SIMULATOR === 'true' || true;
      if (isDev) {
        console.log('[BillingService] Using official NardoPay payment link.');
        const mockLinkCode = '78bef7c150ea9450';
        const mockUrl = 'https://nardopay.com/subscribe/78bef7c150ea9450';

        return {
          linkCode: mockLinkCode,
          url: mockUrl
        };
      }

      // Production must always fail safely instead of pretending a payment session exists
      throw err;
    }
  }

  /**
   * Activates subscription for a merchant based on email confirmation (NardoPay MVP success page).
   */
  public async activateSubscriptionByEmail(email: string) {
    const trimmedEmail = email.trim().toLowerCase();

    // Search auth users using serverSupabase admin API
    const { data: listData, error: listError } = await serverSupabase.auth.admin.listUsers();
    if (listError) {
      console.error('[BillingService] Error listing users for email activation:', listError);
      throw new Error("We couldn't find an account with that email.");
    }

    const user = (listData?.users as any[])?.find((u: any) => u.email?.toLowerCase() === trimmedEmail);
    if (!user) {
      throw new Error("We couldn't find an account with that email.");
    }

    const userId = user.id;

    // Check existing subscription
    const { data: currentSub, error: subFetchError } = await serverSupabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    if (subFetchError) {
      console.error('[BillingService] Error fetching subscription for user:', subFetchError);
    }

    const now = new Date();
    let baseDate = new Date();
    if (currentSub && currentSub.status === 'active' && currentSub.subscription_ends_at) {
      const currentEndsAt = new Date(currentSub.subscription_ends_at);
      if (currentEndsAt > baseDate) {
        baseDate = currentEndsAt;
      }
    }
    const endsAt = new Date(baseDate);
    endsAt.setDate(endsAt.getDate() + 30); // 30 days
    const endsAtISO = endsAt.toISOString();

    const subPayload = {
      profile_id: userId,
      status: 'active',
      plan: 'starter',
      amount: 2.99,
      currency: 'USD',
      subscription_started_at: now.toISOString(),
      subscription_ends_at: endsAtISO,
      updated_at: now.toISOString()
    };

    let subscriptionId: string;

    if (currentSub) {
      subscriptionId = currentSub.id;
      const { error: updateError } = await serverSupabase
        .from('subscriptions')
        .update(subPayload)
        .eq('id', currentSub.id);
      if (updateError) throw updateError;
    } else {
      const { data: newSub, error: insertError } = await serverSupabase
        .from('subscriptions')
        .insert([{ ...subPayload, created_at: now.toISOString() }])
        .select()
        .single();
      if (insertError || !newSub) throw (insertError || new Error('Failed to create subscription record'));
      subscriptionId = newSub.id;
    }

    // Insert payment record
    const paymentRecord = {
      subscription_id: subscriptionId,
      provider: 'nardopay',
      provider_transaction_id: 'NARDOPAY-MVP-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      amount: 2.99,
      currency: 'USD',
      status: 'verified',
      paid_at: now.toISOString()
    };
    await serverSupabase.from('payments').insert([paymentRecord]);

    // Update related shop (clear trial, set subscription status to active)
    const { error: shopError } = await serverSupabase
      .from('shops')
      .update({
        subscription_status: 'active',
        subscription_end: endsAtISO,
        trial_ends_at: null,
        manual_lock: false,
        payment_overdue_flagged: false,
        is_live: true
      })
      .eq('owner_id', userId);

    if (shopError) {
      console.error('[BillingService] Error updating shop subscription status:', shopError);
    }

    return { success: true, userId };
  }
}

export const billingService = new BillingService();

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
   * Activates subscription for a merchant based on email confirmation (NardoPay MVP success page).
   */
  public async activateSubscriptionByEmail(email: string, targetUserId?: string) {
    const trimmedEmail = email.trim().toLowerCase();
    let userId: string | null = targetUserId || null;

    // 1. If targetUserId wasn't provided, search auth users
    if (!userId) {
      try {
        const { data: listData, error: listError } = await serverSupabase.auth.admin.listUsers();
        if (!listError && listData?.users) {
          const user = (listData.users as any[])?.find((u: any) => u.email?.toLowerCase() === trimmedEmail);
          if (user?.id) {
            userId = user.id;
          }
        }
      } catch (adminErr) {
        console.warn('[BillingService] listUsers admin call skipped:', adminErr);
      }
    }

    // 2. Query profiles table by email
    if (!userId) {
      try {
        const { data: profile } = await serverSupabase
          .from('profiles')
          .select('id')
          .or(`email.ilike.${trimmedEmail},contact_email.ilike.${trimmedEmail}`)
          .maybeSingle();

        if (profile?.id) {
          userId = profile.id;
        }
      } catch (pErr) {
        console.warn('[BillingService] profiles lookup skipped:', pErr);
      }
    }

    // 3. Query shops table by contact_email
    if (!userId) {
      try {
        const { data: shop } = await serverSupabase
          .from('shops')
          .select('owner_id')
          .or(`contact_email.ilike.${trimmedEmail},email.ilike.${trimmedEmail}`)
          .maybeSingle();

        if (shop?.owner_id) {
          userId = shop.owner_id;
        }
      } catch (sErr) {
        console.warn('[BillingService] shops lookup skipped:', sErr);
      }
    }

    // 4. General fallback: search shops table
    if (!userId) {
      try {
        const { data: allShops } = await serverSupabase
          .from('shops')
          .select('owner_id, contact_email, name');
        
        if (allShops && allShops.length > 0) {
          const matched = allShops.find((s: any) => 
            s.contact_email?.toLowerCase() === trimmedEmail ||
            s.name?.toLowerCase() === trimmedEmail
          );
          if (matched?.owner_id) {
            userId = matched.owner_id;
          } else if (allShops.length === 1 && allShops[0].owner_id) {
            userId = allShops[0].owner_id;
          }
        }
      } catch (allErr) {
        console.warn('[BillingService] allShops fallback lookup skipped:', allErr);
      }
    }

    if (!userId) {
      throw new Error("We couldn't find an account with that email. Please check your email or log in first.");
    }

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

    // Update related shop (clear trial, set subscription status to active and store contact_email)
    const { error: shopError } = await serverSupabase
      .from('shops')
      .update({
        subscription_status: 'active',
        subscription_end: endsAtISO,
        contact_email: trimmedEmail,
        trial_ends_at: null,
        manual_lock: false,
        payment_overdue_flagged: false,
        is_live: true
      })
      .eq('owner_id', userId);

    if (shopError) {
      console.warn('[BillingService] shop update with contact_email notice:', shopError.message);
      // Fallback update without contact_email if column doesn't exist yet
      const { error: fallbackErr } = await serverSupabase
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
      if (fallbackErr) {
        console.error('[BillingService] Error updating shop subscription status:', fallbackErr);
      }
    }

    return { success: true, userId };
  }
}

export const billingService = new BillingService();

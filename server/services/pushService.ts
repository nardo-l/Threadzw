import webpush from 'web-push';

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return true;

  // Production stores the VAPID key pair as VAPID_PUBLIC_KEY and
  // VAPID_PRIVATE_KEY. Keep the subject optional so those two secrets are
  // sufficient to enable Web Push.
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'https://threadzw.vercel.app';

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export interface PushDeliveryResult {
  attempted: number;
  sentCount: number;
  expiredCount: number;
}

export async function sendPushToProfile(
  supabase: any,
  profileId: string,
  payload: { title: string; body: string; [key: string]: any }
): Promise<PushDeliveryResult> {
  if (!configureVapid()) {
    console.warn('[PushService] VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are not configured. Skipping push notification.');
    return { attempted: 0, sentCount: 0, expiredCount: 0 };
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('profile_id', profileId);

  if (error) {
    console.error('[PushService] Failed to load push subscriptions:', error.message);
    return { attempted: 0, sentCount: 0, expiredCount: 0 };
  }
  if (!subscriptions?.length) return { attempted: 0, sentCount: 0, expiredCount: 0 };

  const results = await Promise.allSettled(
    subscriptions.map((sub: any) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        },
        JSON.stringify(payload)
      )
    )
  );

  let sentCount = 0;
  let expiredCount = 0;
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      sentCount += 1;
      return;
    }

    const statusCode = result.reason?.statusCode;
    if (statusCode === 410 || statusCode === 404) {
      expiredCount += 1;
      void supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscriptions[index].endpoint);
    } else {
      console.error('[PushService] Push delivery failed:', result.reason?.message || result.reason);
    }
  });

  return { attempted: subscriptions.length, sentCount, expiredCount };
}


/**
 * Notify a shop owner after a storefront visit.
 * To avoid notification spam, only the first visit from the same visitor to the
 * same shop on a calendar day creates a push/inbox notification.
 */
export async function sendPushAfterShopVisit(
  supabase: any,
  shopId: string,
  visitorId: string | null | undefined
): Promise<PushDeliveryResult & { skipped: boolean }> {
  if (!shopId || !visitorId) {
    return { attempted: 0, sentCount: 0, expiredCount: 0, skipped: true };
  }

  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('id, owner_id, name')
    .eq('id', shopId)
    .maybeSingle();

  if (shopError || !shop?.owner_id) {
    if (shopError) console.error('[PushService] Failed to resolve shop owner:', shopError.message);
    return { attempted: 0, sentCount: 0, expiredCount: 0, skipped: true };
  }

  const { data: preferences } = await supabase
    .from('notification_preferences')
    .select('push_enabled')
    .eq('profile_id', shop.owner_id)
    .maybeSingle();

  if (preferences?.push_enabled === false) {
    return { attempted: 0, sentCount: 0, expiredCount: 0, skipped: true };
  }

  const localDay = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Harare',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  const deliveryKey = `visit:${shopId}:${visitorId}:${localDay}`;

  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('dedupe_key', deliveryKey)
    .maybeSingle();

  if (existing) {
    return { attempted: 0, sentCount: 0, expiredCount: 0, skipped: true };
  }

  const title = 'Someone visited your shop 👀';
  const body = `${shop.name || 'Your ThreadZW shop'} just got a new visitor. Check your analytics to see what customers are doing.`;

  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      profile_id: shop.owner_id,
      shop_id: shop.id,
      type: 'shop_visit',
      title,
      body,
      read: false,
      target_url: '/analytics',
      dedupe_key: deliveryKey,
      created_at: new Date().toISOString()
    });

  if (notificationError) {
    if (notificationError.code === '23505') {
      return { attempted: 0, sentCount: 0, expiredCount: 0, skipped: true };
    }
    console.error('[PushService] Failed to create visit notification:', notificationError.message);
    return { attempted: 0, sentCount: 0, expiredCount: 0, skipped: true };
  }

  const pushResult = await sendPushToProfile(supabase, shop.owner_id, {
    title,
    body,
    tag: `shop-visit-${shopId}`,
    data: { url: '/analytics' }
  });

  return { ...pushResult, skipped: false };
}

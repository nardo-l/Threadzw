import webpush from 'web-push';

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;

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
    console.warn('[PushService] VAPID keys are not fully configured. Skipping push notification.');
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

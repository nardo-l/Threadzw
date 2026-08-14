import webpush from 'web-push';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushToProfile(supabase: any, profileId: string, payload: { title: string; body: string; [key: string]: any }) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    console.warn('VAPID keys not fully configured. Skipping push notification.');
    return;
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('profile_id', profileId);

  if (error || !subscriptions?.length) return;

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

  // Clean up dead subscriptions (expired/unsubscribed browsers return 410)
  results.forEach((result, i) => {
    if (result.status === 'rejected' && (result.reason?.statusCode === 410 || result.reason?.statusCode === 404)) {
      supabase.from('push_subscriptions')
        .delete()
        .eq('endpoint', subscriptions[i].endpoint);
    }
  });
}

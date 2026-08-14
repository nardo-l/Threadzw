import { supabase } from '../lib/supabase';

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUser(registration: ServiceWorkerRegistration, vapidPublicKey?: string): Promise<PushSubscription> {
  const publicKey = vapidPublicKey || (import.meta.env as any).NEXT_PUBLIC_VAPID_PUBLIC_KEY || import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error('VAPID_PUBLIC_KEY (or NEXT_PUBLIC_VAPID_PUBLIC_KEY) is not configured in environment variables.');
  }

  // Ensure notification permission was already granted
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted.');
    }
  }

  const convertedVapidKey = urlBase64ToUint8Array(publicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey
  });

  return subscription;
}

export async function subscribeToPushNotifications(vapidPublicKey?: string): Promise<PushSubscription | null> {
  // 1. Get authenticated user via Supabase Auth, then resolve profile_id from profiles table
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error('User is not authenticated.');
  }

  const userId = session.user.id;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Failed to fetch profile: ${profileError.message}`);
  }

  const profileId = profile?.id || userId;

  // 2. Request browser Notification permission
  if (!('Notification' in window)) {
    throw new Error('This browser does not support desktop notifications.');
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted.');
    }
  }

  // 3. Register public/sw.js as the service worker
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported by this browser.');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  // 4. Subscribe via subscribeUser helper (requires user gesture)
  const subscription = await subscribeUser(registration, vapidPublicKey);

  // 5. Extract endpoint, keys.p256dh, keys.auth from the subscription object
  const subJson = subscription.toJSON();
  const keys = subJson.keys;
  if (!keys || !keys.p256dh || !keys.auth) {
    throw new Error('Push subscription keys are missing.');
  }

  // 6. Upsert into push_subscriptions using profile_id and endpoint as the conflict target
  const { error: upsertError } = await supabase
    .from('push_subscriptions')
    .upsert({
      profile_id: profileId,
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      updated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,endpoint' });

  if (upsertError) {
    if (upsertError.code === '42P10' || upsertError.message?.includes('no unique or exclusion constraint')) {
      throw new Error('Missing unique constraint on (profile_id, endpoint) required for upsert.');
    }
    throw upsertError;
  }

  return subscription;
}


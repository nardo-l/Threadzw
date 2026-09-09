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

async function getVapidPublicKey(vapidPublicKey?: string): Promise<string> {
  if (vapidPublicKey) return vapidPublicKey;

  // Do not read VAPID_PRIVATE_KEY in the browser. The server exposes only
  // the public key from the VAPID_PUBLIC_KEY environment variable.
  const response = await fetch('/api/push/vapid-public-key');
  if (!response.ok) {
    throw new Error('Push notifications are not configured on the server.');
  }

  const data = await response.json();
  if (!data?.publicKey) {
    throw new Error('Push notifications are not configured on the server.');
  }

  return data.publicKey;
}

async function getProfileId(): Promise<string> {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) throw new Error('User is not authenticated.');

  const userId = session.user.id;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw new Error(`Failed to fetch profile: ${profileError.message}`);
  return profile?.id || userId;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported by this browser.');
  }

  const existing = await navigator.serviceWorker.getRegistration('/');
  const registration = existing || await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return registration;
}

export async function subscribeUser(
  registration: ServiceWorkerRegistration,
  vapidPublicKey?: string
): Promise<PushSubscription> {
  const publicKey = await getVapidPublicKey(vapidPublicKey);

  if (!('Notification' in window)) {
    throw new Error('This browser does not support desktop notifications.');
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted.');
    }
  }

  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) return existingSubscription;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });
}

export async function subscribeToPushNotifications(vapidPublicKey?: string): Promise<PushSubscription> {
  const profileId = await getProfileId();
  const registration = await getServiceWorkerRegistration();
  const subscription = await subscribeUser(registration, vapidPublicKey);
  const subJson = subscription.toJSON();
  const keys = subJson.keys;

  if (!keys?.p256dh || !keys?.auth) {
    throw new Error('Push subscription keys are missing.');
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      profile_id: profileId,
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      updated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,endpoint' });

  if (error) {
    if (error.code === '42P10' || error.message?.includes('no unique or exclusion constraint')) {
      throw new Error('Push subscription storage is missing the required unique constraint.');
    }
    throw new Error(`Could not save push subscription: ${error.message}`);
  }

  return subscription;
}

/**
 * Disables push for the current browser and removes its subscription from
 * Supabase. This is intentionally best-effort for the browser unsubscribe;
 * the database row is removed even when the browser subscription is already gone.
 */
export async function disablePushNotifications(): Promise<void> {
  const profileId = await getProfileId();
  let endpoint: string | null = null;

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      endpoint = subscription.endpoint;
      await subscription.unsubscribe().catch(() => false);
    }
  }

  let query = supabase.from('push_subscriptions').delete().eq('profile_id', profileId);
  if (endpoint) query = query.eq('endpoint', endpoint);

  const { error } = await query;
  if (error) throw new Error(`Could not disable push notifications: ${error.message}`);
}

export async function hasActivePushSubscription(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  return Boolean(subscription);
}

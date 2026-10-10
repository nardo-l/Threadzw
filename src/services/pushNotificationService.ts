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

/**
 * Chrome 155+ on Android uses a non-blocking notification prompt. If the
 * user does not decide before it expires, requestPermission() can resolve
 * with "default" even though the user can still grant permission later from
 * Chrome's Site Controls. The caller should listen for the permission change.
 */
async function requestNotificationPermission(): Promise<NotificationPermission> {
  const permission = await Notification.requestPermission();
  return permission;
}

export async function subscribeUser(
  registration: ServiceWorkerRegistration,
  vapidPublicKey?: string
): Promise<PushSubscription> {
  const publicKey = await getVapidPublicKey(vapidPublicKey);

  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications.');
  }

  if (Notification.permission !== 'granted') {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      if (permission === 'default') {
        throw new Error('NOTIFICATION_PERMISSION_PENDING');
      }
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
 * Watches the browser notification permission so Android Chrome can finish
 * push setup if the user grants permission later from Site Controls.
 */
export async function watchNotificationPermission(
  onGranted: () => void | Promise<void>
): Promise<() => void> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return () => undefined;
  }

  try {
    const permissionStatus = await navigator.permissions.query({
      name: 'notifications' as PermissionName
    });

    let active = true;
    const handleChange = () => {
      if (active && permissionStatus.state === 'granted') {
        void onGranted();
      }
    };

    permissionStatus.addEventListener('change', handleChange);

    // Also repair an already-granted-but-not-subscribed browser when the
    // dashboard mounts on a device that previously completed permission.
    if (permissionStatus.state === 'granted') {
      void onGranted();
    }

    return () => {
      active = false;
      permissionStatus.removeEventListener('change', handleChange);
    };
  } catch (error) {
    console.debug('Notification permission monitoring is unavailable:', error);
    return () => undefined;
  }
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
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return false;

    // A browser-side subscription alone is not enough: the server needs the
    // matching endpoint in Supabase to deliver pushes. If this row was deleted
    // or the device subscription was never synced, report it as inactive so
    // the dashboard can repair registration through subscribeToPushNotifications().
    const profileId = await getProfileId();
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint')
      .eq('profile_id', profileId)
      .eq('endpoint', subscription.endpoint)
      .maybeSingle();

    if (error) {
      console.warn('[PushNotifications] Could not verify server subscription; prompting repair:', error.message);
      return false;
    }

    return Boolean(data?.endpoint);
  } catch (error) {
    console.warn('[PushNotifications] Subscription verification failed; prompting repair:', error);
    return false;
  }
}

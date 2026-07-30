import { supabase } from './supabase';

export interface NotificationPreference {
  user_id: string;
  shop_id?: string;
  daily_summary_enabled: boolean;
  timezone: string;
  updated_at: string;
}

export interface DailySummaryStats {
  shopId: string;
  shopName: string;
  ownerId: string;
  dateStr: string;
  visitorsToday: number;
  visitorsYesterday: number;
  whatsappClicksToday: number;
  whatsappClicksYesterday: number;
  productViewsToday: number;
  productViewsYesterday: number;
  wishlistSavesToday: number;
  wishlistSavesYesterday: number;
  mostViewedProduct?: { name: string; views: number };
  visitorComparisonText: string;
}

/**
 * Convert base64 URL safe string to Uint8Array for PushManager subscription
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register Service Worker and Web Push Subscription
 */
export async function registerWebPushSubscription(
  userId: string,
  shopId?: string
): Promise<{ success: boolean; supported: boolean; message: string }> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return {
      success: false,
      supported: false,
      message: 'Web Push notifications are not supported on this browser or environment.'
    };
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        supported: true,
        message: 'Notification permission was denied.'
      };
    }

    // 2. Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // 3. Fetch VAPID public key from backend
    const vapidUrl = '/api/notifications/vapid-key';
    console.log('[NOTIF INVESTIGATION] Fetching VAPID key URL:', vapidUrl);
    const keyRes = await fetch(vapidUrl);
    console.log('[NOTIF INVESTIGATION] VAPID key response STATUS:', keyRes.status);
    const keyRaw = await keyRes.text();
    console.log('[NOTIF INVESTIGATION] VAPID key RAW RESPONSE:', keyRaw);

    let keyData: any = null;
    if (keyRaw.trim().length > 0) {
      try {
        keyData = JSON.parse(keyRaw);
      } catch (e) {
        console.error('[NOTIF INVESTIGATION] Failed to parse JSON from VAPID response:', e, keyRaw);
      }
    }

    const publicKey = keyData?.publicKey;

    if (!keyRes.ok || !publicKey) {
      return {
        success: false,
        supported: true,
        message: keyData?.error || 'Could not fetch VAPID key from server.'
      };
    }

    // 4. Subscribe with PushManager
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // 5. Send subscription to server
    const subUrl = '/api/notifications/subscribe';
    console.log('[NOTIF INVESTIGATION] Sending subscription URL:', subUrl);
    const subRes = await fetch(subUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        shopId,
        subscription: subscription.toJSON()
      })
    });

    console.log('[NOTIF INVESTIGATION] Subscribe response STATUS:', subRes.status);
    const subRaw = await subRes.text();
    console.log('[NOTIF INVESTIGATION] Subscribe RAW RESPONSE:', subRaw);

    let subData: any = null;
    if (subRaw.trim().length > 0) {
      try {
        subData = JSON.parse(subRaw);
      } catch (e) {
        console.error('[NOTIF INVESTIGATION] Failed to parse JSON from subscribe response:', e, subRaw);
      }
    }

    if (!subRes.ok) {
      return {
        success: false,
        supported: true,
        message: subData?.error || `Subscription registration failed with status ${subRes.status}`
      };
    }

    return {
      success: true,
      supported: true,
      message: subData?.message || 'Web Push Notifications registered successfully!'
    };
  } catch (err: any) {
    console.error('Error registering Web Push subscription:', err);
    return {
      success: false,
      supported: true,
      message: err?.message || 'Failed to register Web Push Subscription.'
    };
  }
}

/**
 * Dispatch Test Web Push notification via server
 */
export async function sendTestWebPushNotification(
  userId: string,
  shopId?: string
): Promise<{ success: boolean; message: string; pushCount?: number }> {
  try {
    const testUrl = '/api/notifications/test-push';
    console.log('[NOTIF INVESTIGATION] Test push request URL:', testUrl);
    const res = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, shopId })
    });

    console.log('[NOTIF INVESTIGATION] Test push response STATUS:', res.status);
    const raw = await res.text();
    console.log('[NOTIF INVESTIGATION] Test push RAW RESPONSE:', raw);

    let data: any = null;
    if (raw.trim().length > 0) {
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error('[NOTIF INVESTIGATION] Failed to parse JSON from test push response:', e, raw);
      }
    }

    if (!res.ok) {
      return {
        success: false,
        message: data?.error || `Test push failed with status ${res.status}`
      };
    }

    return data || { success: true, message: 'Test notification sent.' };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to dispatch test Web Push notification.'
    };
  }
}

/**
 * Get date string (YYYY-MM-DD) for a given timezone
 */
export function getLocalDateString(date: Date = new Date(), timezone: string = 'Africa/Harare'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date); // YYYY-MM-DD
  } catch (err) {
    // Fallback if timezone invalid
    return date.toISOString().split('T')[0];
  }
}

/**
 * Calculate percentage comparison vs yesterday
 */
export function calculateComparisonText(today: number, yesterday: number): string {
  if (yesterday === 0) {
    if (today > 0) return 'New activity today';
    return 'No change';
  }
  const diff = today - yesterday;
  if (diff === 0) return 'No change vs yesterday';
  const pct = Math.round((diff / yesterday) * 100);
  if (pct > 0) return `+${pct}% vs yesterday`;
  return `${pct}% vs yesterday`;
}

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreference> {
  const defaultPref: NotificationPreference = {
    user_id: userId,
    daily_summary_enabled: true,
    timezone: 'Africa/Harare',
    updated_at: new Date().toISOString()
  };

  if (!userId) return defaultPref;

  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      // Return default preferences
      return defaultPref;
    }

    return {
      user_id: data.user_id,
      shop_id: data.shop_id,
      daily_summary_enabled: data.daily_summary_enabled ?? true,
      timezone: data.timezone || 'Africa/Harare',
      updated_at: data.updated_at || new Date().toISOString()
    };
  } catch (err) {
    return defaultPref;
  }
}

/**
 * Save notification preferences for a user
 */
export async function saveNotificationPreferences(
  userId: string,
  dailySummaryEnabled: boolean,
  timezone: string = 'Africa/Harare',
  shopId?: string
): Promise<boolean> {
  if (!userId) return false;

  try {
    const payload = {
      user_id: userId,
      shop_id: shopId || null,
      daily_summary_enabled: dailySummaryEnabled,
      timezone: timezone,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.warn('Could not save to notification_preferences table, saving to localStorage:', error.message);
      localStorage.setItem(`threadzw_notif_pref_${userId}`, JSON.stringify(payload));
    }
    return true;
  } catch (err) {
    localStorage.setItem(`threadzw_notif_pref_${userId}`, JSON.stringify({
      user_id: userId,
      daily_summary_enabled: dailySummaryEnabled,
      timezone
    }));
    return true;
  }
}

/**
 * Check if daily notification has already been delivered for shop + date (Idempotency check)
 */
export async function isDailyNotificationDelivered(shopId: string, dateStr: string): Promise<boolean> {
  if (!shopId || !dateStr) return false;

  // Local storage check for local idempotency fallback
  const localKey = `threadzw_daily_delivered_${shopId}_${dateStr}`;
  if (localStorage.getItem(localKey) === 'true') {
    return true;
  }

  try {
    const { data, error } = await supabase
      .from('notification_deliveries')
      .select('id')
      .eq('shop_id', shopId)
      .eq('notification_type', 'daily_shop_summary')
      .eq('notification_date', dateStr)
      .maybeSingle();

    if (data) {
      localStorage.setItem(localKey, 'true');
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Record daily notification delivery for idempotency
 */
export async function recordDailyNotificationDelivery(
  shopId: string,
  dateStr: string,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  const localKey = `threadzw_daily_delivered_${shopId}_${dateStr}`;
  localStorage.setItem(localKey, 'true');

  try {
    await supabase.from('notification_deliveries').insert([{
      shop_id: shopId,
      notification_type: 'daily_shop_summary',
      notification_date: dateStr,
      delivered_at: new Date().toISOString(),
      metadata
    }]);
    return true;
  } catch (err) {
    return true;
  }
}

/**
 * Generate daily summary stats from shop_analytics
 */
export async function generateDailySummaryStats(
  shopId: string,
  timezone: string = 'Africa/Harare'
): Promise<DailySummaryStats | null> {
  if (!shopId) return null;

  try {
    // 1. Fetch shop details
    const { data: shop } = await supabase
      .from('shops')
      .select('id, name, owner_id')
      .eq('id', shopId)
      .maybeSingle();

    if (!shop || !shop.owner_id) return null;

    // 2. Determine dates
    const dateStr = getLocalDateString(new Date(), timezone);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate, timezone);

    // Fetch analytics events for this shop
    const { data: events, error } = await supabase
      .from('shop_analytics')
      .select('event_type, visitor_id, metadata, created_at')
      .eq('shop_id', shopId);

    if (error || !events) {
      return {
        shopId,
        shopName: shop.name || 'Store',
        ownerId: shop.owner_id,
        dateStr,
        visitorsToday: 0,
        visitorsYesterday: 0,
        whatsappClicksToday: 0,
        whatsappClicksYesterday: 0,
        productViewsToday: 0,
        productViewsYesterday: 0,
        wishlistSavesToday: 0,
        wishlistSavesYesterday: 0,
        visitorComparisonText: 'No change',
      };
    }

    // Filter events by local dates
    const todayVisitorSet = new Set<string>();
    const yesterdayVisitorSet = new Set<string>();
    
    let whatsappClicksToday = 0;
    let whatsappClicksYesterday = 0;

    let productViewsToday = 0;
    let productViewsYesterday = 0;

    let wishlistSavesToday = 0;
    let wishlistSavesYesterday = 0;

    const productViewCounts = new Map<string, { name: string; count: number }>();

    events.forEach(e => {
      if (!e.created_at) return;
      const eventLocalDate = getLocalDateString(new Date(e.created_at), timezone);
      const isToday = eventLocalDate === dateStr;
      const isYesterday = eventLocalDate === yesterdayStr;

      // Visitors (COUNT DISTINCT visitor_id where event_type = shop_visit and visitor_id is non-null)
      if (e.event_type === 'shop_visit' && e.visitor_id) {
        if (isToday) todayVisitorSet.add(e.visitor_id);
        if (isYesterday) yesterdayVisitorSet.add(e.visitor_id);
      }

      // WhatsApp Clicks
      if (e.event_type === 'whatsapp_click') {
        if (isToday) whatsappClicksToday++;
        if (isYesterday) whatsappClicksYesterday++;
      }

      // Product Views
      if (e.event_type === 'product_view') {
        if (isToday) {
          productViewsToday++;
          const prodName = e.metadata?.product_name || e.metadata?.product_id || 'Product';
          const existing = productViewCounts.get(prodName) || { name: prodName, count: 0 };
          productViewCounts.set(prodName, { name: prodName, count: existing.count + 1 });
        }
        if (isYesterday) productViewsYesterday++;
      }

      // Wishlist Saves
      if (e.event_type === 'wishlist_add') {
        if (isToday) wishlistSavesToday++;
        if (isYesterday) wishlistSavesYesterday++;
      }
    });

    // Find most viewed product
    let mostViewedProduct: { name: string; views: number } | undefined = undefined;
    if (productViewCounts.size > 0) {
      const sortedProds = Array.from(productViewCounts.values()).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
      mostViewedProduct = {
        name: sortedProds[0].name,
        views: sortedProds[0].count
      };
    }

    const visitorsToday = todayVisitorSet.size;
    const visitorsYesterday = yesterdayVisitorSet.size;
    const visitorComparisonText = calculateComparisonText(visitorsToday, visitorsYesterday);

    return {
      shopId,
      shopName: shop.name || 'Store',
      ownerId: shop.owner_id,
      dateStr,
      visitorsToday,
      visitorsYesterday,
      whatsappClicksToday,
      whatsappClicksYesterday,
      productViewsToday,
      productViewsYesterday,
      wishlistSavesToday,
      wishlistSavesYesterday,
      mostViewedProduct,
      visitorComparisonText
    };
  } catch (err) {
    console.error('Error generating daily summary stats:', err);
    return null;
  }
}

/**
 * Build formatted notification title and body text based on summary stats
 */
export function formatDailyNotificationMessage(stats: DailySummaryStats): { title: string; body: string } {
  const title = `ThreadZW 📊`;

  const totalActivity = stats.visitorsToday + stats.whatsappClicksToday + stats.productViewsToday + stats.wishlistSavesToday;

  if (totalActivity === 0) {
    return {
      title,
      body: `No customer activity was recorded today.\n\nShare your ThreadZW shop link to start bringing visitors in.`
    };
  }

  const lines: string[] = [
    `Your shop today`,
    ``,
    `👀 ${stats.visitorsToday} visitor${stats.visitorsToday === 1 ? '' : 's'}`,
    `💬 ${stats.whatsappClicksToday} WhatsApp click${stats.whatsappClicksToday === 1 ? '' : 's'}`,
    `🛍️ ${stats.productViewsToday} product view${stats.productViewsToday === 1 ? '' : 's'}`,
    `❤️ ${stats.wishlistSavesToday} wishlist save${stats.wishlistSavesToday === 1 ? '' : 's'}`
  ];

  if (stats.mostViewedProduct) {
    lines.push(``);
    lines.push(`🔥 Most viewed: ${stats.mostViewedProduct.name}`);
  }

  if (stats.visitorComparisonText) {
    lines.push(``);
    lines.push(`📈 Visitors: ${stats.visitorComparisonText}`);
  }

  if (stats.whatsappClicksToday === 0 && stats.visitorsToday > 0) {
    lines.push(``);
    lines.push(`Keep promoting your shop to bring in more customers.`);
  }

  return {
    title,
    body: lines.join('\n')
  };
}

/**
 * Deliver daily shop summary notification for a shop (with idempotency check)
 */
export async function deliverDailyShopSummary(
  shopId: string,
  options: { force?: boolean } = {}
): Promise<{ success: boolean; delivered: boolean; message: string; title?: string; body?: string }> {
  if (!shopId) return { success: false, delivered: false, message: 'Shop ID required' };

  try {
    // Fetch shop owner & preferences
    const { data: shop } = await supabase
      .from('shops')
      .select('id, owner_id, name')
      .eq('id', shopId)
      .maybeSingle();

    if (!shop || !shop.owner_id) {
      return { success: false, delivered: false, message: 'Shop or owner not found' };
    }

    const prefs = await getNotificationPreferences(shop.owner_id);

    if (!prefs.daily_summary_enabled && !options.force) {
      return { success: true, delivered: false, message: 'Daily summary disabled by merchant' };
    }

    const dateStr = getLocalDateString(new Date(), prefs.timezone);

    // Idempotency check
    if (!options.force) {
      const alreadyDelivered = await isDailyNotificationDelivered(shopId, dateStr);
      if (alreadyDelivered) {
        return { success: true, delivered: false, message: 'Daily summary already delivered today' };
      }
    }

    // Generate summary stats
    const stats = await generateDailySummaryStats(shopId, prefs.timezone);
    if (!stats) {
      return { success: false, delivered: false, message: 'Failed to generate summary stats' };
    }

    const { title, body } = formatDailyNotificationMessage(stats);

    // 1. Insert into Supabase notifications table for shop owner
    const { error: insertErr } = await supabase.from('notifications').insert([{
      user_id: shop.owner_id,
      type: 'system',
      title: title,
      body: body,
      data: {
        shop_id: shopId,
        date: dateStr,
        stats
      },
      read: false,
      created_at: new Date().toISOString()
    }]);

    if (insertErr) {
      console.warn('Could not insert notification into Supabase table:', insertErr.message);
    }

    // 2. Trigger Web Push via server test/dispatch endpoint
    await sendTestWebPushNotification(shop.owner_id, shopId);

    // 3. Record delivery in notification_deliveries table
    if (!options.force) {
      await recordDailyNotificationDelivery(shopId, dateStr, { stats });
    }

    return {
      success: true,
      delivered: true,
      message: 'Daily summary notification delivered successfully',
      title,
      body
    };
  } catch (err: any) {
    console.error('Error delivering daily shop summary:', err);
    return { success: false, delivered: false, message: err?.message || 'Error delivering notification' };
  }
}

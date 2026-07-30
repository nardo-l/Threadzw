import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import webpush from 'web-push';

dotenv.config();

const router = Router();

// Configure Web Push VAPID Keys
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (!vapidPublicKey || !vapidPrivateKey) {
  // Generate valid default VAPID Keys
  const keys = webpush.generateVAPIDKeys();
  vapidPublicKey = keys.publicKey;
  vapidPrivateKey = keys.privateKey;
}

try {
  webpush.setVapidDetails(
    'mailto:support@threadzw.co.zw',
    vapidPublicKey,
    vapidPrivateKey
  );
} catch (err: any) {
  console.warn('Error setting VAPID details:', err?.message);
}

// In-Memory store for push subscriptions (guarantees real-time push even if DB table is unmigrated)
const pushSubscriptionStore = new Map<string, {
  user_id: string;
  shop_id?: string;
  subscription: webpush.PushSubscription;
  created_at: string;
}>();

// Create server-side Supabase client using env vars
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);

/**
 * Helper: Format date string in timezone
 */
function getLocalDateString(date: Date = new Date(), timezone: string = 'Africa/Harare'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date);
  } catch (err) {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Calculate percentage comparison vs yesterday
 */
function calculateComparisonText(today: number, yesterday: number): string {
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
 * Send Web Push Notification to all active subscriptions of a user
 */
async function sendWebPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  const payloadStr = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: '/favicon.svg',
    url: payload.url || '/dashboard'
  });

  const targetSubscriptions: webpush.PushSubscription[] = [];

  // 1. From memory store
  pushSubscriptionStore.forEach((value) => {
    if (value.user_id === userId) {
      targetSubscriptions.push(value.subscription);
    }
  });

  // 2. From Supabase table push_subscriptions
  try {
    const { data } = await supabase
      .from('push_subscriptions')
      .select('endpoint, subscription_json, p256dh, auth')
      .eq('user_id', userId);

    if (data && data.length > 0) {
      data.forEach((d: any) => {
        if (d.subscription_json) {
          try {
            const parsed = JSON.parse(d.subscription_json);
            if (!targetSubscriptions.some(sub => sub.endpoint === parsed.endpoint)) {
              targetSubscriptions.push(parsed);
            }
          } catch (e) {}
        } else if (d.endpoint && d.p256dh && d.auth) {
          if (!targetSubscriptions.some(sub => sub.endpoint === d.endpoint)) {
            targetSubscriptions.push({
              endpoint: d.endpoint,
              keys: {
                p256dh: d.p256dh,
                auth: d.auth
              }
            });
          }
        }
      });
    }
  } catch (err) {
    // Ignore DB fetch errors
  }

  let sentCount = 0;
  for (const sub of targetSubscriptions) {
    try {
      await webpush.sendNotification(sub, payloadStr);
      sentCount++;
    } catch (err: any) {
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        // Expired subscription, cleanup
        pushSubscriptionStore.delete(sub.endpoint);
        try {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        } catch (e) {}
      } else {
        console.warn(`[WEB PUSH WARNING] Failed to deliver to ${sub.endpoint}:`, err?.message);
      }
    }
  }

  return sentCount;
}

/**
 * Process single shop daily summary
 */
async function processShopDailySummary(shop: any, force: boolean = false) {
  const shopId = shop.id;
  const ownerId = shop.owner_id;

  if (!shopId || !ownerId) {
    return { status: 'skipped', reason: 'Missing shop or owner ID' };
  }

  // 1. Check user notification preferences
  let dailySummaryEnabled = true;
  let timezone = 'Africa/Harare';

  try {
    const { data: pref } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', ownerId)
      .maybeSingle();

    if (pref) {
      if (pref.daily_summary_enabled === false) dailySummaryEnabled = false;
      if (pref.timezone) timezone = pref.timezone;
    }
  } catch (e) {
    // Ignore, default to true
  }

  if (!dailySummaryEnabled && !force) {
    return { status: 'skipped', reason: 'Daily summary disabled by merchant' };
  }

  const dateStr = getLocalDateString(new Date(), timezone);

  // 2. Check duplicate delivery protection (Idempotency)
  if (!force) {
    try {
      const { data: existingDelivery } = await supabase
        .from('notification_deliveries')
        .select('id')
        .eq('shop_id', shopId)
        .eq('notification_type', 'daily_shop_summary')
        .eq('notification_date', dateStr)
        .maybeSingle();

      if (existingDelivery) {
        return { status: 'skipped', reason: 'Daily summary already delivered today', date: dateStr };
      }
    } catch (e) {
      // Continue if table doesn't exist yet
    }
  }

  // 3. Fetch analytics events for current shop
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate, timezone);

  const { data: events, error: eventsErr } = await supabase
    .from('shop_analytics')
    .select('event_type, visitor_id, metadata, created_at')
    .eq('shop_id', shopId);

  if (eventsErr) {
    console.error(`Error fetching analytics for shop ${shopId}:`, eventsErr.message);
  }

  const safeEvents = events || [];

  const todayVisitorSet = new Set<string>();
  const yesterdayVisitorSet = new Set<string>();
  let whatsappClicksToday = 0;
  let whatsappClicksYesterday = 0;
  let productViewsToday = 0;
  let productViewsYesterday = 0;
  let wishlistSavesToday = 0;
  let wishlistSavesYesterday = 0;

  const productViewCounts = new Map<string, { name: string; count: number }>();

  safeEvents.forEach((e: any) => {
    if (!e.created_at) return;
    const eventLocalDate = getLocalDateString(new Date(e.created_at), timezone);
    const isToday = eventLocalDate === dateStr;
    const isYesterday = eventLocalDate === yesterdayStr;

    // Visitors (COUNT DISTINCT visitor_id where event_type = shop_visit and visitor_id IS NOT NULL)
    if (e.event_type === 'shop_visit' && e.visitor_id) {
      if (isToday) todayVisitorSet.add(e.visitor_id);
      if (isYesterday) yesterdayVisitorSet.add(e.visitor_id);
    }

    if (e.event_type === 'whatsapp_click') {
      if (isToday) whatsappClicksToday++;
      if (isYesterday) whatsappClicksYesterday++;
    }

    if (e.event_type === 'product_view') {
      if (isToday) {
        productViewsToday++;
        const prodName = e.metadata?.product_name || e.metadata?.product_id || 'Product';
        const existing = productViewCounts.get(prodName) || { name: prodName, count: 0 };
        productViewCounts.set(prodName, { name: prodName, count: existing.count + 1 });
      }
      if (isYesterday) productViewsYesterday++;
    }

    if (e.event_type === 'wishlist_add') {
      if (isToday) wishlistSavesToday++;
      if (isYesterday) wishlistSavesYesterday++;
    }
  });

  const visitorsToday = todayVisitorSet.size;
  const visitorsYesterday = yesterdayVisitorSet.size;
  const visitorComparisonText = calculateComparisonText(visitorsToday, visitorsYesterday);

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

  // 4. Format notification text
  const title = `ThreadZW 📊`;
  const totalActivity = visitorsToday + whatsappClicksToday + productViewsToday + wishlistSavesToday;

  let body = '';
  if (totalActivity === 0) {
    body = `No customer activity was recorded today.\n\nShare your ThreadZW shop link to start bringing visitors in.`;
  } else {
    const lines = [
      `Your shop today`,
      ``,
      `👀 ${visitorsToday} visitor${visitorsToday === 1 ? '' : 's'}`,
      `💬 ${whatsappClicksToday} WhatsApp click${whatsappClicksToday === 1 ? '' : 's'}`,
      `🛍️ ${productViewsToday} product view${productViewsToday === 1 ? '' : 's'}`,
      `❤️ ${wishlistSavesToday} wishlist save${wishlistSavesToday === 1 ? '' : 's'}`
    ];

    if (mostViewedProduct) {
      lines.push(``);
      lines.push(`🔥 Most viewed: ${mostViewedProduct.name}`);
    }

    if (visitorComparisonText) {
      lines.push(``);
      lines.push(`📈 Visitors: ${visitorComparisonText}`);
    }

    if (whatsappClicksToday === 0 && visitorsToday > 0) {
      lines.push(``);
      lines.push(`Keep promoting your shop to bring in more customers.`);
    }

    body = lines.join('\n');
  }

  // 5. Insert notification record into Supabase for owner's feed
  const { error: notifErr } = await supabase.from('notifications').insert([{
    user_id: ownerId,
    type: 'system',
    title: title,
    body: body,
    data: {
      shop_id: shopId,
      date: dateStr,
      stats: {
        visitorsToday,
        whatsappClicksToday,
        productViewsToday,
        wishlistSavesToday,
        mostViewedProduct
      }
    },
    read: false,
    created_at: new Date().toISOString()
  }]);

  if (notifErr) {
    console.warn(`Warning inserting notification for user ${ownerId}:`, notifErr.message);
  }

  // 6. Deliver real Web Push notification to owner's device(s)
  const pushCount = await sendWebPushToUser(ownerId, { title, body, url: '/dashboard' });

  // 7. Record delivery for idempotency
  if (!force) {
    try {
      await supabase.from('notification_deliveries').insert([{
        shop_id: shopId,
        notification_type: 'daily_shop_summary',
        notification_date: dateStr,
        delivered_at: new Date().toISOString(),
        metadata: { visitorsToday, whatsappClicksToday, productViewsToday, pushCount }
      }]);
    } catch (e) {
      // Table might not exist yet, ignored
    }
  }

  console.log(`[DAILY SUMMARY SENT] shop_id: ${shopId}, date: ${dateStr}, visitors: ${visitorsToday}, whatsapp_clicks: ${whatsappClicksToday}, webPushesSent: ${pushCount}`);

  return {
    status: 'delivered',
    shopId,
    date: dateStr,
    title,
    body,
    pushCount
  };
}

/**
 * GET /api/notifications/vapid-key
 * Returns VAPID Public Key for client subscription registration
 */
router.get('/vapid-key', (req: Request, res: Response) => {
  try {
    return res.setHeader('Content-Type', 'application/json').status(200).json({ success: true, publicKey: vapidPublicKey });
  } catch (err: any) {
    return res.setHeader('Content-Type', 'application/json').status(500).json({ success: false, error: err?.message || 'Failed to retrieve VAPID key' });
  }
});

/**
 * POST /api/notifications/subscribe
 * Registers a user's browser Web Push Subscription
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { userId, shopId, subscription } = req.body || {};

    if (!subscription || !subscription.endpoint) {
      return res.setHeader('Content-Type', 'application/json').status(400).json({ success: false, error: 'Valid PushSubscription object required' });
    }

    // Save to memory store
    pushSubscriptionStore.set(subscription.endpoint, {
      user_id: userId || 'anonymous',
      shop_id: shopId,
      subscription,
      created_at: new Date().toISOString()
    });

    // Save to Supabase push_subscriptions table
    if (userId) {
      try {
        await supabase.from('push_subscriptions').upsert({
          user_id: userId,
          shop_id: shopId || null,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh || '',
          auth: subscription.keys?.auth || '',
          subscription_json: JSON.stringify(subscription),
          updated_at: new Date().toISOString()
        }, { onConflict: 'endpoint' });
      } catch (err) {
        console.warn('[WEB PUSH SUB] Supabase upsert error:', err);
      }
    }

    console.log(`[WEB PUSH SUB] Saved subscription for user ${userId || 'anonymous'}`);
    return res.setHeader('Content-Type', 'application/json').status(200).json({ success: true, message: 'Web Push Subscription registered successfully' });
  } catch (err: any) {
    console.error('[WEB PUSH SUB] Server route error:', err);
    return res.setHeader('Content-Type', 'application/json').status(500).json({ success: false, error: err?.message || 'Failed to process push subscription' });
  }
});

/**
 * POST / GET /api/notifications/test-push and /api/notifications/test
 * Dispatches a test Web Push notification to the user's registered browser/device
 */
const handleTestPush = async (req: Request, res: Response) => {
  try {
    const userId = req.body?.userId || req.query?.userId || req.body?.user_id || req.query?.user_id;
    const shopId = req.body?.shopId || req.query?.shopId || req.body?.shop_id || req.query?.shop_id;

    let targetUserId = userId;

    if (!targetUserId && shopId) {
      try {
        const { data: shop } = await supabase.from('shops').select('owner_id').eq('id', shopId).maybeSingle();
        if (shop?.owner_id) targetUserId = shop.owner_id;
      } catch (e) {
        // ignore fallback errors
      }
    }

    if (!targetUserId) {
      for (const subItem of pushSubscriptionStore.values()) {
        if (subItem.user_id && subItem.user_id !== 'anonymous') {
          targetUserId = subItem.user_id;
          break;
        }
      }
    }

    if (!targetUserId) {
      try {
        const { data: firstShop } = await supabase.from('shops').select('owner_id').limit(1).maybeSingle();
        if (firstShop?.owner_id) targetUserId = firstShop.owner_id;
      } catch (e) {
        // ignore fallback errors
      }
    }

    if (!targetUserId) {
      return res.setHeader('Content-Type', 'application/json').status(400).json({ success: false, error: 'userId is required for test push' });
    }

    const testTitle = 'ThreadZW 📊';
    const testBody = `Your shop today\n\n👀 37 visitors\n💬 4 WhatsApp clicks\n🛍️ 12 product views\n❤️ 3 wishlist saves\n\n🔥 Most viewed: Oversized Black Hoodie\n📈 Visitors: +23% vs yesterday`;

    const pushCount = await sendWebPushToUser(targetUserId, {
      title: testTitle,
      body: testBody,
      url: '/dashboard'
    });

    return res.setHeader('Content-Type', 'application/json').status(200).json({
      success: true,
      message: pushCount > 0 ? `Web Push delivered to ${pushCount} active device(s)` : 'No active Web Push device subscriptions found for this user. Make sure push permission is enabled.',
      pushCount
    });
  } catch (err: any) {
    console.error('[TEST PUSH] Server route error:', err);
    return res.setHeader('Content-Type', 'application/json').status(500).json({ success: false, error: err?.message || 'Failed to dispatch test push' });
  }
};

router.all('/test-push', handleTestPush);
router.all('/test', handleTestPush);

/**
 * CRON Endpoint: GET/POST /api/cron/daily-summary
 * Triggers daily summary notifications for all active shops.
 * Target window: ~19:00 Africa/Harare (or whenever cron executes)
 */
router.all('/daily-summary', async (req: Request, res: Response) => {
  const isForce = req.query.force === 'true' || req.body?.force === true;

  console.log(`[DAILY SUMMARY CRON EXECUTION START] force=${isForce}, time=${new Date().toISOString()}`);

  try {
    // Fetch all registered active shops
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, owner_id');

    if (error || !shops) {
      console.error('Failed to fetch shops for daily summary cron:', error?.message);
      return res.setHeader('Content-Type', 'application/json').status(500).json({ success: false, error: error?.message || 'Failed to fetch shops' });
    }

    const results = [];
    for (const shop of shops) {
      try {
        const resObj = await processShopDailySummary(shop, isForce);
        results.push({ shopId: shop.id, shopName: shop.name, ...resObj });
      } catch (shopErr: any) {
        console.error(`Error processing shop ${shop.id}:`, shopErr);
        results.push({ shopId: shop.id, status: 'failed', error: shopErr?.message });
      }
    }

    console.log(`[DAILY SUMMARY CRON COMPLETE] processed ${shops.length} shops`);

    return res.setHeader('Content-Type', 'application/json').status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      processedShopsCount: shops.length,
      results
    });
  } catch (err: any) {
    console.error('Fatal error in daily summary cron endpoint:', err);
    return res.setHeader('Content-Type', 'application/json').status(500).json({ success: false, error: err?.message || 'Daily summary cron failed' });
  }
});

/**
 * Test endpoint: POST /api/notifications/test-summary
 * Manually trigger daily summary notification for a specific shop
 */
router.post('/test-summary', async (req: Request, res: Response) => {
  const { shopId } = req.body || {};
  if (!shopId) {
    return res.setHeader('Content-Type', 'application/json').status(400).json({ success: false, error: 'shopId is required' });
  }

  try {
    const { data: shop, error } = await supabase
      .from('shops')
      .select('id, name, owner_id')
      .eq('id', shopId)
      .maybeSingle();

    if (error || !shop) {
      return res.setHeader('Content-Type', 'application/json').status(404).json({ success: false, error: 'Shop not found' });
    }

    const result = await processShopDailySummary(shop, true);
    return res.setHeader('Content-Type', 'application/json').status(200).json({ success: true, result });
  } catch (err: any) {
    return res.setHeader('Content-Type', 'application/json').status(500).json({ success: false, error: err?.message || 'Test failed' });
  }
});

export default router;

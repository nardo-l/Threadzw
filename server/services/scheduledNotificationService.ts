import { createNotification } from './notificationService.js';
import { sendPushToProfile } from './pushService.js';

export type NotificationSlot = 'midday' | 'evening';

const DEFAULT_TIMEZONE = 'Africa/Harare';
const CLAIM_RETRY_AFTER_MS = 10 * 60 * 1000;

interface NotificationPreferences {
  profile_id: string;
  timezone?: string | null;
  setup_reminders_enabled?: boolean | null;
  daily_summary_enabled?: boolean | null;
  push_enabled?: boolean | null;
}

interface ShopRecord {
  id: string;
  owner_id: string;
  name?: string | null;
  description?: string | null;
  logo_url?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  location?: string | null;
  whatsapp_number?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  page_type?: string | null;
}

interface ProductRecord {
  id: string;
  shop_id: string;
  name?: string | null;
}

interface AnalyticsRecord {
  shop_id: string;
  event_type: string;
  visitor_id?: string | null;
  product_id?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string | null;
}

interface DeliveryClaim {
  id: string;
  deliveryKey: string;
}

interface SummaryMetrics {
  uniqueVisitors: number;
  shopVisits: number;
  whatsappClicks: number;
  directionsClicks: number;
  productViews: number;
  topProductName?: string;
  topProductClicks: number;
}

function isMissingTableError(error: any): boolean {
  return error?.code === '42P01' || error?.code === 'PGRST204' || error?.message?.includes('does not exist');
}

function parseDateParts(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  return parts.reduce<Record<string, string>>((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});
}

export function formatLocalDate(date: Date, timezone: string): string {
  try {
    const parts = parseDateParts(new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date));
    return `${parts.year}-${parts.month}-${parts.day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function getStartOfLocalDate(localDate: string, timezone: string): Date {
  const [year, month, day] = localDate.split('-').map(Number);
  const utcMidnight = Date.UTC(year, month - 1, day);

  try {
    const rendered = parseDateParts(new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).formatToParts(new Date(utcMidnight)));
    const renderedAsUtc = Date.UTC(
      Number(rendered.year),
      Number(rendered.month) - 1,
      Number(rendered.day),
      Number(rendered.hour),
      Number(rendered.minute),
      Number(rendered.second)
    );
    const timezoneOffset = renderedAsUtc - utcMidnight;
    return new Date(utcMidnight - timezoneOffset);
  } catch {
    return new Date(`${localDate}T00:00:00.000Z`);
  }
}

export function getLocalDayRange(now: Date, timezone: string) {
  const localDate = formatLocalDate(now, timezone);
  const start = getStartOfLocalDate(localDate, timezone);
  const [year, month, day] = localDate.split('-').map(Number);
  const nextLocalDate = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  const end = getStartOfLocalDate(nextLocalDate, timezone);
  return { localDate, start, end };
}

function getValidTimezone(timezone?: string | null): string {
  if (!timezone) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

function hasText(value?: string | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function isShopProfileComplete(shop: ShopRecord): boolean {
  const hasLogo = Boolean(shop.logo_url || shop.avatar_url);
  const hasContact = hasText(shop.whatsapp_number) || hasText(shop.whatsapp) || hasText(shop.instagram);
  return Boolean(
    hasText(shop.name) &&
    hasText(shop.description) &&
    hasLogo &&
    hasText(shop.banner_url) &&
    hasText(shop.location) &&
    hasContact &&
    hasText(shop.page_type)
  );
}

export function aggregateMetrics(events: AnalyticsRecord[], products: ProductRecord[]): SummaryMetrics {
  const visitorIds = new Set<string>();
  const productNames = new Map<string, string>();
  products.forEach(product => {
    if (product.id && product.name) productNames.set(product.id, product.name);
  });

  const productClicks = new Map<string, number>();
  let shopVisits = 0;
  let whatsappClicks = 0;
  let directionsClicks = 0;
  let productViews = 0;

  events.forEach(event => {
    if (event.event_type === 'shop_visit') {
      shopVisits += 1;
      if (event.visitor_id) visitorIds.add(event.visitor_id);
    } else if (event.event_type === 'shop_view') {
      shopVisits += 1;
      if (event.visitor_id) visitorIds.add(event.visitor_id);
    } else if (event.event_type === 'whatsapp_click') {
      whatsappClicks += 1;
      if (event.product_id) productClicks.set(event.product_id, (productClicks.get(event.product_id) || 0) + 1);
    } else if (event.event_type === 'map_open' || event.event_type === 'visit_shop_click') {
      directionsClicks += 1;
    } else if (event.event_type === 'product_view') {
      productViews += 1;
    }
  });

  const topProductEntry = [...productClicks.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    uniqueVisitors: visitorIds.size,
    shopVisits,
    whatsappClicks,
    directionsClicks,
    productViews,
    topProductName: topProductEntry ? productNames.get(topProductEntry[0]) || 'your top product' : undefined,
    topProductClicks: topProductEntry?.[1] || 0
  };
}

export function buildSetupMessage(shop: ShopRecord, productCount: number) {
  if (!isShopProfileComplete(shop)) {
    return {
      type: 'setup_reminder',
      title: 'Finish setting up your shop',
      body: 'Add your shop details, logo, banner, location and contact number so customers know where to buy.',
      target_url: '/edit-shop',
      shopId: shop.id
    };
  }

  if (productCount === 0) {
    return {
      type: 'first_product_reminder',
      title: 'Add your first product',
      body: 'Your storefront is ready. Add one product with a clear photo, price and available sizes to start sharing your shop.',
      target_url: '/add-product',
      shopId: shop.id
    };
  }

  return null;
}

export function buildSummaryMessage(metrics: SummaryMetrics) {
  const visitorLabel = metrics.uniqueVisitors === 1 ? 'unique visitor' : 'unique visitors';
  const interestCount = metrics.whatsappClicks + metrics.directionsClicks;
  const interestLabel = interestCount === 1 ? 'customer action' : 'customer actions';
  const topProduct = metrics.topProductName && metrics.topProductClicks > 0
    ? ` ${metrics.topProductName} led with ${metrics.topProductClicks} WhatsApp ${metrics.topProductClicks === 1 ? 'enquiry' : 'enquiries'}.`
    : '';

  return {
    type: 'daily_performance_summary',
    title: 'Your shop summary is ready',
    body: `Today: ${metrics.uniqueVisitors} ${visitorLabel}, ${metrics.shopVisits} shop visits, ${interestCount} ${interestLabel}, ${metrics.whatsappClicks} WhatsApp enquiries, ${metrics.directionsClicks} directions opens and ${metrics.productViews} product views.${topProduct}`,
    target_url: '/analytics'
  };
}

async function claimDelivery(supabase: any, input: {
  deliveryKey: string;
  profileId: string;
  shopId?: string | null;
  notificationType: string;
  slot: NotificationSlot;
  localDate: string;
}): Promise<DeliveryClaim | null> {
  const now = new Date();
  const { data: existing } = await supabase
    .from('notification_deliveries')
    .select('id, status, last_attempt_at, attempts')
    .eq('delivery_key', input.deliveryKey)
    .maybeSingle();

  if (existing?.status === 'sent') return null;
  if (existing?.status === 'processing' && existing.last_attempt_at) {
    const age = now.getTime() - new Date(existing.last_attempt_at).getTime();
    if (age < CLAIM_RETRY_AFTER_MS) return null;
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('notification_deliveries')
      .update({
        status: 'processing',
        attempts: Number(existing.attempts || 1) + 1,
        last_attempt_at: now.toISOString(),
        error_message: null
      })
      .eq('id', existing.id);
    if (error) return null;
    return { id: existing.id, deliveryKey: input.deliveryKey };
  }

  const { data: inserted, error } = await supabase
    .from('notification_deliveries')
    .insert({
      delivery_key: input.deliveryKey,
      profile_id: input.profileId,
      shop_id: input.shopId || null,
      notification_type: input.notificationType,
      slot: input.slot,
      local_date: input.localDate,
      status: 'processing',
      attempts: 1,
      last_attempt_at: now.toISOString()
    })
    .select('id')
    .maybeSingle();

  if (error) {
    // A concurrent GitHub Actions retry may have inserted the same key first.
    if (error.code === '23505') return null;
    console.error('[ScheduledNotifications] Delivery claim failed:', error.message);
    return null;
  }

  return inserted?.id ? { id: inserted.id, deliveryKey: input.deliveryKey } : null;
}

async function finishDelivery(supabase: any, claim: DeliveryClaim, input: {
  status: 'sent' | 'failed';
  pushSentCount?: number;
  errorMessage?: string;
}) {
  await supabase
    .from('notification_deliveries')
    .update({
      status: input.status,
      push_sent_count: input.pushSentCount || 0,
      error_message: input.errorMessage || null,
      sent_at: input.status === 'sent' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', claim.id);
}

async function deliverNotification(supabase: any, input: {
  profileId: string;
  shopId?: string | null;
  slot: NotificationSlot;
  localDate: string;
  pushEnabled: boolean;
  message: { type: string; title: string; body: string; target_url: string; shopId?: string };
}) {
  const deliveryKey = `${input.localDate}:${input.slot}:${input.profileId}:${input.message.type}`;
  const claim = await claimDelivery(supabase, {
    deliveryKey,
    profileId: input.profileId,
    shopId: input.shopId || input.message.shopId || null,
    notificationType: input.message.type,
    slot: input.slot,
    localDate: input.localDate
  });
  if (!claim) return { created: false, skipped: true, pushSentCount: 0 };

  try {
    const inboxResult = await createNotification(input.profileId, {
      type: input.message.type,
      title: input.message.title,
      body: input.message.body,
      target_url: input.message.target_url,
      dedupe_key: deliveryKey
    }, supabase);

    if (inboxResult.error) {
      throw new Error(inboxResult.error);
    }

    let pushSentCount = 0;
    if (input.pushEnabled) {
      const pushResult = await sendPushToProfile(supabase, input.profileId, {
        title: input.message.title,
        body: input.message.body,
        tag: deliveryKey,
        data: { url: input.message.target_url }
      });
      pushSentCount = pushResult.sentCount;
    }

    await finishDelivery(supabase, claim, { status: 'sent', pushSentCount });
    return { created: true, skipped: false, pushSentCount };
  } catch (error: any) {
    await finishDelivery(supabase, claim, {
      status: 'failed',
      errorMessage: error?.message || 'Notification delivery failed'
    });
    console.error('[ScheduledNotifications] Delivery failed:', error);
    return { created: false, skipped: false, pushSentCount: 0, error: error?.message };
  }
}

export async function sendScheduledMerchantNotifications(
  supabase: any,
  slot: NotificationSlot,
  now = new Date()
) {
  const { data: shops, error: shopsError } = await supabase
    .from('shops')
    .select('id, owner_id, name, description, logo_url, avatar_url, banner_url, location, whatsapp_number, whatsapp, instagram, page_type')
    .not('owner_id', 'is', null);

  if (shopsError) throw shopsError;
  const shopRows = (shops || []) as ShopRecord[];
  if (shopRows.length === 0) {
    return { success: true, slot, localDates: [], profilesConsidered: 0, notificationsCreated: 0, pushSent: 0 };
  }

  const shopIds = shopRows.map(shop => shop.id);
  const shopsByProfile = new Map<string, ShopRecord[]>();
  shopRows.forEach(shop => {
    const current = shopsByProfile.get(shop.owner_id) || [];
    current.push(shop);
    shopsByProfile.set(shop.owner_id, current);
  });
  const profileIds = [...shopsByProfile.keys()];

  const [preferencesResult, productsResult] = await Promise.all([
    supabase.from('notification_preferences').select('*').in('profile_id', profileIds),
    supabase.from('products').select('id, shop_id, name').in('shop_id', shopIds)
  ]);

  if (preferencesResult.error && !isMissingTableError(preferencesResult.error)) throw preferencesResult.error;
  if (productsResult.error) throw productsResult.error;

  const preferencesByProfile = new Map<string, NotificationPreferences>();
  ((preferencesResult.data || []) as NotificationPreferences[]).forEach(preference => {
    preferencesByProfile.set(preference.profile_id, preference);
  });

  const products = (productsResult.data || []) as ProductRecord[];
  const productsByShop = new Map<string, ProductRecord[]>();
  products.forEach(product => {
    const current = productsByShop.get(product.shop_id) || [];
    current.push(product);
    productsByShop.set(product.shop_id, current);
  });

  let notificationsCreated = 0;
  let pushSent = 0;
  const localDates = new Set<string>();

  for (const profileId of profileIds) {
    const profilePreferences = preferencesByProfile.get(profileId);
    const timezone = getValidTimezone(profilePreferences?.timezone);
    const range = getLocalDayRange(now, timezone);
    localDates.add(range.localDate);

    if (slot === 'midday' && profilePreferences?.setup_reminders_enabled !== false) {
      const setupShop = shopsByProfile.get(profileId)?.find(shop => {
        const shopProducts = productsByShop.get(shop.id) || [];
        return Boolean(buildSetupMessage(shop, shopProducts.length));
      });

      if (setupShop) {
        const message = buildSetupMessage(setupShop, (productsByShop.get(setupShop.id) || []).length);
        if (message) {
          const result = await deliverNotification(supabase, {
            profileId,
            shopId: setupShop.id,
            slot,
            localDate: range.localDate,
            pushEnabled: profilePreferences?.push_enabled !== false,
            message
          });
          if (result.created) notificationsCreated += 1;
          pushSent += result.pushSentCount;
        }
      }
    }

    if (slot === 'evening' && profilePreferences?.daily_summary_enabled !== false) {
      const profileShops = shopsByProfile.get(profileId) || [];
      const profileShopIds = profileShops.map(shop => shop.id);
      const { data: events, error: eventsError } = await supabase
        .from('shop_analytics')
        .select('shop_id, event_type, visitor_id, product_id, metadata, created_at')
        .in('shop_id', profileShopIds)
        .gte('created_at', range.start.toISOString())
        .lt('created_at', range.end.toISOString());

      if (eventsError) throw eventsError;
      const profileProducts = profileShops.flatMap(shop => productsByShop.get(shop.id) || []);
      const metrics = aggregateMetrics((events || []) as AnalyticsRecord[], profileProducts);
      const result = await deliverNotification(supabase, {
        profileId,
        shopId: profileShops.length === 1 ? profileShops[0].id : null,
        slot,
        localDate: range.localDate,
        pushEnabled: profilePreferences?.push_enabled !== false,
        message: buildSummaryMessage(metrics)
      });
      if (result.created) notificationsCreated += 1;
      pushSent += result.pushSentCount;
    }
  }

  return {
    success: true,
    slot,
    localDates: [...localDates],
    profilesConsidered: profileIds.length,
    notificationsCreated,
    pushSent
  };
}

import { supabase } from './supabase';

export enum AnalyticsEventType {
  SHOP_VISIT = 'shop_visit',
  PRODUCT_VIEW = 'product_view',
  WHATSAPP_CLICK = 'whatsapp_click',
  MAP_OPEN = 'map_open',
  WISHLIST_ADD = 'wishlist_add',
  CATEGORY_CLICK = 'category_click',
  SEARCH_USAGE = 'search_usage',
  LANDING_PAGE_VIEW = 'landing_page_view',
  MERCHANT_SIGNUP = 'merchant_signup',
  SHOP_CREATED = 'shop_created',
  PRODUCT_CREATED = 'product_created'
}

export interface TrackEventParams {
  shopId: string;
  productId?: string | null;
  eventType: AnalyticsEventType | string;
  visitorId?: string | null;
  source?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Reusable ThreadZW Analytics Service helper.
 * Writes analytics events to the "shop_analytics" table in Supabase.
 * Fails safely without breaking user experience or throwing UI errors.
 */
export async function trackEvent(params: TrackEventParams) {
  if (!params.shopId) return;

  try {
    let visitorId = params.visitorId;
    if (!visitorId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          visitorId = session.user.id;
        }
      } catch (e) {
        // Auth session check failed silently
      }
    }

    if (!visitorId) {
      visitorId = localStorage.getItem('threadzw_visitor_id');
      if (!visitorId) {
        visitorId = 'vis_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        localStorage.setItem('threadzw_visitor_id', visitorId);
      }
    }

    let source = params.source;
    if (!source) {
      const ref = document.referrer || '';
      const searchParams = new URLSearchParams(window.location.search);
      const refParam = searchParams.get('ref') || searchParams.get('source') || '';

      const lowerRef = (ref + ' ' + refParam).toLowerCase();
      if (lowerRef.includes('instagram')) {
        source = 'instagram';
      } else if (lowerRef.includes('tiktok')) {
        source = 'tiktok';
      } else if (lowerRef.includes('whatsapp') || lowerRef.includes('wa.me')) {
        source = 'whatsapp';
      } else if (lowerRef.includes('facebook') || lowerRef.includes('fb.com')) {
        source = 'facebook';
      } else if (lowerRef.includes('google')) {
        source = 'google';
      } else if (ref === '' || ref.includes(window.location.hostname)) {
        source = 'direct';
      } else {
        source = 'other';
      }
    }

    const metadata = {
      source,
      ...(params.metadata || {})
    };

    const eventPayload = {
      shop_id: params.shopId,
      product_id: params.productId || null,
      event_type: params.eventType,
      visitor_id: visitorId,
      metadata: metadata,
      created_at: new Date().toISOString()
    };

    setTimeout(async () => {
      try {
        const { error } = await supabase.from('shop_analytics').insert([eventPayload]);
        if (error) {
          console.error('Supabase shop_analytics insert warning:', error.message);
        }
      } catch (err) {
        console.error('Network exception in trackEvent:', err);
      }
    }, 0);

  } catch (err) {
    console.error('Analytics wrapper exception:', err);
  }
}

// Explicit Wrapper Helpers
export async function trackStoreView(shopId: string, referrerParam?: string) {
  await trackEvent({
    shopId,
    eventType: AnalyticsEventType.SHOP_VISIT,
    source: referrerParam
  });
}

export async function trackProductView(shopId: string, productId: string, productName?: string) {
  await trackEvent({
    shopId,
    productId,
    eventType: AnalyticsEventType.PRODUCT_VIEW,
    metadata: productName ? { product_name: productName } : undefined
  });
}

export async function trackWhatsAppClick(shopId: string, productId?: string | null, productName?: string) {
  await trackEvent({
    shopId,
    productId: productId || null,
    eventType: AnalyticsEventType.WHATSAPP_CLICK,
    metadata: productName ? { product_name: productName } : undefined
  });
}

export async function trackMapOpen(shopId: string) {
  await trackEvent({
    shopId,
    eventType: AnalyticsEventType.MAP_OPEN
  });
}

export async function trackWishlistAdd(shopId: string, productId: string, productName?: string) {
  await trackEvent({
    shopId,
    productId,
    eventType: AnalyticsEventType.WISHLIST_ADD,
    metadata: productName ? { product_name: productName } : undefined
  });
}

export async function trackCategoryClick(shopId: string, categoryName: string) {
  await trackEvent({
    shopId,
    eventType: AnalyticsEventType.CATEGORY_CLICK,
    metadata: { category_name: categoryName }
  });
}

export async function trackSearchUsage(shopId: string, query: string) {
  if (!query || !query.trim()) return;
  await trackEvent({
    shopId,
    eventType: AnalyticsEventType.SEARCH_USAGE,
    metadata: { search_query: query.trim() }
  });
}

export async function trackPurchaseIntent(
  shopId: string,
  productId: string,
  productName: string,
  price: number,
  buttonClicked: string,
  size: string,
  color: string
) {
  await trackEvent({
    shopId,
    productId,
    eventType: AnalyticsEventType.WHATSAPP_CLICK,
    metadata: {
      product_name: productName,
      price,
      button_clicked: buttonClicked,
      size,
      color
    }
  });
}

export async function trackLandingPageView() {}
export async function trackSignUpEvent(userId: string) {}
export async function trackShopCreatedEvent(shopId: string, shopName: string) {}
export async function trackProductCreatedEvent(shopId: string, productId: string) {}

export async function createMerchantNotification(
  shopOwnerId: string,
  type: 'new_purchase_intent' | 'new_whatsapp_intent' | 'milestone_reached' | 'low_stock' | 'announcement',
  title: string,
  body: string,
  data: Record<string, any> = {}
) {
  if (!shopOwnerId) return;
  try {
    const { error } = await supabase.from('notifications').insert([{
      user_id: shopOwnerId,
      type: type,
      title,
      body,
      data: data,
      read: false,
      created_at: new Date().toISOString()
    }]);
    
    if (error) {
      console.error("Could not insert notification into Supabase:", error.message);
    }
  } catch (err) {
    console.error("Exception during notification creation:", err);
  }
}

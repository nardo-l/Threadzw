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
 * Reusable Visitor ID Helper.
 * If user is logged in: visitorId = auth.user.id
 * Otherwise: Generate UUID, store in localStorage, reuse on future visits.
 */
export async function getVisitorId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (_) {
    // Auth check failed silently
  }

  let visitorId = localStorage.getItem('threadzw_visitor_id');
  if (!visitorId) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      visitorId = crypto.randomUUID();
    } else {
      visitorId = 'vis_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    }
    localStorage.setItem('threadzw_visitor_id', visitorId);
  }
  return visitorId;
}

/**
 * Reusable ThreadZW Analytics Service helper.
 * Writes analytics events to the "shop_analytics" table in Supabase.
 * Prints detailed logs for every event.
 */
export async function trackEvent(params: TrackEventParams) {
  let visitorId = params.visitorId;
  if (!visitorId) {
    visitorId = await getVisitorId();
  }

  // Step 3 Log: Inside every tracking function
  console.log("TRACK FUNCTION EXECUTED", {
    eventType: params.eventType,
    shopId: params.shopId,
    visitorId
  });

  if (!params.shopId) {
    console.warn("TRACK FUNCTION SKIPPED: shopId is missing or undefined", {
      eventType: params.eventType,
      shopId: params.shopId
    });
    return;
  }

  try {
    let source = params.source;
    if (!source) {
      const ref = typeof document !== 'undefined' ? document.referrer || '' : '';
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
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
      } else if (ref === '' || (typeof window !== 'undefined' && ref.includes(window.location.hostname))) {
        source = 'direct';
      } else {
        source = 'other';
      }
    }

    const metadata: Record<string, any> = {
      source,
      ...(params.metadata || {})
    };

    if (params.productId) {
      metadata.product_id = params.productId;
    }

    const eventPayload: Record<string, any> = {
      shop_id: params.shopId,
      event_type: params.eventType,
      visitor_id: visitorId,
      metadata: metadata
    };

    // Step 4 Log: Immediately before insert
    console.log("INSERT PAYLOAD", eventPayload);

    const { data, error } = await supabase.from('shop_analytics').insert([eventPayload]).select();

    // Step 5 Log: Immediately after insert
    console.log("SUPABASE RESULT", {
      data,
      error
    });

    if (error) {
      console.error("ANALYTICS INSERT FAILED - FULL ERROR:", JSON.stringify(error, null, 2), error);
    } else {
      console.log("Insert Successful:", data);
    }

    return { data, error };
  } catch (err: any) {
    console.error("ANALYTICS INSERT FAILED WITH EXCEPTION:", err);
  }
}

// Explicit Wrapper Helpers
export async function trackStoreView(shopId: string, referrerParam?: string) {
  return await trackEvent({
    shopId,
    eventType: AnalyticsEventType.SHOP_VISIT,
    source: referrerParam
  });
}

export async function trackProductView(shopId: string, productId: string, productName?: string) {
  return await trackEvent({
    shopId,
    productId,
    eventType: AnalyticsEventType.PRODUCT_VIEW,
    metadata: {
      product_id: productId,
      ...(productName ? { product_name: productName } : {})
    }
  });
}

export async function trackWhatsAppClick(shopId: string, productId?: string | null, productName?: string) {
  return await trackEvent({
    shopId,
    productId: productId || null,
    eventType: AnalyticsEventType.WHATSAPP_CLICK,
    metadata: {
      ...(productId ? { product_id: productId } : {}),
      ...(productName ? { product_name: productName } : {})
    }
  });
}

export async function trackMapOpen(shopId: string) {
  return await trackEvent({
    shopId,
    eventType: AnalyticsEventType.MAP_OPEN
  });
}

export async function trackWishlistAdd(shopId: string, productId: string, productName?: string) {
  return await trackEvent({
    shopId,
    productId,
    eventType: AnalyticsEventType.WISHLIST_ADD,
    metadata: {
      product_id: productId,
      ...(productName ? { product_name: productName } : {})
    }
  });
}

export async function trackCategoryClick(shopId: string, categoryName: string) {
  return await trackEvent({
    shopId,
    eventType: AnalyticsEventType.CATEGORY_CLICK,
    metadata: { category_name: categoryName }
  });
}

export async function trackSearchUsage(shopId: string, query: string) {
  if (!query || !query.trim()) return;
  return await trackEvent({
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
  return await trackEvent({
    shopId,
    productId,
    eventType: AnalyticsEventType.WHATSAPP_CLICK,
    metadata: {
      product_id: productId,
      product_name: productName,
      price,
      button_clicked: buttonClicked,
      size,
      color
    }
  });
}

export async function trackLandingPageView() {}
export async function trackSignUpEvent(_userId: string) {}
export async function trackShopCreatedEvent(_shopId: string, _shopName: string) {}
export async function trackProductCreatedEvent(_shopId: string, _productId: string) {}

export async function createMerchantNotification(
  _shopOwnerId: string,
  _type: string,
  _title: string,
  _body: string,
  _data: Record<string, any> = {}
) {
  // Notifications removed per user request
}


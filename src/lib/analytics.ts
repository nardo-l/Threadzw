import { supabase } from './supabase';

// ═══════════════════════════════════════════════════════════════════════════
// BASE ANALYTICS RECORDER
// ═══════════════════════════════════════════════════════════════════════════

export async function logAnalyticsEvent(
  eventType: string,
  shopId: string,
  productId: string | null = null,
  metadata: Record<string, any> = {}
) {
  if (!shopId) return;

  // Resolve active visitor ID cleanly
  let vid = localStorage.getItem('boutique_customer_id');
  if (!vid) {
    vid = 'cust_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('boutique_customer_id', vid);
  }

  const eventPayload = {
    shop_id: shopId,
    product_id: productId,
    event_type: eventType,
    visitor_id: vid,
    metadata: metadata,
    created_at: new Date().toISOString()
  };

  // Write directly and solely to Supabase analytics_events table
  try {
    const { error } = await supabase.from('analytics_events').insert([eventPayload]);
    if (error) {
      console.error(`Supabase analytics insert error:`, error.message);
      throw error;
    }
  } catch (err) {
    console.error('Network exception logging event to Supabase:', err);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPLICIT TRACKING WRAPPERS
// ═══════════════════════════════════════════════════════════════════════════

export async function trackStoreView(shopId: string, referrerParam?: string) {
  let ref = referrerParam || document.referrer || 'Direct';
  // Filter social referrers for presentation
  if (ref.includes('instagram.com')) ref = 'Instagram';
  else if (ref.includes('facebook.com')) ref = 'Facebook';
  else if (ref.includes('tiktok.com')) ref = 'TikTok';
  else if (ref.includes('wa.me') || ref.includes('whatsapp.com')) ref = 'WhatsApp';
  else if (ref.includes('google.com')) ref = 'Google Search';
  else if (ref.includes('tzw') || ref.includes('threadzw')) ref = 'Shared Link';
  
  await logAnalyticsEvent('store_view', shopId, null, { referrer_label: ref });
}

export async function trackProductView(shopId: string, productId: string, productName?: string) {
  await logAnalyticsEvent('product_view', shopId, productId, { name: productName });
}

export async function trackPurchaseIntent(
  shopId: string,
  productId: string,
  productName: string,
  price: number,
  buttonClicked: 'buy_now' | 'whatsapp',
  size?: string,
  color?: string
) {
  await logAnalyticsEvent('purchase_intent', shopId, productId, {
    product_name: productName,
    price: price,
    button_clicked: buttonClicked,
    size: size || 'M',
    color: color || 'Black'
  });
}

export async function trackWishlistAdd(shopId: string, productId: string, productName?: string) {
  await logAnalyticsEvent('wishlist_add', shopId, productId, { name: productName });
}

export async function trackCategoryClick(shopId: string, categoryName: string) {
  await logAnalyticsEvent('category_click', shopId, null, { category_name: categoryName });
}

export async function trackSearchUsage(shopId: string, query: string) {
  if (!query || !query.trim()) return;
  await logAnalyticsEvent('search_usage', shopId, null, { search_query: query.trim() });
}

export async function trackLandingPageView() {
  const vid = localStorage.getItem('boutique_customer_id') || 'visitor_' + Math.random().toString(36).substring(2, 11);
  if (!localStorage.getItem('boutique_customer_id')) {
    localStorage.setItem('boutique_customer_id', vid);
  }
  try {
    await supabase.from('analytics_events').insert([{
      shop_id: 'system_landing',
      event_type: 'landing_page_view',
      visitor_id: vid,
      metadata: { referrer: document.referrer || 'Direct' },
      created_at: new Date().toISOString()
    }]);
  } catch (e) {
    console.warn('Analytics landing page log skipped:', e);
  }
}

export async function trackSignUpEvent(userId: string) {
  try {
    await supabase.from('analytics_events').insert([{
      shop_id: 'system_signup',
      event_type: 'merchant_signup',
      visitor_id: userId,
      metadata: { user_id: userId },
      created_at: new Date().toISOString()
    }]);
  } catch (e) {
    console.warn('Analytics signup log skipped:', e);
  }
}

export async function trackShopCreatedEvent(shopId: string, shopName: string) {
  try {
    await supabase.from('analytics_events').insert([{
      shop_id: shopId,
      event_type: 'shop_created',
      visitor_id: shopId,
      metadata: { name: shopName },
      created_at: new Date().toISOString()
    }]);
  } catch (e) {
    console.warn('Analytics shop created log skipped:', e);
  }
}

export async function trackProductCreatedEvent(shopId: string, productId: string) {
  try {
    await supabase.from('analytics_events').insert([{
      shop_id: shopId,
      product_id: productId,
      event_type: 'product_created',
      visitor_id: shopId,
      metadata: {},
      created_at: new Date().toISOString()
    }]);
  } catch (e) {
    console.warn('Analytics product created log skipped:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION GENERATION HELPER
// ═══════════════════════════════════════════════════════════════════════════

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
      throw error;
    }
  } catch (err) {
    console.error("Exception during notification creation:", err);
    throw err;
  }
}

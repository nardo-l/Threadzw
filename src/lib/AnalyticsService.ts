import { createClient } from '@supabase/supabase-js';
import { supabase as clientSupabase } from './supabase';

export interface TodayAnalytics {
  visitors: number;
  whatsappClicks: number;
  conversionRate: number;
  products: number;
  topProduct: string;
  yesterdayVisitors: number;
  visitorGrowthPercentage: string;
}

function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    return clientSupabase;
  }
  const url = (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL))
    || (import.meta as any).env?.VITE_SUPABASE_URL
    || 'https://placeholder.supabase.co';
  const key = (typeof process !== 'undefined' && (process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.VITE_SUPABASE_ANON_KEY))
    || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
    || 'placeholder';
  return createClient(url, key);
}

export class AnalyticsService {
  /**
   * Helper to format date string YYYY-MM-DD for given timezone
   */
  static getLocalDateString(date: Date = new Date(), timezone: string = 'Africa/Harare'): string {
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
   * Helper to calculate visitor growth percentage string e.g. "+18%" or "-5%" or "0%"
   */
  static calculateGrowthPercentage(today: number, yesterday: number): string {
    if (yesterday === 0) {
      if (today > 0) return '+100%';
      return '0%';
    }
    const diff = today - yesterday;
    const pct = Math.round((diff / yesterday) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  }

  /**
   * Get today's analytics summary for a shop.
   * Single source of truth for analytics computations across ThreadZW.
   */
  static async getTodayAnalytics(shopId: string, timezone: string = 'Africa/Harare'): Promise<TodayAnalytics> {
    const supabase = getSupabaseClient();

    const todayStr = this.getLocalDateString(new Date(), timezone);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = this.getLocalDateString(yesterdayDate, timezone);

    // 1. Fetch products count and default top product name for shop
    let productsCount = 0;
    let defaultProductName = 'N/A';

    const { data: productsData } = await supabase
      .from('products')
      .select('id, name')
      .eq('shop_id', shopId);

    if (productsData) {
      productsCount = productsData.length;
      if (productsData.length > 0 && productsData[0].name) {
        defaultProductName = productsData[0].name;
      }
    }

    // 2. Fetch analytics events for shop
    const { data: events } = await supabase
      .from('shop_analytics')
      .select('event_type, visitor_id, metadata, created_at')
      .eq('shop_id', shopId);

    const safeEvents = events || [];
    const todayVisitorSet = new Set<string>();
    const yesterdayVisitorSet = new Set<string>();
    let whatsappClicksToday = 0;
    const productViewCounts = new Map<string, number>();

    safeEvents.forEach((e: any) => {
      if (!e.created_at) return;
      const eventDate = this.getLocalDateString(new Date(e.created_at), timezone);
      const isToday = eventDate === todayStr;
      const isYesterday = eventDate === yesterdayStr;

      // Unique visitors (valid shop_visit events with visitor_id)
      if (e.event_type === 'shop_visit' && e.visitor_id) {
        if (isToday) todayVisitorSet.add(e.visitor_id);
        if (isYesterday) yesterdayVisitorSet.add(e.visitor_id);
      }

      // WhatsApp clicks today
      if (e.event_type === 'whatsapp_click' && isToday) {
        whatsappClicksToday++;
      }

      // Product views today
      if (e.event_type === 'product_view' && isToday) {
        const prodName = e.metadata?.product_name || e.metadata?.product_id || 'Product';
        productViewCounts.set(prodName, (productViewCounts.get(prodName) || 0) + 1);
      }
    });

    const visitors = todayVisitorSet.size;
    const yesterdayVisitors = yesterdayVisitorSet.size;
    const whatsappClicks = whatsappClicksToday;

    // Conversion rate = (whatsappClicks / visitors) * 100
    const conversionRate = visitors > 0 ? Number(((whatsappClicks / visitors) * 100).toFixed(1)) : 0;

    // Top product
    let topProduct = defaultProductName;
    if (productViewCounts.size > 0) {
      const sorted = Array.from(productViewCounts.entries()).sort((a, b) => b[1] - a[1]);
      topProduct = sorted[0][0];
    }

    // Growth percentage
    const visitorGrowthPercentage = this.calculateGrowthPercentage(visitors, yesterdayVisitors);

    return {
      visitors,
      whatsappClicks,
      conversionRate,
      products: productsCount,
      topProduct,
      yesterdayVisitors,
      visitorGrowthPercentage
    };
  }
}

export const getTodayAnalytics = (shopId: string, timezone?: string) =>
  AnalyticsService.getTodayAnalytics(shopId, timezone);

export default AnalyticsService;

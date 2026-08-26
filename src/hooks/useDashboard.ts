import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AnalyticsService } from '../lib/AnalyticsService';
import { getShopVehicles } from '../services/vehicleService';
import { withTimeout } from '../lib/withTimeout';

const DASHBOARD_REQUEST_TIMEOUT_MS = 15000;

export interface TrafficSourceStat {
  name: string;
  percentage: number;
  count: number;
}

export interface StoreHealthStats {
  live: number;
  outOfStock: number;
  draft: number;
  missingImages: number;
  lowStock: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  timeAgo: string;
  type: 'view' | 'whatsapp' | 'visit' | 'product_update' | 'product_publish';
  date: string;
}

export interface DailyVisitPoint {
  day: string;
  visits: number;
  fullDate: string;
}

export interface DashboardData {
  productsCount: number;
  liveProductsCount: number;
  outOfStockCount: number;
  draftCount: number;
  missingImagesCount: number;
  lowStockCount: number;
  
  totalVisitors: number;
  lifetimeUniqueVisitors: number;
  visitorsChangePercent: number;
  
  whatsappClicks: number;
  lifetimeInterestEvents: number;
  whatsappClicksChangePercent: number;
  
  conversionRate: string;
  conversionRateChangePercent: number;
  
  visitShopClicks: number;
  visitShopClicksChangePercent: number;

  topProducts: any[];
  trafficSources: TrafficSourceStat[];
  storeHealth: StoreHealthStats;
  recentActivity: ActivityItem[];
  dailyVisitsChart: DailyVisitPoint[];
  
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function getTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const useDashboard = (shopId?: string | null): DashboardData => {
  const [data, setData] = useState<Omit<DashboardData, 'loading' | 'error' | 'refetch'>>({
    productsCount: 0,
    liveProductsCount: 0,
    outOfStockCount: 0,
    draftCount: 0,
    missingImagesCount: 0,
    lowStockCount: 0,
    totalVisitors: 0,
    lifetimeUniqueVisitors: 0,
    visitorsChangePercent: 0,
    whatsappClicks: 0,
    lifetimeInterestEvents: 0,
    whatsappClicksChangePercent: 0,
    conversionRate: '0.0',
    conversionRateChangePercent: 0,
    visitShopClicks: 0,
    visitShopClicksChangePercent: 0,
    topProducts: [],
    trafficSources: [],
    storeHealth: {
      live: 0,
      outOfStock: 0,
      draft: 0,
      missingImages: 0,
      lowStock: 0
    },
    recentActivity: [],
    dailyVisitsChart: []
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [productsRes, analyticsRes, todayAnalytics, vehiclesList] = await Promise.all([
        withTimeout(
          supabase
            .from('products')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false }),
          DASHBOARD_REQUEST_TIMEOUT_MS,
          'PRODUCTS_LOAD'
        ),
        withTimeout(
          supabase
            .from('shop_analytics')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false }),
          DASHBOARD_REQUEST_TIMEOUT_MS,
          'ANALYTICS_LOAD'
        ),
        withTimeout(AnalyticsService.getTodayAnalytics(shopId), DASHBOARD_REQUEST_TIMEOUT_MS, 'TODAY_ANALYTICS_LOAD'),
        withTimeout(getShopVehicles(shopId).catch(() => []), DASHBOARD_REQUEST_TIMEOUT_MS, 'VEHICLES_LOAD')
      ]);

      if (productsRes.error) throw productsRes.error;
      if (analyticsRes.error) throw analyticsRes.error;

      let products = productsRes.data || [];
      const events = analyticsRes.data || [];
      const vehicles = vehiclesList || [];

      // If shop has vehicles and no standard products, map vehicles into products structure for metrics
      if (vehicles.length > 0) {
        const vehicleProducts = vehicles.map(v => ({
          id: v.id,
          shop_id: v.shop_id,
          name: v.title,
          price: v.price,
          images: v.images && v.images.length > 0 ? v.images.map(img => typeof img === 'string' ? img : img.image_url) : (v.primary_image ? [v.primary_image] : []),
          is_published: v.status !== 'sold',
          status: v.status === 'available' ? 'active' : (v.status === 'sold' ? 'sold_out' : 'paused'),
          total_stock: v.status === 'available' ? 1 : 0,
          is_vehicle: true,
          created_at: v.created_at
        }));
        products = [...products, ...vehicleProducts];
      }

      // 1. PRODUCTS & STORE HEALTH
      const productsCount = products.length;
      let live = 0;
      let outOfStock = 0;
      let draft = 0;
      let missingImages = 0;
      let lowStock = 0;

      const productWhatsappMap = new Map<string, number>();

      products.forEach(p => {
        const stock = p.total_stock ?? 0;
        const hasImages = p.images && p.images.length > 0;
        const isDraft = p.status === 'draft' || p.is_published === false;

        if (isDraft) draft++;
        else if (stock === 0 || p.status === 'sold_out') outOfStock++;
        else live++;

        if (!hasImages) missingImages++;
        if (stock > 0 && stock <= 3) lowStock++;
      });

      // 2. ANALYTICS METRICS (Visitors, WhatsApp Clicks, Visit Shop Clicks)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Only count valid shop_visit events with a non-empty visitor_id for Shop Visitors
      const validShopVisitEvents = events.filter(e => e.event_type === 'shop_visit' && Boolean(e.visitor_id));
      const whatsappEvents = events.filter(e => e.event_type === 'whatsapp_click');
      const visitShopEvents = events.filter(e => e.event_type === 'map_open');

      // Total Unique Visitors = COUNT(DISTINCT visitor_id) from valid shop_visit events
      const uniqueVisitorsSet = new Set(validShopVisitEvents.map(e => e.visitor_id));
      const totalVisitors = uniqueVisitorsSet.size;
      const whatsappClicks = whatsappEvents.length;
      const visitShopClicks = visitShopEvents.length;

      // Period comparisons (Current 7 days vs Previous 7 days)
      const currVisitorsSet = new Set<string>();
      const prevVisitorsSet = new Set<string>();
      let currWhatsapp = 0, prevWhatsapp = 0;
      let currVisits = 0, prevVisits = 0;

      events.forEach(e => {
        if (!e.created_at) return;
        const d = new Date(e.created_at);
        const isCurr = d >= sevenDaysAgo && d <= now;
        const isPrev = d >= fourteenDaysAgo && d < sevenDaysAgo;

        if (e.event_type === 'shop_visit' && e.visitor_id) {
          if (isCurr) currVisitorsSet.add(e.visitor_id);
          if (isPrev) prevVisitorsSet.add(e.visitor_id);
        }

        if (e.event_type === 'whatsapp_click') {
          if (isCurr) currWhatsapp++;
          if (isPrev) prevWhatsapp++;
          
          const productId = e.product_id || e.metadata?.product_id;
          if (productId) {
            productWhatsappMap.set(productId, (productWhatsappMap.get(productId) || 0) + 1);
          }
        }

        if (e.event_type === 'map_open') {
          if (isCurr) currVisits++;
          if (isPrev) prevVisits++;
        }
      });

      const currVisitors = currVisitorsSet.size;
      const prevVisitors = prevVisitorsSet.size;

      const calcPct = (c: number, p: number) => {
        if (isNaN(c) || isNaN(p)) return 0;
        if (p === 0) return c > 0 ? 100 : 0;
        const res = ((c - p) / p) * 100;
        return isNaN(res) || !isFinite(res) ? 0 : Number(res.toFixed(1));
      };
      
      const visitorsChangePercent = calcPct(currVisitors, prevVisitors);
      const whatsappClicksChangePercent = calcPct(currWhatsapp, prevWhatsapp);
      const visitShopClicksChangePercent = calcPct(currVisits, prevVisits);

      // Conversion Rate = WhatsApp Clicks / Unique Shop Visitors * 100
      const conversionRateVal = totalVisitors > 0 
        ? ((whatsappClicks / totalVisitors) * 100).toFixed(1) 
        : '0.0';

      const currConv = currVisitors > 0 ? (currWhatsapp / currVisitors) * 100 : 0;
      const prevConv = prevVisitors > 0 ? (prevWhatsapp / prevVisitors) * 100 : 0;
      const conversionRateChangePercent = calcPct(currConv, prevConv);

      // 3. TOP PERFORMING PRODUCTS BY WHATSAPP CLICKS
      const topProducts = products.map(p => ({
        ...p,
        whatsapp_clicks: productWhatsappMap.get(p.id) || 0
      })).sort((a, b) => b.whatsapp_clicks - a.whatsapp_clicks).slice(0, 5);

      // 4. TRAFFIC SOURCES BREAKDOWN
      const referrerCounts: Record<string, number> = { Instagram: 0, WhatsApp: 0, TikTok: 0, Direct: 0, Other: 0 };
      events.forEach(e => {
        const src = (e.metadata?.source || e.metadata?.referrer_label || 'direct').toLowerCase();
        if (src.includes('instagram')) referrerCounts.Instagram++;
        else if (src.includes('whatsapp') || src.includes('wa.me')) referrerCounts.WhatsApp++;
        else if (src.includes('tiktok')) referrerCounts.TikTok++;
        else if (src.includes('direct')) referrerCounts.Direct++;
        else referrerCounts.Other++;
      });

      const totalRef = Object.values(referrerCounts).reduce((a, b) => a + b, 0);
      const trafficSources: TrafficSourceStat[] = [
        { name: 'Instagram', percentage: totalRef > 0 ? Math.round((referrerCounts.Instagram / totalRef) * 100) : 0, count: referrerCounts.Instagram },
        { name: 'WhatsApp', percentage: totalRef > 0 ? Math.round((referrerCounts.WhatsApp / totalRef) * 100) : 0, count: referrerCounts.WhatsApp },
        { name: 'TikTok', percentage: totalRef > 0 ? Math.round((referrerCounts.TikTok / totalRef) * 100) : 0, count: referrerCounts.TikTok },
        { name: 'Direct', percentage: totalRef > 0 ? Math.round((referrerCounts.Direct / totalRef) * 100) : 0, count: referrerCounts.Direct }
      ].filter(s => s.count > 0 || totalRef === 0);

      if (trafficSources.length === 0 && totalRef === 0) {
        trafficSources.push(
          { name: 'Instagram', percentage: 0, count: 0 },
          { name: 'WhatsApp', percentage: 0, count: 0 },
          { name: 'TikTok', percentage: 0, count: 0 },
          { name: 'Direct', percentage: 0, count: 0 }
        );
      }

      // 5. RECENT ACTIVITY CHRONOLOGICAL EVENTS FROM REAL EVENTS
      const recentActivity: ActivityItem[] = events.slice(0, 10).map((e, idx) => {
        let title = 'Store activity recorded.';
        let type: ActivityItem['type'] = 'view';
        if (e.event_type === 'whatsapp_click') {
          title = `Someone clicked WhatsApp (${e.metadata?.product_name || 'Product'}).`;
          type = 'whatsapp';
        } else if (e.event_type === 'map_open') {
          title = 'Someone clicked Visit Shop.';
          type = 'visit';
        } else if (e.event_type === 'product_view') {
          title = `Someone viewed ${e.metadata?.product_name || 'a product'}.`;
          type = 'view';
        } else if (e.event_type === 'shop_visit') {
          title = 'Someone visited your storefront.';
          type = 'view';
        }
        return {
          id: e.id || String(idx),
          title,
          timeAgo: getTimeAgo(e.created_at),
          type,
          date: e.created_at
        };
      });

      // 6. REAL 7-DAY SHOP VISITS CHART DATA (Unique Visitors per day)
      const dailyVisitsChart: DailyVisitPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = targetDate.toISOString().split('T')[0];
        const dayLabel = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayVisitorSet = new Set<string>();
        events.forEach(e => {
          if (e.event_type === 'shop_visit' && e.visitor_id && e.created_at) {
            const eDate = new Date(e.created_at).toISOString().split('T')[0];
            if (eDate === dateStr) {
              dayVisitorSet.add(e.visitor_id);
            }
          }
        });

        dailyVisitsChart.push({
          day: dayLabel,
          visits: dayVisitorSet.size,
          fullDate: dateStr
        });
      }

      setData({
        productsCount,
        liveProductsCount: live,
        outOfStockCount: outOfStock,
        draftCount: draft,
        missingImagesCount: missingImages,
        lowStockCount: lowStock,
        totalVisitors,
        lifetimeUniqueVisitors: totalVisitors,
        visitorsChangePercent,
        whatsappClicks,
        lifetimeInterestEvents: whatsappClicks + visitShopClicks,
        whatsappClicksChangePercent,
        conversionRate: conversionRateVal,
        conversionRateChangePercent,
        visitShopClicks,
        visitShopClicksChangePercent,
        topProducts,
        trafficSources,
        storeHealth: {
          live,
          outOfStock,
          draft,
          missingImages,
          lowStock
        },
        recentActivity,
        dailyVisitsChart
      });

    } catch (err: any) {
      console.error('Error fetching dashboard analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchDashboardData
  };
};

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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

export interface DashboardData {
  productsCount: number;
  liveProductsCount: number;
  outOfStockCount: number;
  draftCount: number;
  missingImagesCount: number;
  lowStockCount: number;
  
  totalVisitors: number;
  visitorsChangePercent: number;
  
  whatsappClicks: number;
  whatsappClicksChangePercent: number;
  
  conversionRate: string;
  conversionRateChangePercent: number;
  
  visitShopClicks: number;
  visitShopClicksChangePercent: number;

  topProducts: any[];
  trafficSources: TrafficSourceStat[];
  storeHealth: StoreHealthStats;
  recentActivity: ActivityItem[];
  
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
    visitorsChangePercent: 0,
    whatsappClicks: 0,
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
    recentActivity: []
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
      const [productsRes, analyticsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false }),
        supabase
          .from('shop_analytics')
          .select('*')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false })
      ]);

      if (productsRes.error) throw productsRes.error;
      if (analyticsRes.error) throw analyticsRes.error;

      const products = productsRes.data || [];
      const events = analyticsRes.data || [];

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

      const visitorEvents = events.filter(e => e.event_type === 'shop_visit' || e.event_type === 'product_view' || e.event_type === 'landing_page_view');
      const whatsappEvents = events.filter(e => e.event_type === 'whatsapp_click');
      const visitShopEvents = events.filter(e => e.event_type === 'map_open');

      const totalVisitors = visitorEvents.length;
      const whatsappClicks = whatsappEvents.length;
      const visitShopClicks = visitShopEvents.length;

      // Period comparisons
      let currVisitors = 0, prevVisitors = 0;
      let currWhatsapp = 0, prevWhatsapp = 0;
      let currVisits = 0, prevVisits = 0;

      events.forEach(e => {
        const d = new Date(e.created_at);
        const isCurr = d >= sevenDaysAgo && d <= now;
        const isPrev = d >= fourteenDaysAgo && d < sevenDaysAgo;

        if (e.event_type === 'shop_visit' || e.event_type === 'product_view' || e.event_type === 'landing_page_view') {
          if (isCurr) currVisitors++;
          if (isPrev) prevVisitors++;
        }
        if (e.event_type === 'whatsapp_click') {
          if (isCurr) currWhatsapp++;
          if (isPrev) prevWhatsapp++;
          
          if (e.product_id) {
            productWhatsappMap.set(e.product_id, (productWhatsappMap.get(e.product_id) || 0) + 1);
          }
        }
        if (e.event_type === 'map_open') {
          if (isCurr) currVisits++;
          if (isPrev) prevVisits++;
        }
      });

      const calcPct = (c: number, p: number) => (p === 0 ? (c > 0 ? 100 : 0) : Number((((c - p) / p) * 100).toFixed(1)));
      
      const visitorsChangePercent = calcPct(currVisitors, prevVisitors);
      const whatsappClicksChangePercent = calcPct(currWhatsapp, prevWhatsapp);
      const visitShopClicksChangePercent = calcPct(currVisits, prevVisits);

      const conversionRateVal = totalVisitors > 0 ? ((whatsappClicks / totalVisitors) * 100).toFixed(1) : '0.0';
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
      visitorEvents.forEach(e => {
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

      setData({
        productsCount,
        liveProductsCount: live,
        outOfStockCount: outOfStock,
        draftCount: draft,
        missingImagesCount: missingImages,
        lowStockCount: lowStock,
        totalVisitors,
        visitorsChangePercent,
        whatsappClicks,
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
        recentActivity
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

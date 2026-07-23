import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface CategoryStat {
  name: string;
  count: number;
}

export interface DailyChartPoint {
  dateLabel: string; // e.g. "Jul 23"
  dayName: string;   // e.g. "Wed"
  revenue: number;
  orders: number;
}

export interface DashboardData {
  productsCount: number;
  availableProductsCount: number;
  outOfStockProductsCount: number;
  categoriesCount: number;
  categoriesList: CategoryStat[];
  totalRevenue: number;
  revenueChangePercent: number;
  totalOrders: number;
  ordersChangePercent: number;
  totalVisitors: number;
  visitorsChangePercent: number;
  conversionRate: string;
  conversionRateChangePercent: number;
  dailyChartData: DailyChartPoint[];
  topProducts: any[];
  recentProducts: any[];
  recentOrders: any[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboard = (shopId?: string | null): DashboardData => {
  const [data, setData] = useState<Omit<DashboardData, 'loading' | 'error' | 'refetch'>>({
    productsCount: 0,
    availableProductsCount: 0,
    outOfStockProductsCount: 0,
    categoriesCount: 0,
    categoriesList: [],
    totalRevenue: 0,
    revenueChangePercent: 0,
    totalOrders: 0,
    ordersChangePercent: 0,
    totalVisitors: 0,
    visitorsChangePercent: 0,
    conversionRate: '0.0',
    conversionRateChangePercent: 0,
    dailyChartData: [],
    topProducts: [],
    recentProducts: [],
    recentOrders: []
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
      // Execute parallel queries across all relevant Supabase tables for current shop
      const [productsRes, salesRes, ordersRes, analyticsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false }),
        supabase
          .from('sales')
          .select('*')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('*')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false }),
        supabase
          .from('analytics_events')
          .select('*')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false })
      ]);

      if (productsRes.error) console.warn('Products fetch error:', productsRes.error);
      if (salesRes.error) console.warn('Sales fetch error:', salesRes.error);
      if (ordersRes.error) console.warn('Orders fetch error:', ordersRes.error);
      if (analyticsRes.error) console.warn('Analytics fetch error:', analyticsRes.error);

      const products = productsRes.data || [];
      const sales = salesRes.data || [];
      const orders = ordersRes.data || [];
      const events = analyticsRes.data || [];

      // 1. PRODUCTS METRICS
      const productsCount = products.length;
      const availableProductsCount = products.filter(
        p => (p.total_stock > 0 || p.is_available === true) && p.status !== 'sold_out'
      ).length;
      const outOfStockProductsCount = products.filter(
        p => p.total_stock === 0 || p.status === 'sold_out' || p.is_available === false
      ).length;

      // Categories computation
      const catMap = new Map<string, number>();
      products.forEach(p => {
        const catName = p.category ? p.category.trim() : 'Uncategorized';
        catMap.set(catName, (catMap.get(catName) || 0) + 1);
      });
      const categoriesList: CategoryStat[] = Array.from(catMap.entries()).map(([name, count]) => ({
        name,
        count
      }));
      const categoriesCount = categoriesList.length;

      // Recent and Top Products
      const recentProducts = products.slice(0, 5);
      const topProducts = [...products]
        .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
        .slice(0, 5);

      // 2. REVENUE & ORDERS METRICS
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Calculate total revenue from sales + completed orders
      const salesRevenue = sales.reduce((sum, s) => sum + (Number(s.final_price) || 0), 0);
      const ordersRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const totalRevenue = salesRevenue + ordersRevenue;

      const totalOrders = sales.length + orders.length;

      // Recent Orders combining sales and orders
      const combinedRecentOrders = [
        ...sales.map(s => ({
          id: s.id,
          title: s.product_name || 'Direct Sale',
          amount: Number(s.final_price) || 0,
          date: s.created_at,
          type: 'sale',
          status: 'completed'
        })),
        ...orders.map(o => ({
          id: o.id,
          title: `Order #${o.id.substring(0, 6)}`,
          amount: Number(o.total_amount) || 0,
          date: o.created_at,
          type: 'order',
          status: o.status || 'pending'
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      // Past 7 Days vs Previous 7 Days Comparison
      let currentPeriodRev = 0;
      let prevPeriodRev = 0;
      let currentPeriodOrders = 0;
      let prevPeriodOrders = 0;

      [...sales, ...orders].forEach(item => {
        const itemDate = new Date(item.created_at);
        const price = Number(item.final_price || item.total_amount || 0);

        if (itemDate >= sevenDaysAgo && itemDate <= now) {
          currentPeriodRev += price;
          currentPeriodOrders += 1;
        } else if (itemDate >= fourteenDaysAgo && itemDate < sevenDaysAgo) {
          prevPeriodRev += price;
          prevPeriodOrders += 1;
        }
      });

      const calcPercentChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Number((((current - previous) / previous) * 100).toFixed(1));
      };

      const revenueChangePercent = calcPercentChange(currentPeriodRev, prevPeriodRev);
      const ordersChangePercent = calcPercentChange(currentPeriodOrders, prevPeriodOrders);

      // 3. VISITORS & CONVERSION METRICS
      // Count store_view and product_view events
      const visitorEvents = events.filter(
        e => e.event_type === 'store_view' || e.event_type === 'product_view' || e.event_type === 'landing_page_view'
      );
      
      const totalVisitors = visitorEvents.length;

      let currentPeriodVisitors = 0;
      let prevPeriodVisitors = 0;

      events.forEach(e => {
        const eDate = new Date(e.created_at);
        if (eDate >= sevenDaysAgo && eDate <= now) {
          currentPeriodVisitors += 1;
        } else if (eDate >= fourteenDaysAgo && eDate < sevenDaysAgo) {
          prevPeriodVisitors += 1;
        }
      });

      const visitorsChangePercent = calcPercentChange(currentPeriodVisitors, prevPeriodVisitors);

      const conversionRateVal = totalVisitors > 0
        ? ((totalOrders / totalVisitors) * 100).toFixed(1)
        : '0.0';

      const prevConversionRateVal = prevPeriodVisitors > 0
        ? ((prevPeriodOrders / prevPeriodVisitors) * 100)
        : 0;

      const currentConversionRateVal = currentPeriodVisitors > 0
        ? ((currentPeriodOrders / currentPeriodVisitors) * 100)
        : 0;

      const conversionRateChangePercent = calcPercentChange(
        currentConversionRateVal,
        prevConversionRateVal
      );

      // 4. DAILY CHART DATA (Last 7 Days)
      const dailyChartData: DailyChartPoint[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = 6; i >= 0; i--) {
        const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0);
        const dayEnd = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59);

        const shortDate = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayName = dayNames[dayDate.getDay()];

        // Filter transactions on this calendar day
        let dayRev = 0;
        let dayOrders = 0;

        [...sales, ...orders].forEach(item => {
          const itemDate = new Date(item.created_at);
          if (itemDate >= dayStart && itemDate <= dayEnd) {
            dayRev += Number(item.final_price || item.total_amount || 0);
            dayOrders += 1;
          }
        });

        dailyChartData.push({
          dateLabel: shortDate,
          dayName: dayName,
          revenue: dayRev,
          orders: dayOrders
        });
      }

      setData({
        productsCount,
        availableProductsCount,
        outOfStockProductsCount,
        categoriesCount,
        categoriesList,
        totalRevenue,
        revenueChangePercent,
        totalOrders,
        ordersChangePercent,
        totalVisitors,
        visitorsChangePercent,
        conversionRate: conversionRateVal,
        conversionRateChangePercent,
        dailyChartData,
        topProducts,
        recentProducts,
        recentOrders: combinedRecentOrders
      });

    } catch (err: any) {
      console.error('Error in useDashboard hook:', err);
      setError(err.message || 'Failed to fetch dashboard metrics');
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

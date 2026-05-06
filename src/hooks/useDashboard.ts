import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import React from 'react';
import { DollarSign, ShoppingBag, Eye, Users } from 'lucide-react';

export const useDashboard = () => {
  const { user } = useAuth();
  const { shop } = useSubscription();
  const [stats, setStats] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    totalSales: 0,
    totalOrders: 0,
    conversionRate: 0,
    avgOrderValue: 0
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [salesOverTime, setSalesOverTime] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [signals, setSignals] = useState({ lowStock: [], highInterest: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!shop) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

      const [todayOrds, monthOrds, viewData, allProducts] = await Promise.all([
        supabase.from('orders').select('sale_price, quantity')
          .eq('shop_id', shop.id).gte('created_at', todayStart.toISOString()),
        supabase.from('orders').select('sale_price, quantity')
          .eq('shop_id', shop.id).gte('created_at', monthStart.toISOString()),
        supabase.from('products').select('view_count, name, price, id, images, like_count, save_count').eq('shop_id', shop.id),
        supabase.from('products').select('*').eq('shop_id', shop.id).neq('status', 'deleted').order('created_at', { ascending: false })
      ]);

      const sum = (res: any) => res.data?.reduce((s: number, o: any) => s + (o.sale_price * o.quantity), 0) || 0;
      const todayRev = sum(todayOrds);
      const todayCount = todayOrds.data?.length || 0;
      const totalViews = viewData.data?.reduce((s: number, p: any) => s + (p.view_count || 0), 0) || 0;

      const { data: shopsData } = await supabase.from('shops').select('follower_count').eq('id', shop.id).single();
      const followerCount = shopsData?.follower_count || 0;

      setStats([
        { label: 'Revenue', value: `$${todayRev}`, icon: React.createElement(DollarSign, { size: 16 }), color: 'text-primary' },
        { label: 'Orders', value: todayCount, icon: React.createElement(ShoppingBag, { size: 16 }), color: 'text-secondary' },
        { label: 'Views', value: totalViews, icon: React.createElement(Eye, { size: 16 }), color: 'text-blue-400' },
        { label: 'Followers', value: followerCount, icon: React.createElement(Users, { size: 16 }), color: 'text-purple-400' }
      ]);

      setAnalytics({
        totalSales: sum(monthOrds),
        totalOrders: monthOrds.data?.length || 0,
        conversionRate: totalViews > 0 ? ((monthOrds.data?.length || 0) / totalViews * 100).toFixed(1) : 0,
        avgOrderValue: monthOrds.data?.length ? (sum(monthOrds) / monthOrds.data.length).toFixed(2) : 0
      });

      setProducts(allProducts.data || []);
      
      // Fetch orders for the last 7 days to build the chart
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0,0,0,0);

      const { data: weekOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shop.id)
        .gte('created_at', weekStart.toISOString());

      const dailyData: Record<string, number> = {};
      const productSalesCount: Record<string, number> = {};

      weekOrders?.forEach((order: any) => {
        const day = new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'short' })[0];
        const revenue = order.total_price || (order.sale_price * order.quantity) || 0;
        dailyData[day] = (dailyData[day] || 0) + revenue;

        // Track product sales for top products
        if (order.items) {
          order.items?.forEach((item: any) => {
            productSalesCount[item.productId] = (productSalesCount[item.productId] || 0) + (item.quantity || 1);
          });
        } else if (order.product_id) {
          productSalesCount[order.product_id] = (productSalesCount[order.product_id] || 0) + (order.quantity || 1);
        }
      });

      const days = [];
      const dayNames = ['S','M','T','W','T','F','S'];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = dayNames[date.getDay()];
        days.push({
          label: dayName,
          revenue: dailyData[dayName] || 0
        });
      }

      setWeeklyData(days);
      setSalesOverTime(days);

      // Top Products based on actual sales count
      const sortedTop = (viewData.data || [])
        .map(p => ({
          ...p,
          sales: productSalesCount[p.id] || 0
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      setTopProducts(sortedTop);

    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      setError('Could not load dashboard');
    } finally {
      setLoading(false);
    }
  }, [shop]);

  const recordSale = async (sale: any) => {
    if (!shop || !user) return;
    try {
      const { error: err } = await supabase.from('orders').insert({
        shop_id: shop.id,
        owner_id: user.id,
        product_id: sale.product_id,
        product_name: sale.product_name || 'Manual Sale',
        quantity: sale.quantity,
        sale_price: sale.sale_price,
        listed_price: sale.listed_price,
        size: sale.size,
        channel: sale.channel,
        is_negotiated: sale.is_negotiated
      });
      if (err) throw err;
      
      // Delay to allow trigger to run
      setTimeout(() => {
        fetchDashboard();
      }, 500);
    } catch (err) {
      console.error('Error recording sale:', err);
    }
  };

  const addProduct = async (productData: any) => {
    if (!shop || !user) return;
    try {
      const { error: err } = await supabase.from('products').insert({
        ...productData,
        shop_id: shop.id,
        owner_id: user.id,
        is_published: true
      });
      if (err) throw err;
      fetchDashboard();
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  useEffect(() => {
    if (shop?.id) {
      fetchDashboard();
    }
  }, [shop?.id, fetchDashboard]);

  return { 
    stats, 
    analytics, 
    weeklyData, 
    salesOverTime, 
    topProducts, 
    products, 
    recentOrders, 
    signals, 
    loading, 
    error, 
    refetch: fetchDashboard,
    recordSale,
    addProduct
  };
};

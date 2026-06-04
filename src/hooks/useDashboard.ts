import { useState, useEffect, useCallback, useMemo } from 'react';
import { mockSales, mockProducts } from '../data/mockData';
import React from 'react';
import { DollarSign, ShoppingBag, Eye, Users } from 'lucide-react';

export const useDashboard = () => {
  const [salesList, setSalesList] = useState<any[]>(mockSales);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    const todayRev = salesList.reduce((sum, s) => sum + s.final_price, 0);
    const todayCount = salesList.length;
    const totalViews = 1240; // Static mock views
    const followerCount = 185; // Static mock followers

    return [
      { label: 'Revenue', value: `$${todayRev}`, icon: React.createElement(DollarSign, { size: 16 }), color: 'text-[#C6FF00]' },
      { label: 'Orders', value: todayCount, icon: React.createElement(ShoppingBag, { size: 16 }), color: 'text-emerald-400' },
      { label: 'Views', value: totalViews, icon: React.createElement(Eye, { size: 16 }), color: 'text-blue-400' },
      { label: 'Followers', value: followerCount, icon: React.createElement(Users, { size: 16 }), color: 'text-purple-400' }
    ];
  }, [salesList]);

  const analytics = useMemo(() => {
    const totalRev = salesList.reduce((sum, s) => sum + s.final_price, 0);
    const totalCount = salesList.length;
    const conRate = totalCount > 0 ? ((totalCount / 1240) * 100).toFixed(1) : '0';
    const avgOrder = totalCount > 0 ? (totalRev / totalCount).toFixed(2) : '0';

    return {
      totalSales: totalRev,
      totalOrders: totalCount,
      conversionRate: conRate,
      avgOrderValue: avgOrder
    };
  }, [salesList]);

  const weeklyData = useMemo(() => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days.map((d, index) => {
      // Seed nice chart values based on index
      return {
        label: d,
        revenue: index * 10 + 15
      };
    });
  }, []);

  const topProducts = useMemo(() => {
    return mockProducts.slice(0, 3).map((p, idx) => ({
      ...p,
      sales: 10 - idx * 2
    }));
  }, []);

  const productsList = useMemo(() => {
    return mockProducts;
  }, []);

  const recordSale = useCallback(async (sale: any) => {
    const newSale = {
      id: `sale-${Date.now()}`,
      product_name: sale.product_name || 'Manual Sale',
      size: sale.size || 'M',
      quantity: sale.quantity || 1,
      final_price: sale.sale_price || 18,
      payment_method: sale.payment_method || 'cash',
      channel: sale.channel || 'walk-in',
      created_at: new Date().toISOString(),
    };
    setSalesList(prev => [newSale, ...prev]);
  }, []);

  const addProduct = useCallback(async (productData: any) => {
    // Stub
  }, []);

  return { 
    stats, 
    analytics, 
    weeklyData, 
    salesOverTime: weeklyData, 
    topProducts, 
    products: productsList, 
    recentOrders: salesList, 
    signals: { lowStock: [], highInterest: [] }, 
    loading, 
    error: null, 
    refetch: async () => {},
    recordSale,
    addProduct
  };
};

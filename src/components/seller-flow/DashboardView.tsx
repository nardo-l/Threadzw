import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, TrendingUp, DollarSign, ShoppingCart, Eye, BarChart3, Clock, ChevronRight } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export const DashboardView: React.FC<{ myShop: any }> = ({ myShop }) => {
  const { setSellerFlowState } = useInventory();
  const [dateRange, setDateRange] = useState<'7D' | '30D' | 'All'>('7D');
  const [loading, setLoading] = useState(true);
  const [dashboardOrders, setDashboardOrders] = useState<any[]>([]);
  const [dashboardProducts, setDashboardProducts] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async (range: string) => {
    if (!myShop?.id) return;
    setLoading(true);

    try {
      let startDate = null;
      if (range === '7D') {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (range === '30D') {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      let query = supabase
        .from('orders')
        .select(`
          id,
          sale_price,
          quantity,
          size,
          channel,
          created_at,
          product_id,
          products (
            id,
            name,
            images,
            price
          )
        `)
        .eq('shop_id', myShop.id)
        .order('created_at', { ascending: true });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDashboardOrders(data || []);

      const { data: products } = await supabase
        .from('products')
        .select('id, name, images, price, view_count, save_count, total_stock')
        .eq('shop_id', myShop.id)
        .eq('is_published', true);

      setDashboardProducts(products || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [myShop?.id]);

  useEffect(() => {
    fetchDashboardData(dateRange);
  }, [fetchDashboardData, dateRange]);

  if (myShop?.subscription_status === 'trial') {
    return (
      <div className="flex flex-col min-h-screen bg-black">
        {/* Top Bar for Locked State */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#1a1a1a]">
          <button onClick={() => setSellerFlowState('live')} className="p-1">
            <ArrowLeft className="text-white" size={24} />
          </button>
          <h1 className="text-white font-bold text-[18px] absolute left-1/2 -translate-x-1/2">Dashboard</h1>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="text-[48px] mb-4">📊</div>
          <h2 className="text-white text-[20px] font-bold mb-2.5">Full Analytics</h2>
          <p className="text-[#888] text-[14px] leading-relaxed mb-2">
            Graphs, top products, size breakdowns and more unlock when you upgrade.
          </p>
          <p className="text-[#555] text-[12px] mb-6">
            During your trial you can see a simple 5-day sales summary in Shop Centre.
          </p>
          <button
            onClick={() => setSellerFlowState('paywall')}
            className="bg-linear-to-br from-[#9B27AF] to-[#FF2D78] text-white font-bold text-[14px] px-8 h-12 rounded-full active:scale-[0.98] transition-all"
          >
            Upgrade for $6/month →
          </button>
        </div>
      </div>
    );
  }

  // Calculations
  const totalRevenue = dashboardOrders.reduce((sum, o) => sum + (o.sale_price * (o.quantity || 1)), 0);
  const totalSales = dashboardOrders.length;
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  const totalViews = dashboardProducts.reduce((sum, p) => sum + (p.view_count || 0), 0);

  const getDailyRevenue = () => {
    const days = dateRange === '7D' ? 7 : dateRange === '30D' ? 30 : null;
    if (!days) return []; // All time handling if needed, but for now we focus on fixed ranges

    const result = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = dashboardOrders.filter(o => o.created_at.startsWith(dateStr));
      const revenue = dayOrders.reduce((sum, o) => sum + o.sale_price * (o.quantity || 1), 0);
      result.push({
        label: i === 0 ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
        revenue,
        count: dayOrders.length
      });
    }
    return result;
  };

  const dayData = getDailyRevenue();
  const maxDayRevenue = Math.max(...dayData.map(d => d.revenue), 1);

  const getTopProducts = () => {
    const productSales: Record<string, any> = {};
    dashboardOrders.forEach(order => {
      const id = order.product_id;
      if (!id) return;
      if (!productSales[id]) {
        productSales[id] = {
          id,
          name: order.products?.name || 'Unknown',
          image: order.products?.images?.[0],
          revenue: 0,
          count: 0
        };
      }
      productSales[id].revenue += order.sale_price * (order.quantity || 1);
      productSales[id].count += order.quantity || 1;
    });
    return Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  };

  const getSizeSales = () => {
    const sizes: Record<string, any> = {};
    dashboardOrders.forEach(order => {
      if (!order.size) return;
      const s = order.size.trim();
      if (!sizes[s]) {
        sizes[s] = { size: s, count: 0 };
      }
      sizes[s].count += order.quantity || 1;
    });
    return Object.values(sizes).sort((a, b) => b.count - a.count);
  };

  const getBestDays = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = new Array(7).fill(0);
    dashboardOrders.forEach(order => {
      const day = new Date(order.created_at).getDay();
      dayCounts[day] += order.quantity || 1;
    });
    return dayNames.map((name, i) => ({ name, count: dayCounts[i] }));
  };

  const getChannels = () => {
    const inStore = dashboardOrders.filter(o => o.channel === 'in_store').length;
    const whatsapp = dashboardOrders.filter(o => o.channel === 'whatsapp').length;
    const total = inStore + whatsapp;
    return {
      inStore,
      whatsapp,
      total,
      inStorePct: total > 0 ? Math.round(inStore / total * 100) : 0,
      whatsappPct: total > 0 ? Math.round(whatsapp / total * 100) : 0
    };
  };

  const recentOrders = [...dashboardOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const stats = [
    { label: 'REVENUE', value: `$${totalRevenue.toFixed(2)}`, accent: true },
    { label: 'SALES', value: totalSales.toString() },
    { label: 'AVG SALE', value: `$${avgOrderValue.toFixed(2)}` },
    { label: 'VIEWS', value: totalViews.toString() },
  ];

  const bestDays = getBestDays();
  const maxBestDayCount = Math.max(...bestDays.map(d => d.count), 1);
  const topDay = bestDays.reduce((best, day) => day.count > best.count ? day : best, bestDays[0]);
  const channels = getChannels();

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Top Bar */}
      <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-50">
        <button onClick={() => setSellerFlowState('live')} className="p-1">
          <ArrowLeft className="text-white" size={24} />
        </button>
        <h1 className="text-white font-bold text-[18px]">Dashboard</h1>
        <div className="flex bg-[#111] border border-[#222] rounded-full h-[30px] p-0.5">
          {(['7D', '30D', 'All'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 rounded-full text-[11px] font-bold transition-all ${
                dateRange === range ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white shadow-sm' : 'text-[#888]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col p-5 gap-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="min-w-[130px] h-[100px] bg-[#111] rounded-[14px] animate-pulse" />
            ))}
          </div>
          <div className="h-[200px] bg-[#111] rounded-[14px] animate-pulse" />
          <div className="h-[300px] bg-[#111] rounded-[14px] animate-pulse" />
        </div>
      ) : (
        <div className="flex flex-col pb-[100px]">
          {/* Section 1: Summary Stats */}
          <div className="flex overflow-x-auto no-scrollbar gap-2.5 px-5 py-5">
            {stats.map((s, i) => (
              <div key={i} className="min-w-[130px] bg-[#111] border border-[#222] rounded-[14px] p-4 flex flex-col">
                <div className="text-[#888] text-[10px] font-bold tracking-wider uppercase">{s.label}</div>
                <div className="text-white font-bold text-[26px] mt-1">{s.value}</div>
                {s.accent && <div className="w-5 h-[2px] bg-[#FF2D78] mt-1.5" />}
              </div>
            ))}
          </div>

          {/* Section 2: Revenue Chart */}
          <div className="px-5 mb-8">
            <h2 className="text-white font-bold text-[15px] mb-3">Revenue</h2>
            <div className="bg-[#111] border border-[#222] rounded-[14px] p-4 pt-6">
              <div className="relative h-[120px] flex items-end gap-1 px-1">
                {/* Y-axis marks hypothetical logic */}
                <div className="absolute left-0 top-0 text-[#444] text-[9px] font-mono">${maxDayRevenue.toFixed(0)}</div>
                <div className="absolute left-0 bottom-0 text-[#444] text-[9px] font-mono">$0</div>

                {dayData.map((d, i) => {
                  const height = maxDayRevenue > 0 ? (d.revenue / maxDayRevenue) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, d.revenue > 0 ? 2 : 4)}%` }}
                        transition={{ delay: i * 0.02, duration: 0.6, ease: 'easeOut' }}
                        className={`w-full rounded-t-[3px] transition-all duration-300 ${
                          d.revenue > 0 ? 'bg-linear-to-t from-[#9B27AF] to-[#FF2D78]' : 'bg-[#1a1a1a]'
                        }`}
                      />
                      {(dateRange === '7D' || (dateRange === '30D' && i % 4 === 0)) && (
                        <div className="text-[#444] text-[8px] mt-2 whitespace-nowrap truncate w-full text-center">{d.label}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Top Products */}
          <div className="px-5 mb-8">
            <h2 className="text-white font-bold text-[15px] mb-3">Top Products by Sales</h2>
            <div className="flex flex-col gap-2">
              {getTopProducts().map((p, i) => (
                <div key={p.id} className="bg-[#111] border border-[#222] rounded-[12px] p-3 flex items-center">
                  <div className={`w-5 font-bold text-[16px] italic ${i === 0 ? 'text-transparent bg-clip-text bg-linear-to-r from-[#9B27AF] to-[#FF2D78]' : 'text-[#444]'}`}>
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 rounded-[8px] overflow-hidden ml-2.5 bg-[#1a1a1a] shrink-0">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-[#1a1a1a] to-[#222]" />
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-white text-[13px] font-bold truncate">{p.name}</div>
                    <div className="text-[#888] text-[11px] mt-0.5">{p.count} sold</div>
                  </div>
                  <div className="text-[#FF2D78] font-bold text-[14px]">
                    ${p.revenue.toFixed(2)}
                  </div>
                </div>
              ))}
              {getTopProducts().length === 0 && (
                <div className="text-[#555] text-center py-4 text-[13px]">No sales recorded yet</div>
              )}
            </div>
          </div>

          {/* Section 4: Sizes Sold */}
          <div className="px-5 mb-8">
            <h2 className="text-white font-bold text-[15px] mb-3">Sizes Sold</h2>
            <div className="flex flex-wrap gap-2.5">
              {getSizeSales().map((s, i) => (
                <div 
                  key={s.size} 
                  className={`flex flex-col items-center justify-center min-w-[64px] h-[64px] rounded-full px-3 ${
                    i === 0 ? 'bg-linear-to-br from-[#9B27AF] to-[#FF2D78] shadow-lg' : 'bg-[#111] border border-[#222]'
                  }`}
                >
                  <span className="text-white font-bold text-[14px] leading-none">{s.size}</span>
                  <span className={`text-[10px] mt-1 ${i === 0 ? 'text-white/80' : 'text-[#888]'}`}>{s.count} sold</span>
                </div>
              ))}
              {getSizeSales().length === 0 && (
                <div className="w-full text-[#555] text-center py-4 text-[13px]">No size data available</div>
              )}
            </div>
          </div>

          {/* Section 5: Best Days to Sell */}
          <div className="px-5 mb-8">
            <h2 className="text-white font-bold text-[15px] mb-3">Best Days to Sell</h2>
            <div className="bg-[#111] border border-[#222] rounded-[14px] p-4 flex items-end justify-between h-[120px] gap-2">
              {bestDays.map((d, i) => {
                const height = (d.count / maxBestDayCount) * 100;
                const isTop = topDay.count > 0 && d.name === topDay.name;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    {isTop && <span className="text-[12px] mb-1">🔥</span>}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, d.count > 0 ? 5 : 2)}%` }}
                      className={`w-full rounded-t-[3px] ${isTop ? 'bg-[#FF2D78]' : 'bg-[#222]'}`}
                    />
                    <div className="text-[#555] text-[10px] mt-2 font-bold">{d.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 6: Channels */}
          <div className="px-5 mb-8">
            <h2 className="text-white font-bold text-[15px] mb-3">How People Buy</h2>
            <div className="flex gap-3">
              <div className="flex-1 bg-[#111] border border-[#222] rounded-[14px] p-4 flex flex-col items-center text-center">
                <span className="text-[28px]">🏪</span>
                <span className="text-[#888] text-[12px] mt-1.5">In Store</span>
                <div className="text-white font-bold text-[28px] mt-1">{channels.inStore}</div>
                <span className="text-[#555] text-[10px] mb-3">sales</span>
                <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF2D78]" style={{ width: `${channels.inStorePct}%` }} />
                </div>
                <span className="text-[#FF2D78] text-[11px] font-bold mt-2">{channels.inStorePct}%</span>
              </div>
              <div className="flex-1 bg-[#111] border border-[#222] rounded-[14px] p-4 flex flex-col items-center text-center">
                <span className="text-[28px]">💬</span>
                <span className="text-[#888] text-[12px] mt-1.5">WhatsApp</span>
                <div className="text-white font-bold text-[28px] mt-1">{channels.whatsapp}</div>
                <span className="text-[#555] text-[10px] mb-3">sales</span>
                <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#22c55e]" style={{ width: `${channels.whatsappPct}%` }} />
                </div>
                <span className="text-[#22c55e] text-[11px] font-bold mt-2">{channels.whatsappPct}%</span>
              </div>
            </div>
          </div>

          {/* Section 7: Recent Sales Log */}
          <div className="px-5">
            <h2 className="text-white font-bold text-[15px] mb-3">Recent Sales</h2>
            <div className="flex flex-col gap-1.5 pb-20">
              {recentOrders.map((order) => (
                <div key={order.id} className="bg-[#111] border border-[#1a1a1a] rounded-[10px] p-3.5">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {order.order_reference ? (
                          <span className="text-[#FF2D78] text-[11px] font-bold uppercase tracking-wider">{order.order_reference}</span>
                        ) : (
                          <span className="text-[#555] text-[11px] font-bold uppercase tracking-wider">Manual Sale</span>
                        )}
                      </div>
                      <div className="text-white text-[13px] font-bold mt-1 truncate">{order.products?.name || order.product_name || 'Item'}</div>
                    </div>
                    <div className="text-white font-bold text-[14px] ml-4">
                      ${order.sale_price.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="bg-[#1a1a1a] px-2 py-0.5 rounded-full text-[#888] text-[10px] font-bold">{order.size || 'No Size'}</div>
                      <div className="bg-[#1a1a1a] px-2 py-0.5 rounded-full text-[#888] text-[10px] font-bold">
                        {order.channel === 'whatsapp' ? '💬 WhatsApp' : '🏪 In Store'}
                      </div>
                    </div>
                    <div className="text-[#555] text-[10px] font-medium flex items-center gap-1">
                      <Clock size={10} />
                      {timeAgo(order.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <div className="bg-[#111]/50 border border-dashed border-[#222] rounded-[16px] p-8 flex flex-col items-center text-center">
                  <div className="text-[32px] mb-3">📉</div>
                  <div className="text-[#555] text-[13px]">No sales recorded for this period</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

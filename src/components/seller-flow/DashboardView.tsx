import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Eye, 
  BarChart3, 
  Clock, 
  ChevronRight,
  Target,
  ArrowUpRight,
  Package,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { supabase } from '../../lib/supabase';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

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
      if (range === '7D') startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      else if (range === '30D') startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      let query = supabase.from('orders').select('*, products(*)').eq('shop_id', myShop.id);
      if (startDate) query = query.gte('created_at', startDate);
      const { data: oData } = await query.order('created_at', { ascending: true });
      setDashboardOrders(oData || []);

      const { data: pData } = await supabase.from('products').select('*').eq('shop_id', myShop.id);
      setDashboardProducts(pData || []);
    } finally {
      setLoading(false);
    }
  }, [myShop?.id]);

  useEffect(() => { fetchDashboardData(dateRange); }, [fetchDashboardData, dateRange]);

  const totalRevenue = useMemo(() => dashboardOrders.reduce((sum, o) => sum + (o.sale_price * (o.quantity || 1)), 0), [dashboardOrders]);
  const totalSales = dashboardOrders.length;
  const totalViews = useMemo(() => dashboardProducts.reduce((sum, p) => sum + (p.view_count || 0), 0), [dashboardProducts]);

  const chartData = useMemo(() => {
    const days = dateRange === '7D' ? 7 : dateRange === '30D' ? 30 : 14;
    const result = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = dashboardOrders.filter(o => o.created_at.startsWith(dateStr));
      result.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayOrders.reduce((sum, o) => sum + (o.sale_price * (o.quantity || 1)), 0),
        count: dayOrders.length
      });
    }
    return result;
  }, [dashboardOrders, dateRange]);

  const topProducts = useMemo(() => {
    const counts: Record<string, any> = {};
    dashboardOrders.forEach(o => {
      const pid = o.product_id;
      if (!counts[pid]) counts[pid] = { name: o.products?.name, revenue: 0, count: 0, img: o.products?.images?.[0] };
      counts[pid].revenue += o.sale_price * o.quantity;
      counts[pid].count += o.quantity;
    });
    return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 4);
  }, [dashboardOrders]);

  if (myShop?.subscription_status === 'trial') {
    return (
      <div className="flex flex-col min-h-screen bg-black items-center justify-center p-10 text-center">
         <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary mb-6">
            <Target size={32} />
         </div>
         <h2 className="text-2xl font-syne font-black tracking-tighter uppercase italic mb-2">PRO ANALYTICS</h2>
         <p className="text-white/40 text-sm mb-10 leading-relaxed max-w-xs">Unlock deep insights, growth charts, and customer trends. Available for Thread Pro members.</p>
         <button onClick={() => setSellerFlowState('paywall')} className="w-full h-14 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
           Upgrade to Pro
         </button>
         <button onClick={() => setSellerFlowState('live')} className="mt-6 text-white/30 text-[10px] font-black uppercase tracking-widest italic">Return to Hub</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans pb-20">
      <header className="px-6 py-8 flex items-center justify-between sticky top-0 z-50 bg-black/80 backdrop-blur-xl">
         <div className="flex items-center gap-4">
            <button onClick={() => setSellerFlowState('live')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
               <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-syne font-black tracking-tighter uppercase italic">INSIGHTS</h1>
         </div>
         <div className="flex bg-white/5 p-1 rounded-xl">
            {(['7D', '30D', 'All'] as const).map(r => (
               <button 
                key={r} 
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${dateRange === r ? 'bg-white text-black' : 'text-white/40'}`}
               >
                 {r}
               </button>
            ))}
         </div>
      </header>

      <main className="px-6 py-4 flex flex-col gap-10">
        {/* KPI Cards */}
        <section className="grid grid-cols-2 gap-4">
           <div className="p-6 rounded-[32px] bg-[#0A0A0A] border border-white/5">
              <div className="flex items-center gap-2 text-primary mb-1">
                 <DollarSign size={12} />
                 <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Gross Revenue</span>
              </div>
              <div className="text-3xl font-syne font-black tracking-tighter italic">${totalRevenue.toFixed(0)}</div>
           </div>
           <div className="p-6 rounded-[32px] bg-[#0A0A0A] border border-white/5">
              <div className="flex items-center gap-2 text-white/40 mb-1">
                 <ShoppingBag size={12} />
                 <span className="text-[8px] font-black uppercase tracking-widest">Total Sales</span>
              </div>
              <div className="text-3xl font-syne font-black tracking-tighter italic">{totalSales}</div>
           </div>
        </section>

        {/* Dynamic Area Chart */}
        <section className="p-8 rounded-[40px] bg-[#0A0A0A] border border-white/5">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/30">Growth Forecast</h3>
              <ArrowUpRight size={16} className="text-primary" />
           </div>
           <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                       <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF5FA2" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FF5FA2" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="name" hide />
                    <YAxis dataKey="revenue" hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ color: '#FF5FA2', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#FF5FA2" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-6 flex justify-between items-center bg-white/5 p-4 rounded-2xl">
              <div className="flex flex-col">
                 <span className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-1">Profile Visits</span>
                 <span className="text-lg font-syne font-black italic">{totalViews}</span>
              </div>
              <div className="flex items-center gap-1 text-green-500 font-black text-[10px]">
                 <TrendingUp size={12} /> +12%
              </div>
           </div>
        </section>

        {/* Top Movers */}
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6 italic">Top Performing</h3>
          <div className="flex flex-col gap-3">
             {topProducts.map((p: any, i) => (
               <div key={`top-product-${i}`} className="flex items-center justify-between p-4 rounded-3xl bg-[#0A0A0A] border border-white/5">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl overflow-hidden grayscale">
                        <img src={p.img} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs font-bold truncate max-w-[120px]">{p.name}</span>
                        <span className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-1">{p.count} units sold</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-sm font-black italic">${p.revenue.toFixed(0)}</div>
                  </div>
               </div>
             ))}
          </div>
        </section>

        {/* Size Breakdown (Minimalist Bar chart) */}
        <section className="pb-10">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6 italic">Size Demand</h3>
           <div className="grid grid-cols-4 gap-4">
              {['XS', 'S', 'M', 'L'].map((size, idx) => (
                <div key={size} className="flex flex-col items-center gap-4">
                   <div className="w-full h-32 bg-white/5 rounded-2xl relative overflow-hidden flex items-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${20 + (idx * 20)}%` }}
                        className="w-full bg-white text-black flex items-center justify-center font-black text-[10px]"
                      >
                         {20 + (idx * 20)}%
                      </motion.div>
                   </div>
                   <span className="text-[10px] font-black uppercase italic">{size}</span>
                </div>
              ))}
           </div>
        </section>
      </main>
    </div>
  );
};

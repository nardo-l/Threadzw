// src/screens/Dashboard.tsx

import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  Menu,
  Bell,
  ChevronDown,
  Calendar,
  DollarSign,
  ShoppingBag, 
  Users,
  TrendingUp,
  Plus, 
  Store,
  Share2,
  Tag,
  Edit3,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { toast } from 'sonner';
import { Paywall } from './Paywall';
import { TrialBanner } from '../components/dashboard/TrialBanner';
import { GuidedWalkthrough } from '../components/dashboard/GuidedWalkthrough';
import { LaunchChecklist } from '../components/dashboard/LaunchChecklist';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading, subscription } = useAuth();
  const { shop, loading: shopLoading } = useShopContext();

  // Load live, real Supabase dashboard metrics for authenticated merchant's shop
  const {
    productsCount,
    availableProductsCount,
    outOfStockProductsCount,
    categoriesCount,
    totalRevenue,
    revenueChangePercent,
    totalOrders,
    ordersChangePercent,
    totalVisitors,
    visitorsChangePercent,
    conversionRate,
    conversionRateChangePercent,
    dailyChartData,
    topProducts,
    recentProducts,
    recentOrders,
    loading: dashboardLoading
  } = useDashboard(shop?.id);

  // Session check redirect
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login');
    }
  }, [session, authLoading, navigate]);

  // Determine if subscription/trial is active
  const isSubscriptionOrTrialActive = useMemo(() => {
    if (!session || !user || !subscription) return false;
    const now = new Date();

    if (subscription.status === 'trial') {
      const trialEndsAt = subscription.trial_ends_at;
      if (trialEndsAt) {
        const parsedTrialEnd = new Date(trialEndsAt);
        if (!isNaN(parsedTrialEnd.getTime()) && parsedTrialEnd > now) {
          return true;
        }
      }
    }

    if (subscription.status === 'active') {
      const subEndsAt = subscription.subscription_ends_at;
      if (subEndsAt) {
        const parsedSubEnd = new Date(subEndsAt);
        if (!isNaN(parsedSubEnd.getTime()) && parsedSubEnd > now) {
          return true;
        }
      }
    }

    return false;
  }, [subscription, session, user]);

  // Copy Shop Link
  const handleCopyShopLink = async () => {
    if (!shop) return;
    try {
      const url = `https://threadzw.vercel.app/shop/${shop.slug ? shop.slug.trim() : shop.id.trim()}?page=home`;
      await navigator.clipboard.writeText(url);
      toast.success('Shop link copied to clipboard!');
    } catch (err) {
      toast.error('Could not copy shop link');
    }
  };

  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const dateRangeLabel = useMemo(() => {
    if (!dailyChartData || dailyChartData.length === 0) return 'Last 7 days';
    const start = dailyChartData[0]?.dateLabel || '';
    const end = dailyChartData[dailyChartData.length - 1]?.dateLabel || '';
    return `${start} – ${end}`;
  }, [dailyChartData]);

  // Dynamic Chart Points Calculation
  const chartPointsStr = useMemo(() => {
    if (!dailyChartData || dailyChartData.length === 0) {
      return '35,140 103,140 171,140 239,140 307,140 375,140 443,140';
    }
    const maxVal = Math.max(...dailyChartData.map(d => d.orders || d.revenue), 1);
    const count = dailyChartData.length;
    
    return dailyChartData.map((d, i) => {
      const x = 35 + (i * (410 / Math.max(count - 1, 1)));
      const val = d.orders > 0 ? d.orders : (d.revenue > 0 ? d.revenue : 0);
      const y = maxVal > 0 ? 140 - ((val / maxVal) * 110) : 140;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [dailyChartData]);

  const hasChartActivity = useMemo(() => {
    return (dailyChartData || []).some(d => d.orders > 0 || d.revenue > 0);
  }, [dailyChartData]);

  if (shopLoading || authLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-[#bef500] w-8 h-8" />
        <span className="text-xs text-zinc-500 mt-4 font-mono">Loading merchant dashboard...</span>
      </div>
    );
  }

  // Gatekeeper checks
  if (!isSubscriptionOrTrialActive) {
    return <Paywall />;
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-8 space-y-8 text-center font-sans relative">
        <div className="w-20 h-20 rounded-3xl bg-[#bef500]/10 border border-[#bef500]/20 flex items-center justify-center text-[#bef500] relative z-10">
          <ShoppingBag size={32} />
        </div>
        <div className="space-y-3 relative z-10 max-w-sm">
          <h3 className="text-3xl font-black uppercase tracking-tight">No Shop Registered</h3>
          <p className="text-sm text-zinc-400 font-medium leading-relaxed">
            Initialize your storefront to start selling on ThreadZW.
          </p>
        </div>
        <button 
          onClick={() => navigate('/setup')} 
          className="px-10 py-4 bg-[#bef500] text-black font-extrabold text-sm uppercase tracking-wider rounded-full hover:opacity-90 transition-all cursor-pointer relative z-10"
        >
          Create Shop
        </button>
      </div>
    );
  }

  const userFirstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Merchant';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-black font-sans pb-28">
      {/* Top Header */}
      <header className="max-w-md mx-auto px-5 pt-6 pb-4 flex items-center justify-between bg-[#F8F9FA] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-zinc-200/50 rounded-xl transition-colors cursor-pointer"
          >
            <Menu size={22} className="text-zinc-900" />
          </button>
          
          <div className="flex items-center text-xl font-black tracking-tight">
            <span className="text-black">Thread</span>
            <span className="text-[#bef500] font-black">ZW</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/notifications')}
            className="relative p-2 hover:bg-zinc-200/50 rounded-xl transition-colors cursor-pointer"
          >
            <Bell size={20} className="text-zinc-800" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#bef500] rounded-full ring-2 ring-[#F8F9FA]" />
          </button>

          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold overflow-hidden border border-zinc-200">
              {userFirstName.charAt(0).toUpperCase()}
            </div>
            <ChevronDown size={14} className="text-zinc-500" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-5 space-y-5">
        <GuidedWalkthrough />
        <TrialBanner />
        <LaunchChecklist shop={shop} productsCount={productsCount} />

        {/* Greeting & Date Filter */}
        <div className="flex items-start justify-between gap-2 pt-1">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-950 flex items-center gap-2">
              {greetingText}, {userFirstName} <span className="text-xl">👋</span>
            </h1>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Live store statistics for <span className="font-bold text-zinc-800">{shop.name}</span>.
            </p>
          </div>

          <button className="shrink-0 bg-white border border-zinc-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 cursor-pointer">
            <Calendar size={14} className="text-zinc-500" />
            <span>{dateRangeLabel}</span>
            <ChevronDown size={13} className="text-zinc-400" />
          </button>
        </div>

        {/* 4 Primary Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Total Revenue */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Total Revenue</span>
              <div className="w-7 h-7 bg-[#bef500] rounded-lg flex items-center justify-center text-black font-bold">
                <DollarSign size={16} />
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-zinc-950 tracking-tight">
                ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] font-semibold text-[#82b300] mt-1 flex items-center gap-1">
                <span>{revenueChangePercent >= 0 ? `↑ ${revenueChangePercent}%` : `↓ ${Math.abs(revenueChangePercent)}%`}</span>
                <span className="text-zinc-400 font-normal">vs last week</span>
              </div>
            </div>
          </div>

          {/* Card 2: Orders */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Total Orders</span>
              <div className="w-7 h-7 bg-[#bef500] rounded-lg flex items-center justify-center text-black font-bold">
                <ShoppingBag size={15} />
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-zinc-950 tracking-tight">{totalOrders}</div>
              <div className="text-[11px] font-semibold text-[#82b300] mt-1 flex items-center gap-1">
                <span>{ordersChangePercent >= 0 ? `↑ ${ordersChangePercent}%` : `↓ ${Math.abs(ordersChangePercent)}%`}</span>
                <span className="text-zinc-400 font-normal">vs last week</span>
              </div>
            </div>
          </div>

          {/* Card 3: Visitors */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Store Visitors</span>
              <div className="w-7 h-7 bg-[#bef500] rounded-lg flex items-center justify-center text-black font-bold">
                <Users size={15} />
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-zinc-950 tracking-tight">{totalVisitors}</div>
              <div className="text-[11px] font-semibold text-[#82b300] mt-1 flex items-center gap-1">
                <span>{visitorsChangePercent >= 0 ? `↑ ${visitorsChangePercent}%` : `↓ ${Math.abs(visitorsChangePercent)}%`}</span>
                <span className="text-zinc-400 font-normal">vs last week</span>
              </div>
            </div>
          </div>

          {/* Card 4: Conversion Rate */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Conversion Rate</span>
              <div className="w-7 h-7 bg-[#bef500] rounded-lg flex items-center justify-center text-black font-bold">
                <TrendingUp size={15} />
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-zinc-950 tracking-tight">{conversionRate}%</div>
              <div className="text-[11px] font-semibold text-[#82b300] mt-1 flex items-center gap-1">
                <span>{conversionRateChangePercent >= 0 ? `↑ ${conversionRateChangePercent}%` : `↓ ${Math.abs(conversionRateChangePercent)}%`}</span>
                <span className="text-zinc-400 font-normal">vs last week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Overview Grid */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Inventory Status</h3>
            <button 
              onClick={() => navigate('/inventory')}
              className="text-xs font-bold text-zinc-900 hover:underline cursor-pointer"
            >
              Manage Catalog →
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-2.5">
              <div className="text-lg font-black text-zinc-950">{productsCount}</div>
              <div className="text-[10px] font-semibold text-zinc-500 mt-0.5">Total Products</div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5">
              <div className="text-lg font-black text-emerald-800">{availableProductsCount}</div>
              <div className="text-[10px] font-semibold text-emerald-600 mt-0.5">In Stock</div>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2.5">
              <div className="text-lg font-black text-rose-800">{outOfStockProductsCount}</div>
              <div className="text-[10px] font-semibold text-rose-600 mt-0.5">Out of Stock</div>
            </div>

            <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5">
              <div className="text-lg font-black text-amber-800">{categoriesCount}</div>
              <div className="text-[10px] font-semibold text-amber-600 mt-0.5">Categories</div>
            </div>
          </div>
        </div>

        {/* Orders Overview Chart Card */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-950">Orders Overview</h3>
            <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg">
              Past 7 days
            </span>
          </div>

          {/* Chart SVG */}
          <div className="pt-2 relative">
            <div className="relative h-40 w-full">
              {/* Grid background lines */}
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-zinc-400 font-medium">
                <div className="border-b border-zinc-100 pb-0.5">Active</div>
                <div className="border-b border-zinc-100 pb-0.5"></div>
                <div className="border-b border-zinc-100 pb-0.5"></div>
                <div>0</div>
              </div>

              {!hasChartActivity && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] z-10 text-center p-2">
                  <span className="text-xs font-bold text-zinc-600">No orders recorded in this period</span>
                  <span className="text-[10px] text-zinc-400 font-medium mt-0.5">Share your store link to receive WhatsApp orders</span>
                </div>
              )}

              {/* Line SVG */}
              <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 500 160">
                <polyline
                  fill="none"
                  stroke="#bef500"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartPointsStr}
                />
              </svg>
            </div>

            {/* X-axis date labels */}
            <div className="flex justify-between text-[10px] font-medium text-zinc-400 pt-3 px-1">
              {(dailyChartData || []).map((point, idx) => (
                <span key={idx}>{point.dateLabel}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-zinc-950">Quick Actions</h3>

          {/* 5 Quick Action Icon Buttons */}
          <div className="grid grid-cols-5 gap-2 text-center">
            <button 
              onClick={() => navigate('/add-product')}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl border border-zinc-200 bg-white group-hover:border-zinc-300 flex items-center justify-center text-zinc-800 transition-all shadow-2xs group-active:scale-95">
                <Plus size={20} className="stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-medium text-zinc-700 leading-tight">Add Product</span>
            </button>

            <button 
              onClick={() => {
                const url = `/shop/${shop.slug ? shop.slug.trim() : shop.id.trim()}?page=home`;
                window.open(url, '_blank');
              }}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl border border-zinc-200 bg-white group-hover:border-zinc-300 flex items-center justify-center text-zinc-800 transition-all shadow-2xs group-active:scale-95">
                <Store size={19} />
              </div>
              <span className="text-[10px] font-medium text-zinc-700 leading-tight">View Store</span>
            </button>

            <button 
              onClick={handleCopyShopLink}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl border border-zinc-200 bg-white group-hover:border-zinc-300 flex items-center justify-center text-zinc-800 transition-all shadow-2xs group-active:scale-95">
                <Share2 size={19} />
              </div>
              <span className="text-[10px] font-medium text-zinc-700 leading-tight">Share Store</span>
            </button>

            <button 
              onClick={() => toast.info('Discount feature ready to create new promo code.')}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl border border-zinc-200 bg-white group-hover:border-zinc-300 flex items-center justify-center text-zinc-800 transition-all shadow-2xs group-active:scale-95">
                <Tag size={19} />
              </div>
              <span className="text-[10px] font-medium text-zinc-700 leading-tight">Create Discount</span>
            </button>

            <button 
              onClick={() => navigate('/edit-shop')}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl border border-zinc-200 bg-white group-hover:border-zinc-300 flex items-center justify-center text-zinc-800 transition-all shadow-2xs group-active:scale-95">
                <Edit3 size={19} />
              </div>
              <span className="text-[10px] font-medium text-zinc-700 leading-tight">Customize Store</span>
            </button>
          </div>

          {/* Primary Add Product Button */}
          <button 
            onClick={() => navigate('/add-product')}
            className="w-full bg-[#bef500] text-black font-extrabold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
          >
            <Plus size={18} className="stroke-[3]" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Merchant Products Section (Real Data + Elegant Empty State) */}
        {productsCount === 0 ? (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-[#bef500]/20 text-zinc-900 border border-[#bef500]/30 flex items-center justify-center mx-auto">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-950">No products yet.</h3>
              <p className="text-xs text-zinc-500 font-medium mt-1 max-w-xs mx-auto leading-relaxed">
                Add your first product to activate your storefront catalog and accept WhatsApp orders.
              </p>
            </div>
            <button 
              onClick={() => navigate('/add-product')}
              className="px-6 py-2.5 bg-[#bef500] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={15} className="stroke-[2.5]" />
              <span>Add your first product</span>
            </button>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-950">Top Products</h3>
              <button 
                onClick={() => navigate('/inventory')}
                className="text-xs font-semibold text-zinc-500 hover:text-black cursor-pointer uppercase tracking-wider"
              >
                View all ({productsCount})
              </button>
            </div>

            <div className="space-y-3">
              {(topProducts.length > 0 ? topProducts : recentProducts).slice(0, 5).map((product) => {
                const pImg = product.images?.[0] || product.image_url;
                const isSoldOut = product.total_stock === 0 || product.status === 'sold_out';

                return (
                  <div key={product.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 overflow-hidden shrink-0 flex items-center justify-center text-zinc-400 font-bold text-[10px] border border-zinc-200">
                        {pImg ? (
                          <img 
                            src={pImg} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Package size={18} />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 truncate max-w-[170px]">{product.name}</div>
                        <div className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                          {isSoldOut ? (
                            <span className="text-rose-600 font-bold">Out of stock</span>
                          ) : (
                            <span>{product.total_stock || 0} in stock</span>
                          )}
                          <span>•</span>
                          <span>{product.category || 'General'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="font-extrabold text-zinc-950 text-xs">
                      ${Number(product.price || 0).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity / Sales Log Card */}
        {recentOrders.length > 0 && (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Recent Sales & Orders</h3>
            </div>
            <div className="space-y-2">
              {recentOrders.map((order, idx) => (
                <div key={`${order.id}-${idx}`} className="flex items-center justify-between py-1.5 border-b border-zinc-100 last:border-0 text-xs">
                  <div>
                    <div className="font-bold text-zinc-900">{order.title}</div>
                    <div className="text-[10px] text-zinc-400 font-medium">
                      {new Date(order.date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-600">+${Number(order.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
};

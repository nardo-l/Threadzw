// src/screens/Dashboard.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  Menu,
  ChevronDown,
  Calendar,
  ShoppingBag, 
  Users,
  TrendingUp,
  Plus, 
  Store,
  Share2,
  Edit3,
  Tag,
  Package,
  MessageSquare,
  ArrowRight,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from '../components/NotificationBell';
import { NotificationPromptBanner } from '../components/NotificationPromptBanner';
import { useDashboard } from '../hooks/useDashboard';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { ShopSetupChecklist } from '../components/dashboard/ShopSetupChecklist';
import { TutorialModal } from '../components/onboarding/TutorialModal';
import { toast } from 'sonner';
import { Paywall } from './Paywall';
import { paymentService } from '../services/paymentService';
import { DashboardPlanCard } from '../components/plans/DashboardPlanCard';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading, subscription } = useAuth();
  const { shop, loading: shopLoading, refreshShop } = useShopContext();
  const [dateFilter, setDateFilter] = useState('May 20 – May 26');
  const [chartFilter, setChartFilter] = useState('Last 7 days');
  const [dbPaymentVerified, setDbPaymentVerified] = useState<boolean | null>(null);

  // Force refresh shop record on mount to guarantee fresh Supabase state
  useEffect(() => {
    if (session && user) {
      refreshShop().catch(err => console.warn('Dashboard refreshShop note:', err));
    }
  }, [session, user]);

  // Check shop_payments table if shop object isn't marked paid yet
  useEffect(() => {
    let isMounted = true;
    if (shop?.id) {
      paymentService.getShopPaymentStatus(shop.id).then(res => {
        if (isMounted) {
          setDbPaymentVerified(res.isPaid);
        }
      }).catch(() => {
        if (isMounted) setDbPaymentVerified(false);
      });
    }
    return () => { isMounted = false; };
  }, [shop?.id, shop?.payment_status]);

  const {
    productsCount,
    liveProductsCount,
    totalVisitors,
    visitorsChangePercent,
    whatsappClicks,
    whatsappClicksChangePercent,
    conversionRate,
    conversionRateChangePercent,
    topProducts: realTopProducts,
    recentActivity,
    dailyVisitsChart,
    loading: dashboardLoading
  } = useDashboard(shop?.id);

  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (shop?.id) {
      const isCompleted = localStorage.getItem(`threadzw_tutorial_completed_${shop.id}`) === 'true';
      if (!isCompleted) {
        setShowTutorial(true);
      }
    }
  }, [shop?.id]);

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login');
    } else if (!authLoading && !shopLoading && session && !shop) {
      navigate('/signup');
    }
  }, [session, shop, authLoading, shopLoading, navigate]);

  useEffect(() => {
    if (localStorage.getItem('threadzw_just_subscribed') === 'true') {
      localStorage.removeItem('threadzw_just_subscribed');
      toast.success('Premium access is active. Welcome to ThreadZW.');
    }
  }, []);

  const isShopPaidAndActive = useMemo(() => {
    if (!session || !user) return false;

    // Check verified database payment or shop object flags
    if (dbPaymentVerified === true) return true;

    if (shop) {
      if (shop.payment_status === 'paid' && shop.payment_required === false) {
        return true;
      }
    }

    return false;
  }, [shop, session, user, dbPaymentVerified]);

  const handleCopyShopLink = async () => {
    if (!shop) return;
    try {
      const url = `${window.location.origin}/shop/${shop.slug ? shop.slug.trim() : shop.id.trim()}?page=home`;
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

  // Real 7-day shop visits chart calculation (Hook must be called unconditionally)
  const maxVisitsScale = useMemo(() => {
    if (!dailyVisitsChart || dailyVisitsChart.length === 0) return 10;
    const maxVal = Math.max(...dailyVisitsChart.map(p => p.visits));
    return maxVal > 0 ? maxVal : 5;
  }, [dailyVisitsChart]);

  const visitPoints = useMemo(() => {
    if (!dailyVisitsChart || dailyVisitsChart.length === 0) {
      return [
        { day: 'Day 1', visits: 0, x: 10, y: 75 },
        { day: 'Day 2', visits: 0, x: 23.3, y: 75 },
        { day: 'Day 3', visits: 0, x: 36.6, y: 75 },
        { day: 'Day 4', visits: 0, x: 50, y: 75 },
        { day: 'Day 5', visits: 0, x: 63.3, y: 75 },
        { day: 'Day 6', visits: 0, x: 76.6, y: 75 },
        { day: 'Day 7', visits: 0, x: 90, y: 75 },
      ];
    }

    return dailyVisitsChart.map((pt, idx) => {
      const xPct = 10 + idx * 13.33;
      const ratio = Math.min(1, Math.max(0, pt.visits / maxVisitsScale));
      const yVal = 75 - ratio * 60;
      return {
        day: pt.day,
        visits: pt.visits,
        x: xPct,
        y: yVal
      };
    });
  }, [dailyVisitsChart, maxVisitsScale]);

  if (shopLoading || authLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-black flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-[#A1DF00] w-8 h-8" />
        <span className="text-xs text-zinc-400 mt-4 font-medium">Loading store dashboard...</span>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center text-black p-8 space-y-6 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-[#CCFF00] flex items-center justify-center text-black shadow-sm">
          <ShoppingBag size={28} />
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="text-2xl font-bold tracking-tight">No Shop Registered</h3>
          <p className="text-xs text-zinc-500 font-normal leading-relaxed">
            Initialize your storefront so customers can browse and send WhatsApp enquiries on ThreadZW.
          </p>
        </div>
        <button 
          onClick={() => navigate('/setup')} 
          className="px-8 py-3.5 bg-[#CCFF00] text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-sm"
        >
          Create Shop
        </button>
      </div>
    );
  }

  const userFirstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Store Owner';

  const polylinePoints = visitPoints.map(p => `${p.x * 3.5},${p.y}`).join(' ');

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111] font-sans pb-28">
      {/* Top Navigation Bar */}
      <header className="max-w-4xl mx-auto px-5 pt-4 pb-3 flex items-center justify-between sticky top-0 z-30 bg-[#F8F9FA]/90 backdrop-blur-md">
        <button 
          onClick={() => navigate('/settings')}
          className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
        >
          <Menu size={22} className="text-zinc-900" />
        </button>

        <div className="flex items-center text-xl font-bold tracking-tight cursor-pointer" onClick={() => navigate('/dashboard')}>
          <span className="text-black">Thread</span>
          <span className="text-[#96D100] ml-0.5">ZW</span>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <div 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-zinc-200">
              {userFirstName.substring(0, 2).toUpperCase()}
            </div>
            <ChevronDown size={14} className="text-zinc-500" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-3 space-y-5">
        {/* Greeting Section & Date Range Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              {greetingText}, {userFirstName} <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-xs text-zinc-500 font-normal mt-0.5">
              Here's what's happening with your store today.
            </p>
          </div>

          <button 
            onClick={() => setDateFilter(dateFilter === 'May 20 – May 26' ? 'May 13 – May 19' : 'May 20 – May 26')}
            className="inline-flex items-center gap-2 bg-white border border-zinc-200/80 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:border-zinc-300 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Calendar size={14} className="text-zinc-400" />
            <span>{dateFilter}</span>
            <ChevronDown size={13} className="text-zinc-400 ml-0.5" />
          </button>
        </div>

        {/* Push Notification Permission Banner */}
        <NotificationPromptBanner userId={user?.id} />

        {/* Shop Setup Checklist */}
        <ShopSetupChecklist 
          shop={shop}
          productsCount={productsCount}
          isShopPaidAndActive={isShopPaidAndActive}
        />

        {/* Plan Status & Entitlement Usage */}
        <DashboardPlanCard
          shop={shop}
          productsCount={productsCount}
          liveProductsCount={liveProductsCount}
        />

        {/* 4 Metric / KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Products / Total Vehicles */}
          <div className="bg-white border border-zinc-200/70 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-zinc-500">
                {shop?.page_type === 'vehicles' ? 'Total Vehicles' : 'Total Products'}
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#CCFF00] flex items-center justify-center text-black font-bold">
                <Package size={15} className="stroke-[2.5]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">{productsCount}</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-lime-600">
              <span>{liveProductsCount} active</span>
              <span className="text-zinc-400 font-normal">
                {shop?.page_type === 'vehicles' ? 'in showroom' : 'in store catalog'}
              </span>
            </div>
          </div>

          {/* Card 2: Customer Interests */}
          <div className="bg-white border border-zinc-200/70 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-zinc-500">Customer Interests</span>
              <div className="w-7 h-7 rounded-lg bg-[#CCFF00] flex items-center justify-center text-black font-bold">
                <MessageSquare size={15} className="stroke-[2.5]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">{whatsappClicks}</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-lime-600">
              <span>↑ {whatsappClicksChangePercent}%</span>
              <span className="text-zinc-400 font-normal">vs last week</span>
            </div>
          </div>

          {/* Card 3: Visitors */}
          <div className="bg-white border border-zinc-200/70 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-zinc-500">Visitors</span>
              <div className="w-7 h-7 rounded-lg bg-[#CCFF00] flex items-center justify-center text-black font-bold">
                <Users size={15} className="stroke-[2.5]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">{totalVisitors.toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-lime-600">
              <span>↑ {visitorsChangePercent}%</span>
              <span className="text-zinc-400 font-normal">vs last week</span>
            </div>
          </div>

          {/* Card 4: Conversion Rate */}
          <div className="bg-white border border-zinc-200/70 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-zinc-500">Conversion Rate</span>
              <div className="w-7 h-7 rounded-lg bg-[#CCFF00] flex items-center justify-center text-black font-bold">
                <TrendingUp size={15} className="stroke-[2.5]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">{conversionRate}%</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-lime-600">
              <span>↑ {conversionRateChangePercent}%</span>
              <span className="text-zinc-400 font-normal">vs last week</span>
            </div>
          </div>
        </div>

        {/* Real Shop Visits Overview Chart Card */}
        <div className="bg-white border border-zinc-200/70 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Shop Visits Overview</h3>
              <p className="text-[11px] text-zinc-400 font-normal">Real storefront visitors over the past 7 days</p>
            </div>
            <button 
              onClick={() => setChartFilter(chartFilter === 'Last 7 days' ? 'Last 30 days' : 'Last 7 days')}
              className="flex items-center gap-1.5 bg-white border border-zinc-200/80 rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:border-zinc-300 transition-colors cursor-pointer"
            >
              <span>{chartFilter}</span>
              <ChevronDown size={13} className="text-zinc-400" />
            </button>
          </div>

          {/* SVG Line Chart */}
          <div className="pt-2 pb-1 relative">
            <div className="h-44 w-full flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 350 85" preserveAspectRatio="none">
                {/* Horizontal Gridlines */}
                <line x1="0" y1="0" x2="350" y2="0" stroke="#F1F3F5" strokeWidth="1" />
                <line x1="0" y1="20" x2="350" y2="20" stroke="#F1F3F5" strokeWidth="1" />
                <line x1="0" y1="40" x2="350" y2="40" stroke="#F1F3F5" strokeWidth="1" />
                <line x1="0" y1="60" x2="350" y2="60" stroke="#F1F3F5" strokeWidth="1" />
                <line x1="0" y1="80" x2="350" y2="80" stroke="#F1F3F5" strokeWidth="1" strokeDasharray="2 2" />

                {/* Electric Lime Green Trend Line */}
                <polyline
                  fill="none"
                  stroke="#CCFF00"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePoints}
                />

                {/* Plot Data Dots */}
                {visitPoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x * 3.5}
                    cy={pt.y}
                    r="4"
                    fill="#CCFF00"
                    stroke="#000"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
            </div>

            {/* Y Axis Labels */}
            <div className="absolute top-0 left-0 bottom-6 flex flex-col justify-between text-[10px] text-zinc-400 font-normal pointer-events-none">
              <span>{maxVisitsScale}</span>
              <span>{Math.round(maxVisitsScale * 0.75)}</span>
              <span>{Math.round(maxVisitsScale * 0.5)}</span>
              <span>{Math.round(maxVisitsScale * 0.25)}</span>
              <span>0</span>
            </div>

            {/* X Axis Date Labels */}
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-normal pt-3 px-1">
              {visitPoints.map((pt) => (
                <span key={pt.day}>{pt.day}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white border border-zinc-200/70 rounded-2xl p-5 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-zinc-900">Quick Actions</h3>

          {/* Quick Action Icon Buttons (Removed small white Add Product & Create Discount) */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <button 
              onClick={() => {
                const url = `${window.location.origin}/shop/${shop.slug ? shop.slug.trim() : shop.id.trim()}?page=home`;
                window.open(url, '_blank');
              }}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl border border-zinc-200/80 bg-white group-hover:bg-zinc-50 flex items-center justify-center text-zinc-800 transition-all shadow-2xs group-active:scale-95">
                <Store size={20} className="stroke-[1.8]" />
              </div>
              <span className="text-[11px] font-normal text-zinc-700 leading-tight">View Store</span>
            </button>

            <button 
              onClick={handleCopyShopLink}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl border border-zinc-200/80 bg-white group-hover:bg-zinc-50 flex items-center justify-center text-zinc-800 transition-all shadow-2xs group-active:scale-95">
                <Share2 size={20} className="stroke-[1.8]" />
              </div>
              <span className="text-[11px] font-normal text-zinc-700 leading-tight">Share Store</span>
            </button>

            <button 
              onClick={() => navigate('/edit-shop')}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl border border-zinc-200/80 bg-white group-hover:bg-zinc-50 flex items-center justify-center text-zinc-800 transition-all shadow-2xs group-active:scale-95">
                <Edit3 size={20} className="stroke-[1.8]" />
              </div>
              <span className="text-[11px] font-normal text-zinc-700 leading-tight">Customize Store</span>
            </button>
          </div>

          {/* Wide Prominent + ADD PRODUCT / + ADD VEHICLE Green CTA Button */}
          <button 
            onClick={() => navigate(shop?.page_type === 'vehicles' ? '/add-vehicle' : '/add-product')}
            className="w-full h-12 bg-[#CCFF00] hover:bg-[#bbf000] text-black rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <Plus size={18} className="stroke-[2.5]" /> 
            {shop?.page_type === 'vehicles' ? 'ADD VEHICLE' : 'ADD PRODUCT'}
          </button>
        </div>

        {/* 2-Column Section: Recent Activity & Top Products (NO DUMMY DATA) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Customer Enquiries & Activity */}
          <div className="bg-white border border-zinc-200/70 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                {shop?.page_type === 'vehicles' ? 'Recent WhatsApp Inquiries' : 'Recent Customer Enquiries'}
              </h3>
              <button 
                onClick={() => navigate('/analytics')}
                className="text-xs font-medium text-zinc-500 hover:text-black cursor-pointer transition-colors"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 4).map((act) => (
                  <div key={act.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50/80 transition-colors border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        {act.type === 'whatsapp' ? <MessageSquare size={18} /> : <Users size={18} />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 line-clamp-1">{act.title}</h4>
                        <div className="text-[11px] text-zinc-400 font-normal">
                          {act.timeAgo}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 shrink-0">
                      Active
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">No recent WhatsApp inquiries yet</p>
                  <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">Share your showroom link to start receiving customer WhatsApp inquiries.</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products / Top Vehicles */}
          <div className="bg-white border border-zinc-200/70 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                {shop?.page_type === 'vehicles' ? 'Showroom Inventory' : 'Top Products'}
              </h3>
              <button 
                onClick={() => navigate('/inventory')}
                className="text-xs font-medium text-zinc-500 hover:text-black cursor-pointer transition-colors"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {realTopProducts && realTopProducts.length > 0 ? (
                realTopProducts.slice(0, 4).map((prod) => (
                  <div key={prod.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50/80 transition-colors">
                    <div className="flex items-center gap-3">
                      {prod.images && prod.images[0] ? (
                        <img 
                          src={prod.images[0]} 
                          alt={prod.name} 
                          className="w-11 h-11 rounded-lg object-cover bg-zinc-100 shrink-0" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                          <Package size={20} />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">{prod.name}</h4>
                        <span className="text-[11px] text-zinc-400 font-normal">{prod.whatsapp_clicks || 0} WhatsApp clicks</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-zinc-900">
                      ${(prod.price || 0).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">No products in store catalog</p>
                  <button 
                    onClick={() => navigate('/add-product')} 
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#85B800] hover:underline cursor-pointer"
                  >
                    Add your first product <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 5-SCREEN TUTORIAL MODAL */}
      {showTutorial && shop?.id && (
        <TutorialModal shopId={shop.id} onComplete={() => setShowTutorial(false)} />
      )}

      <BottomNavBar />
    </div>
  );
};


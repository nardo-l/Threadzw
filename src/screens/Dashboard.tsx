// src/screens/Dashboard.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  Menu,
  Bell,
  ChevronDown,
  Calendar,
  ShoppingBag, 
  Users,
  TrendingUp,
  Plus, 
  Store,
  Share2,
  Edit3,
  Package,
  MessageSquare,
  Percent,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { useShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { toast } from 'sonner';
import { Paywall } from './Paywall';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading, subscription } = useAuth();
  const { shop, loading: shopLoading } = useShopContext();
  const [timeFilter, setTimeFilter] = useState('This Week');

  const {
    totalVisitors,
    visitorsChangePercent,
    whatsappClicks,
    whatsappClicksChangePercent,
    conversionRate,
    conversionRateChangePercent,
    visitShopClicks,
    visitShopClicksChangePercent,
    topProducts,
    trafficSources,
    storeHealth,
    recentActivity,
    loading: dashboardLoading
  } = useDashboard(shop?.id);

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login');
    }
  }, [session, authLoading, navigate]);

  useEffect(() => {
    if (localStorage.getItem('threadzw_just_subscribed') === 'true') {
      localStorage.removeItem('threadzw_just_subscribed');
      toast.success('Subscription activated successfully! Welcome to ThreadZW Pro 🚀');
    }
  }, []);

  const isProActive = subscription?.status === 'active';
  const subEndsAt = isProActive ? subscription?.subscription_ends_at : subscription?.trial_ends_at || shop?.trial_ends_at;

  let daysRemaining = 0;
  if (subEndsAt) {
    const diff = new Date(subEndsAt).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

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

  if (shopLoading || authLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-[#D7FF00] w-8 h-8" />
        <span className="text-xs text-zinc-500 mt-4 font-mono">Loading dashboard analytics...</span>
      </div>
    );
  }

  if (!isSubscriptionOrTrialActive) {
    return <Paywall />;
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-8 space-y-8 text-center font-sans relative">
        <div className="w-20 h-20 rounded-3xl bg-[#D7FF00]/10 border border-[#D7FF00]/20 flex items-center justify-center text-[#D7FF00] relative z-10">
          <ShoppingBag size={32} />
        </div>
        <div className="space-y-3 relative z-10 max-w-sm">
          <h3 className="text-3xl font-black uppercase tracking-tight">No Shop Registered</h3>
          <p className="text-sm text-zinc-400 font-medium leading-relaxed">
            Initialize your storefront to start receiving WhatsApp orders on ThreadZW.
          </p>
        </div>
        <button 
          onClick={() => navigate('/setup')} 
          className="px-10 py-4 bg-[#D7FF00] text-black font-extrabold text-sm uppercase tracking-wider rounded-full hover:opacity-90 transition-all cursor-pointer relative z-10"
        >
          Create Shop
        </button>
      </div>
    );
  }

  const userFirstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Nardo';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-black font-sans pb-32">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between bg-[#F8F9FA] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-zinc-200/50 rounded-xl transition-colors cursor-pointer"
          >
            <Menu size={22} className="text-zinc-900" />
          </button>
          
          <div className="flex items-center text-xl font-black tracking-tight cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span className="text-black">Thread</span>
            <span className="text-[#D7FF00] bg-black px-1 rounded font-black ml-0.5">ZW</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/notifications')}
            className="relative p-2 hover:bg-zinc-200/50 rounded-xl transition-colors cursor-pointer"
          >
            <Bell size={20} className="text-zinc-800" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D7FF00] rounded-full ring-2 ring-[#F8F9FA]" />
          </button>
          
          <div 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-black text-[#D7FF00] font-black text-sm flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 transition-transform"
          >
            {userFirstName.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        {/* Greeting & Time Filter Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-950 flex items-center gap-2">
              {greetingText}, {userFirstName} <span className="text-2xl">👋</span>
            </h1>
            <p className="text-sm text-zinc-500 font-medium mt-1">
              Here's what's happening in your store today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-2xs">
              <Calendar size={14} className="text-zinc-500" />
              <span>{timeFilter}</span>
              <ChevronDown size={14} className="text-zinc-400" />
            </div>

            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-2xs">
              <span className="text-zinc-500">Compare to:</span>
              <span>Previous Period</span>
              <ChevronDown size={14} className="text-zinc-400" />
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-zinc-950">Quick Actions</h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <button 
              onClick={() => {
                const url = `https://threadzw.vercel.app/shop/${shop.slug ? shop.slug.trim() : shop.id.trim()}?page=home`;
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
              onClick={() => navigate('/edit-shop')}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl border border-zinc-200 bg-white group-hover:border-zinc-300 flex items-center justify-center text-zinc-800 transition-all shadow-2xs group-active:scale-95">
                <Edit3 size={19} />
              </div>
              <span className="text-[10px] font-medium text-zinc-700 leading-tight">Customize Store</span>
            </button>
          </div>

          <button 
            onClick={() => navigate('/add-product')}
            className="w-full h-14 bg-[#D7FF00] text-black rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-wider text-xs shadow-md hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus size={18} strokeWidth={3} /> Add Product
          </button>
        </div>

        {/* 4 Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Store Visitors */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
              <Users size={20} className="stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Store Visitors</span>
              <div className="text-3xl font-black text-zinc-950 tracking-tight mt-1">{totalVisitors}</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <TrendingUp size={14} />
              <span>↑{visitorsChangePercent}% vs last week</span>
            </div>
          </div>

          {/* Card 2: WhatsApp Button Clicks */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D7FF00]/10 rounded-bl-full pointer-events-none" />
            <div className="w-10 h-10 rounded-xl bg-[#D7FF00]/20 flex items-center justify-center text-zinc-950">
              <MessageSquare size={20} className="stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">WhatsApp Clicks</span>
              <div className="text-3xl font-black text-zinc-950 tracking-tight mt-1">{whatsappClicks}</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <TrendingUp size={14} />
              <span>↑{whatsappClicksChangePercent}% vs last week</span>
            </div>
          </div>

          {/* Card 3: Conversion Rate */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
              <Percent size={20} className="stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Conversion Rate</span>
              <div className="text-3xl font-black text-zinc-950 tracking-tight mt-1">{conversionRate}%</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <TrendingUp size={14} />
              <span>↑{conversionRateChangePercent}% vs last week</span>
            </div>
          </div>

          {/* Card 4: Visit Shop Clicks */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
              <MapPin size={20} className="stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Visit Shop Clicks</span>
              <div className="text-3xl font-black text-zinc-950 tracking-tight mt-1">{visitShopClicks}</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <TrendingUp size={14} />
              <span>↑{visitShopClicksChangePercent}% vs last week</span>
            </div>
          </div>
        </div>

        {/* Top Performing Products & Traffic Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Performing Products */}
          <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-950">Top Performing Products</h3>
                <p className="text-xs text-zinc-500">Ranked by WhatsApp clicks</p>
              </div>
              <button 
                onClick={() => navigate('/inventory')}
                className="text-xs font-extrabold text-zinc-900 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                View all <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div key={p.id || idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-xs font-extrabold text-zinc-400">0{idx + 1}</span>
                    <div className="w-11 h-11 rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200">
                      {p.images && p.images[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Package size={20} className="text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{p.name}</h4>
                      <span className="text-xs text-zinc-500 font-medium">USD ${(p.price || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-zinc-950">{p.whatsapp_clicks}</span>
                    <span className="text-[10px] text-zinc-500 block uppercase font-medium">WhatsApp Clicks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-950">Traffic Sources</h3>
              <p className="text-xs text-zinc-500">Where visitors came from</p>
            </div>

            <div className="flex flex-col items-center justify-center my-auto py-4">
              <div className="relative w-44 h-44 rounded-full border-[16px] border-[#D7FF00] flex items-center justify-center shadow-inner">
                <div className="text-center">
                  <span className="text-2xl font-black text-zinc-950">100%</span>
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">Verified</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {trafficSources.map((src, i) => (
                <div key={src.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-[#D7FF00]' : i === 1 ? 'bg-zinc-950' : i === 2 ? 'bg-zinc-400' : 'bg-zinc-200'}`} />
                    <span className="font-bold text-zinc-800">{src.name}</span>
                  </div>
                  <span className="font-black text-zinc-950">{src.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Store Health & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Store Health */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-950">Store Health</h3>
                <p className="text-xs text-zinc-500">Catalog completeness status</p>
              </div>
              <button 
                onClick={() => navigate('/inventory')}
                className="text-xs font-extrabold text-zinc-900 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                Manage <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Package size={16} />
                  </div>
                  <span className="text-sm font-bold text-zinc-800">Products Live</span>
                </div>
                <span className="text-sm font-black text-zinc-950">{storeHealth.live}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <AlertCircle size={16} />
                  </div>
                  <span className="text-sm font-bold text-zinc-800">Out of Stock</span>
                </div>
                <span className="text-sm font-black text-rose-600">{storeHealth.outOfStock}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <span className="text-sm font-bold text-zinc-800">Draft Products</span>
                </div>
                <span className="text-sm font-black text-zinc-950">{storeHealth.draft}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  <span className="text-sm font-bold text-zinc-800">Missing Images</span>
                </div>
                <span className="text-sm font-black text-purple-600">{storeHealth.missingImages}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <ShoppingBag size={16} />
                  </div>
                  <span className="text-sm font-bold text-zinc-800">Low Stock</span>
                </div>
                <span className="text-sm font-black text-blue-600">{storeHealth.lowStock}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-zinc-950">Recent Activity</h3>
              <p className="text-xs text-zinc-500">Chronological visitor interactions</p>
            </div>

            <div className="space-y-4">
              {recentActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-3 pb-3 border-b border-zinc-100 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800 shrink-0 mt-0.5">
                    {act.type === 'whatsapp' ? <MessageSquare size={14} className="text-emerald-600" /> : <Users size={14} className="text-zinc-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-zinc-900">{act.title}</p>
                    <span className="text-[10px] text-zinc-400 font-medium">{act.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-950">Subscription</h3>
            <span className="text-xs font-bold text-zinc-500">{isProActive ? 'Pro Plan' : 'Starter Plan'}</span>
          </div>

          <div className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Current Plan</span>
                <h4 className="text-lg font-black text-zinc-950 mt-0.5">
                  {isProActive ? 'ThreadZW Pro' : '14-Day Free Trial'}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-zinc-950">{isProActive ? '∞' : daysRemaining}</span>
                <span className="text-[10px] text-zinc-500 uppercase block font-bold">{isProActive ? 'Active' : 'Days Remaining'}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#D7FF00] h-full rounded-full" 
                style={{ width: isProActive ? '100%' : `${Math.min(100, Math.max(10, (daysRemaining / 14) * 100))}%` }} 
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
              <span>{isProActive ? 'Subscription Active' : 'Trial active'}</span>
              <span>{isProActive ? (subEndsAt ? `Renews on ${new Date(subEndsAt).toLocaleDateString()}` : 'Pro Active') : `Trial ends in ${daysRemaining} days`}</span>
            </div>
          </div>

          {!isProActive && (
            <button 
              onClick={() => navigate('/subscription')}
              className="w-full h-14 bg-[#D7FF00] text-black rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-wider text-xs shadow-md hover:opacity-95 transition-all cursor-pointer"
            >
              Upgrade for $2.99 / month
            </button>
          )}
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
};

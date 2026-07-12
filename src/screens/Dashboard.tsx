// src/screens/Dashboard.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ChevronRight, 
  Settings, 
  Plus, 
  ExternalLink, 
  Loader2, 
  ShoppingBag, 
  ArrowRight,
  Clock,
  Sparkles,
  Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { getAbsoluteShopUrl } from '../utils/shopUrl';
import { seedShopProductsIfEmpty } from '../utils/seedData';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { toast } from 'sonner';
import { Paywall } from './Paywall';

export const Dashboard: React.FC<{ initialLocked?: boolean }> = ({ initialLocked }) => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading, subscription } = useAuth();
  const { shop, refreshShop, loading: shopLoading } = useShopContext();

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProds, setLoadingProds] = useState(true);

  useEffect(() => {
    if (shop) {
      console.log("FORENSIC START: Redesigned Dashboard mounting");
      fetchDashboardData(shop.id);
    }
  }, [shop]);

  const fetchDashboardData = async (shopId: string) => {
    try {
      setLoadingProds(true);
      const pData = await seedShopProductsIfEmpty(supabase, shopId, user?.id || '');
      setProducts(pData || []);
    } catch (err: any) {
      console.error('Dashboard products fetch error:', err);
      toast.error('Failed to load products');
    } finally {
      setLoadingProds(false);
    }
  };

  const ownerName = useMemo(() => {
    if (shop?.name) {
      // Return the brand/shop name if available to welcome them specifically
      return shop.name;
    }
    const emailPrefix = user?.email?.split('@')[0] || 'Leonardo';
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }, [shop, user]);

  // Product Counts for Product Overview Section
  const productStats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.is_published || p.status === 'active').length;
    const draft = products.filter(p => !p.is_published || p.status === 'draft').length;
    const outOfStock = products.filter(p => p.total_stock === 0 || p.status === 'sold_out').length;

    return [
      { label: 'Products', value: total },
      { label: 'Active Products', value: active },
      { label: 'Draft Products', value: draft },
      { label: 'Out of Stock', value: outOfStock }
    ];
  }, [products]);

  // Generate dynamic, real Supabase-connected timeline items
  const timelineActivities = useMemo(() => {
    const list = [];

    // 1. Product added activity
    if (products.length > 0) {
      const latestProduct = [...products].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      list.push({
        id: 'prod-add',
        title: 'Product added',
        description: `Listed "${latestProduct.name}" under ${latestProduct.category || 'Clothing'}.`,
        time: latestProduct.created_at ? new Date(latestProduct.created_at) : new Date()
      });
    }

    // 2. Banner updated activity (based on shop banner presence)
    if (shop?.banner_url) {
      list.push({
        id: 'banner-up',
        title: 'Banner updated',
        description: 'Brand showcase hero banner was changed and saved.',
        time: new Date(shop.updated_at || shop.created_at || Date.now())
      });
    }

    // 3. Logo changed activity (based on shop logo presence)
    if (shop?.logo_url) {
      list.push({
        id: 'logo-chg',
        title: 'Logo changed',
        description: 'Brand trademark identity logo was configured.',
        time: new Date(shop.updated_at || shop.created_at || Date.now())
      });
    }

    // 4. Shop published activity (based on is_live status)
    if (shop?.is_live) {
      list.push({
        id: 'shop-pub',
        title: 'Shop published',
        description: 'Store is live online and ready to accept WhatsApp coordinates.',
        time: new Date(shop.updated_at || shop.created_at || Date.now())
      });
    }

    // 5. Default Collection created (always present once shop is setup)
    if (shop) {
      list.push({
        id: 'coll-cre',
        title: 'Collection created',
        description: 'Default Season Collection was initialized.',
        time: new Date(shop.created_at || Date.now())
      });
    }

    // Sort by time descending, limit to 5
    return list
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5);
  }, [products, shop]);

  const formatActivityTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handlePreviewShop = () => {
    if (!shop) return;
    try {
      const url = getAbsoluteShopUrl(shop.slug || shop.handle, shop.id);
      window.open(url, '_blank');
    } catch (err: any) {
      toast.error('Could not construct shop URL');
    }
  };

  const handleCopyShopLink = async () => {
    if (!shop) return;
    try {
      const url = `https://threadzw.vercel.app/shop/${shop.id.trim()}?page=home`;
      await navigator.clipboard.writeText(url);
      toast.success('Shop link copied to clipboard!');
    } catch (err: any) {
      toast.error('Could not copy shop link');
    }
  };

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
  const defaultBanner = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80';

  // 1. Session check redirect
  useEffect(() => {
    console.log("[FORENSIC-DASHBOARD] Session verification check. authLoading:", authLoading, "hasSession:", !!session);
    if (!authLoading && !session) {
      console.log("[FORENSIC-DASHBOARD] Unauthenticated user on dashboard. Redirecting to /login...");
      navigate('/login');
    }
  }, [session, authLoading, navigate]);

  // Handle payment redirect success and refresh state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log("[FORENSIC-DASHBOARD] URL search params check:", params.toString());
    if (params.get('payment') === 'success') {
      toast.success('Your subscription is now active! Welcome back.');
      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 1000);
    }
  }, []);

  // 2. Load and verify user subscription/trial
  const isSubscriptionOrTrialActive = useMemo(() => {
    console.log("[FORENSIC-DASHBOARD] isSubscriptionOrTrialActive evaluation triggered. hasSession:", !!session, "hasUser:", !!user, "subscriptionData:", subscription);
    if (!session || !user) {
      console.log("[FORENSIC-DASHBOARD] Subscription check: false (no session or user).");
      return false;
    }
    if (!subscription) {
      console.log("[FORENSIC-DASHBOARD] Subscription check: false (subscription object is null or undefined).");
      return false;
    }

    const now = new Date();
    console.log("[FORENSIC-DASHBOARD] Comparing subscription status with current time:", now.toISOString());

    if (subscription.status === 'trial') {
      const trialEndsAt = subscription.trial_ends_at;
      console.log("[FORENSIC-DASHBOARD] Subscription is 'trial'. trial_ends_at:", trialEndsAt);
      if (trialEndsAt) {
        const parsedTrialEnd = new Date(trialEndsAt);
        const isValid = !isNaN(parsedTrialEnd.getTime()) && parsedTrialEnd > now;
        console.log(`[FORENSIC-DASHBOARD] Trial parsed end: ${parsedTrialEnd.toISOString()}, is greater than now: ${isValid}`);
        if (isValid) {
          return true;
        }
      }
    }

    if (subscription.status === 'active') {
      const subEndsAt = subscription.subscription_ends_at;
      console.log("[FORENSIC-DASHBOARD] Subscription is 'active'. subscription_ends_at:", subEndsAt);
      if (subEndsAt) {
        const parsedSubEnd = new Date(subEndsAt);
        const isValid = !isNaN(parsedSubEnd.getTime()) && parsedSubEnd > now;
        console.log(`[FORENSIC-DASHBOARD] Subscription parsed end: ${parsedSubEnd.toISOString()}, is greater than now: ${isValid}`);
        if (isValid) {
          return true;
        }
      }
    }

    console.log("[FORENSIC-DASHBOARD] Subscription check: false (status is not active trial/sub, or has expired). Status:", subscription.status);
    return false;
  }, [subscription, session, user]);

  console.log("[FORENSIC-DASHBOARD] Render checks. shopLoading:", shopLoading, "authLoading:", authLoading, "shopExist:", !!shop, "isSubscriptionOrTrialActive:", isSubscriptionOrTrialActive);

  if (shopLoading || authLoading) {
    console.log(`[FORENSIC-DASHBOARD] Rendering Loading Spinner (Loader2). shopLoading: ${shopLoading}, authLoading: ${authLoading}`);
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-black w-8 h-8" />
        <span className="text-xs text-zinc-500 mt-4 font-mono">
          Loading brand data (shop: {shopLoading ? "loading" : "done"}, auth: {authLoading ? "loading" : "done"})...
        </span>
      </div>
    );
  }

  // 3. Gatekeeper redirects based on subscription and shop state
  if (!isSubscriptionOrTrialActive) {
    console.log("[FORENSIC-DASHBOARD] Redirecting layout to Paywall...");
    return <Paywall />;
  }

  if (!shop) {
    console.log("[FORENSIC-DASHBOARD] No shop registered. Displaying Initialize Brand Slot UI.");
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-zinc-950 p-8 space-y-8 text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
          <ShoppingBag size={24} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-black">No Brand Registered</h3>
          <p className="text-sm text-zinc-500 max-w-sm font-medium">Create your signature digital storefront to begin showcase coordination on ThreadZW.</p>
        </div>
        <button 
          onClick={() => navigate('/setup')} 
          className="px-8 py-4 bg-[#25D366] text-black font-black text-sm rounded-full hover:bg-[#20ba5a] active:scale-95 transition-all cursor-pointer"
        >
          Initialize Brand Slot
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#25D366] selection:text-black pb-32">
      
      {/* 1. Header Section */}
      <header className="max-w-4xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
        <div className="space-y-1 text-left">
          <h1 className="text-3xl font-black tracking-tight text-black">
            Good morning, {ownerName}
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Manage your clothing brand.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer"
          >
            <Settings className="w-5 h-5 stroke-[1.5]" />
          </button>
          <img 
            src={shop?.logo_url || defaultAvatar} 
            alt="Shop Logo" 
            onClick={() => navigate('/edit-shop')}
            className="w-10 h-10 rounded-full border border-zinc-100 object-cover cursor-pointer hover:opacity-90 transition-all"
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 space-y-10">

        {/* 2. Shop Card */}
        <section className="bg-zinc-50 border border-zinc-100 rounded-[24px] overflow-hidden">
          <div className="h-44 w-full relative bg-zinc-100">
            <img 
              src={shop?.banner_url || defaultBanner} 
              alt="Shop Banner" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            
            {/* Status dot in corner of banner */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md py-1.5 px-3 rounded-full border border-zinc-100 shadow-xs flex items-center gap-2">
              <span className={`relative flex h-2 w-2`}>
                {shop?.is_live && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${shop?.is_live ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-black">
                {shop?.is_live ? 'Online' : 'Paused'}
              </span>
            </div>
          </div>

          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-100 overflow-hidden shrink-0 shadow-xs flex items-center justify-center relative -mt-12 z-10">
                <img 
                  src={shop?.logo_url || defaultAvatar} 
                  alt="Logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-black tracking-tight text-black">
                  {shop?.name || 'Unnamed Brand'}
                </h2>
                <p className="text-xs text-zinc-500 font-medium">
                  {shop?.category || 'Clothing'} &bull; {shop?.location || 'Harare, Zimbabwe'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/edit-shop')}
                className="flex-1 sm:flex-none py-3 px-5 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 text-black font-semibold text-xs rounded-full transition-all cursor-pointer active:scale-95"
              >
                Edit Shop
              </button>
              <button 
                onClick={handlePreviewShop}
                className="flex-1 sm:flex-none py-3 px-5 bg-black hover:bg-zinc-900 text-white font-semibold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Preview Shop</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* 3. Quick Actions */}
        <section className="space-y-4">
          <div className="text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Add Product */}
            <div 
              onClick={() => navigate('/add-product')}
              className="group bg-zinc-50 border border-zinc-100 rounded-[20px] p-6 text-left cursor-pointer hover:border-zinc-300 transition-all active:scale-[0.99] flex items-center justify-between"
            >
              <div className="space-y-1 pr-4">
                <h4 className="text-base font-bold text-black transition-colors group-hover:text-black">Add Product</h4>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">Upload a new listing to your catalog.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0 transition-transform group-hover:translate-x-1" />
            </div>

            {/* Products */}
            <div 
              onClick={() => navigate('/inventory')}
              className="group bg-zinc-50 border border-zinc-100 rounded-[20px] p-6 text-left cursor-pointer hover:border-zinc-300 transition-all active:scale-[0.99] flex items-center justify-between"
            >
              <div className="space-y-1 pr-4">
                <h4 className="text-base font-bold text-black transition-colors group-hover:text-black">Products</h4>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">Manage and edit your existing inventory.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0 transition-transform group-hover:translate-x-1" />
            </div>

            {/* Collections */}
            <div 
              onClick={() => toast.info('Collections are organized automatically by season.')}
              className="group bg-zinc-50 border border-zinc-100 rounded-[20px] p-6 text-left cursor-pointer hover:border-zinc-300 transition-all active:scale-[0.99] flex items-center justify-between"
            >
              <div className="space-y-1 pr-4">
                <h4 className="text-base font-bold text-black transition-colors group-hover:text-black">Collections</h4>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">Organize products into curated seasons.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0 transition-transform group-hover:translate-x-1" />
            </div>

            {/* Customize Shop */}
            <div 
              onClick={() => navigate('/edit-shop')}
              className="group bg-zinc-50 border border-zinc-100 rounded-[20px] p-6 text-left cursor-pointer hover:border-zinc-300 transition-all active:scale-[0.99] flex items-center justify-between"
            >
              <div className="space-y-1 pr-4">
                <h4 className="text-base font-bold text-black transition-colors group-hover:text-black">Customize Shop</h4>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">Update colors, banner, and bio details.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0 transition-transform group-hover:translate-x-1" />
            </div>

            {/* Copy Shop Link */}
            <div 
              onClick={handleCopyShopLink}
              className="group bg-zinc-50 border border-zinc-100 rounded-[20px] p-6 text-left cursor-pointer hover:border-zinc-300 transition-all active:scale-[0.99] flex items-center justify-between"
            >
              <div className="space-y-1 pr-4">
                <h4 className="text-base font-bold text-black transition-colors group-hover:text-black">Copy Shop Link</h4>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">Get the direct link to share with your customers.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0 transition-transform group-hover:translate-x-1" />
            </div>

          </div>
        </section>

        {/* 4. Product Overview */}
        <section className="space-y-4">
          <div className="text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Product Overview</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {productStats.map((stat, idx) => (
              <div 
                key={idx}
                className="bg-zinc-50 border border-zinc-100 rounded-[20px] p-6 text-left space-y-1"
              >
                <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">
                  {stat.label}
                </span>
                <span className="text-3xl font-black text-black leading-none block">
                  {loadingProds ? '...' : stat.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Inventory Preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Latest Products</h3>
            <button 
              onClick={() => navigate('/inventory')}
              className="text-xs font-extrabold text-black hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-[24px] overflow-hidden">
            {loadingProds ? (
              <div className="p-8 text-center text-zinc-500">
                <Loader2 className="animate-spin text-zinc-400 w-6 h-6 mx-auto mb-2" />
                <span className="text-xs font-medium">Reading inventory files...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <p className="text-sm text-zinc-500 font-medium">No products registered under your brand yet.</p>
                <button 
                  onClick={() => navigate('/add-product')}
                  className="py-2.5 px-5 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black text-xs rounded-full transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>List First Product</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {products.slice(0, 5).map((prod) => {
                  const hasDiscount = prod.original_price && Number(prod.original_price) > Number(prod.price);
                  return (
                    <div 
                      key={prod.id}
                      onClick={() => navigate(`/edit-product/${prod.id}`)}
                      className="p-4 flex items-center justify-between hover:bg-zinc-100/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 text-left overflow-hidden">
                        <div className="w-12 h-12 rounded-xl bg-zinc-200 overflow-hidden border border-zinc-200/50 shrink-0">
                          <img 
                            src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=100&q=80'} 
                            alt={prod.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-bold text-black truncate">{prod.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-zinc-900 font-semibold">
                              ${prod.price}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-zinc-400 line-through">
                                ${prod.original_price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-zinc-500 font-medium block">
                            {prod.total_stock} in stock
                          </span>
                          <span className={`inline-block text-[10px] font-black uppercase tracking-wider ${
                            prod.is_published || prod.status === 'active' ? 'text-emerald-500' : 'text-zinc-400'
                          }`}>
                            {prod.is_published || prod.status === 'active' ? 'Active' : 'Draft'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 6. Recent Activity */}
        <section className="space-y-4">
          <div className="text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Recent Activity</h3>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-[24px] p-6 text-left">
            <div className="relative border-l border-zinc-200 pl-6 space-y-6">
              {timelineActivities.map((act) => (
                <div key={act.id} className="relative">
                  {/* Timeline bullet */}
                  <span className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-black ring-4 ring-zinc-50" />
                  
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-sm font-bold text-black">{act.title}</h4>
                      <span className="text-[10px] font-mono text-zinc-400 shrink-0 font-medium">
                        {formatActivityTime(act.time)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">{act.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* 7. Bottom Navigation */}
      <BottomNavBar />

    </div>
  );
};

// src/screens/Dashboard.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  Share2, 
  ShoppingBag, 
  Calendar, 
  Globe, 
  Plus, 
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Edit3,
  ExternalLink,
  Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { toast } from 'sonner';
import { Paywall } from './Paywall';
import { TrialBanner } from '../components/dashboard/TrialBanner';
import { GuidedWalkthrough } from '../components/dashboard/GuidedWalkthrough';
import { LaunchChecklist } from '../components/dashboard/LaunchChecklist';
import { AIAssistantModal } from '../components/AIAssistantModal';
import { AISocialGeneratorModal } from '../components/AISocialGeneratorModal';
import { AICatalogAuditBanner } from '../components/AICatalogAuditBanner';
import { Sparkles, Bot, Share2 as ShareIcon } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading, subscription } = useAuth();
  const { shop, refreshShop, loading: shopLoading } = useShopContext();

  const [productsCount, setProductsCount] = useState<number>(0);
  const [loadingProds, setLoadingProds] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSocialGenOpen, setIsSocialGenOpen] = useState(false);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  // 1. Session check redirect
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login');
    }
  }, [session, authLoading, navigate]);

  // Fetch products count
  useEffect(() => {
    if (shop?.id) {
      fetchProductsCount(shop.id);
    }
  }, [shop]);

  const fetchProductsCount = async (shopId: string) => {
    try {
      setLoadingProds(true);
      const { data, count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('shop_id', shopId);

      if (error) throw error;
      setProductsCount(count || 0);
      setRecentProducts(data || []);
    } catch (err) {
      console.error('Error fetching products count:', err);
    } finally {
      setLoadingProds(false);
    }
  };

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

  // Calculate remaining trial days
  const trialDaysRemaining = useMemo(() => {
    if (!subscription) return 0;
    if (subscription.status === 'active') return null; // Fully subscribed
    if (!subscription.trial_ends_at) return 0;
    const ends = new Date(subscription.trial_ends_at);
    const now = new Date();
    const diffTime = ends.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [subscription]);

  // Toggle Shop Status (Live / Paused)
  const toggleShopStatus = async () => {
    if (!shop || togglingStatus) return;
    setTogglingStatus(true);
    const nextIsLive = !shop.is_active;

    try {
      const { error } = await supabase
        .from('shops')
        .update({ is_active: nextIsLive })
        .eq('id', shop.id);

      if (error) throw error;

      await refreshShop();
      toast.success(nextIsLive ? 'Shop is now Online and visible to customers!' : 'Shop status set to Paused.');
    } catch (err: any) {
      console.error('Error toggling shop status:', err);
      toast.error(`Failed to update shop status: ${err?.message || 'Unknown error'}`);
    } finally {
      setTogglingStatus(false);
    }
  };

  // Copy Shop Link
  const handleCopyShopLink = async () => {
    if (!shop) return;
    try {
      // Use proper domain for public storefront
      const url = `https://threadzw.vercel.app/shop/${shop.slug ? shop.slug.trim() : shop.id.trim()}?page=home`;
      await navigator.clipboard.writeText(url);
      toast.success('Shop link copied to clipboard!');
    } catch (err) {
      toast.error('Could not copy shop link');
    }
  };

  if (shopLoading || authLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-[#25D366] w-8 h-8" />
        <span className="text-xs text-zinc-500 mt-4 font-mono">Loading dashboard...</span>
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
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />
        
        <div className="w-20 h-20 rounded-3xl bg-[#C6FF00]/10 border border-[#C6FF00]/20 flex items-center justify-center text-[#C6FF00] relative z-10 shadow-[0_0_30px_rgba(198,255,0,0.1)]">
          <ShoppingBag size={32} />
        </div>
        <div className="space-y-3 relative z-10 max-w-sm">
          <h3 className="text-3xl font-black uppercase tracking-tight">No Shop Registered</h3>
          <p className="text-sm text-zinc-400 font-medium leading-relaxed">
            Initialize your premium streetwear digital storefront to start dropping products on ThreadZW.
          </p>
        </div>
        <button 
          onClick={() => navigate('/setup')} 
          className="px-10 py-4.5 bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider rounded-full hover:shadow-[0_0_25px_rgba(198,255,0,0.35)] active:scale-95 transition-all cursor-pointer relative z-10"
        >
          Create Shop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#25D366] selection:text-black pb-32">
      {/* Top Header */}
      <header className="max-w-md mx-auto px-6 pt-10 pb-6 flex items-center justify-between border-b border-zinc-100">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black tracking-tight text-black">
            {shop?.name || 'My Dashboard'}
          </h1>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            Merchant Workspace
          </p>
        </div>

        <button 
          id="walkthrough-store"
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer"
        >
          <Settings className="w-5 h-5 stroke-[1.75]" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-6 pt-8 space-y-6">
        <GuidedWalkthrough />
        <TrialBanner />
        <LaunchChecklist shop={shop} productsCount={productsCount} />
        
        {/* QUICK ACTIONS GRID */}
        <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5 text-left shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Quick Actions</h3>
            <span className="text-[10px] text-zinc-400 font-semibold">Shortcuts</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate('/edit-shop')}
              className="flex items-center gap-2.5 p-3 bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98] shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800 shrink-0">
                <Edit3 size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-black block truncate">Edit Store</span>
                <span className="text-[10px] text-zinc-400 font-medium block truncate">Update profile</span>
              </div>
            </button>

            <button
              onClick={() => setIsAssistantOpen(true)}
              className="flex items-center gap-2.5 p-3 bg-zinc-900 text-white border border-zinc-800 hover:bg-black rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98] shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-[#25D366]/20 flex items-center justify-center text-[#25D366] shrink-0">
                <Bot size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">AI Assistant</span>
                <span className="text-[10px] text-zinc-400 font-medium block truncate">Get help</span>
              </div>
            </button>

            <button
              onClick={() => setIsSocialGenOpen(true)}
              className="flex items-center gap-2.5 p-3 bg-purple-950/80 text-white border border-purple-800/60 hover:bg-purple-900 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98] shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-purple-100 block truncate">AI Marketing</span>
                <span className="text-[10px] text-purple-300/80 font-medium block truncate">Gen captions</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/add-product')}
              className="flex items-center gap-2.5 p-3 bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98] shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0">
                <Plus size={16} className="stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-black block truncate">Add Product</span>
                <span className="text-[10px] text-zinc-400 font-medium block truncate">New item</span>
              </div>
            </button>

            <button
              onClick={() => {
                const url = `/shop/${shop.slug ? shop.slug.trim() : shop.id.trim()}?page=home`;
                window.open(url, '_blank');
              }}
              className="flex items-center gap-2.5 p-3 bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98] shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800 shrink-0">
                <ExternalLink size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-black block truncate">View Store</span>
                <span className="text-[10px] text-zinc-400 font-medium block truncate">Open preview</span>
              </div>
            </button>

            <button
              onClick={handleCopyShopLink}
              className="flex items-center gap-2.5 p-3 bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98] shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800 shrink-0">
                <Copy size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-black block truncate">Copy Link</span>
                <span className="text-[10px] text-zinc-400 font-medium block truncate">Share shop</span>
              </div>
            </button>
          </div>
        </div>

        {/* AI Catalog Audit & Smart Recommendations Banner */}
        <AICatalogAuditBanner products={recentProducts} shop={shop} />

        {/* SECTION 1: Shop Status */}
        
        <div id="walkthrough-products" className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 text-left shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${shop?.is_active ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-zinc-100 text-zinc-400'}`}>
                <Globe size={20} className="stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Shop Status</h3>
                <p className="text-xs text-zinc-400 font-semibold tracking-wide uppercase mt-0.5">Visibility</p>
              </div>
            </div>
            
            <button 
              onClick={toggleShopStatus}
              disabled={togglingStatus}
              className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center ${shop?.is_active ? 'bg-[#25D366]' : 'bg-zinc-200'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white transition-transform duration-200 shadow-xs ${shop?.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          
          <div className="pt-2 border-t border-zinc-100">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${shop?.is_active ? 'bg-[#25D366] animate-pulse' : 'bg-zinc-400'}`} />
              <span className="text-sm font-black uppercase text-black">
                {shop?.is_active ? 'Online' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
              {shop?.is_active 
                ? 'Your storefront is active. Customers can browse catalog items and submit direct WhatsApp orders.' 
                : 'Your storefront is paused. Existing data is preserved.'
              }
            </p>
          </div>
        </div>

        {/* SECTION 2: Trial Countdown */}
        <div id="walkthrough-products" className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 text-left shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 text-black flex items-center justify-center">
                <Calendar size={20} className="stroke-[1.75]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Subscription Status</h3>
                <p className="text-xs text-zinc-400 font-semibold tracking-wide uppercase mt-0.5">Billing & Access</p>
              </div>
            </div>
            
            {trialDaysRemaining !== null && (
              <button 
                id="walkthrough-store"
                onClick={() => navigate('/subscription')}
                className="py-1.5 px-3 bg-black hover:bg-zinc-900 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer"
              >
                Upgrade
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100">
            {trialDaysRemaining !== null ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm font-black text-black uppercase">
                    {trialDaysRemaining === 0 ? 'Trial Expired' : `Trial Mode (${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'day' : 'days'} remaining)`}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  {trialDaysRemaining === 0 
                    ? 'Your free trial has ended. Upgrade to continue using ThreadZW.'
                    : 'Your 7-day free trial is active. Upgrade to our Premium Merchant plan for $1/month to ensure uninterrupted shop management.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span className="text-sm font-black text-black uppercase">
                    Premium Plan Active
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  Thank you for being a ThreadZW Premium partner. Your merchant operations and shop channels are fully authorized.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Number of Products */}
        <div id="walkthrough-products" className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 text-left shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 text-black flex items-center justify-center">
                <ShoppingBag size={20} className="stroke-[1.75]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Active Inventory</h3>
                <p className="text-xs text-zinc-400 font-semibold tracking-wide uppercase mt-0.5">Catalog</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                id="walkthrough-add-product"
                onClick={() => navigate('/add-product')}
                className="p-2 bg-[#25D366] hover:bg-[#20ba5a] text-black rounded-lg transition-all active:scale-95 cursor-pointer"
                title="Add Product"
              >
                <Plus size={16} className="stroke-[2.5]" />
              </button>
              <button 
                onClick={() => navigate('/inventory')}
                className="py-1.5 px-3 bg-white border border-zinc-200 hover:border-zinc-300 text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer"
              >
                Manage
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-baseline justify-between">
            <div>
              <span className="text-4xl font-black text-black font-sans leading-none">
                {loadingProds ? '...' : productsCount}
              </span>
              <span className="text-sm text-zinc-500 font-bold ml-2">
                {productsCount === 1 ? 'Product listed' : 'Products listed'}
              </span>
            </div>
            
            <button 
              onClick={() => navigate('/inventory')}
              className="text-xs font-black text-zinc-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View catalog</span>
              <ArrowRight size={12} className="stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* SECTION 4: Share Shop Button */}
        <div id="walkthrough-products" className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 text-left shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center">
                <Share2 size={20} className="stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Share Channel</h3>
                <p className="text-xs text-zinc-400 font-semibold tracking-wide uppercase mt-0.5">Direct link</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 space-y-3">
            <div className="bg-white border border-zinc-150 rounded-xl p-3 flex items-center justify-between overflow-hidden">
              <span className="text-xs font-mono text-zinc-600 truncate mr-2">
                threadzw.app/shop/{shop.slug ? shop.slug.trim() : shop.id.trim()}
              </span>
              <button 
                onClick={handleCopyShopLink}
                className="text-[10px] font-black uppercase text-[#25D366] hover:text-[#20ba5a] transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                Copy Link
              </button>
            </div>
            
            <button 
              onClick={handleCopyShopLink}
              className="w-full h-12 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Share2 size={14} className="stroke-[2.5]" />
              <span>Share Storefront Link</span>
            </button>
          </div>
        </div>

      </main>

      {/* AI Productivity Modals */}
      <AIAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      <AISocialGeneratorModal
        isOpen={isSocialGenOpen}
        onClose={() => setIsSocialGenOpen(false)}
        shopName={shop?.name || 'ThreadZW Boutique'}
        products={recentProducts}
      />

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
};

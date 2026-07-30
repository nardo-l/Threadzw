// src/components/dashboard/ShopSetupChecklist.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Store, 
  Package, 
  Bell, 
  Share2, 
  Sparkles, 
  X, 
  Smartphone,
  Loader2,
  PartyPopper,
  Check
} from 'lucide-react';
import { Shop } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { registerWebPushSubscription } from '../../lib/dailyNotificationService';
import { toast } from 'sonner';

interface ShopSetupChecklistProps {
  shop: Shop | null;
  productsCount: number;
  isSubscriptionOrTrialActive: boolean;
}

export const ShopSetupChecklist: React.FC<ShopSetupChecklistProps> = ({
  shop,
  productsCount,
  isSubscriptionOrTrialActive,
}) => {
  const navigate = useNavigate();
  const { user, subscription } = useAuth();

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [registeringPush, setRegisteringPush] = useState(false);
  const [pushErrorMsg, setPushErrorMsg] = useState<string | null>(null);
  
  // Track notifications enabled state
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  // Track shop shared state
  const [shopShared, setShopShared] = useState<boolean>(() => {
    if (!shop?.id) return false;
    return localStorage.getItem(`threadzw_shop_shared_${shop.id}`) === 'true';
  });

  // Track user manually dismissed completed banner
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (!shop?.id) return false;
    return localStorage.getItem(`threadzw_checklist_dismissed_${shop.id}`) === 'true';
  });

  // Check if push permission updates
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPushEnabled(true);
      }
    }
  }, []);

  // 1. Profile completion check
  const isProfileComplete = useMemo(() => {
    if (!shop) return false;
    if (shop.setup_complete) return true;
    const hasName = Boolean(shop.name && shop.name.trim().length > 0);
    const hasDesc = Boolean(shop.description && shop.description.trim().length > 0);
    const hasLogo = Boolean(shop.logo_url || shop.avatar_url);
    const hasBanner = Boolean(shop.banner_url);
    const hasLocation = Boolean(shop.location);
    const hasWhatsapp = Boolean(shop.whatsapp_number || shop.instagram);
    return hasName && hasDesc && (hasLogo || hasBanner) && (hasLocation || hasWhatsapp);
  }, [shop]);

  // 2. Product added check
  const isProductAdded = productsCount > 0;

  // 3. Daily notifications enabled check
  const isNotificationsEnabled = pushEnabled || (shop?.id ? localStorage.getItem(`threadzw_notif_enabled_${shop.id}`) === 'true' : false);

  // 4. Upgrade to Pro check
  const isProActive = useMemo(() => {
    if (isSubscriptionOrTrialActive) return true;
    if (subscription?.status === 'active' || subscription?.status === 'trial') return true;
    if (shop?.plan === 'active' || shop?.plan === 'trial') return true;
    return false;
  }, [isSubscriptionOrTrialActive, subscription, shop]);

  // 5. Share shop check
  const isShopShared = shopShared;

  // Calculate overall progress
  const tasks = useMemo(() => [
    {
      id: 'profile',
      title: 'Complete your Shop Profile',
      subtitle: 'Add logo, description, and contact details',
      completed: isProfileComplete,
      icon: Store,
      onClick: () => navigate('/edit-shop')
    },
    {
      id: 'product',
      title: 'Add your First Product',
      subtitle: 'Upload product image, price, and sizes',
      completed: isProductAdded,
      icon: Package,
      onClick: () => navigate('/inventory')
    },
    {
      id: 'notif',
      title: 'Enable Daily Notifications',
      subtitle: 'Receive 19:00 daily briefing on sales & visits',
      completed: isNotificationsEnabled,
      icon: Bell,
      onClick: () => {
        if (isNotificationsEnabled) {
          toast.info('Daily notifications are already enabled!');
        } else {
          setPushErrorMsg(null);
          setShowNotifModal(true);
        }
      }
    },
    {
      id: 'share',
      title: 'Share your Shop',
      subtitle: 'Share your store link on WhatsApp or Instagram',
      completed: isShopShared,
      icon: Share2,
      onClick: handleShareShop
    }
  ], [isProfileComplete, isProductAdded, isNotificationsEnabled, isShopShared, navigate]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);
  const isAllComplete = completedCount === totalTasks;

  // Handle Share Shop flow
  async function handleShareShop() {
    if (!shop) return;
    const slugOrId = shop.slug ? shop.slug.trim() : shop.id.trim();
    const url = `https://threadzw.vercel.app/shop/${slugOrId}?page=home`;

    let success = false;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shop.name || 'ThreadZW Shop',
          text: `Check out ${shop.name || 'our shop'} on ThreadZW!`,
          url: url,
        });
        success = true;
      } catch (err) {
        // User cancelled or share dismissed
      }
    }

    if (!success) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Shop link copied to clipboard!');
        success = true;
      } catch (err) {
        toast.error('Could not copy shop link');
      }
    }

    if (success) {
      localStorage.setItem(`threadzw_shop_shared_${shop.id}`, 'true');
      setShopShared(true);
    }
  }

  // Handle Enable Notifications inside Modal
  async function handleEnablePushNotifications() {
    if (!user?.id) {
      toast.error('User session required');
      return;
    }

    setRegisteringPush(true);
    setPushErrorMsg(null);

    try {
      const res = await registerWebPushSubscription(user.id, shop?.id || undefined);
      if (res.success) {
        setPushEnabled(true);
        if (shop?.id) {
          localStorage.setItem(`threadzw_notif_enabled_${shop.id}`, 'true');
        }
        toast.success('Web Push Notifications registered successfully!');
        setShowNotifModal(false);
      } else {
        if (res.message.includes('denied')) {
          setPushErrorMsg('Notification permission was blocked in browser settings. Please click the lock icon next to your browser URL bar to allow notifications.');
        } else {
          setPushErrorMsg(res.message);
        }
      }
    } catch (err: any) {
      setPushErrorMsg(err?.message || 'Error enabling notifications');
    } finally {
      setRegisteringPush(false);
    }
  }

  // Handle Dismiss Completed Banner
  const handleDismiss = () => {
    setDismissed(true);
    if (shop?.id) {
      localStorage.setItem(`threadzw_checklist_dismissed_${shop.id}`, 'true');
    }
  };

  // If user dismissed or all complete and dismissed
  if (dismissed && isAllComplete) {
    return null;
  }

  // All complete view: Celebration Success Banner
  if (isAllComplete) {
    return (
      <div className="bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border border-zinc-800 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all animate-fadeIn">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#CCFF00]/15 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#CCFF00] text-black font-black flex items-center justify-center shrink-0 shadow-sm">
              <PartyPopper size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#CCFF00]">
                  5/5 Completed
                </span>
                <span className="inline-flex items-center gap-1 bg-[#CCFF00]/20 text-[#CCFF00] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#CCFF00]/30">
                  <Check size={10} /> Fully Setup
                </span>
              </div>
              <h3 className="text-lg font-extrabold tracking-tight text-white mt-0.5">
                🎉 Your shop is ready to grow!
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
                All store setup tasks are completed. Your storefront is fully optimized to receive WhatsApp orders and daily performance summaries.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Dismiss checklist"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-4 transition-all">
      {/* Header & Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-[#CCFF00] font-black flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Shop Setup Checklist
              </h2>
              <span className="bg-zinc-100 text-zinc-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-zinc-200">
                {completedCount}/{totalTasks} Completed
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-normal mt-0.5">
              Complete these key tasks to get your store fully ready for customers.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200/60">
          <div 
            className="h-full bg-[#96D100] rounded-full transition-all duration-500 shadow-2xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Task Items Grid */}
      <div className="grid grid-cols-1 divide-y divide-zinc-100 border-t border-zinc-100 pt-1">
        {tasks.map((task) => {
          const TaskIcon = task.icon;
          return (
            <div 
              key={task.id}
              onClick={task.onClick}
              className={`group flex items-center justify-between py-3 px-2 rounded-xl transition-all cursor-pointer ${
                task.completed ? 'opacity-75 hover:opacity-100 hover:bg-zinc-50/60' : 'hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="shrink-0">
                  {task.completed ? (
                    <div className="w-6 h-6 rounded-full bg-lime-100 text-lime-700 flex items-center justify-center">
                      <CheckCircle2 size={18} className="fill-lime-500 text-white" />
                    </div>
                  ) : (
                    <Circle size={20} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  )}
                </div>

                <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-[#CCFF00] flex items-center justify-center shrink-0 transition-colors">
                  <TaskIcon size={16} />
                </div>

                <div className="min-w-0">
                  <h4 className={`text-xs font-bold tracking-tight truncate ${
                    task.completed ? 'line-through text-zinc-400' : 'text-zinc-900 group-hover:text-black'
                  }`}>
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 truncate font-normal">
                    {task.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {task.completed ? (
                  <span className="text-[10px] font-extrabold text-lime-700 bg-lime-50 border border-lime-200/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Done
                  </span>
                ) : (
                  <button className="text-xs font-bold text-zinc-900 group-hover:text-black bg-zinc-100 group-hover:bg-[#CCFF00] group-hover:text-black px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
                    <span>Start</span>
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enable Daily Notifications Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-zinc-100 relative">
            <button 
              onClick={() => setShowNotifModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-black rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#CCFF00] text-black font-black flex items-center justify-center shrink-0 shadow-xs">
                <Bell size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">
                  Daily 19:00 Shop Summary
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  Stay updated on your store performance every evening
                </p>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <Smartphone size={16} className="text-[#96D100] mt-0.5 shrink-0" />
                <p className="text-xs text-zinc-700 font-normal leading-relaxed">
                  Every evening at <strong>19:00 (Africa/Harare)</strong>, ThreadZW sends a push briefing directly to your browser or device containing:
                </p>
              </div>
              <ul className="text-xs text-zinc-600 space-y-1.5 pl-6 list-disc font-medium">
                <li>Total daily store visitors & comparison vs yesterday</li>
                <li>WhatsApp order click counts</li>
                <li>Product page views & most saved items</li>
              </ul>
            </div>

            {pushErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium leading-relaxed">
                {pushErrorMsg}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNotifModal(false)}
                className="flex-1 py-3 px-4 border border-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEnablePushNotifications}
                disabled={registeringPush}
                className="flex-1 py-3 px-4 bg-[#CCFF00] hover:bg-[#bbee00] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                {registeringPush ? (
                  <Loader2 size={16} className="animate-spin text-black" />
                ) : (
                  <>
                    <Bell size={15} />
                    <span>Enable Notifications</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

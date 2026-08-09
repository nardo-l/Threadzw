// src/components/dashboard/ShopSetupChecklist.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Store, 
  Package, 
  Share2, 
  Sparkles, 
  X, 
  Loader2,
  PartyPopper,
  Check
} from 'lucide-react';
import { Shop } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface ShopSetupChecklistProps {
  shop: Shop | null;
  productsCount: number;
  isShopPaidAndActive: boolean;
}

export const ShopSetupChecklist: React.FC<ShopSetupChecklistProps> = ({
  shop,
  productsCount,
  isShopPaidAndActive,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // 1. Profile completion check
  const isProfileComplete = useMemo(() => {
    if (!shop) return false;
    const hasName = Boolean(shop.name && shop.name.trim().length > 0);
    const hasDesc = Boolean(shop.description && shop.description.trim().length > 0);
    const hasLogo = Boolean(shop.logo_url || shop.avatar_url);
    const hasBanner = Boolean(shop.banner_url);
    const hasLocation = Boolean(shop.location && shop.location.trim().length > 0);
    const hasContact = Boolean((shop.whatsapp_number && shop.whatsapp_number.trim().length > 0) || (shop.instagram && shop.instagram.trim().length > 0));
    const hasCategory = Boolean(shop.category && shop.category.trim().length > 0);

    return hasName && hasDesc && hasLogo && hasBanner && hasLocation && hasContact && hasCategory;
  }, [shop]);

  // 2. Product added check
  const isProductAdded = productsCount > 0;

  // 3. Paid Shop Activation check
  const isProActive = useMemo(() => {
    if (isShopPaidAndActive) return true;
    if (shop?.payment_status === 'paid' && shop?.payment_required === false) return true;
    return false;
  }, [isShopPaidAndActive, shop]);

  // 4. Share shop check
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
      id: 'share',
      title: 'Share your Shop',
      subtitle: 'Share your store link on WhatsApp or Instagram',
      completed: isShopShared,
      icon: Share2,
      onClick: handleShareShop
    }
  ], [isProfileComplete, isProductAdded, isShopShared, navigate]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);
  const isAllComplete = completedCount === totalTasks;

  // Handle Share Shop flow
  async function handleShareShop() {
    if (!shop) return;
    const slugOrId = shop.slug ? shop.slug.trim() : shop.id.trim();
    const url = `https://threadzw.vercel.app/shop/${slugOrId}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Store link copied to clipboard.');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success('Store link copied to clipboard.');
        } catch (e) {
          throw new Error('Clipboard write failed');
        }
        document.body.removeChild(textArea);
      }

      localStorage.setItem(`threadzw_shop_shared_${shop.id}`, 'true');
      setShopShared(true);
    } catch (err) {
      toast.error("Couldn't copy the link. Please try again.");
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
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, ImagePlus, ShoppingBag, Share2, CheckCircle2, ChevronRight } from 'lucide-react';
import { Shop } from '../../types';
import { toast } from 'sonner';

interface Props {
  shop: Shop;
  productsCount: number;
}

export const LaunchChecklist: React.FC<Props> = ({ shop, productsCount }) => {
  const navigate = useNavigate();
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    const shared = localStorage.getItem(`threadzw_shop_shared_${shop?.id}`);
    if (shared === 'true') {
      setIsShared(true);
    }
  }, [shop?.id]);

  const hasLogo = !!(shop?.logo_url);
  const hasBanner = !!(shop?.banner_url);
  const hasProduct = productsCount > 0;

  const tasks = [
    {
      id: 'logo',
      label: 'Upload logo',
      desc: 'Add a brand logo to personalize your storefront.',
      icon: Image,
      completed: hasLogo,
      action: () => navigate('/edit-shop')
    },
    {
      id: 'banner',
      label: 'Upload banner',
      desc: 'Add a header banner for your store.',
      icon: ImagePlus,
      completed: hasBanner,
      action: () => navigate('/edit-shop')
    },
    {
      id: 'product',
      label: 'Add first product',
      desc: 'Upload at least one item so customers can browse your first drop.',
      icon: ShoppingBag,
      completed: hasProduct,
      action: () => navigate('/add-product')
    },
    {
      id: 'share',
      label: 'Share your shop',
      desc: 'Copy your storefront link and share on WhatsApp.',
      icon: Share2,
      completed: isShared,
      action: async () => {
        try {
          const url = `${window.location.origin}/shop/${shop?.slug || shop?.id}?page=home`;
          await navigator.clipboard.writeText(url);
          localStorage.setItem(`threadzw_shop_shared_${shop?.id}`, 'true');
          setIsShared(true);
          toast.success('Shop link copied to clipboard!');
        } catch {
          toast.error('Failed to copy link.');
        }
      }
    }
  ];

  const completedCount = tasks.filter(t => t.completed).length;

  if (completedCount === 4) {
    return (
      <div className="bg-zinc-950 rounded-3xl p-6 text-white flex items-center gap-4 border border-zinc-800">
        <span className="text-3xl">🎉</span>
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight text-[#C6FF00]">Shop 100% Ready!</h3>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">Your storefront is configured and ready for customer enquiries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 rounded-3xl p-6 text-white space-y-4 border border-zinc-800/80 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight">LAUNCH CHECKLIST</h3>
          <p className="text-[11px] text-zinc-400 font-medium">Complete these steps to make your store customer-ready</p>
        </div>
        <span className="text-xs font-mono font-extrabold text-[#C6FF00] bg-[#C6FF00]/10 px-2.5 py-1 rounded-full border border-[#C6FF00]/20">
          {completedCount}/4 COMPLETED
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={task.action}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer group text-left ${
              task.completed ? 'bg-zinc-900/60 opacity-80' : 'bg-zinc-900 hover:bg-zinc-800/90'
            }`}
          >
            <div className="flex items-center gap-3.5">
              {task.completed ? (
                <div className="w-8 h-8 rounded-xl bg-[#C6FF00]/10 flex items-center justify-center text-[#C6FF00] shrink-0">
                  <CheckCircle2 size={18} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white shrink-0">
                  <task.icon size={18} />
                </div>
              )}
              <div>
                <span className={`text-xs font-bold block ${task.completed ? 'text-zinc-300 line-through' : 'text-white'}`}>
                  {task.label}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5 font-medium">
                  {task.desc}
                </span>
              </div>
            </div>
            {!task.completed && <ChevronRight size={16} className="text-zinc-600 group-hover:text-white shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Settings, CheckCircle2, ChevronRight } from 'lucide-react';
import { Shop } from '../../types';

interface Props {
  shop: Shop;
  productsCount: number;
}

export const LaunchChecklist: React.FC<Props> = ({ shop, productsCount }) => {
  const navigate = useNavigate();

  const isSetupComplete = !!(
    shop.logo_url && 
    shop.banner_url && 
    shop.category && 
    shop.description && 
    shop.whatsapp_number && 
    shop.location
  );
  const isProductAdded = productsCount > 0;

  const completedCount = (isSetupComplete ? 1 : 0) + (isProductAdded ? 1 : 0);

  if (completedCount === 2) {
    return (
      <div className="bg-zinc-950 rounded-3xl p-6 text-white flex items-center gap-4">
        <span className="text-3xl">🎉</span>
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight">Your shop is ready!</h3>
          <p className="text-xs text-zinc-400 mt-1">Your shop is ready to receive orders.</p>
        </div>
      </div>
    );
  }

  const items = [
    { 
      label: 'SET UP SHOP', 
      desc: 'Complete your storefront details including logo, banner, category and business information.', 
      icon: Settings, 
      path: '/store', 
      completed: isSetupComplete 
    },
    { 
      label: 'ADD FIRST PRODUCT', 
      desc: 'Upload your first product so customers can start ordering.', 
      icon: ShoppingBag, 
      path: '/products', 
      completed: isProductAdded 
    },
  ];

  return (
    <div className="bg-zinc-950 rounded-3xl p-6 text-white space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-tight">LAUNCH CHECKLIST</h3>
        <span className="text-[10px] font-mono text-[#C6FF00]">{completedCount}/2 COMPLETED</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.label === 'ADD FIRST PRODUCT' && !isProductAdded) {
                navigate('/add-product');
              } else {
                navigate(item.path);
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              {item.completed ? (
                <CheckCircle2 size={16} className="text-[#C6FF00]" />
              ) : (
                <item.icon size={16} className="text-zinc-500 group-hover:text-[#C6FF00]" />
              )}
              <div className="text-left">
                <span className={`text-xs font-bold block ${item.completed ? 'text-[#C6FF00]' : 'text-white'}`}>{item.label}</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">{item.desc}</span>
              </div>
            </div>
            {!item.completed && <ChevronRight size={16} className="text-zinc-600" />}
          </button>
        ))}
      </div>
    </div>
  );
};

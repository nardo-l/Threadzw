import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, ShoppingBag, Store, User } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const getActiveTab = () => {
    if (pathname === '/' || pathname.replace(/\/$/, '') === '/dashboard') return 'dashboard';
    if (pathname.startsWith('/inventory') || pathname.startsWith('/products') || pathname.startsWith('/add-product') || pathname.startsWith('/edit-product')) return 'products';
    if (pathname.startsWith('/edit-shop')) return 'store';
    if (pathname.startsWith('/settings')) return 'account';
    return '';
  };

  const activeTab = getActiveTab();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <LayoutGrid size={20} className="stroke-[1.75]" /> },
    { id: 'products', label: 'Products', path: '/inventory', icon: <ShoppingBag size={20} className="stroke-[1.75]" /> },
    { id: 'store', label: 'Store', path: '/edit-shop', icon: <Store size={20} className="stroke-[1.75]" /> },
    { id: 'account', label: 'Account', path: '/settings', icon: <User size={20} className="stroke-[1.75]" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-zinc-100 z-40 flex items-center pb-safe shadow-xs">
      <div className="flex items-center justify-around w-full max-w-lg mx-auto px-6">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-1 transition-all cursor-pointer ${
                isActive 
                  ? 'text-black' 
                  : 'text-zinc-400 hover:text-zinc-600 active:scale-95'
              }`}
              id={`nav-tab-${item.id}`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'text-black scale-105 font-bold' : 'text-zinc-400'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] tracking-tight transition-all font-sans ${isActive ? 'text-black font-semibold' : 'text-zinc-400 font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, ShoppingBag, Store, BarChart3, Settings } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const getActiveTab = () => {
    if (pathname === '/' || pathname.replace(/\/$/, '') === '/dashboard') return 'dashboard';
    if (pathname.startsWith('/inventory') || pathname.startsWith('/products') || pathname.startsWith('/add-product') || pathname.startsWith('/edit-product')) return 'products';
    if (pathname.startsWith('/edit-shop') || pathname.startsWith('/shop')) return 'store';
    if (pathname.startsWith('/analytics')) return 'analytics';
    if (pathname.startsWith('/settings')) return 'settings';
    return '';
  };

  const activeTab = getActiveTab();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <LayoutGrid size={18} className="stroke-[1.8]" /> },
    { id: 'products', label: 'Products', path: '/inventory', icon: <ShoppingBag size={18} className="stroke-[1.8]" /> },
    { id: 'store', label: 'Store', path: '/edit-shop', icon: <Store size={18} className="stroke-[1.8]" /> },
    { id: 'analytics', label: 'Analytics', path: '/analytics', icon: <BarChart3 size={18} className="stroke-[1.8]" /> },
    { id: 'settings', label: 'Settings', path: '/settings', icon: <Settings size={18} className="stroke-[1.8]" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-zinc-100 z-40 flex items-center pb-safe shadow-xs">
      <div className="flex items-center justify-around w-full max-w-2xl mx-auto px-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer ${
                isActive 
                  ? 'text-black' 
                  : 'text-zinc-400 hover:text-zinc-600 active:scale-95'
              }`}
              id={`nav-tab-${item.id}`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'text-[#D7FF00] bg-black p-1.5 rounded-xl scale-105' : 'text-zinc-500'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] tracking-tight transition-all font-sans ${isActive ? 'text-black font-extrabold' : 'text-zinc-400 font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

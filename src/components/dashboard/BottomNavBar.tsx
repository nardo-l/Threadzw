import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Tag, Store, BarChart3, Settings } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const getActiveTab = () => {
    if (pathname === '/' || pathname.replace(/\/$/, '') === '/dashboard') return 'dashboard';
    if (pathname.startsWith('/inventory') || pathname.startsWith('/products') || pathname.startsWith('/add-product') || pathname.startsWith('/edit-product')) return 'products';
    if (pathname.startsWith('/edit-shop')) return 'shopfront';
    if (pathname.startsWith('/settings')) return 'settings';
    return '';
  };

  const activeTab = getActiveTab();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { id: 'products', label: 'Products', path: '/inventory', icon: <Tag size={18} /> },
    { id: 'shopfront', label: 'Shopfront', path: '/edit-shop', icon: <Store size={18} /> },
    { id: 'settings', label: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[68px] bg-white/95 backdrop-blur-md border-t border-zinc-100/80 z-40 flex items-center pb-safe shadow-lg">
      <div className="flex items-center justify-around w-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer ${
                isActive 
                  ? 'text-zinc-950 font-bold' 
                  : 'text-zinc-400 hover:text-zinc-700 active:scale-95'
              }`}
              id={`nav-tab-${item.id}`}
            >
              <div className={`transition-all duration-300 ${isActive ? 'text-zinc-950 scale-105' : 'text-zinc-400'}`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-semibold tracking-tight transition-all ${isActive ? 'text-zinc-950 font-bold' : 'text-zinc-400 font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

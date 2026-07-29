import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Store, Settings } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const getActiveTab = () => {
    if (pathname === '/' || pathname.replace(/\/$/, '') === '/dashboard') return 'dashboard';
    if (pathname.startsWith('/inventory') || pathname.startsWith('/products') || pathname.startsWith('/add-product') || pathname.startsWith('/edit-product')) return 'products';
    if (pathname.startsWith('/edit-shop') || pathname.startsWith('/shop')) return 'shop';
    if (pathname.startsWith('/settings')) return 'settings';
    return '';
  };

  const activeTab = getActiveTab();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
    { id: 'products', label: 'Products', path: '/inventory', icon: <ShoppingBag size={20} /> },
    { id: 'shop', label: 'Shop', path: '/edit-shop', icon: <Store size={20} /> },
    { id: 'settings', label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-zinc-100 z-40 flex items-center pb-safe shadow-md">
      <div className="flex items-center justify-around w-full max-w-2xl mx-auto px-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer ${
                isActive 
                  ? 'text-[#85B800]' 
                  : 'text-zinc-400 hover:text-zinc-600 active:scale-95'
              }`}
              id={`nav-tab-${item.id}`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'text-[#85B800] scale-105' : 'text-zinc-600'}`}>
                {item.icon}
              </div>
              <span className={`text-[11px] tracking-tight transition-all font-sans ${isActive ? 'text-[#85B800] font-bold' : 'text-zinc-500 font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


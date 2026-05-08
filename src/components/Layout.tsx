import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Store, Search, Heart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useInventory } from '../context/InventoryContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../App';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    onboardingComplete, 
    sellerFlowState, 
    buyerFlowState, 
    setBuyerFlowState, 
    communityScreen, 
    setCommunityScreen,
  } = useInventory();
  const { session, isGuest } = useAuth();
  const { showRenewalPaywall, paywallType } = useSubscription();
  const [isPillVisible, setIsPillVisible] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  const isAuthScreen = ['/auth', '/login', '/signup', '/verify'].includes(location.pathname);
  const isPaywallScreen = location.pathname.startsWith('/paywall');
  const isShopCentre = location.pathname.startsWith('/shop-centre');
  
  // Buyer Flow nav logic:
  const isBuyerHidden = ['productDetail', 'shopProfile', 'quiz', 'quizResult', 'bestDresserEntry'].includes(buyerFlowState);
  
  // Community Flow nav logic:
  const isCommunityHidden = ['quiz', 'quizResult', 'shareCard', 'bestDresserEntry', 'entrySuccess', 'bracket'].includes(communityScreen);
  const isCommunityVisibleRoute = location.pathname.startsWith('/best-dresser') || location.pathname.startsWith('/community') || location.pathname.startsWith('/quiz');

  // Show nav only if authenticated OR guest, 
  // AND it's not an auth screen
  // AND NOT on the expired paywall (hidden on State 2, visible on State 1)
  const isExpiredPaywallActive = (showRenewalPaywall && paywallType === 'expired') || (isPaywallScreen && paywallType === 'expired');

  // Seller Flow nav logic:
  const hiddenOnSellerStates = ['shopCentre_pendingCode', 'paywall_plan', 'paywall_payment', 'paywall_code', 'pending_code', 'enter_code', 'payment_received'].includes(sellerFlowState);
  const isSellerHidden = isShopCentre && hiddenOnSellerStates;

  // Main routes should generally ALWAYS show nav if on main tabs
  const isMainRoute = ['/', '/shops', '/search', '/saved-items', '/profile', '/notifications'].includes(location.pathname);

  const showNav = (session || isGuest) && 
                 !isAuthScreen && 
                 !isExpiredPaywallActive &&
                 !isSellerHidden &&
                 (isMainRoute || (!isBuyerHidden && !isCommunityHidden)) &&
                 !location.pathname.startsWith('/new-listing');

  const hideNav = !showNav;

  useEffect(() => {
    const handleInteraction = () => {
      setIsPillVisible(true);
    };

    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('mousedown', handleInteraction);

    return () => {
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('mousedown', handleInteraction);
    };
  }, []);

  return (
    <div className="flex min-h-screen" style={{ background: t.bg_primary }}>
      {/* Desktop Sidebar */}
      {showNav && (
        <aside 
          className="hidden lg:flex w-[280px] flex-col sticky top-0 h-screen p-6"
          style={{ borderRight: `1px solid ${t.border_secondary}` }}
        >
          <div 
            onClick={() => navigate('/')}
            className="mb-10 cursor-pointer"
          >
            <h1 className="text-[28px] font-pacifico leading-none" style={{ color: t.accent }}>thread</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-1 font-bold" style={{ color: `${t.text_primary}4D` }}>The Marketplace</p>
          </div>

          <nav className="flex flex-col gap-2">
            <SidebarNavItem to="/" icon={<Home size={22} />} label="Home" />
            <SidebarNavItem to="/shops" icon={<Store size={22} />} label="Shops" />
            <SidebarNavItem to="/search" icon={<Search size={22} />} label="Search" />
            <SidebarNavItem to="/profile" icon={<User size={22} />} label="Profile" />
          </nav>

          <div className="mt-auto pt-6 border-t" style={{ borderColor: t.border_secondary }}>
            {session && (
              <button 
                onClick={() => navigate('/shop-centre')}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95"
                style={{ background: t.gradient, color: 'white', boxShadow: t.shadow }}
              >
                <span>🏪</span>
                Shop Centre
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <main 
          ref={mainRef}
          className={`relative max-w-[1400px] mx-auto w-full flex-1 no-scrollbar lg:overflow-y-auto ${!hideNav ? 'pb-24 lg:pb-0' : ''}`}
        >
          <div className={`mx-auto w-full h-full ${!location.pathname.startsWith('/shop-centre') && !location.pathname.startsWith('/new-listing') && !location.pathname.startsWith('/product/') ? 'max-w-[430px] lg:max-w-none' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="min-h-full flex flex-col"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Floating Shop Centre Button (Mobile Only) */}
          {location.pathname === '/' && session && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/shop-centre')}
              className="lg:hidden fixed bottom-[96px] right-5 z-50 flex items-center gap-2 px-[18px] py-[10px] rounded-full transition-all"
              style={{ background: t.gradient, boxShadow: t.shadow_lg }}
            >
              <span className="text-[14px]">🏪</span>
              <span className="text-white font-bold text-[13px]">Shop Centre</span>
            </motion.button>
          )}
        </main>

        {/* Bottom Nav (Mobile/Tablet Only) */}
        {!hideNav && (
          <motion.div 
            initial={{ y: 0, opacity: 1 }}
            animate={{ 
              y: isPillVisible ? 0 : 100,
              opacity: isPillVisible ? 1 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden fixed bottom-[24px] left-5 right-5 z-[50] text-center"
          >
            <nav 
              className="backdrop-blur-xl rounded-[100px] px-2 py-[10px] flex items-center w-full max-w-[400px] mx-auto overflow-hidden border"
              style={{ background: `${t.nav_bg}E6`, borderColor: t.nav_border, boxShadow: t.shadow_lg }}
            >
              <NavItem to="/" icon={<Home size={22} />} label="Home" />
              <NavItem to="/shops" icon={<Store size={22} />} label="Shops" />
              <NavItem to="/search" icon={<Search size={22} />} label="Search" />
              <NavItem to="/profile" icon={<User size={22} />} label="Profile" />
            </nav>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const SidebarNavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  const t = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { setBuyerFlowState } = useInventory();
  
  const getIsActive = () => {
    if (to === '/') return location.pathname === '/';
    if (to === '/shops') return location.pathname === '/shops' || location.pathname.startsWith('/shop/');
    if (to === '/search') return location.pathname === '/search';
    if (to === '/profile') {
      return location.pathname === '/profile' || 
             location.pathname.startsWith('/profile/') || 
             location.pathname === '/saved-items' || 
             location.pathname === '/notifications';
    }
    return false;
  };

  const isActive = getIsActive();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (to === '/') setBuyerFlowState('home');
    else if (to === '/shops') setBuyerFlowState('shops');
    else if (to === '/search') setBuyerFlowState('search');
    navigate(to);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300
        ${isActive 
          ? 'font-bold' 
          : 'hover:bg-white/5'}
      `}
      style={{
        background: isActive ? t.accent_bg : 'transparent',
        color: isActive ? t.accent : t.text_secondary
      }}
    >
      <div className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
        {icon}
      </div>
      <span className="text-[15px]">{label}</span>
      {isActive && (
        <motion.div 
          layoutId="sidebar-active"
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ background: t.accent }}
        />
      )}
    </button>
  );
};

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  const t = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { setBuyerFlowState } = useInventory();
  
  const getIsActive = () => {
    if (to === '/') return location.pathname === '/';
    if (to === '/shops') return location.pathname === '/shops' || location.pathname.startsWith('/shop/');
    if (to === '/shop-centre') {
      return location.pathname.startsWith('/shop-centre') || 
             location.pathname.startsWith('/dashboard') ||
             location.pathname.startsWith('/new-listing') ||
             location.pathname.startsWith('/orders') ||
             location.pathname.startsWith('/subscription-management');
    }
    if (to === '/search') return location.pathname === '/search';
    if (to === '/profile') {
      return location.pathname === '/profile' || 
             location.pathname.startsWith('/profile/') || 
             location.pathname === '/saved-items' || 
             location.pathname === '/notifications' ||
             location.pathname === '/settings';
    }
    return false;
  };

  const isActive = getIsActive();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Direct state setting as requested by user
    if (to === '/') {
      setBuyerFlowState('home');
    } else if (to === '/shops') {
      setBuyerFlowState('shops');
    } else if (to === '/search') {
      setBuyerFlowState('search');
    } else if (to === '/profile') {
      // Profile is a separate screen, not handled by BuyerJourney state-switcher
    }
    
    navigate(to);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all duration-300 relative
        ${isActive ? '' : 'hover:scale-110'}
      `}
      style={{ color: isActive ? t.nav_active : t.nav_inactive }}
    >
      {icon}
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: t.nav_active }} />
      )}
    </button>
  );
};

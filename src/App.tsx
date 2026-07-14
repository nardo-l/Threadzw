// src/App.tsx

import { useState, useEffect, useRef, useMemo } from 'react';

const appStartTime = performance.now();
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SplashScreen } from './screens/SplashScreen';
import { SignUp } from './screens/SignUp';
import { CheckEmail } from './screens/CheckEmail';
import { BuildingScreen } from './screens/BuildingScreen';
import { AuthCallback } from './screens/AuthCallback';
import { ResetPassword } from './screens/ResetPassword';
import { Dashboard } from './screens/Dashboard';
import { AddProduct } from './screens/AddProduct';
import { EditProduct } from './screens/EditProduct';
import { Inventory } from './screens/Inventory';
import { Settings } from './screens/Settings';
import { ShopEdit } from './screens/ShopEdit';
import { SalesSystem } from './screens/SalesSystem';
import { Support } from './screens/Support';
import { Notifications } from './screens/Notifications';
import { Search } from './screens/Search';
import { ShopProfileView } from './components/buyer-flow/ShopProfileView';
import { ProductDetail } from './screens/ProductDetail';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { FollowProvider } from './context/FollowContext';
import { InventoryProvider } from './context/InventoryContext';
import { Toaster } from 'sonner';
import { LandingPage } from './screens/LandingPage';
import { AdminLeads } from './screens/AdminLeads';
import { SetupShop } from './screens/SetupShop';
import { ShopProvider, useShopContext } from './context/ShopContext';
import { StorefrontPage } from './pages/StorefrontPage';
import { ShopDirectoryPage } from './pages/ShopDirectoryPage';
import { Login } from './screens/Login';
import { MaintenanceOverlay } from './components/MaintenanceOverlay';
import { NardoPayCheckout } from './screens/NardoPayCheckout';


type AppStage = 'landing' | 'onboarding' | 'paywall' | 'building' | 'dashboard' | 'admin' | 'shop' | 'product' | 'setup' | 'shop-directory' | 'checkout';

const getInitialStageAndParams = (pathname: string): { stage: AppStage; handle?: string; id?: string } => {
  const path = pathname.toLowerCase().replace(/\/$/, '');

  if (path === '/shop' || path === '/store' || path === '/shops') {
    return { stage: 'shop-directory' };
  }
  if (path === '/demo' || path === '/shop/demo' || path === '/store/demo') {
    return { stage: 'shop', handle: 'demo' };
  }
  if (path === '/admin') {
    return { stage: 'admin' };
  }
  if (path === '/onboarding' || path === '/signup') {
    return { stage: 'onboarding' };
  }
  if (path.startsWith('/dashboard') || path === '/inventory' || path === '/add-product' || path.startsWith('/edit-product') || path === '/settings' || path === '/edit-shop') {
    return { stage: 'dashboard' };
  }
  if (path === '/setup') {
    return { stage: 'setup' };
  }
  if (path.startsWith('/checkout')) {
    return { stage: 'checkout' };
  }
  
  // Match /product/:id
  const productMatch = pathname.match(/^\/product\/([a-z0-9_-]+)$/i);
  if (productMatch) {
    return {
      stage: 'product',
      id: productMatch[1]
    };
  }

  // Deep parse for permanent unique storefront URLs
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const firstSegment = segments[0];
    const reserved = ['login', 'signup', 'admin', 'onboarding', 'dashboard', 'inventory', 'add-product', 'settings', 'edit-shop', 'setup', 'demo', 'product', 'api', 's', 'shop', 'store', 'checkout', 'auth', 'reset-password', 'check-email'];
    
    if (firstSegment === 's') {
      const shopId = segments[1];
      if (shopId) {
        return { stage: 'shop', id: shopId };
      }
    }
    
    if (firstSegment === 'shop' || firstSegment === 'store') {
      const secondSegment = segments[1];
      if (secondSegment) {
        if (secondSegment.includes('--')) {
          const idx = secondSegment.lastIndexOf('--');
          return { stage: 'shop', id: secondSegment.substring(idx + 2) };
        } else {
          return { stage: 'shop', id: secondSegment };
        }
      }
    }
    
    if (firstSegment.includes('--')) {
      const idx = firstSegment.lastIndexOf('--');
      const slugPart = firstSegment.substring(0, idx);
      const idPart = firstSegment.substring(idx + 2);
      // Since it has '--', it's always a persistent storefront URL, regardless of whether the slug is a reserved word
      return { stage: 'shop', handle: slugPart, id: idPart };
    }

    // Default: If it's not a reserved route, treat as raw slug storefront
    if (!reserved.includes(firstSegment.toLowerCase())) {
      return { stage: 'shop', handle: firstSegment.toLowerCase() };
    }
  }

  // Match /store/:slug or /shop/:handle (Legacy backup support)
  const shopMatch = pathname.match(/^\/(?:shop|store)\/@?([a-z0-9_-]+)$/i);
  if (shopMatch) {
    return {
      stage: 'shop',
      handle: shopMatch[1].replace(/^@/, '').toLowerCase()
    };
  }

  return { stage: 'landing' };
};

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const cleanPath = location.pathname.toLowerCase().replace(/\/$/, '');
  
  const initialData = getInitialStageAndParams(location.pathname);
  const [appStage, setAppStageState] = useState<AppStage>(initialData.stage);
  const appStageRef = useRef<AppStage>(initialData.stage);
  
  const [hasInitialized, setHasInitialized] = useState(false);
  const authLoadingDoneRef = useRef<number | null>(null);
  const shopLoadingDoneRef = useRef<number | null>(null);
  const profileLoadingDoneRef = useRef<number | null>(null);
  const loggedTimingsRef = useRef(false);

  const { session, loading, profile } = useAuth();
  const { shop, loading: shopLoading, hasShop, refreshShop } = useShopContext();

  // Handle public routes unconditionally to prevent any auth lag or state conflicts
  const isPublicShopPath = useMemo(() => {
    const segments = cleanPath.split('/').filter(Boolean);
    if (cleanPath === '/demo' || cleanPath === '/shop' || cleanPath === '/store' || cleanPath === '/shops' || cleanPath.startsWith('/shop/') || cleanPath.startsWith('/store/') || cleanPath.startsWith('/s/')) {
      return true;
    }
    if (segments.length > 0) {
      const firstSegment = segments[0];
      if (firstSegment.includes('--')) {
        // Since it has '--', it's always a persistent storefront URL
        return true;
      }
      const reserved = ['login', 'signup', 'admin', 'onboarding', 'dashboard', 'inventory', 'add-product', 'edit-product', 'settings', 'edit-shop', 'setup', 'demo', 'product', 'api', 'checkout', 'auth', 'reset-password', 'check-email'];
      if (!reserved.includes(firstSegment.toLowerCase())) {
        return true;
      }
    }
    return false;
  }, [cleanPath]);

  // Track auth loading done time
  if (!loading && !authLoadingDoneRef.current) {
    authLoadingDoneRef.current = performance.now();
  }

  // Track profile loading done time
  if (profile && !profileLoadingDoneRef.current) {
    profileLoadingDoneRef.current = performance.now();
  }

  // Track shop loading done time
  if (!shopLoading && !shopLoadingDoneRef.current && !loading) {
    shopLoadingDoneRef.current = performance.now();
  }

  useEffect(() => {
    if (hasInitialized) return;

    // Instant bypass for public storefront routes to prevent any lag or splash display
    if (isPublicShopPath) {
      console.log("FORENSIC STARTUP: Public path detected. Bypassing startup delays.");
      setHasInitialized(true);
      return;
    }

    // Hard limit of 1 second for splash display
    const timer = setTimeout(() => {
      console.log("FORENSIC STARTUP: Hard limit of 1 second reached. Initializing app anyway.");
      setHasInitialized(true);
    }, 1000);

    // If auth loading is done
    if (!loading) {
      if (!session) {
        // If not logged in, we can initialize immediately
        console.log("FORENSIC STARTUP: Auth finished (unauthenticated). Initializing app.");
        clearTimeout(timer);
        setHasInitialized(true);
      } else {
        // If logged in, wait for shop loading to finish
        if (!shopLoading) {
          console.log("FORENSIC STARTUP: Auth & Shop finished (authenticated). Initializing app.");
          clearTimeout(timer);
          setHasInitialized(true);
        }
      }
    }

    return () => clearTimeout(timer);
  }, [loading, session, shopLoading, hasInitialized, isPublicShopPath]);

  useEffect(() => {
    if (hasInitialized && !loggedTimingsRef.current) {
      loggedTimingsRef.current = true;
      const totalStartupTime = performance.now() - appStartTime;
      const splashDuration = totalStartupTime; // since splash is unmounted when hasInitialized is true

      const authRestorationTime = authLoadingDoneRef.current 
        ? authLoadingDoneRef.current - appStartTime 
        : 0;

      const profileLoadingTime = (profileLoadingDoneRef.current && authLoadingDoneRef.current)
        ? Math.max(0, profileLoadingDoneRef.current - authLoadingDoneRef.current)
        : 0;

      const shopLoadingTime = (shopLoadingDoneRef.current && authLoadingDoneRef.current)
        ? Math.max(0, shopLoadingDoneRef.current - authLoadingDoneRef.current)
        : 0;

      console.log("%c⚡ THREADZW PERFORMANCE REPORT ⚡", "color: #25D366; font-weight: bold; font-size: 14px;");
      console.log(`- Splash Duration: ${splashDuration.toFixed(2)}ms`);
      console.log(`- Auth Restoration Time: ${authRestorationTime.toFixed(2)}ms`);
      console.log(`- Profile Loading Time: ${profileLoadingTime.toFixed(2)}ms`);
      console.log(`- Shop Loading Time: ${shopLoadingTime.toFixed(2)}ms`);
      console.log(`- Total Startup Time: ${totalStartupTime.toFixed(2)}ms`);
      console.log(`- Target: Under 1s warm, Under 2s cold. Result: ${totalStartupTime < 1000 ? "WARM PASS" : totalStartupTime < 2000 ? "COLD PASS" : "FAIL"}`);
    }
  }, [hasInitialized]);

  const setAppStage = async (stage: AppStage) => {
    console.log(`[FORENSIC-ROUTE-STAGE] setAppStage called. Target stage: "${stage}", current stage: "${appStageRef.current}"`);
    appStageRef.current = stage;
    setAppStageState(stage);
    
    // Synced path push
    if (stage === 'landing') {
      console.log("[FORENSIC-ROUTE-STAGE] Redirecting to landing page: /");
      navigate('/');
    }
    else if (stage === 'building') {
      console.log("[FORENSIC-ROUTE-STAGE] Redirecting to building: /building");
      navigate('/building');
    }
    else if (stage === 'onboarding') {
      console.log("[FORENSIC-ROUTE-STAGE] Redirecting to onboarding signup: /signup");
      navigate('/signup');
    }
    else if (stage === 'dashboard') {
      console.log("[FORENSIC-ROUTE-STAGE] Preparing dashboard stage. Calling refreshShop()...");
      const t0 = performance.now();
      await refreshShop();
      const t1 = performance.now();
      console.log(`[FORENSIC-ROUTE-STAGE] refreshShop() finished in ${(t1 - t0).toFixed(2)}ms. Navigating to /dashboard...`);
      navigate('/dashboard');
    }
    else if (stage === 'admin') {
      console.log("[FORENSIC-ROUTE-STAGE] Redirecting to admin: /admin");
      navigate('/admin');
    }
    else if (stage === 'setup') {
      console.log("[FORENSIC-ROUTE-STAGE] Redirecting to setup: /setup");
      navigate('/setup');
    }
    else if (stage === 'checkout') {
      console.log("[FORENSIC-ROUTE-STAGE] Redirecting to checkout: /checkout/nardopay");
      navigate('/checkout/nardopay');
    }
  };

  const isDashboardSubPath = useMemo(() => {
    return (
      appStage === 'dashboard' ||
      cleanPath === '/dashboard' ||
      cleanPath.startsWith('/dashboard/') ||
      cleanPath === '/inventory' ||
      cleanPath === '/settings' ||
      cleanPath === '/edit-shop' ||
      cleanPath === '/add-product' ||
      cleanPath.startsWith('/edit-product/')
    );
  }, [appStage, cleanPath]);

  // Keep appStage in sync with path transitions
  useEffect(() => {
    const data = getInitialStageAndParams(location.pathname);
    setAppStageState(data.stage);
    appStageRef.current = data.stage;
  }, [location.pathname]);

  // Route protection and syncing
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    console.log("[FORENSIC-ROUTE-GUARD] Route Sync Effect triggered. Path:", path, "authLoading:", loading, "shopLoading:", shopLoading, "hasShop:", hasShop, "isPublicShopPath:", isPublicShopPath, "loggedIn:", !!session, "appStage:", appStageRef.current);

    if (loading) {
      console.log("[FORENSIC-ROUTE-GUARD] Auth loading in progress, returning.");
      return;
    }
    
    // Allow public routes
    if (isPublicShopPath) {
      console.log("[FORENSIC-ROUTE-GUARD] Public shop path. Sync bypassed.");
      return;
    }

    if (
      path === '' ||
      path === '/' ||
      path === '/login' ||
      path === '/signup' ||
      path === '/check-email' ||
      path === '/onboarding' ||
      path.startsWith('/shop/') || 
      path.startsWith('/store/') || 
      path === '/demo' || 
      path === '/demo/' || 
      path === '/admin' || 
      path.startsWith('/product/') ||
      path.startsWith('/checkout') ||
      path.startsWith('/auth') ||
      path === '/reset-password'
    ) {
      console.log("[FORENSIC-ROUTE-GUARD] Special/Public/Form route, returning.");
      return;
    }

    const loggedIn = !!session;

    if (!loggedIn) {
      console.log("[FORENSIC-ROUTE-GUARD] User is not logged in on protected route. Current stage:", appStageRef.current);
      if (
        appStageRef.current !== 'landing' && 
        appStageRef.current !== 'onboarding' &&
        appStageRef.current !== 'building'
      ) {
        console.log("[FORENSIC-ROUTE-GUARD] Changing stage to 'landing' due to unauthenticated state.");
        setAppStage('landing');
      }
    } else {
      console.log("[FORENSIC-ROUTE-GUARD] User is logged in on protected route. Checking shopLoading...");
      if (shopLoading) {
        console.log("[FORENSIC-ROUTE-GUARD] shopLoading is true, delaying stage adjustment.");
        return;
      }

      console.log("[FORENSIC-ROUTE-GUARD] User is logged in and shop is done loading. Current stage:", appStageRef.current);
      if (
        appStageRef.current !== 'dashboard' &&
        appStageRef.current !== 'onboarding' &&
        appStageRef.current !== 'building' &&
        appStageRef.current !== 'setup'
      ) {
        console.log("[FORENSIC-ROUTE-GUARD] Transitioning stage to 'dashboard'.");
        setAppStage('dashboard');
      }
    }
  }, [loading, session, shopLoading, hasShop, location.pathname, isPublicShopPath]);

  if (!hasInitialized) {
    return <SplashScreen />;
  }

  // Standalone Login and Signup Router Blocks
  if (cleanPath === '/login') {
    return <Login />;
  }

  if (cleanPath === '/signup') {
    return <SignUp />;
  }

  if (cleanPath === '/check-email') {
    return <CheckEmail />;
  }

  if (cleanPath === '/auth/confirm') {
    return <AuthCallback />;
  }

  if (cleanPath === '/reset-password') {
    return <ResetPassword />;
  }

  if (isPublicShopPath || appStage === 'shop' || appStage === 'shop-directory') {
    return (
      <Routes>
        <Route path="/demo" element={<StorefrontPage />} />
        
        {/* Marketplace Directory Routes */}
        <Route path="/shops" element={<ShopDirectoryPage />} />
        <Route path="/shop" element={<Navigate to="/shops" replace />} />
        <Route path="/store" element={<Navigate to="/shops" replace />} />
        
        {/* Support formatting in /s/:slug */}
        <Route path="/s/:slug" element={<StorefrontPage />} />
        <Route path="/s/:slug/products" element={<StorefrontPage />} />
        <Route path="/s/:slug/product/:productId" element={<StorefrontPage />} />
        <Route path="/s/:slug/category/:categoryId" element={<StorefrontPage />} />
        <Route path="/s/:slug/about" element={<StorefrontPage />} />

        {/* Supports both /shop/:slug--id and /shop/:slug formats */}
        <Route path="/shop/:slug" element={<StorefrontPage />} />
        <Route path="/shop/:slug/products" element={<StorefrontPage />} />
        <Route path="/shop/:slug/product/:productId" element={<StorefrontPage />} />
        <Route path="/shop/:slug/category/:categoryId" element={<StorefrontPage />} />
        <Route path="/shop/:slug/about" element={<StorefrontPage />} />

        {/* Supports both /store/:slug--id and /store/:slug formats */}
        <Route path="/store/:slug" element={<StorefrontPage />} />
        <Route path="/store/:slug/products" element={<StorefrontPage />} />
        <Route path="/store/:slug/product/:productId" element={<StorefrontPage />} />
        <Route path="/store/:slug/category/:categoryId" element={<StorefrontPage />} />
        <Route path="/store/:slug/about" element={<StorefrontPage />} />

        {/* Supports direct root path, e.g. /:slug--id */}
        <Route path="/:slug" element={<StorefrontPage />} />
        <Route path="/:slug/products" element={<StorefrontPage />} />
        <Route path="/:slug/product/:productId" element={<StorefrontPage />} />
        <Route path="/:slug/category/:categoryId" element={<StorefrontPage />} />
        <Route path="/:slug/about" element={<StorefrontPage />} />

        <Route path="*" element={<StorefrontPage />} />
      </Routes>
    );
  }

  if (appStage === 'product') {
    return (
      <Routes>
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (appStage === 'admin') {
    return <AdminLeads />;
  }

  if (appStage === 'landing') {
    return (
      <LandingPage 
        onStartFree={() => {
          localStorage.removeItem('threadzw_logged_in');
          localStorage.removeItem('threadzw_onboarding_complete');
          localStorage.removeItem('threadzw_onboarding_step');
          localStorage.removeItem('threadzw_onboarding_states');
          localStorage.removeItem('threadzw_owner_name');
          setAppStage('onboarding');
        }} 
        onLoginSuccess={() => {
          setAppStage('dashboard');
        }} 
      />
    );
  }

  if (appStage === 'onboarding') {
    return (
      <SignUp />
    );
  }

  if (appStage === 'building') {
    return (
      <BuildingScreen
        setAppStage={setAppStage}
      />
    );
  }

  if (appStage === 'setup') {
    return <SetupShop onSetupComplete={refreshShop} />;
  }

  if (appStage === 'checkout') {
    return <NardoPayCheckout />;
  }

  if (isDashboardSubPath) {
    return (
      <Routes>
        <Route path="/" element={<Dashboard initialLocked={false} />} />
        <Route path="/dashboard" element={<Dashboard initialLocked={false} />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/edit-shop" element={<ShopEdit />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/edit-product/:id" element={<EditProduct />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }

  return session ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <FollowProvider>
            <InventoryProvider>
              <ShopProvider>
                <AppContent />
                <MaintenanceOverlay />
                <ToastContainer />
                <Toaster position="top-center" theme="dark" expand={false} richColors />
              </ShopProvider>
            </InventoryProvider>
          </FollowProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

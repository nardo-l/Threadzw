// src/App.tsx

import { useState, useEffect, useRef, useMemo } from 'react';

const appStartTime = performance.now();
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SplashScreen } from './screens/SplashScreen';
import { SignUp } from './screens/SignUp';
import { ThreadzwOnboarding } from './screens/ThreadzwOnboarding';
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
import { Search } from './screens/Search';
import { ProductDetail } from './screens/ProductDetail';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { Toaster } from 'sonner';
import { LandingPage } from './screens/LandingPage';
import { AdminLeads } from './screens/AdminLeads';
import { ShopProvider, useShopContext } from './context/ShopContext';
import { StorefrontPage } from './pages/StorefrontPage';
import { BioPageView } from './components/public-pages/BioPageView';
import { ShopDirectoryPage } from './pages/ShopDirectoryPage';
import { Login } from './screens/Login';
import { Subscription } from './screens/Subscription';
import { Paywall } from './screens/Paywall';
import { SubscriptionSuccess } from './screens/SubscriptionSuccess';
import { Analytics } from './screens/Analytics';
import { Notifications } from './screens/Notifications';
import { SuccessScreen } from './components/onboarding/SuccessScreen';
import { ProPlanShowcase } from './screens/ProPlanShowcase';
import { AddVehicle } from './screens/AddVehicle';
import { EditVehicle } from './screens/EditVehicle';
import { DesignSystemPart1 } from './components/design-system/DesignSystemPart1';
import { DesignSystemPart2 } from './components/design-system/DesignSystemPart2';
import { DesignSystemPart3 } from './components/design-system/DesignSystemPart3';
import { DesignSystemPart4 } from './components/design-system/DesignSystemPart4';
import { DesignSystemPart5 } from './components/design-system/DesignSystemPart5';


type AppStage = 'landing' | 'onboarding' | 'paywall' | 'building' | 'dashboard' | 'admin' | 'shop' | 'product' | 'setup' | 'shop-directory' | 'checkout' | 'pricing' | 'setup-success' | 'subscription' | 'pro-showcase' | 'design-system' | 'design-system-2' | 'design-system-3' | 'design-system-4' | 'design-system-5';

const getInitialStageAndParams = (pathname: string): { stage: AppStage; slug?: string; id?: string } => {
  const path = pathname.toLowerCase().replace(/\/$/, '');

  if (path === '/design-system-part-5' || path === '/design-system' || path === '/presentation-5' || path === '/presentation') {
    return { stage: 'design-system-5' };
  }

  if (path === '/design-system-part-4' || path === '/presentation-4') {
    return { stage: 'design-system-4' };
  }

  if (path === '/design-system-part-3' || path === '/presentation-3') {
    return { stage: 'design-system-3' };
  }

  if (path === '/design-system-part-2' || path === '/presentation-2') {
    return { stage: 'design-system-2' };
  }

  if (path === '/design-system-part-1' || path === '/presentation-1') {
    return { stage: 'design-system' };
  }

  if (path === '/pro-showcase') {
    return { stage: 'pro-showcase' };
  }

  if (path === '/shop' || path === '/store' || path === '/shops') {
    return { stage: 'shop-directory' };
  }
  if (path === '/demo' || path === '/shop/demo' || path === '/store/demo') {
    return { stage: 'shop', slug: 'him-clothing' };
  }
  if (path === '/admin') {
    return { stage: 'admin' };
  }
  if (path === '/onboarding' || path === '/signup') {
    return { stage: 'onboarding' };
  }
  if (path.startsWith('/dashboard') || path === '/inventory' || path === '/analytics' || path === '/notifications' || path === '/add-product' || path.startsWith('/edit-product') || path === '/add-vehicle' || path.startsWith('/edit-vehicle') || path === '/settings' || path === '/edit-shop' || path === '/edit-profile') {
    return { stage: 'dashboard' };
  }
  if (path === '/pricing') {
    return { stage: 'pricing' };
  }
  if (path === '/setup-success') {
    return { stage: 'setup-success' };
  }
  if (path === '/setup') {
    return { stage: 'setup' };
  }
  if (path.startsWith('/checkout')) {
    return { stage: 'checkout' };
  }
  if (path === '/paywall') {
    return { stage: 'paywall' };
  }
  if (path === '/subscription') {
    return { stage: 'subscription' };
  }
  if (path === '/subscription/success') {
    return { stage: 'subscription-success' as any };
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
    const reserved = ['login', 'signup', 'admin', 'onboarding', 'dashboard', 'inventory', 'add-product', 'edit-product', 'add-vehicle', 'edit-vehicle', 'settings', 'notifications', 'edit-shop', 'edit-profile', 'setup', 'pricing', 'setup-success', 'demo', 'product', 'api', 's', 'shop', 'store', 'checkout', 'auth', 'reset-password', 'subscription', 'paywall'];
    
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
      return { stage: 'shop', slug: slugPart, id: idPart };
    }

    // Default: If it's not a reserved route, treat as raw slug storefront
    if (!reserved.includes(firstSegment.toLowerCase())) {
      return { stage: 'shop', slug: firstSegment.toLowerCase() };
    }
  }

  // Match /store/:slug or /shop/:handle (Legacy backup support)
  const shopMatch = pathname.match(/^\/(?:shop|store)\/@?([a-z0-9_-]+)$/i);
  if (shopMatch) {
    return {
      stage: 'shop',
      slug: shopMatch[1].replace(/^@/, '').toLowerCase()
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
      const reserved = ['login', 'signup', 'admin', 'onboarding', 'dashboard', 'inventory', 'add-product', 'edit-product', 'add-vehicle', 'edit-vehicle', 'settings', 'notifications', 'edit-shop', 'edit-profile', 'setup', 'pricing', 'setup-success', 'demo', 'product', 'api', 'checkout', 'auth', 'reset-password', 'subscription'];
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
    console.log(`[ROUTER] navigation decisions. setAppStage called. Target stage: "${stage}", current stage: "${appStageRef.current}"`);
    appStageRef.current = stage;
    setAppStageState(stage);
    
    // Synced path push
    if (stage === 'landing') {
      console.log("[ROUTER] navigation decisions. Redirecting to landing page: /");
      navigate('/');
    }
    else if (stage === 'building') {
      console.log("[ROUTER] navigation decisions. Redirecting to building: /building");
      navigate('/building');
    }
    else if (stage === 'onboarding') {
      console.log("[ROUTER] navigation decisions. Redirecting to onboarding signup: /signup");
      navigate('/onboarding');
    }
    else if (stage === 'dashboard') {
      console.log("[ROUTER] navigation decisions. Preparing dashboard stage. Calling refreshShop()...");
      const t0 = performance.now();
      await refreshShop();
      const t1 = performance.now();
      console.log(`[ROUTER] refreshShop() finished in ${(t1 - t0).toFixed(2)}ms. Navigating to /dashboard...`);
      navigate('/dashboard');
    }
    else if (stage === 'admin') {
      console.log("[ROUTER] navigation decisions. Redirecting to admin: /admin");
      navigate('/admin');
    }
    else if (stage === 'pricing') {
      navigate('/pricing');
    }
    else if (stage === 'setup-success') {
      navigate('/setup-success');
    }
    else if (stage === 'setup') {
      console.log("[ROUTER] navigation decisions. Redirecting to setup: /setup");
      navigate('/setup');
    }
    else if (stage === 'subscription') {
      console.log("[ROUTER] navigation decisions. Redirecting to subscription: /subscription");
      navigate('/subscription');
    }
  };

  const isDashboardSubPath = useMemo(() => {
    if (
      cleanPath === '/subscription' || 
      cleanPath === '/subscription/success' ||
      cleanPath.startsWith('/checkout') || 
      cleanPath === '/pricing' || 
      cleanPath === '/setup' || 
      cleanPath === '/setup-success'
    ) {
      return false;
    }
    return (
      appStage === 'dashboard' ||
      cleanPath === '/dashboard' ||
      cleanPath.startsWith('/dashboard/') ||
      cleanPath === '/inventory' ||
      cleanPath === '/analytics' ||
      cleanPath === '/settings' ||
      cleanPath === '/notifications' ||
      cleanPath === '/edit-shop' ||
      cleanPath === '/edit-profile' ||
      cleanPath === '/add-product' ||
      cleanPath.startsWith('/edit-product/') ||
      cleanPath === '/add-vehicle' ||
      cleanPath.startsWith('/edit-vehicle/')
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
    const path = location.pathname.toLowerCase().replace(/\/$/, '');
    console.log("[ROUTER] Route Sync Effect triggered. Path:", path, "authLoading:", loading, "shopLoading:", shopLoading, "hasShop:", hasShop, "isPublicShopPath:", isPublicShopPath, "loggedIn:", !!session, "appStage:", appStageRef.current);

    if (loading) {
      console.log("[ROUTER] Auth loading in progress, returning.");
      return;
    }
    
    // Allow public routes
    if (isPublicShopPath) {
      console.log("[ROUTER] Public shop path. Sync bypassed.");
      return;
    }

    const loggedIn = !!session;

    if (path === '' || path === '/') {
      console.log("[ROUTER] Root landing page. Returning to let user view landing page.");
      return;
    }

    // Handle special auth paths when logged in or out
    if (
      path === '/login' ||
      path === '/signup' ||
      path === '/onboarding'
    ) {
      if (path === '/signup' || path === '/onboarding') {
        // Allow user to remain on onboarding/signup flow without interruption
        console.log("[ROUTER] User is on onboarding/signup route. Allowing flow to continue.");
        return;
      }
      if (!loggedIn) {
        // If not logged in on /login, fine to view
        console.log("[ROUTER] Special route while unauthenticated, returning.");
        return;
      } else {
        // If logged in on /login, check if shop is still loading
        if (shopLoading) {
          console.log("[ROUTER] shopLoading is true on special route, delaying decision.");
          return;
        }

        if (hasShop) {
          console.log("[ROUTER] User has shop on /login route. Transitioning to dashboard.");
          setAppStage('dashboard');
        } else {
          console.log("[ROUTER] User has no shop on /login route. Transitioning to onboarding.");
          setAppStage('onboarding');
        }
        return;
      }
    }

    // Other non-onboarding, non-landing public routes are bypassed
    if (
      path.startsWith('/shop/') || 
      path.startsWith('/store/') || 
      path === '/demo' || 
      path === '/admin' || 
      path.startsWith('/product/') ||
      path.startsWith('/auth') ||
      path === '/reset-password' ||
      path === '/subscription' ||
      path === '/subscription/success' ||
      path === '/setup-success'
    ) {
      console.log("[ROUTER] General public route bypassed.");
      return;
    }

    if (!loggedIn) {
      console.log("[ROUTER] User is not logged in on protected route. Current stage:", appStageRef.current);
      if (
        appStageRef.current !== 'landing' && 
        appStageRef.current !== 'onboarding' &&
        appStageRef.current !== 'building'
      ) {
        console.log("[ROUTER] navigation decisions. Changing stage to 'landing' due to unauthenticated state.");
        setAppStage('landing');
      }
    } else {
      console.log("[ROUTER] User is logged in on protected route. Checking shopLoading...");
      if (shopLoading) {
        console.log("[ROUTER] shopLoading is true, delaying stage adjustment.");
        return;
      }

      console.log("[ROUTER] User is logged in and shop is done loading. Current stage:", appStageRef.current);
      if (!hasShop) {
        // If logged in but does not have a shop, protect from dashboard subpaths and redirect to onboarding!
        console.log("[ROUTER] User is logged in on protected route but has no shop. Transitioning to onboarding.");
        setAppStage('onboarding');
        return;
      }

      if (
        appStageRef.current !== 'dashboard' &&
        appStageRef.current !== 'onboarding' &&
        appStageRef.current !== 'building' &&
        appStageRef.current !== 'setup' && appStageRef.current !== 'setup-success' && appStageRef.current !== 'pricing' && appStageRef.current !== 'subscription'
      ) {
        console.log("[ROUTER] navigation decisions. Transitioning stage to 'dashboard'.");
        setAppStage('dashboard');
      }
    }
  }, [loading, session, shopLoading, hasShop, location.pathname, isPublicShopPath]);

  if (!hasInitialized) {
    return <SplashScreen />;
  }

  // Standalone Login and Signup Router Blocks
  if (cleanPath === '/design-system-part-5' || cleanPath === '/design-system' || cleanPath === '/presentation-5' || cleanPath === '/presentation' || appStage === 'design-system-5') {
    return <DesignSystemPart5 />;
  }

  if (cleanPath === '/design-system-part-4' || cleanPath === '/presentation-4' || appStage === 'design-system-4') {
    return <DesignSystemPart4 />;
  }

  if (cleanPath === '/design-system-part-3' || cleanPath === '/presentation-3' || appStage === 'design-system-3') {
    return <DesignSystemPart3 />;
  }

  if (cleanPath === '/design-system-part-2' || cleanPath === '/presentation-2' || appStage === 'design-system-2') {
    return <DesignSystemPart2 />;
  }

  if (cleanPath === '/design-system-part-1' || cleanPath === '/presentation-1' || appStage === 'design-system') {
    return <DesignSystemPart1 />;
  }

  if (cleanPath === '/login') {
    return <Login />;
  }

  if (cleanPath === '/signup' || cleanPath === '/onboarding') {
    return <ThreadzwOnboarding />;
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
        <Route path="/demo" element={<Navigate to="/shop/him-clothing?page=home" replace />} />
        
        {/* Marketplace Directory Routes */}
        <Route path="/shops" element={<ShopDirectoryPage />} />
        <Route path="/shop" element={<Navigate to="/shops" replace />} />
        <Route path="/store" element={<Navigate to="/shops" replace />} />
        
        {/* Support formatting in /s/:slug */}
        <Route path="/s/:slug" element={<BioPageView />} />
        <Route path="/s/:slug/products" element={<BioPageView />} />
        <Route path="/s/:slug/product/:productId" element={<BioPageView />} />
        <Route path="/s/:slug/category/:categoryId" element={<BioPageView />} />
        <Route path="/s/:slug/about" element={<BioPageView />} />

        {/* Supports both /shop/:slug--id and /shop/:slug formats */}
        <Route path="/shop/:slug" element={<BioPageView />} />
        <Route path="/shop/:slug/products" element={<BioPageView />} />
        <Route path="/shop/:slug/product/:productId" element={<BioPageView />} />
        <Route path="/shop/:slug/category/:categoryId" element={<BioPageView />} />
        <Route path="/shop/:slug/about" element={<BioPageView />} />

        {/* Supports both /store/:slug--id and /store/:slug formats */}
        <Route path="/store/:slug" element={<BioPageView />} />
        <Route path="/store/:slug/products" element={<BioPageView />} />
        <Route path="/store/:slug/product/:productId" element={<BioPageView />} />
        <Route path="/store/:slug/category/:categoryId" element={<BioPageView />} />
        <Route path="/store/:slug/about" element={<BioPageView />} />

        {/* Supports direct root path, e.g. /:slug--id */}
        <Route path="/:slug" element={<BioPageView />} />
        <Route path="/:slug/products" element={<BioPageView />} />
        <Route path="/:slug/product/:productId" element={<BioPageView />} />
        <Route path="/:slug/category/:categoryId" element={<BioPageView />} />
        <Route path="/:slug/about" element={<BioPageView />} />

        <Route path="*" element={<BioPageView />} />
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
          setAppStage('onboarding');
        }} 
        onLoginSuccess={() => {
          setAppStage('dashboard');
        }} 
      />
    );
  }

  if (appStage === 'onboarding') {
    return <ThreadzwOnboarding />;
  }

  if (appStage === 'building') {
    return (
      <BuildingScreen
        setAppStage={setAppStage}
      />
    );
  }

  if (appStage === 'pro-showcase' || cleanPath === '/pro-showcase') {
    return <ProPlanShowcase />;
  }

  if (appStage === 'pricing') {
    return <SignUp initialStep={3} />;
  }
  if (appStage === 'setup-success' || cleanPath === '/setup-success') {
    return <SuccessScreen onContinue={() => { setAppStage('setup'); navigate('/signup?step=6'); }} />;
  }
  if (appStage === 'setup') {
    return <SignUp initialStep={6} />;
  }

  if (appStage === 'subscription' || cleanPath === '/subscription') {
    return <Subscription />;
  }

  if (cleanPath === '/subscription/success') {
    return <SubscriptionSuccess />;
  }

  if (isDashboardSubPath) {
    return (
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/edit-shop" element={<ShopEdit />} />
        <Route path="/edit-profile" element={<ShopEdit initialSubView="edit-profile" />} />
        <Route path="/account" element={<ShopEdit />} />
        <Route path="/edit-profile" element={<ShopEdit initialSubView="edit-profile" />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/edit-product/:id" element={<EditProduct />} />
        <Route path="/add-vehicle" element={<AddVehicle />} />
        <Route path="/edit-vehicle/:id" element={<EditVehicle />} />
        <Route path="/paywall" element={<Paywall />} />
        <Route path="/subscription" element={<Subscription />} />
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
          <ShopProvider>
            <AppContent />
            <ToastContainer />
            <Toaster position="top-center" theme="dark" expand={false} richColors />
          </ShopProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

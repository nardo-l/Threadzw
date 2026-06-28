// src/App.tsx

import { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingFlow } from './screens/OnboardingFlow';
import { BuildingScreen } from './screens/BuildingScreen';
import { Dashboard } from './screens/Dashboard';
import { AddProduct } from './screens/AddProduct';
import { EditProduct } from './screens/EditProduct';
import { Inventory } from './screens/Inventory';
import { Settings } from './screens/Settings';
import { ShopEdit } from './screens/ShopEdit';
import { SalesSystem } from './screens/SalesSystem';
import { OrderManagement } from './screens/OrderManagement';
import { Profile } from './screens/Profile';
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
import { SignUp } from './screens/SignUp';
import { MaintenanceOverlay } from './components/MaintenanceOverlay';


type AppStage = 'landing' | 'onboarding' | 'paywall' | 'building' | 'dashboard' | 'admin' | 'shop' | 'product' | 'setup' | 'shop-directory';

const getInitialStageAndParams = (pathname: string): { stage: AppStage; handle?: string; id?: string } => {
  const path = pathname.toLowerCase().replace(/\/$/, '');

  if (path === '/shop' || path === '/store') {
    return { stage: 'shop-directory' };
  }
  if (path === '/demo' || path === '/shop/demo' || path === '/store/demo') {
    return { stage: 'shop', handle: 'demo' };
  }
  if (path === '/admin') {
    return { stage: 'admin' };
  }
  if (path === '/onboarding') {
    return { stage: 'onboarding' };
  }
  if (path.startsWith('/dashboard') || path === '/inventory' || path === '/add-product' || path.startsWith('/edit-product') || path === '/settings' || path === '/edit-shop') {
    return { stage: 'dashboard' };
  }
  if (path === '/setup') {
    return { stage: 'setup' };
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
    const reserved = ['login', 'signup', 'admin', 'onboarding', 'dashboard', 'inventory', 'add-product', 'settings', 'edit-shop', 'setup', 'demo', 'product', 'api', 's', 'shop', 'store'];
    
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
  
  const { shop, loading: shopLoading, hasShop, refreshShop } = useShopContext();

  const setAppStage = (stage: AppStage) => {
    appStageRef.current = stage;
    setAppStageState(stage);
    // Synced path push
    if (stage === 'landing') navigate('/');
    else if (stage === 'building') navigate('/building');
    else if (stage === 'dashboard') {
      refreshShop();
      navigate('/dashboard');
    }
    else if (stage === 'admin') navigate('/admin');
    else if (stage === 'setup') navigate('/setup');
  };

  const { session, loading } = useAuth();

  // Handle public routes unconditionally to prevent any auth lag or state conflicts
  const isPublicShopPath = useMemo(() => {
    const segments = cleanPath.split('/').filter(Boolean);
    if (cleanPath === '/demo' || cleanPath === '/shop' || cleanPath === '/store' || cleanPath.startsWith('/shop/') || cleanPath.startsWith('/store/') || cleanPath.startsWith('/s/')) {
      return true;
    }
    if (segments.length > 0) {
      const firstSegment = segments[0];
      if (firstSegment.includes('--')) {
        // Since it has '--', it's always a persistent storefront URL
        return true;
      }
      const reserved = ['login', 'signup', 'admin', 'onboarding', 'dashboard', 'inventory', 'add-product', 'edit-product', 'settings', 'edit-shop', 'setup', 'demo', 'product', 'api'];
      if (!reserved.includes(firstSegment.toLowerCase())) {
        return true;
      }
    }
    return false;
  }, [cleanPath]);

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
    if (loading) return;
    
    // Allow public routes
    if (isPublicShopPath) {
      return;
    }

    const path = location.pathname.toLowerCase();
    if (
      path === '' ||
      path === '/' ||
      path === '/login' ||
      path === '/signup' ||
      path.startsWith('/shop/') || 
      path.startsWith('/store/') || 
      path === '/demo' || 
      path === '/demo/' || 
      path === '/admin' || 
      path.startsWith('/product/')
    ) {
      return;
    }

    const loggedIn = !!session;

    if (!loggedIn) {
      if (
        appStageRef.current !== 'landing' && 
        appStageRef.current !== 'onboarding' &&
        appStageRef.current !== 'building'
      ) {
        setAppStage('landing');
      }
    } else {
      if (shopLoading) return;

      if (
        appStageRef.current !== 'dashboard' &&
        appStageRef.current !== 'onboarding' &&
        appStageRef.current !== 'building'
      ) {
        setAppStage('dashboard');
      }
    }
  }, [loading, session, shopLoading, hasShop, location.pathname, isPublicShopPath]);

  if (loading) {
    return <SplashScreen />;
  }

  // Standalone Login and Signup Router Blocks
  if (cleanPath === '/login') {
    return <Login />;
  }

  if (cleanPath === '/signup') {
    return (
      <OnboardingFlow 
        setAppStage={setAppStage}
      />
    );
  }

  if (isPublicShopPath || appStage === 'shop' || appStage === 'shop-directory') {
    return (
      <Routes>
        <Route path="/demo" element={<StorefrontPage />} />
        
        {/* Marketplace Directory Routes */}
        <Route path="/shop" element={<ShopDirectoryPage />} />
        <Route path="/store" element={<Navigate to="/shop" replace />} />
        
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

  if (session && shopLoading) {
    return <SplashScreen />;
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
      <OnboardingFlow 
        setAppStage={setAppStage}
      />
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

  return <SplashScreen />;
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

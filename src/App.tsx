// src/App.tsx

import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingFlow } from './screens/OnboardingFlow';
import { BuildingScreen } from './screens/BuildingScreen';
import { Dashboard } from './screens/Dashboard';
import { AddProduct } from './screens/AddProduct';
import { EditProduct } from './screens/EditProduct';
import { Inventory } from './screens/Inventory';
import { Analytics } from './screens/Analytics';
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
import { PublicShopPage } from './screens/PublicShopPage';
import { LandingPage } from './screens/LandingPage';
import { AdminLeads } from './screens/AdminLeads';
import { mockShop } from './data/mockData';
import { SetupShop } from './screens/SetupShop';
import { ShopProvider, useShopContext } from './context/ShopContext';
import { StorefrontPage } from './pages/StorefrontPage';
import { Login } from './screens/Login';
import { SignUp } from './screens/SignUp';

type AppStage = 'landing' | 'onboarding' | 'paywall' | 'building' | 'dashboard' | 'admin' | 'shop' | 'product' | 'setup';

const getInitialStageAndParams = (pathname: string): { stage: AppStage; handle?: string; id?: string } => {
  const path = pathname.toLowerCase().replace(/\/$/, '');

  if (path === '/demo' || path === '/shop/demo' || path === '/store/demo') {
    return { stage: 'shop', handle: 'demo' };
  }
  if (path === '/admin') {
    return { stage: 'admin' };
  }
  if (path === '/onboarding') {
    return { stage: 'onboarding' };
  }
  if (path.startsWith('/dashboard') || path === '/inventory' || path === '/add-product' || path === '/settings' || path === '/edit-shop') {
    return { stage: 'dashboard' };
  }
  if (path === '/setup') {
    return { stage: 'setup' };
  }
  
  // Match /store/:slug or /shop/:handle
  const shopMatch = pathname.match(/^\/(?:shop|store)\/@?([a-z0-9_-]+)$/i);
  if (shopMatch) {
    return {
      stage: 'shop',
      handle: shopMatch[1].replace(/^@/, '').toLowerCase()
    };
  }

  // Match /product/:id
  const productMatch = pathname.match(/^\/product\/([a-z0-9_-]+)$/i);
  if (productMatch) {
    return {
      stage: 'product',
      id: productMatch[1]
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
    else if (stage === 'dashboard') navigate('/dashboard');
    else if (stage === 'admin') navigate('/admin');
    else if (stage === 'setup') navigate('/setup');
  };

  const { session, loading } = useAuth();

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
  }, [loading, session, shopLoading, hasShop, location.pathname]);

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

  // Handle public routes unconditionally to prevent any auth lag or state conflicts
  const isPublicShopPath = cleanPath === '/demo' || cleanPath.startsWith('/shop/') || cleanPath.startsWith('/store/');

  if (isPublicShopPath) {
    return (
      <Routes>
        <Route path="/demo" element={<StorefrontPage />} />
        <Route path="/shop/:slug" element={<StorefrontPage />} />
        <Route path="/shop/:slug/products" element={<StorefrontPage />} />
        <Route path="/shop/:slug/product" element={<StorefrontPage />} />
        <Route path="/shop/:slug/product/:productId" element={<StorefrontPage />} />
        <Route path="/shop/:slug/category/:categoryId" element={<StorefrontPage />} />
        <Route path="/shop/:slug/about" element={<StorefrontPage />} />
        <Route path="/store/:slug" element={<StorefrontPage />} />
        <Route path="/store/:slug/products" element={<StorefrontPage />} />
        <Route path="/store/:slug/product" element={<StorefrontPage />} />
        <Route path="/store/:slug/product/:productId" element={<StorefrontPage />} />
        <Route path="/store/:slug/category/:categoryId" element={<StorefrontPage />} />
        <Route path="/store/:slug/about" element={<StorefrontPage />} />
        <Route path="*" element={<StorefrontPage />} />
      </Routes>
    );
  }

  if (session && shopLoading) {
    return <SplashScreen />;
  }

  if (appStage === 'shop') {
    return (
      <Routes>
        <Route path="/shop/:slug" element={<StorefrontPage />} />
        <Route path="/shop/:slug/products" element={<StorefrontPage />} />
        <Route path="/shop/:slug/product" element={<StorefrontPage />} />
        <Route path="/shop/:slug/product/:productId" element={<StorefrontPage />} />
        <Route path="/shop/:slug/category/:categoryId" element={<StorefrontPage />} />
        <Route path="/shop/:slug/about" element={<StorefrontPage />} />
        <Route path="/store/:slug" element={<StorefrontPage />} />
        <Route path="/store/:slug/products" element={<StorefrontPage />} />
        <Route path="/store/:slug/product" element={<StorefrontPage />} />
        <Route path="/store/:slug/product/:productId" element={<StorefrontPage />} />
        <Route path="/store/:slug/category/:categoryId" element={<StorefrontPage />} />
        <Route path="/store/:slug/about" element={<StorefrontPage />} />
        <Route path="/demo" element={<StorefrontPage />} />
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

  if (appStage === 'dashboard' || cleanPath === '/dashboard' || cleanPath.startsWith('/dashboard/')) {
    return (
      <Routes>
        <Route path="/" element={<Dashboard initialLocked={false} />} />
        <Route path="/dashboard" element={<Dashboard initialLocked={false} />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/edit-product/:productId" element={<EditProduct />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/sales" element={<OrderManagement />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/support" element={<Support />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/search" element={<Search />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/edit-shop" element={<ShopEdit />} />
        
        {/* Core Router Aliases requested in Part 4/8 */}
        <Route path="/dashboard/products" element={<Inventory />} />
        <Route path="/dashboard/edit" element={<ShopEdit />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/analytics" element={<Analytics />} />
        
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

import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingFlow } from './screens/OnboardingFlow';
import { Paywall } from './screens/Paywall';
import { BuildingScreen } from './screens/BuildingScreen';
import { Dashboard } from './screens/Dashboard';
import { AddProduct } from './screens/AddProduct';
import { EditProduct } from './screens/EditProduct';
import { Inventory } from './screens/Inventory';
import { Analytics } from './screens/Analytics';
import { Settings } from './screens/Settings';
import { ShopEdit } from './screens/ShopEdit';
import { SalesSystem } from './screens/SalesSystem';
import { ShopProfileView } from './components/buyer-flow/ShopProfileView';
import { ProductDetail } from './screens/ProductDetail';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { FollowProvider } from './context/FollowContext';
import { InventoryProvider } from './context/InventoryContext';
import { Toaster } from 'sonner';
import { PublicShopPage } from './screens/PublicShopPage';
import { LandingPage } from './screens/LandingPage';
import { AdminLeads } from './screens/AdminLeads';
import { mockShop } from './data/mockData';
import { SetupShop } from './screens/SetupShop';
import { ShopProvider, useShopContext } from './context/ShopContext';

type AppStage = 'landing' | 'onboarding' | 'paywall' | 'building' | 'dashboard' | 'admin' | 'shop' | 'product' | 'setup';

const getInitialStageAndParams = (): { stage: AppStage; handle?: string; id?: string } => {
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '');

  if (path === '/demo' || path === '/shop/demo' || path === '/store/demo') {
    return { stage: 'shop', handle: 'demo' };
  }
  if (path === '/admin') {
    return { stage: 'admin' };
  }
  if (path === '/dashboard') {
    return { stage: 'dashboard' };
  }
  if (path === '/setup') {
    return { stage: 'setup' };
  }
  
  // Match /store/:slug or /shop/:handle
  const shopMatch = window.location.pathname.match(/^\/(?:shop|store)\/@?([a-z0-9_-]+)$/i);
  if (shopMatch) {
    return {
      stage: 'shop',
      handle: shopMatch[1].replace(/^@/, '').toLowerCase()
    };
  }

  // Match /product/:id
  const productMatch = window.location.pathname.match(/^\/product\/([a-z0-9_-]+)$/i);
  if (productMatch) {
    return {
      stage: 'product',
      id: productMatch[1]
    };
  }

  return { stage: 'landing' };
};

function AppContent() {
  const initialData = getInitialStageAndParams();
  const [appStage, setAppStageState] = useState<AppStage>(initialData.stage);
  const appStageRef = useRef<AppStage>(initialData.stage);
  
  const { shop, loading: shopLoading, hasShop, refreshShop } = useShopContext();

  const setAppStage = (stage: AppStage) => {
    appStageRef.current = stage;
    setAppStageState(stage);
    // Synced path push
    if (stage === 'landing') window.history.pushState({}, '', '/');
    else if (stage === 'building') window.history.pushState({}, '', '/building');
    else if (stage === 'paywall') window.history.pushState({}, '', '/paywall');
    else if (stage === 'dashboard') window.history.pushState({}, '', '/dashboard');
    else if (stage === 'admin') window.history.pushState({}, '', '/admin');
    else if (stage === 'setup') window.history.pushState({}, '', '/setup');
  };

  const [paywallScreen, setPaywallScreen] = useState(1);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [myShop, setMyShop] = useState<any>(mockShop);
  const [paywallMode, setPaywallMode] = useState<'signup' | 'payment'>('signup');
  const [authLoading, setAuthLoading] = useState(false); // Immediate visual mockup loading

  // Consolidated Onboarding Shop Context Data State
  const [shopData, setShopData] = useState({
    ownerName: '',
    name: '',
    category: '',
    town: 'Harare',
    whatsapp: '',
    description: '',
    instagram: '',
    priceRange: '10-50',
    productEstimate: '50-100'
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(mockShop.logo_url);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(mockShop.banner_url);

  const { session, loading } = useAuth();

  // Sync stage to browser navigation popstate
  useEffect(() => {
    const handlePopState = () => {
      const data = getInitialStageAndParams();
      setAppStageState(data.stage);
      appStageRef.current = data.stage;
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route protection and syncing
  useEffect(() => {
    if (loading) return;
    
    // Allow public routes
    const path = window.location.pathname;
    if (path.startsWith('/shop/') || path.startsWith('/store/') || path === '/demo' || path === '/demo/' || path === '/admin' || path.startsWith('/product/')) {
      return;
    }

    const loggedIn = localStorage.getItem('threadzw_logged_in') === 'true';

    if (!loggedIn) {
      if (
        appStageRef.current !== 'landing' && 
        appStageRef.current !== 'onboarding' &&
        appStageRef.current !== 'building' && 
        appStageRef.current !== 'paywall'
      ) {
        setAppStage('landing');
      }
    } else {
      if (shopLoading) return;

      if (!hasShop) {
        if (appStageRef.current !== 'setup') {
          setAppStage('setup');
        }
      } else {
        if (appStageRef.current !== 'dashboard') {
          setAppStage('dashboard');
        }
      }
    }
  }, [loading, session, shopLoading, hasShop]);

  if (loading || authLoading) {
    return <SplashScreen />;
  }

  // Handle public routes unconditionally to prevent any auth lag or state conflicts
  const cleanPath = window.location.pathname.toLowerCase().replace(/\/$/, '');
  const isDemoUrl = cleanPath === '/demo' || cleanPath === '/shop/demo' || cleanPath === '/store/demo' || cleanPath.endsWith('/demo');

  if (isDemoUrl) {
    return (
      <Routes>
        <Route path="/demo" element={<PublicShopPage handle="demo" />} />
        <Route path="/shop/:shopSlug" element={<PublicShopPage handle="demo" />} />
        <Route path="/store/:shopSlug" element={<PublicShopPage handle="demo" />} />
        <Route path="*" element={<PublicShopPage handle="demo" />} />
      </Routes>
    );
  }

  if (cleanPath.startsWith('/shop/') || cleanPath.startsWith('/store/')) {
    const handle = initialData.handle || 'demo';
    return (
      <Routes>
        <Route path="/shop/:shopSlug" element={<PublicShopPage handle={handle} />} />
        <Route path="/store/:shopSlug" element={<PublicShopPage handle={handle} />} />
        <Route path="*" element={<PublicShopPage handle={handle} />} />
      </Routes>
    );
  }

  if (localStorage.getItem('threadzw_logged_in') === 'true' && shopLoading) {
    return <SplashScreen />;
  }

  if (appStage === 'shop') {
    const handle = initialData.handle || 'demo';
    return (
      <Routes>
        <Route path="/shop/:shopSlug" element={<PublicShopPage handle={handle} />} />
        <Route path="/store/:shopSlug" element={<PublicShopPage handle={handle} />} />
        <Route path="/demo" element={<PublicShopPage handle="demo" />} />
        <Route path="*" element={<PublicShopPage handle={handle} />} />
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
        setPaywallScreen={setPaywallScreen}
      />
    );
  }

  if (appStage === 'paywall') {
    return (
      <Paywall
        paywallScreen={paywallScreen}
        setPaywallScreen={setPaywallScreen}
        paywallMode={paywallMode}
        setPaywallMode={setPaywallMode}
        myShop={myShop}
        setMyShop={setMyShop}
        setAppStage={setAppStage}
        setOnboardingStep={setOnboardingStep}
        shopData={shopData}
      />
    );
  }

  if (appStage === 'building') {
    return (
      <BuildingScreen
        setAppStage={setAppStage}
        setPaywallScreen={setPaywallScreen}
      />
    );
  }

  if (appStage === 'setup') {
    return <SetupShop onSetupComplete={refreshShop} />;
  }

  if (appStage === 'dashboard') {
    return (
      <Routes>
        <Route path="/" element={<Dashboard initialLocked={false} />} />
        <Route path="/dashboard" element={<Dashboard initialLocked={false} />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/edit-product/:productId" element={<EditProduct />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/sales" element={<SalesSystem />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/edit-shop" element={<ShopEdit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
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
          <SubscriptionProvider>
            <FollowProvider>
              <InventoryProvider>
                <ShopProvider>
                  <AppContent />
                  <ToastContainer />
                  <Toaster position="top-center" theme="dark" expand={false} richColors />
                </ShopProvider>
              </InventoryProvider>
            </FollowProvider>
          </SubscriptionProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

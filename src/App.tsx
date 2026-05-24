import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { SplashScreen } from './screens/SplashScreen';
import { Paywall } from './screens/Paywall';
import { OnboardingFlow } from './screens/OnboardingFlow';
import { BuildingScreen } from './screens/BuildingScreen';
import { RevealScreen } from './screens/RevealScreen';
import { Dashboard } from './screens/Dashboard';
import { AddProduct } from './screens/AddProduct';
import { EditProduct } from './screens/EditProduct';
import { Inventory } from './screens/Inventory';
import { Analytics } from './screens/Analytics';
import { Settings } from './screens/Settings';
import { ShopEdit } from './screens/ShopEdit';
import { ShopProfileView } from './components/buyer-flow/ShopProfileView';
import { ProductDetail } from './screens/ProductDetail';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { FollowProvider } from './context/FollowContext';
import { InventoryProvider } from './context/InventoryContext';
import { Toaster } from 'sonner';
import { PublicShopPage } from './screens/PublicShopPage';
import { LandingPage } from './screens/LandingPage';

type AppStage = 'landing' | 'paywall' | 'onboarding' | 'building' | 'reveal' | 'dashboard';

const getRouteFromURL = () => {
  const path = window.location.pathname;

  // Match /shop/@handle or /shop/handle
  const shopMatch = path.match(/^\/shop\/@?([a-z0-9_-]+)$/i);

  if (shopMatch) {
    return {
      type: 'shop',
      handle: shopMatch[1].replace(/^@/, '').toLowerCase()
    };
  }

  return { type: 'app' };
};

function AppContent() {
  const [currentRoute] = useState(getRouteFromURL());

  // Render public shop page immediately without requiring auth
  if (currentRoute.type === 'shop') {
    return (
      <PublicShopPage
        handle={currentRoute.handle}
      />
    );
  }

  // Top level view controller states
  const [appStage, setAppStage] = useState<AppStage | null>(null);
  const appStageRef = useRef<AppStage | null>(null);
  useEffect(() => {
    appStageRef.current = appStage;
  }, [appStage]);
  const [paywallScreen, setPaywallScreen] = useState(1);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [myShop, setMyShop] = useState<any>(null);
  const [paywallMode, setPaywallMode] = useState<'signup' | 'payment'>('signup');
  const [authLoading, setAuthLoading] = useState(true);

  const [dashboardLocked, setDashboardLocked] = useState(false);
  const [signupAlreadyDone, setSignupAlreadyDone] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Consolidated Onboarding Shop Context Data State
  const [shopData, setShopData] = useState({
    ownerName: '',
    name: '',
    category: '',
    town: '',
    whatsapp: '',
    description: '',
    instagram: '',
    priceRange: '',
    productEstimate: ''
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const initApp = async () => {
    setAuthLoading(true);
    try {
      console.log('initApp starting view check...');
      const route = getRouteFromURL();
      if (route.type === 'shop') {
        setAuthLoading(false);
        return;
      }

      // Check session
      const {
        data: { session: activeSession }
      } = await supabase.auth.getSession();

      if (!activeSession?.user?.id) {
        console.log('No active auth session. Routing to Landing Page.');
        setAppStage('landing');
        setAuthLoading(false);
        return;
      }

      console.log('Auth session detected:', activeSession.user.id);
      setSession(activeSession);

      const [profileResult, shopResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', activeSession.user.id)
          .maybeSingle(),
        supabase
          .from('shops')
          .select('*')
          .eq('owner_id', activeSession.user.id)
          .maybeSingle()
      ]);

      const profile = profileResult.data;
      const shop = shopResult.data;

      // HAS SHOP — go straight to dashboard
      if (shop) {
        setMyShop(shop);

        const isExpired =
          shop.subscription_status === 'expired' ||
          (shop.subscription_status === 'trial' &&
            new Date(shop.trial_ends_at) < new Date());

        if (isExpired) {
          console.log('Subscription has expired. Locking Dashboard.');
          setAppStage('dashboard');
          setDashboardLocked(true);
        } else {
          console.log('Shop verified active! Routing to Dashboard workspace.');
          setAppStage('dashboard');
          setDashboardLocked(false);
        }
        return;
      }

      // HAS ACCOUNT BUT NO SHOP
      if (profile) {
        console.log('Profile exists but no shop. Starting onboarding with signup already done.');
        setAppStage('onboarding');
        setOnboardingStep(1);
        setSignupAlreadyDone(true);
        return;
      }

      // Account exists but no profile
      setAppStage('onboarding');
      setOnboardingStep(1);
    } catch (err) {
      console.error('App init security/query fail:', err);
      setAppStage('landing');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  // Listen to external auth session terminations or initiations
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('App state auth event listener signal:', event, 'Stage ref:', appStageRef.current);
      if (event === 'SIGNED_IN') {
        if (appStageRef.current === 'paywall' || appStageRef.current === 'building' || appStageRef.current === 'reveal') {
          console.log('Bypassing initApp() since we are in paywall/building/reveal state.');
          return;
        }
        initApp();
      } else if (event === 'SIGNED_OUT') {
        setAppStage('landing');
        setOnboardingStep(1);
        setMyShop(null);
        setDashboardLocked(false);
        setSignupAlreadyDone(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Public buyer storefront routing logic (unrestricted shop profiles & product pages)
  const isPublicPath =
    window.location.pathname.startsWith('/shop/') ||
    window.location.pathname.startsWith('/product/');

  if (isPublicPath) {
    console.log('Public route detected. Bypassing state machine checker.');
    return (
      <Router>
        <Routes>
          <Route path="/shop/:handle" element={<ShopProfileView />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  // Core Merchant state machine router render tree
  if (authLoading) {
    return <SplashScreen />;
  }

  if (appStage === 'landing') {
    return (
      <LandingPage 
        onStartFree={() => {
          setAppStage('paywall');
          setPaywallScreen(1);
          setPaywallMode('signup');
        }} 
        onLoginSuccess={() => {
          initApp();
        }} 
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

  if (appStage === 'onboarding') {
    return (
      <OnboardingFlow
        onboardingStep={onboardingStep}
        setOnboardingStep={setOnboardingStep}
        setAppStage={setAppStage}
        setPaywallScreen={setPaywallScreen}
        setPaywallMode={setPaywallMode}
        shopData={shopData}
        setShopData={setShopData}
        logoFile={logoFile}
        setLogoFile={setLogoFile}
        logoPreview={logoPreview}
        setLogoPreview={setLogoPreview}
        bannerFile={bannerFile}
        setBannerFile={setBannerFile}
        bannerPreview={bannerPreview}
        setBannerPreview={setBannerPreview}
        signupAlreadyDone={signupAlreadyDone}
      />
    );
  }

  if (appStage === 'building') {
    return (
      <BuildingScreen
        shopData={shopData}
        logoFile={logoFile}
        bannerFile={bannerFile}
        setMyShop={setMyShop}
        setAppStage={setAppStage}
      />
    );
  }

  if (appStage === 'reveal') {
    return (
      <RevealScreen
        myShop={myShop}
        setAppStage={setAppStage}
      />
    );
  }

  if (appStage === 'dashboard') {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard initialLocked={dashboardLocked} />} />
          <Route path="/dashboard" element={<Dashboard initialLocked={dashboardLocked} />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/edit-product/:productId" element={<EditProduct />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/edit-shop" element={<ShopEdit />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  return <SplashScreen />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SubscriptionProvider>
          <FollowProvider>
            <InventoryProvider>
              <AppContent />
              <ToastContainer />
              <Toaster position="top-center" theme="dark" expand={false} richColors />
            </InventoryProvider>
          </FollowProvider>
        </SubscriptionProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

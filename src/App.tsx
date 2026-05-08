/*
TO RESET ONBOARDING FOR TESTING
run this in browser console:

localStorage.removeItem('thread_onboarding_complete')
localStorage.removeItem('thread_town_selected')
localStorage.removeItem('thread_style_picked')
localStorage.removeItem('thread_has_account')
localStorage.removeItem('thread_user_town')

Then hard refresh the page.
*/

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { motion } from 'motion/react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/supabase';
import { Layout } from './components/Layout';
import { HomeFeed } from './screens/HomeFeed';
import { Shops } from './screens/Shops';
import { BestDresser } from './screens/BestDresser';
import { Dashboard } from './screens/Dashboard';
import { Profile } from './screens/Profile';
import { EditProfile } from './screens/EditProfile';
import { ProductDetail } from './screens/ProductDetail';
import { Quiz } from './screens/Quiz';
import { SavedItems } from './screens/SavedItems';
import { OnboardingSlides } from './screens/OnboardingSlides';
import { TownSelector } from './screens/TownSelector';
import { StylePicker } from './screens/StylePicker';
import { StyleResult } from './screens/StyleResult';
import { ShopProfile } from './screens/ShopProfile';
import { ShopCentre } from './screens/ShopCentre';
import { ShopEdit } from './screens/ShopEdit';
import { MyProducts } from './screens/MyProducts';
import { OrderManagement } from './screens/OrderManagement';
import { Auth } from './screens/Auth';
import { AuthCallback } from './screens/AuthCallback';
import { Search } from './screens/Search';
import { HowToUse } from './screens/HowToUse';
import { Enquiries } from './screens/Enquiries';
import { Following } from './screens/Following';
import { Followers } from './screens/Followers';
import { NewListing } from './screens/NewListing';
import { EditProduct } from './screens/EditProduct';
import { SplashScreen } from './screens/SplashScreen';
import { SellerOnboarding } from './screens/SellerOnboarding';
import { Paywall } from './screens/Paywall';
import { SubscriptionManagement } from './screens/SubscriptionManagement';
import { ForgotPassword } from './screens/ForgotPassword';
import { ResetPassword } from './screens/ResetPassword';
import { StoriesViewer } from './components/StoriesViewer';
import { BuyerJourney } from './screens/BuyerJourney';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { FollowProvider } from './context/FollowContext';
import { AppSubscriptionGuard } from './components/AppSubscriptionGuard';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { SessionExpiredOverlay } from './components/SessionExpiredOverlay';
import { ProtectedRoute, AuthRoute } from './components/ProtectedRoute';
import { Toaster, toast } from 'sonner';
import { mapError } from './lib/utils';

export const THEMES = {
  dark: {
    // Backgrounds
    bg_primary: '#000000',
    bg_secondary: '#0a0a0a',
    bg_card: '#111111',
    bg_card_2: '#1a1a1a',
    bg_input: '#111111',
    bg_elevated: '#1a1a1a',
    
    // Borders
    border_primary: '#222222',
    border_secondary: '#1a1a1a',
    border_subtle: '#333333',
    
    // Text
    text_primary: '#ffffff',
    text_secondary: '#888888',
    text_tertiary: '#555555',
    text_placeholder: '#444444',
    
    // Accent — pink
    accent: '#FF2D78',
    accent_dark: '#CC0055',
    accent_bg: 'rgba(255,45,120,0.1)',
    accent_border: 'rgba(255,45,120,0.25)',
    
    // Gradient
    gradient: 'linear-gradient(135deg, #9B27AF, #FF2D78)',
    
    // Status colors
    green: '#22c55e',
    green_bg: 'rgba(34,197,94,0.1)',
    green_border: 'rgba(34,197,94,0.25)',
    amber: '#f59e0b',
    amber_bg: 'rgba(245,158,11,0.1)',
    amber_border: 'rgba(245,158,11,0.25)',
    red: '#ef4444',
    red_bg: 'rgba(239,68,68,0.1)',
    red_border: 'rgba(239,68,68,0.25)',
    blue: '#3b82f6',
    blue_bg: 'rgba(59,130,246,0.1)',
    blue_border: 'rgba(59,130,246,0.25)',
    
    // Bottom nav
    nav_bg: '#000000',
    nav_border: '#111111',
    nav_active: '#FF2D78',
    nav_inactive: '#555555',
    
    // Story ring
    story_ring: '#FF2D78',
    
    // Overlay
    overlay: 'rgba(0,0,0,0.75)',
    
    // Shadow
    shadow: '0 4px 20px rgba(0,0,0,0.4)',
    shadow_lg: '0 8px 40px rgba(0,0,0,0.6)'
  },
  
  light: {
    // Backgrounds
    bg_primary: '#F5F5F5',
    bg_secondary: '#EFEFEF',
    bg_card: '#FFFFFF',
    bg_card_2: '#F8F8F8',
    bg_input: '#FFFFFF',
    bg_elevated: '#FFFFFF',
    
    // Borders
    border_primary: '#E0E0E0',
    border_secondary: '#EBEBEB',
    border_subtle: '#D4D4D4',
    
    // Text
    text_primary: '#1a1a1a',
    text_secondary: '#6C757D',
    text_tertiary: '#9E9E9E',
    text_placeholder: '#BDBDBD',
    
    // Accent — slightly darker pink
    accent: '#E0245E',
    accent_dark: '#B5003A',
    accent_bg: 'rgba(224,36,94,0.08)',
    accent_border: 'rgba(224,36,94,0.2)',
    
    // Gradient
    gradient: 'linear-gradient(135deg, #7B1FA2, #E0245E)',
    
    // Status colors
    green: '#16a34a',
    green_bg: 'rgba(22,163,74,0.08)',
    green_border: 'rgba(22,163,74,0.2)',
    amber: '#d97706',
    amber_bg: 'rgba(217,119,6,0.08)',
    amber_border: 'rgba(217,119,6,0.2)',
    red: '#dc2626',
    red_bg: 'rgba(220,38,38,0.08)',
    red_border: 'rgba(220,38,38,0.2)',
    blue: '#2563eb',
    blue_bg: 'rgba(37,99,235,0.08)',
    blue_border: 'rgba(37,99,235,0.2)',
    
    // Bottom nav
    nav_bg: '#FFFFFF',
    nav_border: '#E0E0E0',
    nav_active: '#E0245E',
    nav_inactive: '#9E9E9E',
    
    // Story ring
    story_ring: '#E0245E',
    
    // Overlay
    overlay: 'rgba(0,0,0,0.5)',
    
    // Shadow
    shadow: '0 4px 20px rgba(0,0,0,0.08)',
    shadow_lg: '0 8px 40px rgba(0,0,0,0.12)'
  }
};

export const useSystemTheme = () => {
  const getTheme = () => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  };
  
  const [theme, setTheme] = useState(getTheme);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'light' : 'dark');
      console.log('System theme changed to:', e.matches ? 'light' : 'dark');
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);
  
  return theme;
};

export const ThemeContext = createContext<{
  theme: typeof THEMES.dark;
  themeMode: 'light' | 'dark' | 'system';
  activeTheme: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}>({
  theme: THEMES.dark,
  themeMode: 'dark',
  activeTheme: 'dark',
  setThemeMode: () => {}
});

export const useTheme = () => useContext(ThemeContext).theme;
export const useThemeControl = () => {
  const context = useContext(ThemeContext);
  return { 
    themeMode: context.themeMode, 
    setThemeMode: context.setThemeMode,
    activeTheme: context.activeTheme
  };
};

// Step 4: Credential Validator
const validateCredentials = () => {
  const errors = []
  
  if (!SUPABASE_URL) {
    errors.push('SUPABASE_URL is empty')
  }
  
  if ((SUPABASE_URL as string) === 'YOUR_SUPABASE_URL_HERE') {
    errors.push(
      'SUPABASE_URL is still a placeholder — replace with your real project URL'
    )
  }
  
  if (!SUPABASE_URL.startsWith('https://')) {
    errors.push('SUPABASE_URL must start with https://')
  }
  
  if (!SUPABASE_URL.includes('supabase.co')) {
    errors.push('SUPABASE_URL must include supabase.co')
  }
  
  if (!SUPABASE_ANON_KEY) {
    errors.push('SUPABASE_ANON_KEY is empty')
  }
  
  if ((SUPABASE_ANON_KEY as string) === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    errors.push(
      'SUPABASE_ANON_KEY is still a placeholder — replace with your real anon key'
    )
  }
  
  if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
    errors.push(
      'SUPABASE_ANON_KEY looks wrong — it should start with eyJ'
    )
  }
  
  return errors
}

const initializeOnboardingStep = () => {
  // Read ALL flags synchronously to determine the current step
  const slidesDone = localStorage.getItem('thread_onboarding_complete') === 'true';
  const townDone = localStorage.getItem('thread_town_selected') === 'true';
  const styleDone = localStorage.getItem('thread_style_picked') === 'true';
  const hasAccount = localStorage.getItem('thread_has_account') === 'true';
  
  console.log('Onboarding init:', {
    hasAccount,
    slidesDone,
    townDone,
    styleDone
  });
  
  // If they have an active account flag AND finished all steps, they are truly done
  if (hasAccount && slidesDone && townDone && styleDone) {
    return 'done';
  }

  // If ANY step is missing, we should probably start from where they left off
  // UNLESS they actually have a session (handled in AppContent)
  if (!slidesDone) return 'slides';
  if (!townDone) return 'town';
  if (!styleDone) return 'style_picker';
  
  return 'done';
};

function AppContent() {
  const t = useTheme();
  const { activeTheme } = useThemeControl();
  const { session, loading: authLoading, profile, isGuest, setIsGuest } = useAuth();
  const { setCurrentShopId, setBuyerFlowState } = useInventory();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [onboardingStep, setOnboardingStep] = useState(initializeOnboardingStep);

  // AUTH EVENT HANDLING (for Password Recovery)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // DEEP LINK HANDLING
  useEffect(() => {
    const handleDeepLink = async () => {
      const path = window.location.pathname;
      const shopMatch = path.match(/^\/shop\/@([a-zA-Z0-9_]+)$/);
      
      if (shopMatch) {
        const handle = shopMatch[1];
        try {
          const { data: shop, error } = await supabase
            .from('shops')
            .select(`
              *,
              products (
                id,
                name,
                images,
                price,
                total_stock,
                is_published
              )
            `)
            .eq('handle', handle.toLowerCase())
            .eq('is_live', true)
            .single();
          
          if (error || !shop) {
            toast.error('Shop not found or no longer active.');
            return;
          }
          
          // Auto-enable guest mode if they aren't logged in to view the shop
          if (!session && !isGuest) {
            setIsGuest(true);
          }

          setCurrentShopId(shop.id);
          setBuyerFlowState('shopProfile');
          
          // Clear URL
          window.history.replaceState({}, '', '/');
        } catch (err) {
          console.error('Deep link error:', err);
        }
      }
    };
    handleDeepLink();
  }, [session, isGuest, setIsGuest, setCurrentShopId, setBuyerFlowState]);

  useEffect(() => {
    // Update body background
    document.body.style.background = t.bg_primary;
    
    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', activeTheme === 'light' ? '#F5F5F5' : '#FF2D78');
    }
  }, [activeTheme, t]);

  // DEV RESET: If no session and we are marked as 'done' but some local state is missing, 
  // or if the user is stuck in a state where they should see onboarding.
  useEffect(() => {
    if (session) return; // Never reset if logged in
    
    const slidesDone = localStorage.getItem('thread_onboarding_complete') === 'true';
    const townDone = localStorage.getItem('thread_town_selected') === 'true';
    const styleDone = localStorage.getItem('thread_style_picked') === 'true';
    
    // If not logged in and onboarding not fully done, ensure we aren't in 'done' state
    if (onboardingStep === 'done' && (!slidesDone || !townDone || !styleDone)) {
      if (!slidesDone) setOnboardingStep('slides');
      else if (!townDone) setOnboardingStep('town');
      else if (!styleDone) setOnboardingStep('style_picker');
    }
  }, [session, onboardingStep]);

  // Global error listener for unhandled rejections
  const { signOut } = useAuth();
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Rejection:', event.reason);
      const reason = event.reason?.message || String(event.reason);
      const message = mapError(event.reason);
      
      if (message.includes('Connection error') || message.includes('internet')) {
        toast.error(message, { id: 'global-network-error', duration: 5000 });
      }
      
      // If we detect a refresh token error, we MUST force sign out to clear the corrupted state
      if (reason.includes('Refresh Token Not Found') || reason.includes('invalid refresh token')) {
        console.warn('Detected terminal session error, forcing sign out...');
        signOut();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, [signOut]);

  if (authLoading) {
    return <LocalSplashScreen />;
  }

  // VALIDATION: If credentials are missing, stop here and show help
  const credentialErrors = validateCredentials();
  if (credentialErrors.length > 0) {
    return (
      <div 
        className="min-h-screen p-8 flex flex-col items-center justify-center text-center"
        style={{ background: t.bg_primary, color: t.text_primary }}
      >
        <h2 className="text-2xl font-bold mb-4" style={{ color: t.accent }}>Configuration Missing</h2>
        <p className="mb-8 max-w-md" style={{ color: t.text_secondary }}>
          Thread ZW requires Supabase to run. Please check that your environment variables 
          (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are correctly set.
        </p>
        <div 
          className="p-4 rounded-xl text-left font-mono text-xs space-y-2 border"
          style={{ background: t.bg_card, borderColor: t.border_primary }}
        >
          {credentialErrors.map((err, i) => (
            <div key={i} className="text-red-400">• {err}</div>
          ))}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-3 rounded-full font-bold transition-all"
          style={{ background: t.bg_card, color: t.text_primary, border: `1px solid ${t.border_primary}` }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Check if user has an account
  const hasAccount = localStorage.getItem('thread_has_account') === 'true';

  // Existing user with session - Ensure hasAccount flag is set and go to MainApp
  if (session) {
    if (!hasAccount) {
      localStorage.setItem('thread_has_account', 'true');
    }
    return (
      <MainApp
        session={session}
        profile={profile}
        isGuest={isGuest}
        supabase={supabase}
      />
    );
  }

  // Guest user - skip onboarding and auth, go to main app
  if (isGuest) {
    return (
      <MainApp
        session={session}
        profile={profile}
        isGuest={isGuest}
        supabase={supabase}
      />
    );
  }

  // Signed out user - Decide between Onboarding and Auth
  if (!session && !isGuest) {
    // Pass Reset routes MUST bypass the global auth gate to be accessible
    const isPassResetRoute = location.pathname.startsWith('/forgot-password') || 
                            location.pathname.startsWith('/reset-password') ||
                            location.pathname.startsWith('/auth/callback');

    if (isPassResetRoute) {
      return (
        <MainApp
          session={session}
          profile={profile}
          isGuest={isGuest}
          supabase={supabase}
        />
      );
    }

    if (onboardingStep !== 'done') {
      return (
        <Routes>
          <Route 
            path="/onboarding/slides" 
            element={
              <OnboardingSlides 
                onComplete={() => {
                  localStorage.setItem('thread_onboarding_complete', 'true');
                  setOnboardingStep('town');
                  navigate('/onboarding/town');
                }} 
              />
            } 
          />
          <Route 
            path="/onboarding/town" 
            element={
              <TownSelector 
                onComplete={(town) => {
                  localStorage.setItem('thread_town_selected', 'true');
                  setOnboardingStep('style-picker');
                  navigate('/onboarding/style-picker');
                }} 
              />
            } 
          />
          <Route 
            path="/onboarding/style-picker" 
            element={
              <StylePicker 
                onComplete={() => {
                  // This is called on skip
                  localStorage.setItem('thread_style_picked', 'true');
                  setOnboardingStep('done');
                }} 
              />
            } 
          />
          <Route 
            path="/onboarding/style-result" 
            element={
              <StyleResult 
                onComplete={() => {
                  localStorage.setItem('thread_style_picked', 'true');
                  setOnboardingStep('done');
                }} 
              />
            } 
          />
          <Route path="*" element={<Navigate to={`/onboarding/${onboardingStep.replace('_', '-')}`} replace />} />
        </Routes>
      );
    }
    
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // Fallback
  return <Auth />;
}

function MainApp({ session, profile, isGuest, supabase }: any) {
  const location = useLocation();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Auth Only Routes (Redirect if logged in) */}
      <Route element={<AuthRoute />}>
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes (Require Auth or Guest) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout><Outlet /></Layout>}>
          <Route path="/" element={<BuyerJourney />} />
          <Route path="/shops" element={<BuyerJourney />} />
          <Route path="/shop/:id" element={<BuyerJourney />} />
          <Route path="/shop-centre" element={<ShopCentre />} />
          <Route path="/shop-centre/edit" element={<ShopEdit />} />
          <Route path="/my-products" element={<MyProducts />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/product/:id" element={<BuyerJourney />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/quiz" element={<BuyerJourney />} />
          <Route path="/saved-items" element={<BuyerJourney />} />
          <Route path="/search" element={<BuyerJourney />} />
          <Route path="/notifications" element={<BuyerJourney />} />
          <Route path="/enquiries" element={<Enquiries />} />
          <Route path="/following" element={<Following />} />
          <Route path="/shop/:id/followers" element={<Followers />} />
          <Route path="/new-listing" element={<NewListing />} />
          <Route path="/edit-product/:productId" element={<EditProduct />} />
          <Route path="/settings/subscription" element={<SubscriptionManagement />} />
          <Route path="/paywall" element={<Paywall />} />
          <Route path="/seller-onboarding" element={<SellerOnboarding />} />
          <Route path="/how-to-use" element={<HowToUse />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const systemTheme = useSystemTheme();
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('thread_theme_mode') as any) || 'dark';
  });

  const setThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeModeState(mode);
    localStorage.setItem('thread_theme_mode', mode);
  };

  const resolvedThemeName = (themeMode === 'system' ? systemTheme : themeMode) as 'light' | 'dark';
  const t = THEMES[resolvedThemeName];

  return (
    <ThemeContext.Provider value={{ theme: t, themeMode, setThemeMode, activeTheme: resolvedThemeName }}>
      <GlobalErrorBoundary>
        <AuthProvider>
          <SubscriptionProvider>
            <FollowProvider>
              <InventoryProvider>
                <ToastProvider>
                  <Router>
                    <AppSubscriptionGuard>
                      <AppContent />
                      <StoriesViewerWrapper />
                      <SessionExpiredOverlay />
                      <ToastContainer />
                    </AppSubscriptionGuard>
                  </Router>
                  <Toaster position="top-center" expand={false} richColors theme={resolvedThemeName === 'light' ? 'light' : 'dark'} />
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      width: 1,
                      height: 1,
                      overflow: 'hidden',
                      clip: 'rect(0,0,0,0)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Zimbabwe ThreadZW — Zimbabwe's Fashion Marketplace. Shop local clothing, sneakers, thrift and streetwear from shops in Harare, Bulawayo, Mutare and across Zimbabwe. ThreadZW connects buyers and sellers in Zimbabwe. Zimbabwe fashion marketplace. threadzw zimbabwe. buy clothes Zimbabwe. sell clothes Zimbabwe.
                  </div>
                </ToastProvider>
              </InventoryProvider>
            </FollowProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </GlobalErrorBoundary>
    </ThemeContext.Provider>
  );
}

function LocalSplashScreen() {
  const t = useTheme();
  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center z-[10000]"
      style={{ background: t.bg_primary }}
    >
      <h1 className="text-[32px] font-pacifico" style={{ color: t.accent }}>thread</h1>
      <div className="mt-8">
        <div 
          className="w-[28px] h-[28px] border-[2.5px] rounded-full animate-spin"
          style={{ borderColor: t.border_subtle, borderTopColor: t.accent }}
        />
      </div>
      <p className="text-[12px] mt-4" style={{ color: t.text_secondary }}>Checking your session...</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 0.7s linear infinite;
        }
      `}</style>
    </div>
  )
}

function StoriesViewerWrapper() {
  const { storiesViewerOpen } = useInventory();
  return storiesViewerOpen ? <StoriesViewer /> : null;
}

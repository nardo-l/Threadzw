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
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { RequestReset } from './screens/Auth/PasswordReset/RequestReset';
import { CheckEmail } from './screens/Auth/PasswordReset/CheckEmail';
import { SetNewPassword } from './screens/Auth/PasswordReset/SetNewPassword';
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
  const { session, loading: authLoading, profile, isGuest, setIsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [onboardingStep, setOnboardingStep] = useState(initializeOnboardingStep);

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
    
    return <Auth onGuest={() => setIsGuest(true)} />;
  }

  // Fallback
  return <Auth onGuest={() => setIsGuest(true)} />;
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
        <Route path="/forgot-password" element={<RequestReset />} />
        <Route path="/forgot-password/sent" element={<CheckEmail />} />
        <Route path="/reset-password" element={<SetNewPassword />} />
      </Route>

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
  return (
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
                <Toaster position="top-center" expand={false} richColors />
              </ToastProvider>
            </InventoryProvider>
          </FollowProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}

function LocalSplashScreen() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[10000]">
      <h1 className="text-[32px] font-pacifico text-[#FF2D78]">thread</h1>
      <div className="mt-8">
        <div className="w-[28px] h-[28px] border-[2.5px] border-[#222] border-t-[#FF2D78] rounded-full animate-spin" />
      </div>
      <p className="text-[#888] text-[12px] mt-4">Checking your session...</p>
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

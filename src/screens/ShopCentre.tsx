import React from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { SellerOnboarding } from '../components/seller-flow/SellerOnboarding';
import { ShopSetupForm } from '../components/seller-flow/ShopSetupForm';
import { TrialActivationView } from '../components/seller-flow/TrialActivationView';
import { PendingCodeView } from '../components/seller-flow/PendingCodeView';
import { LiveShopCentreView } from '../components/seller-flow/LiveShopCentreView';
import { PaywallFlow } from '../components/seller-flow/PaywallFlow';
import { DashboardView } from '../components/seller-flow/DashboardView';
import { AddProductView } from '../components/seller-flow/AddProductView';
import { CodeEntryView } from '../components/seller-flow/CodeEntryView';
import { ShopEditView } from '../components/seller-flow/ShopEditView';
import { PaymentReceivedView } from '../components/seller-flow/PaymentReceivedView';

export const ShopCentre: React.FC = () => {
  const { session } = useAuth();
  const { sellerFlowState, setSellerFlowState, refreshInventory } = useInventory();
  const [myShop, setMyShop] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const getShopState = React.useCallback((shop: any) => {
    if (!shop) return 'no_shop';
    
    const now = Date.now();
    const trialEnd = shop.trial_ends_at
      ? new Date(shop.trial_ends_at).getTime()
      : 0;
    const trialActive = now < trialEnd;
    
    const codeExpired = shop.code_expires_at
      ? now > new Date(shop.code_expires_at).getTime()
      : false;
    
    // STATE 1 — Trial active, no payment submitted
    if (trialActive && shop.subscription_status === 'trial') {
      return 'trial_active';
    }
    
    // STATE 2 — Trial active, payment made but no code yet
    if (trialActive && shop.subscription_status === 'pending_payment') {
      return 'trial_paid_pending_code';
    }
    
    // STATE 3 — Trial expired, no payment made
    if (!trialActive && shop.subscription_status === 'trial') {
      // Auto expire the shop
      supabase
        .from('shops')
        .update({
          subscription_status: 'expired',
          is_live: false
        })
        .eq('id', shop.id)
        .then(() => {});
      
      return 'expired_no_payment';
    }
    
    // STATE 4 — Trial expired, payment made but no code yet
    if (!trialActive && shop.subscription_status === 'pending_payment') {
      return 'expired_paid_pending_code';
    }
    
    // STATE 5 — Active subscription, code entered and valid
    if (shop.subscription_status === 'active' && shop.is_live && !codeExpired) {
      return 'subscription_active';
    }
    
    // STATE 6 — Subscription expired
    if (shop.subscription_status === 'active' && codeExpired) {
      supabase
        .from('shops')
        .update({
          subscription_status: 'expired',
          is_live: false,
          access_code: null,
          code_expires_at: null
        })
        .eq('id', shop.id)
        .then(() => {});
      
      return 'subscription_expired';
    }
    
    if (shop.subscription_status === 'expired') {
      return shop.access_code ? 'expired_paid_pending_code' : 'expired_no_payment';
    }
    
    return 'trial_active';
  }, []);

  const checkShopStatus = React.useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      refreshInventory();
      const { data: shop, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      setMyShop(shop);

      const state = getShopState(shop);

      switch (state) {
        case 'no_shop':
          const onboardingDone = localStorage.getItem('thread_shop_onboarding_done') === 'true';
          setSellerFlowState(onboardingDone ? 'setup_form' : 'seller_onboarding');
          break;
        case 'trial_active':
        case 'trial_paid_pending_code':
        case 'subscription_active':
          setSellerFlowState('live');
          break;
        case 'expired_no_payment':
        case 'subscription_expired':
          setSellerFlowState('paywall');
          break;
        case 'expired_paid_pending_code':
          setSellerFlowState('payment_received');
          break;
        default:
          setSellerFlowState('live');
      }

    } catch (err) {
      console.error('Error checking shop status:', err);
    } finally {
      setLoading(false);
    }
  }, [session, setSellerFlowState, getShopState]);

  React.useEffect(() => {
    checkShopStatus();
  }, [checkShopStatus]);

  const renderCurrentView = () => {
    if (sellerFlowState === null || loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-[#FF2D78] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    switch (sellerFlowState) {
      case 'seller_onboarding':
        return <SellerOnboarding onComplete={checkShopStatus} />;
      case 'setup_form':
        return <ShopSetupForm onNext={() => setSellerFlowState('trial_activation')} />;
      case 'trial_activation':
        return <TrialActivationView onActivated={checkShopStatus} onBack={() => setSellerFlowState('setup_form')} />;
      case 'live':
        return <LiveShopCentreView myShop={myShop} onUpdate={checkShopStatus} />;
      case 'paywall':
        return <PaywallFlow myShop={myShop} onActivated={checkShopStatus} />;
      case 'pending_code':
        return <PendingCodeView myShop={myShop} onActivated={checkShopStatus} />;
      case 'enter_code':
        return <CodeEntryView myShop={myShop} onActivated={checkShopStatus} />;
      case 'payment_received':
        return <PaymentReceivedView myShop={myShop} onActivated={checkShopStatus} />;
      case 'dashboard':
        return <DashboardView myShop={myShop} />;
      case 'add_product':
      case 'edit_product':
        return <AddProductView myShop={myShop} onPublished={checkShopStatus} />;
      case 'edit_shop':
        return <ShopEditView myShop={myShop} onUpdate={checkShopStatus} />;
      default:
        return <div className="p-20 text-white">Screen not found: {sellerFlowState}</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {renderCurrentView()}

      {/* Invisible Debug Switcher */}
      <div className="fixed bottom-0 left-0 right-0 h-6 flex justify-center gap-2 px-4 z-[999] pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
        {[
          { label: 's1', state: 'seller_onboarding' },
          { label: 's2', state: 'setup_form' },
          { label: 's3', state: 'trial_activation' },
          { label: 's4', state: 'live' },
          { label: 's5', state: 'paywall' },
          { label: 's6', state: 'pending_code' },
          { label: 's7', state: 'dashboard' },
        ].map(debug => (
          <button 
            key={debug.label}
            onClick={() => setSellerFlowState(debug.state as any)}
            className="text-[9px] text-[#444] pointer-events-auto px-1 hover:text-white"
          >
            {debug.label}
          </button>
        ))}
      </div>
    </div>
  );
};

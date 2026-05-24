import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface Subscription {
  id: string;
  shop_id: string;
  owner_id: string;
  plan: 'shop';
  billing_cycle: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  amount_paid: number;
  currency: string;
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  paynow_reference: string | null;
  payment_method: 'ecocash' | 'free';
  ecocash_number: string | null;
  payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  zuripay_transaction_id: string | null;
  zuripay_poll_url: string | null;
  is_first_month: boolean;
  created_at: string;
}

interface Shop {
  id: string;
  owner_id: string;
  name: string;
  handle: string;
  is_live: boolean;
  product_count: number;
  subscription_id: string | null;
  subscription_status: string;
  trial_ends_at: string;
  plan: 'shop' | null;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  shop: Shop | null;
  loading: boolean;
  showRenewalPaywall: boolean;
  setShowRenewalPaywall: (show: boolean) => void;
  paywallType: 'trial' | 'expired';
  setPaywallType: (type: 'trial' | 'expired') => void;
  currentPlan: 'shop' | null;
  isStarterPlan: boolean;
  isFullPlan: boolean;
  maxProducts: number;
  canAddProduct: boolean;
  isAtProductLimit: boolean;
  daysRemaining: number;
  createSubscription: (params: any) => Promise<{ data: Subscription | null; error: any }>;
  createShop: (params: any) => Promise<{ data: Shop | null; error: any }>;
  renewSubscription: (params: any) => Promise<{ data: Subscription | null; error: any }>;
  cancelSubscription: () => Promise<{ error: any }>;
  fetchShopAndSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRenewalPaywall, setShowRenewalPaywall] = useState(false);
  const [paywallType, setPaywallType] = useState<'trial' | 'expired'>('expired');

  useEffect(() => {
    if (user) {
      fetchShopAndSubscription();
    } else {
      setLoading(false);
      setSubscription(null);
      setShop(null);
    }
  }, [user]);

  const fetchShopAndSubscription = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch shop
      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      
      if (shopData) {
        setShop(shopData as any);
        
        // Fetch subscription
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('shop_id', shopData.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (subData) {
          setSubscription(subData as any);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (params: any) => {
    if (!user?.id) return { data: null, error: new Error('Not authenticated') };

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 20);

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        shop_id: params.shopId,
        owner_id: user.id,
        plan: 'shop',
        billing_cycle: params.billingCycle || 'monthly',
        status: 'active',
        amount_paid: params.amountPaid || 9,
        currency: 'USD',
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_method: params.paymentMethod || 'ecocash',
        ecocash_number: params.ecocashNumber || null,
        payment_status: 'paid'
      })
      .select()
      .single();

    if (data) setSubscription(data as any);
    return { data: data as any, error };
  };

  const createShop = async (params: any) => {
    if (!user?.id) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('shops')
      .insert({
        owner_id: user.id,
        name: params.name,
        handle: params.handle,
        is_live: true,
        product_count: 0,
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (data) setShop(data as any);
    return { data: data as any, error };
  };

  const renewSubscription = async (params: any) => {
    return createSubscription(params);
  };

  const cancelSubscription = async () => {
    if (!subscription?.id) return { error: new Error('No active subscription') };
    
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', subscription.id);

    if (!error) setSubscription(null);
    return { error };
  };

  const isTrial = shop?.subscription_status === 'trial';
  const maxProducts = isTrial ? 3 : Infinity;
  const currentPlan = subscription?.plan || (shop as any)?.plan || (isTrial ? 'shop' : null);
  const isStarterPlan = false; // Deprecated
  const isFullPlan = true; // All plans are now effectively full
  const canAddProduct = shop ? (maxProducts === Infinity || shop.product_count < maxProducts) : false;
  const isAtProductLimit = shop ? (maxProducts !== Infinity && shop.product_count >= maxProducts) : false;
  
  const daysRemaining = subscription
    ? Math.max(0, Math.ceil(
        (new Date(subscription.current_period_end).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
      ))
    : (shop?.trial_ends_at 
        ? Math.max(0, Math.ceil((new Date(shop.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 0);

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      shop,
      loading,
      showRenewalPaywall,
      setShowRenewalPaywall,
      paywallType,
      setPaywallType,
      currentPlan: currentPlan as any,
      isStarterPlan,
      isFullPlan,
      maxProducts,
      canAddProduct,
      isAtProductLimit,
      daysRemaining,
      createSubscription,
      createShop,
      renewSubscription,
      cancelSubscription,
      fetchShopAndSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

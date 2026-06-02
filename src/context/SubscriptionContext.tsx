import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { mockShop } from '../data/mockData';

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
  slug?: string;
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
  
  // Custom mock shop mapping
  const defaultShopData: Shop = {
    id: mockShop.id,
    owner_id: 'user-001',
    name: mockShop.name,
    handle: 'kure',
    is_live: true,
    product_count: 6,
    subscription_id: 'sub-001',
    subscription_status: mockShop.subscription_status,
    trial_ends_at: mockShop.trial_end,
    plan: 'shop',
  };

  const defaultSubData: Subscription = {
    id: 'sub-001',
    shop_id: mockShop.id,
    owner_id: 'user-001',
    plan: 'shop',
    billing_cycle: 'monthly',
    status: 'active',
    amount_paid: 5,
    currency: 'USD',
    started_at: new Date().toISOString(),
    current_period_start: new Date().toISOString(),
    current_period_end: mockShop.trial_end,
    cancelled_at: null,
    paynow_reference: null,
    payment_method: 'free',
    ecocash_number: null,
    payment_status: 'paid',
    zuripay_transaction_id: null,
    zuripay_poll_url: null,
    is_first_month: true,
    created_at: new Date().toISOString(),
  };

  const [shop, setShop] = useState<Shop | null>(defaultShopData);
  const [subscription, setSubscription] = useState<Subscription | null>(defaultSubData);
  const [loading, setLoading] = useState(false);
  const [showRenewalPaywall, setShowRenewalPaywall] = useState(false);
  const [paywallType, setPaywallType] = useState<'trial' | 'expired'>('expired');

  useEffect(() => {
    if (user) {
      setShop(defaultShopData);
      setSubscription(defaultSubData);
    } else {
      setShop(null);
      setSubscription(null);
    }
  }, [user]);

  const fetchShopAndSubscription = async () => {
    setLoading(false);
  };

  const createSubscription = async (params: any) => {
    const updatedSub: Subscription = {
      ...defaultSubData,
      id: `sub-${Date.now()}`,
      shop_id: params.shopId || defaultShopData.id,
      billing_cycle: params.billingCycle || 'monthly',
      status: 'active',
      amount_paid: params.amountPaid || 5,
      payment_method: params.paymentMethod || 'ecocash',
      ecocash_number: params.ecocashNumber || null,
    };
    setSubscription(updatedSub);
    return { data: updatedSub, error: null };
  };

  const createShop = async (params: any) => {
    const updatedShop: Shop = {
      ...defaultShopData,
      name: params.name,
      handle: params.handle,
    };
    setShop(updatedShop);
    return { data: updatedShop, error: null };
  };

  const renewSubscription = async (params: any) => {
    return createSubscription(params);
  };

  const cancelSubscription = async () => {
    setSubscription(null);
    return { error: null };
  };

  const isTrial = shop?.subscription_status === 'trial';
  const maxProducts = isTrial ? 3 : Infinity;
  const currentPlan = subscription?.plan || shop?.plan || (isTrial ? 'shop' : null);
  const isStarterPlan = false;
  const isFullPlan = true;
  const canAddProduct = true;
  const isAtProductLimit = false;

  const daysRemaining = 5; // Fixed mock days remaining for stable prototype

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

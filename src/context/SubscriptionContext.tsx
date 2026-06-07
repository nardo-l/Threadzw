import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect,
  useCallback 
} from 'react'
import { supabase } from '../lib/supabase'

export const SUB_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  PENDING: 'pending',
  EXPIRED: 'expired'
} as const;

export type SubStatus = typeof SUB_STATUS[keyof typeof SUB_STATUS];

export interface Subscription {
  status: SubStatus;
  daysRemaining: number;
  expiryDate: string | null;
  paymentUrl: string | null;
  planName: string;
  pricePerMonth: number;
  trialDays: number;
  rawShopData: any;
  started_at: string;

  trialStartDate?: string | null;
  trialEndDate?: string | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  nextBillingDate?: string | null;
  lastPaymentDate?: string | null;
  paymentProvider?: string | null;
  hasFullAccess?: boolean;
  isLocked?: boolean;
  canBeRenewed?: boolean;
  billingDays?: number;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isLive: boolean;
  showTrialBanner: boolean;
  isUrgent: boolean;
  isCritical: boolean;
  refresh: () => Promise<void>;
  
  // Legacy bridge properties to prevent compiler issues from other files
  shop: any | null;
  daysRemaining: number;
  currentPlan: 'shop' | null;
  isStarterPlan: boolean;
  isFullPlan: boolean;
  maxProducts: number;
  canAddProduct: boolean;
  isAtProductLimit: boolean;
  showRenewalPaywall: boolean;
  setShowRenewalPaywall: (show: boolean) => void;
  paywallType: 'trial' | 'expired';
  setPaywallType: (type: 'trial' | 'expired') => void;
  renewSubscription: (params: any) => Promise<{ data: any; error: any }>;
  cancelSubscription: () => Promise<{ error: any }>;
  fetchShopAndSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState<any | null>(null)
  const [showRenewalPaywall, setShowRenewalPaywall] = useState(false)
  const [paywallType, setPaywallType] = useState<'trial' | 'expired'>('expired')

  const fetchSubscription = useCallback(
    async () => {
      try {
        setLoading(true)
        // Get current user session
        const { data: { session } } = 
          await supabase.auth.getSession()
        
        if (!session || !session.user) {
          setSubscription(null)
          setShop(null)
          setLoading(false)
          return
        }

        // Fetch shop subscription data using owner_id for local context fallback
        const { data: shopData } = await supabase
          .from('shops')
          .select(`
            id,
            name,
            handle,
            trial_start_date,
            trial_end_date,
            trial_started_at,
            trial_ends_at,
            subscription_status,
            subscription_start_date,
            subscription_end_date
          `)
          .eq('owner_id', session.user.id)
          .maybeSingle()

        if (shopData) {
          setShop(shopData)
        }

        // Call Edge Function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/get-subscription`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch subscription')
        }

        const data = await response.json()

        setSubscription({
          status: data.status,
          daysRemaining: data.days_remaining,
          expiryDate: data.expiry_date,
          trialStartDate: data.trial_start_date,
          trialEndDate: data.trial_end_date,
          subscriptionStartDate: data.subscription_start_date,
          subscriptionEndDate: data.subscription_end_date,
          nextBillingDate: data.next_billing_date,
          lastPaymentDate: data.last_payment_date,
          paymentProvider: data.payment_provider,
          planName: data.plan_name || 'ThreadZW Pro',
          pricePerMonth: data.plan_price || 7.00,
          billingDays: data.plan_billing_days || 28,
          trialDays: 28,
          hasFullAccess: data.has_full_access,
          isLocked: data.is_locked,
          canBeRenewed: data.can_be_renewed,
          paymentUrl: null,
          rawShopData: shopData || data,
          started_at: data.trial_start_date || (shopData as any)?.created_at || new Date().toISOString()
        })

      } catch (err) {
        console.error(
          'Subscription fetch error:', err
        )
        // Set fallback in case edge function isn't reachable
        setSubscription(prev => prev || {
          status: SUB_STATUS.EXPIRED,
          daysRemaining: 0,
          expiryDate: null,
          paymentUrl: null,
          planName: 'ThreadZW Pro',
          pricePerMonth: 7,
          trialDays: 28,
          rawShopData: null,
          started_at: new Date().toISOString(),
          isLocked: true
        });
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Helper computed values
  const isLive = subscription
    ? ([
        SUB_STATUS.TRIAL,
        SUB_STATUS.ACTIVE,
        SUB_STATUS.PENDING
      ] as SubStatus[]).includes(subscription.status)
    : false

  const showTrialBanner = subscription
    ?.status === SUB_STATUS.TRIAL

  const isUrgent = subscription
    ?.status === SUB_STATUS.TRIAL
    && subscription.daysRemaining <= 5

  const isCritical = subscription
    ?.status === SUB_STATUS.TRIAL
    && subscription.daysRemaining <= 2

  // Legacy bridge computed constants
  const currentPlan = subscription?.status === SUB_STATUS.ACTIVE 
    ? 'shop' 
    : (subscription?.status === SUB_STATUS.TRIAL ? 'shop' : null)
  const isStarterPlan = false
  const isFullPlan = true
  const maxProducts = Infinity
  const canAddProduct = true
  const isAtProductLimit = false

  const renewSubscription = async (params: any) => {
    return { data: subscription, error: null }
  }

  const cancelSubscription = async () => {
    return { error: null }
  }

  const fetchShopAndSubscription = async () => {
    await fetchSubscription()
  }

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        isLive,
        showTrialBanner,
        isUrgent,
        isCritical,
        refresh: fetchSubscription,
        
        // Legacy bindings
        shop,
        daysRemaining: subscription ? subscription.daysRemaining : 0,
        currentPlan,
        isStarterPlan,
        isFullPlan,
        maxProducts,
        canAddProduct,
        isAtProductLimit,
        showRenewalPaywall,
        setShowRenewalPaywall,
        paywallType,
        setPaywallType,
        renewSubscription,
        cancelSubscription,
        fetchShopAndSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(
    SubscriptionContext
  )
  if (!context) {
    throw new Error(
      'useSubscription must be used inside SubscriptionProvider'
    )
  }
  return context
}

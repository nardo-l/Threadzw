import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect,
  useCallback 
} from 'react'
import { supabase } from '../lib/supabase'
import { SUBSCRIPTION } from '../constants/subscription'

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
      let shopData: any = null;
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
        const { data } = await supabase
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

        shopData = data;

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

        const dataRes = await response.json()

        setSubscription({
          status: dataRes.status,
          daysRemaining: dataRes.days_remaining,
          expiryDate: dataRes.expiry_date,
          trialStartDate: dataRes.trial_start_date,
          trialEndDate: dataRes.trial_end_date,
          subscriptionStartDate: dataRes.subscription_start_date,
          subscriptionEndDate: dataRes.subscription_end_date,
          nextBillingDate: dataRes.next_billing_date,
          lastPaymentDate: dataRes.last_payment_date,
          paymentProvider: dataRes.payment_provider,
          planName: dataRes.plan_name || 'ThreadZW Pro',
          pricePerMonth: dataRes.plan_price || 7.00,
          billingDays: dataRes.plan_billing_days || 28,
          trialDays: 28,
          hasFullAccess: dataRes.has_full_access,
          isLocked: dataRes.is_locked,
          canBeRenewed: dataRes.can_be_renewed,
          paymentUrl: null,
          rawShopData: shopData || dataRes,
          started_at: dataRes.trial_start_date || (shopData as any)?.created_at || new Date().toISOString()
        })

      } catch (err) {
        console.warn(
          'Subscription fetch failed, dynamically falling back to local shop configuration:', err
        )
        
        let status: SubStatus = SUB_STATUS.TRIAL;
        let expiryStr: string | null = null;
        let days = SUBSCRIPTION.TRIAL_DAYS; // default fallback

        if (shopData) {
          status = (shopData.subscription_status || 'trial') as SubStatus;
          expiryStr = shopData.subscription_end_date || shopData.trial_ends_at || shopData.trial_end_date || null;
          if (expiryStr) {
            const diffMs = new Date(expiryStr).getTime() - Date.now();
            days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          } else {
            days = SUBSCRIPTION.TRIAL_DAYS;
          }
        }

        const isLocked = days <= 0 && status !== 'active';
        const finalStatus = (days <= 0 && status === 'trial') ? SUB_STATUS.EXPIRED : status;

        setSubscription({
          status: finalStatus,
          daysRemaining: days,
          expiryDate: expiryStr,
          paymentUrl: null,
          planName: 'ThreadZW Pro',
          pricePerMonth: 7,
          trialDays: 28,
          rawShopData: shopData || null,
          started_at: shopData ? (shopData.trial_started_at || shopData.trial_start_date || new Date().toISOString()) : new Date().toISOString(),
          isLocked: isLocked,
          hasFullAccess: !isLocked,
          canBeRenewed: true
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
    && subscription.daysRemaining <= SUBSCRIPTION.URGENT_DAYS

  const isCritical = subscription
    ?.status === SUB_STATUS.TRIAL
    && subscription.daysRemaining <= SUBSCRIPTION.CRITICAL_DAYS

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

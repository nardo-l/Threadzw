import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '../context/SubscriptionContext'

// Routes always accessible regardless of subscription status
const PUBLIC_ROUTES = [
  '/subscription',
  '/payment-success',
  '/payment-cancelled',
  '/settings',
  '/billing',
  '/login',
  '/signup',
  '/'
]

// Routes with /shop/ prefix always accessible to customers
const isStorefrontRoute = (path: string) =>
  path.startsWith('/shop/')

export const useAccessControl = () => {
  const navigate = useNavigate()
  const { subscription, loading } = useSubscription()
  const currentPath = window.location.pathname

  useEffect(() => {
    if (loading) return
    if (!subscription) return
    
    // Always allow public routes
    if (PUBLIC_ROUTES.includes(currentPath)) 
      return
    
    // Always allow storefront routes
    if (isStorefrontRoute(currentPath)) 
      return

    // Check if locked
    if (subscription.isLocked) {
      navigate('/subscription', { 
        replace: true,
        state: { 
          reason: subscription.status 
        }
      })
    }
  }, [subscription, loading, currentPath, navigate])

  return {
    hasAccess: !subscription?.isLocked,
    isLoading: loading,
    status: subscription?.status
  }
}

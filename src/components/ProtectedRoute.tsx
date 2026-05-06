import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SplashScreen } from '../screens/SplashScreen'

export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { session, profile, loading, isGuest } = useAuth()
  const location = useLocation()

  if (loading) return null;

  if (!session && !isGuest) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  // If authenticated user hasn't finished onboarding, force them there
  const isInternalOnboardingComplete = profile?.onboarding_complete === true || 
                                       (localStorage.getItem('thread_onboarding_complete') === 'true' &&
                                        localStorage.getItem('thread_town_selected') === 'true' &&
                                        localStorage.getItem('thread_style_picked') === 'true');

  if (session && !isGuest && !isInternalOnboardingComplete && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding" replace />
  }

  // If completed onboarding or guest tries to go to onboarding, send them home
  if ((session && isInternalOnboardingComplete) && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export const AuthRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { session, profile, loading, isGuest } = useAuth()

  if (loading) return null;

  if (session || isGuest) {
    const isInternalOnboardingComplete = profile?.onboarding_complete === true || 
                                         (localStorage.getItem('thread_onboarding_complete') === 'true' &&
                                          localStorage.getItem('thread_town_selected') === 'true' &&
                                          localStorage.getItem('thread_style_picked') === 'true');

    if (session && !isInternalOnboardingComplete) return <Navigate to="/onboarding" replace />
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return null;

  if (!session) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export const AuthRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth()

  if (loading) return null;

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

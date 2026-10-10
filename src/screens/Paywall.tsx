import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Legacy route compatibility: all pricing and payment details now live on
 * /subscription, which uses the existing NardoPay + admin-verification flow.
 */
export const Paywall: React.FC = () => <Navigate to="/subscription" replace />;

export default Paywall;

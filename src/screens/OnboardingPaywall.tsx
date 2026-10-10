import React from 'react';
import { Navigate } from 'react-router-dom';

/** Kept only so old bookmarks never show retired free-plan pricing. */
export const OnboardingPaywall: React.FC = () => <Navigate to="/dashboard" replace />;

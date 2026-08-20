import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Pencil, Sparkles, Flame, Shirt } from 'lucide-react';
import { useOnboarding, OnboardingStep } from '../../hooks/useOnboarding';

interface OnboardingOverlayProps {
  shop: any | null;
  productsCount?: number;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = () => {
  return null;
};

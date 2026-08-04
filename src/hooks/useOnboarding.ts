import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type OnboardingStep = 'success' | 'step1' | 'step2' | 'completed';

export const getOnboardingKey = (shopId: string) => `threadzw_onboarding_step_${shopId}`;

export const getOnboardingStep = (shopId: string | null | undefined, productsCount?: number, shopData?: any): OnboardingStep => {
  if (!shopId) return 'completed';

  // If products exist, onboarding is finished
  if (productsCount !== undefined && productsCount > 0) {
    try {
      localStorage.setItem(getOnboardingKey(shopId), 'completed');
    } catch (e) {}
    return 'completed';
  }

  // Check shop object flags
  if (shopData?.is_setup_completed || shopData?.setup_completed) {
    return 'completed';
  }

  try {
    const stored = localStorage.getItem(getOnboardingKey(shopId));
    if (stored === 'completed') return 'completed';
    if (stored === 'step2') return 'step2';
    if (stored === 'step1') return 'step1';
    if (stored === 'success') return 'success';
  } catch (e) {}

  // If shop profile has logo or banner updated but no products, they might be on step 2
  if (shopData?.logo_url || shopData?.banner_url || (shopData?.description && shopData?.description.length > 30)) {
    return 'step2';
  }

  return 'step1';
};

export const setOnboardingStep = async (shopId: string | null | undefined, step: OnboardingStep) => {
  if (!shopId) return;

  try {
    localStorage.setItem(getOnboardingKey(shopId), step);
  } catch (e) {}

  if (step === 'completed') {
    try {
      await supabase
        .from('shops')
        .update({ is_setup_completed: true, setup_completed: true })
        .eq('id', shopId);
    } catch (e) {
      // Ignore schema column warnings if column doesn't exist
    }
  }
};

export const useOnboarding = (shopId: string | null | undefined, productsCount?: number, shopData?: any) => {
  const [step, setStepState] = useState<OnboardingStep>(() => 
    getOnboardingStep(shopId, productsCount, shopData)
  );

  useEffect(() => {
    const currentStep = getOnboardingStep(shopId, productsCount, shopData);
    setStepState(currentStep);
  }, [shopId, productsCount, shopData]);

  const updateStep = async (nextStep: OnboardingStep) => {
    setStepState(nextStep);
    if (shopId) {
      await setOnboardingStep(shopId, nextStep);
    }
  };

  return {
    step,
    updateStep,
    isCompleted: step === 'completed'
  };
};

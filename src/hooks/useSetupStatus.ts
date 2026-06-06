import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface SetupStatus {
  loading: boolean;
  hasShop: boolean;
  setupComplete: boolean;
  shop: any | null;
}

export const useSetupStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SetupStatus>({
    loading: true,
    hasShop: false,
    setupComplete: false,
    shop: null
  });

  const checkSetup = async () => {
    if (!user) {
      setStatus({
        loading: false,
        hasShop: false,
        setupComplete: false,
        shop: null
      });
      return;
    }

    try {
      // Check if shop exists
      const { data: shop, error } = await supabase
        .from('shops')
        .select(`
          id,
          name,
          setup_complete,
          setup_completed_at,
          trial_end,
          subscription_end,
          subscription_status
        `)
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error || !shop) {
        setStatus({
          loading: false,
          hasShop: false,
          setupComplete: false,
          shop: null
        });
        return;
      }

      // Check if setup complete is null, check if existing shop can be marked complete
      let isComplete = shop.setup_complete === true;
      if (shop.setup_complete === null || shop.setup_complete === undefined) {
        if (shop.name && shop.name.trim() && shop.name !== 'My ThreadZW Shop' && shop.name !== 'My brand') {
          isComplete = true;
          // Auto-migrate in the background
          await supabase
            .from('shops')
            .update({
              setup_complete: true,
              setup_completed_at: new Date().toISOString()
            })
            .eq('id', shop.id);
        }
      }

      setStatus({
        loading: false,
        hasShop: true,
        setupComplete: isComplete,
        shop
      });

    } catch (err) {
      console.error('Setup check error:', err);
      setStatus({
        loading: false,
        hasShop: false,
        setupComplete: false,
        shop: null
      });
    }
  };

  useEffect(() => {
    checkSetup();
  }, [user]);

  const markSetupComplete = async (shopId: string) => {
    const { error } = await supabase
      .from('shops')
      .update({
        setup_complete: true,
        setup_completed_at: new Date().toISOString()
      })
      .eq('id', shopId);
    
    if (!error) {
      setStatus(prev => ({
        ...prev,
        setupComplete: true
      }));
    }
  };

  return { ...status, markSetupComplete, refreshSetupStatus: checkSetup };
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShopFrontOnboarding } from '../components/dashboard/ShopFrontOnboarding';
import { useAuth } from '../context/AuthContext';

export const SetupShop: React.FC<{ onSetupComplete?: () => void }> = ({ onSetupComplete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = async (newShop: any) => {
    localStorage.setItem('threadzw_first_login_overlay_shown', 'true');
    localStorage.setItem('threadzw_shop_onboarding_first_time', 'done');
    if (newShop?.id) {
      localStorage.setItem(`threadzw_shop_front_setup_${newShop.id}`, 'true');
    }

    if (onSetupComplete) {
      onSetupComplete();
    } else {
      navigate('/');
    }
  };

  const handleClose = async () => {
    // If they close, auto-create a baseline skeleton shop so they aren't stuck and can configure later
    if (user?.id) {
      try {
        const trialEnds = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const { data: existingShop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!existingShop) {
          const defaultName = 'My ThreadZW Shop';
          const defaultHandle = `shop-${user.id.substring(0, 8)}`;
          
          const { data: newShop } = await supabase
            .from('shops')
            .insert([
              {
                owner_id: user.id,
                name: defaultName,
                handle: defaultHandle,
                slug: defaultHandle,
                whatsapp: '0776223144',
                location: 'Harare',
                categories: ['Streetwear'],
                description: 'Welcome to our clothing store!',
                trial_started_at: new Date().toISOString(),
                trial_ends_at: trialEnds.toISOString(),
                subscription_status: 'trial',
                manual_lock: false,
                is_live: true,
                created_at: new Date().toISOString()
              }
            ])
            .select()
            .maybeSingle();

          if (newShop) {
            localStorage.setItem(`shop_${user.id}`, JSON.stringify(newShop));
          }
        }
      } catch (err) {
        console.error('Error auto-creating default shop:', err);
      }
    }

    localStorage.setItem('threadzw_first_login_overlay_shown', 'true');
    localStorage.setItem('threadzw_shop_onboarding_first_time', 'done');

    if (onSetupComplete) {
      onSetupComplete();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <ShopFrontOnboarding 
        shop={null}
        onClose={handleClose}
        onComplete={handleComplete}
      />
    </div>
  );
};

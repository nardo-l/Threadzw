import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, Store } from 'lucide-react';

export const SetupShop: React.FC<{ onSetupComplete?: () => void }> = ({ onSetupComplete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSetupStart = async () => {
    setLoading(true);
    // Verify if they have an existing shop. If not, redirect to official onboarding creation flow.
    if (user?.id) {
      try {
        const { data: existingShop } = await supabase
          .from('shops')
          .select('id, name, handle')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!existingShop) {
          console.warn('[SetupShop] No existing shop found for user. Redirecting to official /onboarding flow.');
          navigate('/onboarding');
          return;
        }
      } catch (err) {
        console.error('Error verifying existing shop:', err);
      }
    }

    localStorage.setItem('threadzw_first_login_overlay_shown', 'true');
    localStorage.setItem('threadzw_shop_onboarding_first_time', 'done');

    if (onSetupComplete) {
      setTimeout(() => {
        onSetupComplete();
        navigate('/edit-shop');
      }, 300);
    } else {
      navigate('/edit-shop');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-white font-sans selection:bg-[#25D366] selection:text-black">
      <div className="max-w-md w-full bg-[#121212] rounded-3xl border border-zinc-900 overflow-hidden shadow-2xl p-8 text-center space-y-6 relative">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#25D366] to-transparent" />
        
        <div className="w-16 h-16 bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl flex items-center justify-center mx-auto text-[#25D366]">
          <Store size={32} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[#25D366] font-mono text-[10px] tracking-widest uppercase font-black">
            <Sparkles size={12} />
            <span>Store Initialized</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
            Your ThreadZW Store is Ready!
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto p-1 font-medium">
            To start selling, customize your shop front layout, upload your brand logo or banner, and set your WhatsApp contact details.
          </p>
        </div>

        <button
          onClick={handleSetupStart}
          disabled={loading}
          className="w-full h-14 bg-[#25D366] hover:bg-[#b5e600] disabled:bg-zinc-800 text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-[0_4px_20px_rgba(198, 255, 0,0.15)] cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Setup Shop Front</span>
              <ArrowRight size={14} className="stroke-[2.5px]" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

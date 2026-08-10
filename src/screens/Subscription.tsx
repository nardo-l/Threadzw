import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Loader2, ArrowLeft, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../hooks/useShop';
import { toast } from 'sonner';

export const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { shop } = useShop();

  const [subscription, setSubscription] = useState<any | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [subError, setSubError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const fetchSubscription = async () => {
    if (!user) {
      setLoadingSub(false);
      return;
    }
    setLoadingSub(true);
    setSubError(null);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setSubscription(data);
    } catch (err: any) {
      console.error('[SUBSCRIPTION] Error fetching subscription:', err);
      setSubError(err.message || 'Unable to load subscription information.');
    } finally {
      setLoadingSub(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const handleUpgrade = () => {
    window.open('https://nardopay.com/pay/efb2bff4ee35cc08', '_blank');
  };

  // Trial countdown calculation
  let trialDaysRemaining = null;
  let trialEnded = false;
  if (subscription?.trial_ends_at) {
    const trialEnds = new Date(subscription.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnds.getTime() - now.getTime();
    trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (trialDaysRemaining <= 0) {
      trialEnded = true;
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-2 text-zinc-600 hover:text-black font-semibold mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {loadingSub ? (
          <div className="bg-white p-12 rounded-3xl border border-zinc-200 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Loading subscription details...</p>
          </div>
        ) : subError ? (
          <div className="bg-red-50 p-8 rounded-3xl border border-red-200 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-red-900 uppercase">Unable to load subscription information.</h3>
              <p className="text-xs text-red-600 font-medium">{subError}</p>
            </div>
            <button
              onClick={fetchSubscription}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* FREE PLAN CARD */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-black font-extrabold bg-[#C6FF00] px-3 py-1 rounded-full border border-black/10">
                    Active Plan
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 mt-2">Free Plan</h2>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-black">$0</span>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-zinc-100 pt-3">
                {[
                  'Storefront with logo, banner & bio',
                  'Up to 3 products',
                  'Dynamic themes & Video backgrounds',
                  'WhatsApp ordering system',
                  'Shareable ThreadZW store link',
                  'Basic store management'
                ].map(benefit => (
                  <div key={benefit} className="flex items-center gap-3 text-xs font-bold text-zinc-700">
                    <div className="w-5 h-5 rounded-full bg-lime-100 text-lime-800 flex items-center justify-center shrink-0">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-xs font-bold text-zinc-700">
                Current Plan — Active Forever
              </div>
            </div>

            {/* PREMIUM PLAN CARD (COMING SOON) */}
            <div className="bg-zinc-900 text-white p-6 sm:p-8 rounded-3xl border border-zinc-800 shadow-sm space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-extrabold bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
                    Coming Soon
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white mt-2">ThreadZW Premium</h2>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-[#C6FF00]">Coming Soon</span>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-zinc-800 pt-3">
                {[
                  'Unlimited products',
                  'Advanced storefront customization',
                  'More customization options',
                  'Premium features & analytics',
                  'Future advanced shop tools'
                ].map(benefit => (
                  <div key={benefit} className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                    <div className="w-5 h-5 rounded-full bg-zinc-800 text-[#C6FF00] flex items-center justify-center shrink-0">
                      <Sparkles size={12} />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                disabled
                className="w-full h-12 bg-zinc-800 text-zinc-500 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center cursor-not-allowed border border-zinc-700"
              >
                Premium Coming Soon
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


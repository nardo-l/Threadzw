import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Loader2, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
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
    window.open('https://nardopay.com/pay/f1996ce49083d076', '_blank');
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
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#25D366] font-extrabold bg-[#25D366]/10 px-3 py-1 rounded-full">
                {subscription?.status === 'active' ? 'Active Pro Subscription' : trialEnded ? 'Trial Ended' : 'Free Trial Active'}
              </span>
              <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900">ThreadZW Pro</h2>
              <div className="flex items-baseline justify-center gap-1 mt-2">
                <span className="text-4xl font-black text-black">$2.99</span>
                <span className="text-zinc-500 font-bold text-sm">/month</span>
              </div>
            </div>

            {trialDaysRemaining !== null && !trialEnded && subscription?.status !== 'active' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-1">
                <p className="text-xs font-bold text-amber-900">
                  {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} remaining on your free trial.
                </p>
                <p className="text-[11px] text-amber-700 font-medium">Upgrade now to ensure uninterrupted service.</p>
              </div>
            )}

            {trialEnded && subscription?.status !== 'active' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center space-y-1">
                <p className="text-xs font-bold text-red-900">Your free trial has ended.</p>
                <p className="text-[11px] text-red-700 font-medium">Upgrade to continue using ThreadZW.</p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              {[
                'Unlimited products',
                'Online storefront',
                'WhatsApp ordering',
                'Continue receiving orders after your trial'
              ].map(benefit => (
                <div key={benefit} className="flex items-center gap-3 text-xs font-bold text-zinc-700">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-[#25D366] flex items-center justify-center shrink-0">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpgrade}
              disabled={upgrading || subscription?.status === 'active'}
              className="w-full h-14 bg-black hover:bg-zinc-800 disabled:opacity-60 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md"
            >
              {upgrading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : subscription?.status === 'active' ? (
                'Pro Plan Active'
              ) : (
                'Upgrade for $2.99/month'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


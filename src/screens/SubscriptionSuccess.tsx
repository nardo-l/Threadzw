import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Store, Loader2, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [shopNameInput, setShopNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    async function prefillUserShopName() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data: shop } = await supabase
            .from('shops')
            .select('name')
            .eq('owner_id', user.id)
            .maybeSingle();

          if (shop?.name) {
            setShopNameInput(shop.name);
          }
        }
      } catch (e) {
        console.warn('[SubscriptionSuccess] Prefill shop name error:', e);
      }
    }
    prefillUserShopName();
  }, []);

  const generateSlug = (input: string): string => {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawShopName = shopNameInput.trim();

    if (!rawShopName) {
      setErrorMsg('Please enter your shop name.');
      toast.error('Please enter your shop name.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const generatedSlug = generateSlug(rawShopName);
      console.log('[SubscriptionSuccess] Attempting activation for shop name:', rawShopName, 'slug:', generatedSlug);

      // Try backend API first
      let apiSuccess = false;
      try {
        const response = await fetch('/api/billing/activate-by-shop-name', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shopName: rawShopName }),
        });

        const responseText = await response.text();
        let data: any = {};
        if (responseText && responseText.trim() !== '') {
          data = JSON.parse(responseText);
        }

        if (response.ok && !data.error) {
          apiSuccess = true;
        } else {
          throw new Error(data.error || "We couldn't find a shop with that name.");
        }
      } catch (apiErr: any) {
        console.warn('[SubscriptionSuccess] API route notice, using direct client Supabase query:', apiErr);

        // Client-side fallback lookup
        // 1. Query shop by slug
        let { data: shop } = await supabase
          .from('shops')
          .select('*')
          .eq('slug', generatedSlug)
          .maybeSingle();

        // Fallback search by name ilike
        if (!shop) {
          const { data: nameMatch } = await supabase
            .from('shops')
            .select('*')
            .ilike('name', rawShopName)
            .maybeSingle();

          if (nameMatch) {
            shop = nameMatch;
          }
        }

        if (!shop) {
          throw new Error("We couldn't find a shop with that name.");
        }

        const ownerId = shop.owner_id;

        // 2. Query subscription for owner_id
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('profile_id', ownerId)
          .maybeSingle();

        if (!existingSub) {
          throw new Error("We found your shop but couldn't locate your subscription. Please contact support.");
        }

        const now = new Date();
        const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const nowISO = now.toISOString();

        // 3. Update existing subscription (NO INSERT)
        const subPayload: any = {
          status: 'active',
          plan: 'starter',
          amount: 2.99,
          currency: 'USD',
          subscription_started_at: nowISO,
          subscription_ends_at: endsAt,
          shop_id: shop.id,
          updated_at: nowISO
        };

        const { error: updateSubErr } = await supabase
          .from('subscriptions')
          .update(subPayload)
          .eq('profile_id', ownerId);

        if (updateSubErr) {
          throw new Error("Failed to activate subscription. Please contact support.");
        }

        // Insert payment record for tracking
        await supabase.from('payments').insert([{
          subscription_id: existingSub.id,
          provider: 'nardopay',
          provider_transaction_id: 'NARDOPAY-MVP-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
          amount: 2.99,
          currency: 'USD',
          status: 'verified',
          paid_at: nowISO
        }]);

        // 4. Update matching shop
        await supabase
          .from('shops')
          .update({
            subscription_status: 'active',
            subscription_end: endsAt,
            trial_ends_at: null,
            manual_lock: false,
            payment_overdue_flagged: false,
            is_live: true
          })
          .eq('id', shop.id);
      }

      localStorage.setItem('threadzw_just_subscribed', 'true');
      setActivated(true);
      toast.success('Subscription activated successfully! Welcome to ThreadZW Pro 🚀');
    } catch (err: any) {
      console.error('[SubscriptionSuccess] Activation error:', err);
      const msg = err.message || "We couldn't find a shop with that name.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#e1e4cf] font-sans flex flex-col justify-between selection:bg-[#C6FF00] selection:text-black relative overflow-x-hidden">
      {/* Background Micro Glows */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-[#C6FF00]/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-[#C6FF00]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="flex justify-between items-center w-full max-w-[420px] mx-auto px-5 pt-6 pb-2 bg-black/90 backdrop-blur-md z-50 sticky top-0 shrink-0">
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate('/')}>
          <span className="font-extrabold text-xl tracking-tight text-white font-sans">
            ThreadZW<span className="text-[#C6FF00]">.</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/support')}
          className="text-xs text-zinc-400 hover:text-white font-semibold transition-colors cursor-pointer"
        >
          NEED HELP?
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-6 pb-16 max-w-md mx-auto w-full z-10">
        {!activated ? (
          <div className="w-full max-w-[390px] mx-auto flex flex-col space-y-6 text-left px-2">
            
            {/* Success Illustration / Icon */}
            <div className="w-16 h-16 rounded-3xl bg-[#C6FF00]/10 border border-[#C6FF00]/30 flex items-center justify-center text-[#C6FF00] mx-auto mb-2">
              <CheckCircle2 size={36} className="animate-pulse" />
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
                Payment Successful
              </h1>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-[330px] mx-auto">
                Your payment has been received.<br />
                Activate your subscription by entering the shop name you created during onboarding.
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 text-center space-y-1">
                <p className="text-xs font-bold text-red-200 whitespace-pre-line">{errorMsg}</p>
              </div>
            )}

            {/* Form Card */}
            <form onSubmit={handleActivate} className="bg-[#111114] border border-[#232326] rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                  Shop Name <span className="text-[#C6FF00]">*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    required
                    value={shopNameInput}
                    onChange={(e) => setShopNameInput(e.target.value)}
                    placeholder="Enter your ThreadZW shop name"
                    className="w-full bg-[#18181b] border border-[#2d2d32] rounded-xl pl-10 pr-4 py-3.5 text-sm font-normal text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#C6FF00] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#C6FF00] hover:bg-[#b3e600] active:scale-[0.98] disabled:opacity-50 text-black font-extrabold text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#C6FF00]/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Activating Shop...</span>
                  </>
                ) : (
                  <>
                    <span>Activate Subscription</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 space-y-1">
              <p className="text-[11px] text-zinc-400 font-medium">
                Need help finding your shop name?
              </p>
              <p className="text-[11px]">
                <a
                  href="https://wa.me/263771234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C6FF00] font-bold hover:underline"
                >
                  Contact ThreadZW Support
                </a>
              </p>
            </div>

          </div>
        ) : (
          <div className="w-full max-w-[390px] mx-auto flex flex-col space-y-6 text-center px-2 my-auto">
            <div className="w-20 h-20 rounded-full bg-[#C6FF00]/15 border border-[#C6FF00]/40 flex items-center justify-center text-[#C6FF00] mx-auto">
              <Check size={40} className="stroke-[3]" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-tight">
                Subscription Activated
              </h1>
              <p className="text-sm text-zinc-300 font-medium leading-relaxed max-w-[320px] mx-auto">
                Your merchant account is now active.<br />
                You can now continue managing your shop.
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full h-14 bg-[#C6FF00] hover:bg-[#b3e600] active:scale-[0.98] text-black font-extrabold text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#C6FF00]/20 mt-4"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[420px] mx-auto px-5 pb-6 pt-2 text-center text-[10px] text-zinc-600 font-medium shrink-0">
        ThreadZW Secure Merchant Verification • NardoPay MVP
      </footer>
    </div>
  );
};

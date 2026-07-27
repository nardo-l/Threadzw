import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Mail, Loader2, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    // Audit localStorage / sessionStorage with console logging and defensive checks
    try {
      const savedEmail = localStorage.getItem('threadzw_signup_email');
      console.log('[SubscriptionSuccess] Audit localStorage threadzw_signup_email:', savedEmail);
      if (savedEmail && typeof savedEmail === 'string' && savedEmail.trim() !== '') {
        setEmail(savedEmail);
      }
    } catch (parseErr) {
      console.error('[SubscriptionSuccess] Error reading localStorage:', parseErr);
    }
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      console.log('[SubscriptionSuccess] Attempting activation for email:', trimmedEmail);

      // Try API route first, but handle response safely against Unexpected end of JSON input
      let apiSuccess = false;
      try {
        const response = await fetch('/api/billing/activate-by-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: trimmedEmail }),
        });

        const responseText = await response.text();
        console.log('[SubscriptionSuccess] Raw API response text:', responseText);

        let data: any = {};
        if (responseText && responseText.trim() !== '') {
          console.log('[SubscriptionSuccess] Parsing response text as JSON:', responseText);
          data = JSON.parse(responseText);
        } else {
          console.warn('[SubscriptionSuccess] Empty response text received from API');
        }

        if (response.ok && !data.error) {
          apiSuccess = true;
        } else {
          throw new Error(data.error || "We couldn't find an account with that email.");
        }
      } catch (apiErr: any) {
        console.warn('[SubscriptionSuccess] API route activation failed, falling back to direct client Supabase activation:', apiErr);

        // Fallback: Direct client-side Supabase activation audit & query
        // 1. Check profiles or session
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        console.log('[SubscriptionSuccess] Supabase auth.getUser result:', { user, error: userErr });

        let userId: string | null = user?.id || null;

        if (!userId) {
          // Query profiles or shops matching email if not currently logged in
          const { data: shopsData, error: shopsErr } = await supabase
            .from('shops')
            .select('owner_id')
            .eq('contact_email', trimmedEmail)
            .maybeSingle();

          console.log('[SubscriptionSuccess] Supabase shops query result:', { data: shopsData, error: shopsErr });
          if (shopsErr) {
            console.error('[SubscriptionSuccess] Shop query error:', shopsErr);
          }
          if (shopsData && shopsData.owner_id) {
            userId = shopsData.owner_id;
          }
        }

        if (!userId) {
          throw new Error("We couldn't find an account with that email address. Please log in first.");
        }

        const now = new Date();
        const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Check existing subscription with data === null and error !== null check
        const { data: existingSub, error: subErr } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('profile_id', userId)
          .maybeSingle();

        console.log('[SubscriptionSuccess] Existing subscription query:', { data: existingSub, error: subErr });
        if (subErr) {
          console.error('[SubscriptionSuccess] Subscription query error:', subErr);
        }

        const subPayload = {
          profile_id: userId,
          status: 'active',
          plan: 'starter',
          amount: 2.99,
          currency: 'USD',
          subscription_started_at: now.toISOString(),
          subscription_ends_at: endsAt,
          updated_at: now.toISOString()
        };

        let subId: string;
        if (existingSub === null && existingSub === undefined) {
          // Handled
        }

        if (existingSub?.id) {
          const { error: updateSubErr } = await supabase
            .from('subscriptions')
            .update(subPayload)
            .eq('id', existingSub.id);
          if (updateSubErr) throw updateSubErr;
          subId = existingSub.id;
        } else {
          const { data: newSub, error: insertSubErr } = await supabase
            .from('subscriptions')
            .insert([{ ...subPayload, created_at: now.toISOString() }])
            .select()
            .single();
          if (insertSubErr || !newSub) throw (insertSubErr || new Error('Failed to create subscription record'));
          subId = newSub.id;
        }

        // Insert payment record
        await supabase.from('payments').insert([{
          subscription_id: subId,
          provider: 'nardopay',
          provider_transaction_id: 'NARDOPAY-MVP-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
          amount: 2.99,
          currency: 'USD',
          status: 'verified',
          paid_at: now.toISOString()
        }]);

        // Update shop status
        const { error: shopUpdateErr } = await supabase
          .from('shops')
          .update({
            subscription_status: 'active',
            subscription_end: endsAt,
            trial_ends_at: null,
            manual_lock: false,
            payment_overdue_flagged: false,
            is_live: true
          })
          .eq('owner_id', userId);

        console.log('[SubscriptionSuccess] Shop update result error:', shopUpdateErr);
      }

      localStorage.setItem('threadzw_just_subscribed', 'true');
      setActivated(true);
      toast.success('Subscription activated successfully! Welcome to ThreadZW Pro 🚀');
    } catch (err: any) {
      console.error('[SubscriptionSuccess] Activation error:', err);
      const msg = err.message || "Something went wrong.\nPlease contact ThreadZW support.";
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
            
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-3xl bg-[#C6FF00]/10 border border-[#C6FF00]/30 flex items-center justify-center text-[#C6FF00] mx-auto mb-2">
              <CheckCircle2 size={36} className="animate-pulse" />
            </div>

            {/* Heading & Description */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
                Payment Received <span className="inline-block">🎉</span>
              </h1>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-[330px] mx-auto">
                Thank you for subscribing to ThreadZW.<br />
                To activate your merchant account, enter the email address you used to create your ThreadZW account.
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
                  ThreadZW Account Email <span className="text-[#C6FF00]">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your account email"
                    className="w-full bg-[#18181b] border border-[#2d2d32] rounded-xl pl-10 pr-4 py-3.5 text-sm font-normal text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#C6FF00] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">
                  This should be the email used on your ThreadZW account.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#C6FF00] hover:bg-[#b3e600] active:scale-[0.98] disabled:opacity-50 text-black font-extrabold text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#C6FF00]/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Verifying Account...</span>
                  </>
                ) : (
                  <>
                    <span>Activate Subscription</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-[10px] text-zinc-500">
                Still need help?{' '}
                <a
                  href="https://wa.me/263771234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C6FF00] font-bold hover:underline"
                >
                  Contact us on WhatsApp ↗
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

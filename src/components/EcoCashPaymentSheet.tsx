import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface EcoCashPaymentSheetProps {
  plan: string;
  billingCycle: string;
  amount: number;
  isFirstPeriod: boolean;
  shopId: string;
  onSuccess: (subscription: any) => void;
  onClose: () => void;
}

export const EcoCashPaymentSheet: React.FC<EcoCashPaymentSheetProps> = ({
  plan,
  billingCycle,
  amount,
  isFirstPeriod,
  shopId,
  onSuccess,
  onClose,
}) => {
  const { user } = useAuth();
  const [ecocashNumber, setEcocashNumber] = useState('');
  const [step, setStep] = useState<'enter_number' | 'processing' | 'polling' | 'success'>('enter_number');
  // Steps: enter_number -> processing -> polling -> success
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const formatNumber = (val: string) => {
    // Strip non-digits
    const digits = val.replace(/\D/g, '');
    return digits;
  };

  const getFullNumber = () => {
    const digits = ecocashNumber.replace(/\D/g, '');
    // Add Zimbabwe prefix if not present
    if (digits.startsWith('263')) return `+${digits}`;
    if (digits.startsWith('0')) return `+263${digits.slice(1)}`;
    if (digits.startsWith('7')) return `+263${digits}`;
    return `+263${digits}`;
  };

  const isValidNumber = () => {
    const digits = ecocashNumber.replace(/\D/g, '');
    return digits.length >= 9;
  };

  const handleInitiatePayment = async () => {
    if (!isValidNumber()) {
      setError('Please enter a valid EcoCash number');
      return;
    }

    // Free first month -- no payment needed
    if (amount === 0) {
      await handleFreeActivation();
      return;
    }

    setStep('processing');
    setError(null);

    try {
      // Call Edge Function to initiate EcoCash payment
      const { data, error: fnError } = await supabase.functions.invoke(
        'initiate-ecocash-payment',
        {
          body: {
            ecocashNumber: getFullNumber(),
            amount,
            plan,
            billingCycle,
            shopId,
            isFirstPeriod,
            userId: user?.id,
          }
        }
      );

      if (fnError || data?.error) {
        throw new Error(fnError?.message || data?.error || 'Payment initiation failed');
      }

      setStep('polling');

      // Start polling for payment confirmation
      startPolling(data.transactionId, data.pollUrl, data.paymentId);

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setStep('enter_number');
    }
  };

  const handleFreeActivation = async () => {
    setStep('processing');
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'activate-free-subscription',
        {
          body: { plan, billingCycle, shopId, userId: user?.id }
        }
      );
      if (fnError || data?.error) throw new Error('Activation failed');
      setStep('success');
      setTimeout(() => onSuccess(data.subscription), 1500);
    } catch (err) {
      setError('Could not activate free plan. Please try again.');
      setStep('enter_number');
    }
  };

  const startPolling = (txId: string, pUrl: string, paymentId: string) => {
    let count = 0;
    const maxPolls = 24; // Poll for up to 2 minutes (24 × 5s)

    const pollInterval = setInterval(async () => {
      count++;
      setPollCount(count);

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          'poll-ecocash-payment',
          { body: { transactionId: txId, pollUrl: pUrl, paymentId } }
        );

        if (fnError) throw new Error(fnError.message);

        if (data.status === 'paid') {
          clearInterval(pollInterval);
          setStep('success');
          setTimeout(() => onSuccess(data.subscription), 1500);
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          clearInterval(pollInterval);
          setError('Payment was declined or cancelled on your phone. Please try again.');
          setStep('enter_number');
        }
        // If still 'pending' or 'processing' -- keep polling

      } catch (err) {
        console.error('Poll error:', err);
      }

      if (count >= maxPolls) {
        clearInterval(pollInterval);
        setError('Payment timed out. Check your EcoCash and try again if deducted.');
        setStep('enter_number');
      }
    }, 5000); // Poll every 5 seconds
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
      <div className="w-full max-w-[430px] mx-auto bg-[#1a1a1a] rounded-t-3xl p-6">

        {/* Drag handle */}
        <div className="w-10 h-1 bg-[#2a2a2a] rounded-full mx-auto mb-6" />

        {/* STEP: Enter Number */}
        {step === 'enter_number' && (
          <>
            <h2 className="font-syne font-bold text-white text-xl mb-1">
              Pay with EcoCash
            </h2>
            <p className="font-dm-sans text-[#888888] text-sm mb-6">
              Enter your EcoCash number. You'll get a prompt on your phone to approve.
            </p>

            {/* Plan summary */}
            <div className="bg-[#111111] rounded-2xl p-4 mb-5 border border-[#2a2a2a]">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-syne font-bold text-white text-sm">
                    {plan === 'solo' ? 'Solo Store' : 'Full Shop'}
                  </p>
                  <p className="font-dm-mono text-[#888888] text-xs mt-0.5">
                    {billingCycle === 'annual' ? 'Annual billing' : 'Monthly billing'}
                    {isFirstPeriod && amount > 0 && ' · First period'}
                    {isFirstPeriod && amount === 0 && ' · Free first month'}
                  </p>
                </div>
                <p className="font-syne font-bold text-[#f72585] text-2xl">
                  {amount === 0 ? 'FREE' : `$${amount.toFixed(2)}`}
                </p>
              </div>
            </div>

            {/* EcoCash number input */}
            <div className="mb-4">
              <label className="font-dm-mono text-[#888888] text-xs tracking-wider uppercase block mb-2">
                EcoCash Number
              </label>
              <div className="flex items-center bg-[#111111] border-2 border-[#2a2a2a] focus-within:border-[#f72585] rounded-xl overflow-hidden transition-colors">
                <span className="font-dm-mono text-[#f72585] text-sm px-4 border-r border-[#2a2a2a] py-4">
                  +263
                </span>
                <input
                  type="tel"
                  value={ecocashNumber}
                  onChange={e => setEcocashNumber(formatNumber(e.target.value))}
                  placeholder="771 234 567"
                  className="flex-1 bg-transparent text-white font-dm-sans text-base px-4 py-4 outline-none"
                  maxLength={9}
                  inputMode="numeric"
                />
              </div>
              {ecocashNumber.length > 0 && (
                <p className="font-dm-mono text-[#888888] text-xs mt-1.5">
                  Full number: {getFullNumber()}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[#1a0a0a] border border-[#f87171] rounded-xl p-3 mb-4">
                <p className="font-dm-sans text-[#f87171] text-sm">{error}</p>
              </div>
            )}

            {/* How it works */}
            <div className="bg-[#111111] rounded-xl p-3 mb-5 border border-[#2a2a2a]">
              <p className="font-dm-mono text-[#888888] text-xs uppercase tracking-wider mb-2">
                How it works
              </p>
              {[
                'Enter your EcoCash number above',
                'You\'ll get a USSD prompt on your phone',
                'Enter your EcoCash PIN on your phone to approve',
                'Your shop goes live instantly',
              ].map((s, i) => (
                <div key={`payment-step-${i}`} className="flex items-start gap-2 mb-1.5">
                  <span className="font-dm-mono text-[#f72585] text-xs w-4 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <span className="font-dm-sans text-[#cccccc] text-xs">{s}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleInitiatePayment}
              disabled={!isValidNumber() && amount > 0}
              className={`w-full py-4 rounded-2xl font-syne font-bold text-base transition-opacity
                ${(isValidNumber() || amount === 0)
                  ? 'bg-gradient-to-r from-[#f72585] to-[#7209b7] text-white'
                  : 'bg-[#2a2a2a] text-[#888888] cursor-not-allowed'}`}
            >
              {amount === 0 ? 'Activate Free Plan' : `Pay $${amount.toFixed(2)} via EcoCash`}
            </button>

            <button
              onClick={onClose}
              className="w-full mt-3 font-dm-sans text-[#888888] text-sm py-2"
            >
              Cancel
            </button>
          </>
        )}

        {/* STEP: Processing */}
        {step === 'processing' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 border-4 border-[#f72585] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="font-syne font-bold text-white text-xl mb-2">
              Initiating payment...
            </h2>
            <p className="font-dm-sans text-[#888888] text-sm">
              Connecting to EcoCash. Please wait.
            </p>
          </div>
        )}

        {/* STEP: Polling -- waiting for user to approve on phone */}
        {step === 'polling' && (
          <div className="py-6 text-center">
            {/* Animated phone */}
            <div className="relative mx-auto mb-6 w-20 h-20">
              <div className="w-20 h-20 bg-[#111111] rounded-2xl border-2 border-[#f72585] flex items-center justify-center">
                <span className="text-3xl">📱</span>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#f72585] rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-xs font-bold">!</span>
              </div>
            </div>

            <h2 className="font-syne font-bold text-white text-xl mb-2">
              Check your phone
            </h2>
            <p className="font-dm-sans text-[#888888] text-sm mb-2">
              A prompt has been sent to
            </p>
            <p className="font-syne font-bold text-[#f72585] text-lg mb-4">
              {getFullNumber()}
            </p>
            <p className="font-dm-sans text-[#888888] text-sm mb-6">
              Enter your EcoCash PIN on the USSD prompt to approve the payment.
            </p>

            {/* Progress indicator */}
            <div className="bg-[#111111] rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-dm-mono text-[#888888] text-xs">
                  Waiting for approval
                </span>
                <span className="font-dm-mono text-[#888888] text-xs">
                  {Math.max(0, 120 - (pollCount * 5))}s remaining
                </span>
              </div>
              <div className="w-full bg-[#2a2a2a] rounded-full h-1.5">
                <div
                  className="bg-[#f72585] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (pollCount / 24) * 100)}%` }}
                />
              </div>
            </div>

            <p className="font-dm-mono text-[#888888] text-xs">
              Didn't get the prompt?
            </p>
            <button
              onClick={() => { setStep('enter_number'); setError(null) }}
              className="font-dm-mono text-[#f72585] text-xs mt-1"
            >
              Try a different number
            </button>
          </div>
        )}

        {/* STEP: Success */}
        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#f72585] to-[#7209b7] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="font-syne font-bold text-white text-2xl mb-2">
              Payment confirmed!
            </h2>
            <p className="font-dm-sans text-[#888888] text-sm">
              Your shop is going live now...
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

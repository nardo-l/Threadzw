// src/screens/NardoPayCheckout.tsx

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  ShieldCheck, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export const NardoPayCheckout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Secure payment gateway contact inputs
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setErrorMsg('Invalid payment session. Please return to the application and try again.');
    }
  }, [sessionId]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      toast.error('Session ID is missing');
      return;
    }

    if (!whatsappNumber.trim()) {
      toast.error('Please enter your WhatsApp contact number to authorize payment');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      const token = activeSession?.access_token;

      if (!token) {
        throw new Error('Authentication expired. Please log in again.');
      }

      // Direct call to the secure billing backend endpoint
      const response = await fetch('/api/billing/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          whatsappNumber: whatsappNumber.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment authorization declined by network');
      }

      setSuccess(true);
      toast.success('Payment authorized successfully!');

      // Redirect after a beautiful success countdown
      setTimeout(() => {
        navigate('/dashboard?payment=success');
      }, 2500);

    } catch (err: any) {
      console.error('NardoPay transaction processing failed:', err);
      setErrorMsg(err.message || 'Verification failed. Please review details and try again.');
      toast.error(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6 text-white font-sans selection:bg-[#25D366] selection:text-black">
        <div className="max-w-md w-full bg-[#121212] rounded-3xl border border-emerald-900/40 p-8 space-y-6 text-center relative animate-fade-in">
          <div className="w-20 h-20 bg-emerald-950/40 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-[#25D366]">
            <CheckCircle2 size={48} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-none">
              Payment Secured
            </h2>
            <p className="text-zinc-400 text-sm font-medium">
              Your transaction of $7.00 USD has been completed. Re-entering ThreadZW application workspace...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-zinc-600 font-mono text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
            <span>Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col justify-between p-6 text-white font-sans selection:bg-[#25D366] selection:text-black animate-fade-in">
      {/* Top Banner */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between py-4 border-b border-zinc-900">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors font-bold cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span>Cancel & Return</span>
        </button>
        <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[9px] tracking-widest uppercase font-black">
          <ShieldCheck size={12} className="text-[#25D366]" />
          <span>NardoPay PCI Compliant Portal</span>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-md w-full mx-auto bg-[#111111] rounded-3xl border border-zinc-900 overflow-hidden shadow-2xl p-8 space-y-6 relative my-auto">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#25D366] to-transparent" />

        <div className="space-y-2 text-center">
          <div className="text-xs font-mono tracking-widest uppercase text-[#25D366] font-black">
            NardoPay Zimbabwe
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white leading-tight">
            NardoPay Secure Authorization
          </h2>
          <p className="text-zinc-500 text-xs font-semibold leading-relaxed">
            Please enter your WhatsApp details to authorize subscription fee of <strong className="text-white font-black">$7.00 USD</strong>.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-xl flex items-start gap-3 text-red-400 text-xs text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-0.5 text-left">
            <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider font-bold">Secure Session ID</span>
            <span className="text-xs text-zinc-400 font-mono block truncate max-w-[180px]">{sessionId || 'N/A'}</span>
          </div>
          <div className="bg-[#25D366]/10 px-3 py-1.5 rounded-lg border border-[#25D366]/20 flex items-center gap-1">
            <DollarSign size={14} className="text-[#25D366]" />
            <span className="text-sm font-black text-[#25D366] font-mono">7.00</span>
          </div>
        </div>

        <form onSubmit={handlePaymentSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
              Billing WhatsApp Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
              <input 
                type="tel"
                required
                disabled={!sessionId || loading}
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                placeholder="e.g. +263776223144"
                className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl pl-11 pr-4 text-white text-sm focus:outline-none focus:border-[#25D366] transition-all placeholder-zinc-800 font-mono"
              />
            </div>
            <p className="text-[10px] text-zinc-600 font-medium leading-relaxed mt-1">
              Your registered mobile account linked to this WhatsApp number will be prompted to secure authorization.
            </p>
          </div>

          <button
            type="submit"
            disabled={!sessionId || loading}
            className="w-full h-14 bg-[#25D366] hover:bg-[#20ba5a] disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer mt-3"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <>
                <span>Securely Authorize $7.00 USD</span>
                <ArrowRight size={14} className="stroke-[2.5px]" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-zinc-600 font-semibold py-4">
        © {new Date().getFullYear()} NardoPay Zimbabwe Ltd. All rights reserved. PCI-DSS Level 1 Gateway.
      </div>
    </div>
  );
};

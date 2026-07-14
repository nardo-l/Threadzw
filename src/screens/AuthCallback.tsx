// src/screens/AuthCallback.tsx

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, ShieldX, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { hasShop, loading: shopLoading } = useShopContext();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const verifyToken = async () => {
      const currentUrl = window.location.href;
      const currentSearch = window.location.search;
      const currentHash = window.location.hash;

      console.log("[AUTH-CALLBACK] Full URL:", currentUrl);
      console.log("[AUTH-CALLBACK] Search params:", currentSearch);
      console.log("[AUTH-CALLBACK] Hash fragment:", currentHash);

      const searchParamsObj = new URLSearchParams(currentSearch);
      const hashParamsObj = new URLSearchParams(currentHash.substring(1));

      // 1. Check for errors forwarded by Supabase to redirect_to
      const errorParam = searchParamsObj.get('error') || hashParamsObj.get('error');
      const errorCodeParam = searchParamsObj.get('error_code') || hashParamsObj.get('error_code');
      const errorDescParam = searchParamsObj.get('error_description') || hashParamsObj.get('error_description');

      if (errorParam || errorDescParam) {
        const fullErrorMessage = errorDescParam || errorParam || "Verification failed";
        console.error("[AUTH-CALLBACK] Returned error from Supabase:", {
          error: errorParam,
          code: errorCodeParam,
          description: errorDescParam
        });
        if (active) {
          setStatus('error');
          setErrorMessage(fullErrorMessage);
        }
        return;
      }

      const tokenHashParam = searchParamsObj.get('token_hash');
      const tokenParam = searchParamsObj.get('token');
      const typeParam = searchParamsObj.get('type') || hashParamsObj.get('type') || searchParamsObj.get('type_hint');
      const codeParam = searchParamsObj.get('code');
      const accessTokenParam = hashParamsObj.get('access_token');

      console.log("[AUTH-CALLBACK] Extracted params:", {
        type: typeParam,
        token_hash: tokenHashParam ? `${tokenHashParam.substring(0, 8)}...` : null,
        token: tokenParam ? `${tokenParam.substring(0, 8)}...` : null,
        code: codeParam ? "PRESENT" : null,
        access_token: accessTokenParam ? "PRESENT" : null
      });

      if (typeParam) {
        if (active) {
          setDetectedType(typeParam);
        }
      }

      // CASE A: PKCE flow (Authorization Code Flow) where 'code' parameter is in URL
      if (codeParam) {
        console.log("[AUTH-CALLBACK] Detected flow: PKCE auth code exchange");
        console.log("[AUTH-CALLBACK] Verification method chosen: exchangeCodeForSession");
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(codeParam);
          if (error) {
            console.error("[AUTH-CALLBACK] exchangeCodeForSession returned an error:", error);
            if (active) {
              setStatus('error');
              setErrorMessage(error.message || "Failed to exchange verification code.");
            }
            return;
          }
          console.log("[AUTH-CALLBACK] exchangeCodeForSession successful. Session acquired:", !!data.session);
          if (active) {
            setStatus('success');
          }
          return;
        } catch (err: any) {
          console.error("[AUTH-CALLBACK] Exception in exchangeCodeForSession:", err);
          if (active) {
            setStatus('error');
            setErrorMessage(err?.message || "An unexpected error occurred during auth code exchange.");
          }
          return;
        }
      }

      // CASE B: Standard token_hash verification
      if (tokenHashParam && typeParam) {
        console.log("[AUTH-CALLBACK] Detected flow: token_hash email confirmation");
        console.log("[AUTH-CALLBACK] Verification method chosen: verifyOtp with token_hash");
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHashParam,
            type: typeParam as any,
          });

          if (error) {
            console.error("[AUTH-CALLBACK] verifyOtp (token_hash) returned an error:", error);
            if (active) {
              setStatus('error');
              setErrorMessage(error.message || "This confirmation link is invalid or has expired.");
            }
            return;
          }

          console.log("[AUTH-CALLBACK] verifyOtp (token_hash) successful. Returned session:", !!data?.session);
          if (active) {
            setStatus('success');
          }
          return;
        } catch (err: any) {
          console.error("[AUTH-CALLBACK] Exception in verifyOtp (token_hash):", err);
          if (active) {
            setStatus('error');
            setErrorMessage(err?.message || "An unexpected error occurred during confirmation.");
          }
          return;
        }
      }

      // CASE C: Direct token parameter verification (sometimes used instead of token_hash)
      if (tokenParam && typeParam) {
        console.log("[AUTH-CALLBACK] Detected flow: token parameter email confirmation");
        console.log("[AUTH-CALLBACK] Verification method chosen: verifyOtp with token");
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenParam,
            type: typeParam as any,
          });

          if (error) {
            console.error("[AUTH-CALLBACK] verifyOtp (token) returned an error:", error);
            if (active) {
              setStatus('error');
              setErrorMessage(error.message || "This confirmation link is invalid or has expired.");
            }
            return;
          }

          console.log("[AUTH-CALLBACK] verifyOtp (token) successful. Returned session:", !!data?.session);
          if (active) {
            setStatus('success');
          }
          return;
        } catch (err: any) {
          console.error("[AUTH-CALLBACK] Exception in verifyOtp (token):", err);
          if (active) {
            setStatus('error');
            setErrorMessage(err?.message || "An unexpected error occurred during confirmation.");
          }
          return;
        }
      }

      // CASE D: Implicit Grant (hash fragment containing access_token)
      if (accessTokenParam) {
        console.log("[AUTH-CALLBACK] Detected flow: Hash fragment implicit session grant");
        console.log("[AUTH-CALLBACK] Verification method chosen: wait for session resolution");
        
        const { data: { session: checkSession } } = await supabase.auth.getSession();
        if (checkSession) {
          console.log("[AUTH-CALLBACK] Session already populated from hash fragment. Returned session: true");
          if (active) {
            setStatus('success');
          }
          return;
        }

        // Give it up to 1 second to parse or we can try manually getting it or wait
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            console.log(`[AUTH-CALLBACK] Session found on attempt ${attempts}. Returned session: true`);
            clearInterval(interval);
            if (active) {
              setStatus('success');
            }
          } else if (attempts >= 10) {
            console.warn("[AUTH-CALLBACK] Access token present but failed to restore session after 1s.");
            clearInterval(interval);
            if (active) {
              setStatus('error');
              setErrorMessage("Failed to establish session from email confirmation.");
            }
          }
        }, 100);
        return;
      }

      // CASE E: Already authenticated
      const { data: { session: checkSession } } = await supabase.auth.getSession();
      if (checkSession) {
        console.log("[AUTH-CALLBACK] Detected flow: Already authenticated session active");
        console.log("[AUTH-CALLBACK] Verification method chosen: proceed directly");
        if (active) {
          setStatus('success');
        }
        return;
      }

      // CASE F: None of the above matching
      console.warn("[AUTH-CALLBACK] No verification parameters found in URL.");
      if (active) {
        setStatus('error');
        setErrorMessage("Verification link is missing required parameters.");
      }
    };

    verifyToken();

    return () => {
      active = false;
    };
  }, []);

  const handleProceed = () => {
    if (detectedType === 'recovery') {
      navigate('/reset-password');
    } else if (!hasShop) {
      navigate('/setup');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="fixed inset-0 bg-white text-zinc-900 flex flex-col items-center justify-center font-sans select-none overflow-hidden z-[100] selection:bg-[#bef715] selection:text-black">
      <div className="w-full max-w-md px-6 text-center space-y-8">
        
        {status === 'verifying' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center space-y-6"
          >
            {/* Logo */}
            <span className="text-3xl font-black tracking-tighter text-[#bef715]">
              ThreadZW<span className="text-zinc-900">.</span>
            </span>

            {/* Spinner */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#bef715]" />
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-950 font-grotesk">
                Confirming your account...
              </h1>
              <p className="text-zinc-500 text-sm font-medium">
                Please wait while we securely verify your email.
              </p>
            </div>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-6 max-w-sm mx-auto"
          >
            {/* Logo */}
            <span className="text-3xl font-black tracking-tighter text-[#bef715]">
              ThreadZW<span className="text-zinc-900">.</span>
            </span>

            {/* Pulsing checkmark badge */}
            <div className="relative w-24 h-24 flex items-center justify-center my-2">
              {/* Central Ambient Glow */}
              <div className="absolute inset-0 bg-green-500/10 rounded-full blur-xl animate-pulse" />
              
              <div className="absolute inset-0 border border-green-500/20 rounded-full animate-ping [animation-duration:3s]" />
              
              <div className="w-16 h-16 rounded-full bg-zinc-950 border border-green-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                <Check className="w-8 h-8 text-green-500 stroke-[3.5]" />
              </div>
            </div>

            {/* Greeting Typography */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-950 font-grotesk tracking-tight uppercase leading-none">
                Email Verified!
              </h1>
              <p className="text-zinc-500 text-sm font-medium">
                {session?.user?.user_metadata?.full_name ? (
                  <>Welcome, <span className="text-zinc-900 font-extrabold">{session.user.user_metadata.full_name}</span>. Your account is secured.</>
                ) : (
                  "Your merchant credentials have been verified."
                )}
              </p>
            </div>

            {/* List of secure setup achievements */}
            <div className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-left space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                <div className="w-4 h-4 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600">
                  <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                </div>
                <span>Cryptographic verification passed</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                <div className="w-4 h-4 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600">
                  <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                </div>
                <span>Secured database records synchronized</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                <div className="w-4 h-4 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600">
                  <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                </div>
                <span>Merchant auth session established</span>
              </div>
            </div>

            {/* Proceed CTA Button */}
            <button
              onClick={handleProceed}
              className="w-full h-12 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-[#bef715]/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer mt-4"
            >
              {detectedType === 'recovery' ? (
                <>Reset Password</>
              ) : !hasShop ? (
                <>Build My Storefront &rarr;</>
              ) : (
                <>Enter Dashboard &rarr;</>
              )}
            </button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-6"
          >
            {/* Logo */}
            <span className="text-3xl font-black tracking-tighter text-[#bef715]">
              ThreadZW<span className="text-zinc-900">.</span>
            </span>

            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
              <ShieldX className="w-8 h-8 text-red-600" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-950 font-grotesk">
                Verification failed
              </h1>
              <p className="text-zinc-500 text-sm font-medium max-w-xs mx-auto">
                {errorMessage || "This confirmation link is invalid or has expired."}
              </p>
            </div>

            <button 
              onClick={() => navigate('/login')}
              className="btn-primary w-full max-w-xs py-3.5 bg-[#bef715] text-black font-bold uppercase tracking-wider text-xs rounded-full shadow-[0_4px_14px_rgba(190,247,21,0.25)] hover:bg-[#aae010] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center"
            >
              Return to Login
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
};

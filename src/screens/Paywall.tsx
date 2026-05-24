import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Check, Lock, Smartphone, 
  AlertCircle, Clock, ArrowRight, Eye, EyeOff, X, HelpCircle, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface PaywallFlowProps {
  paywallScreen: number;
  setPaywallScreen: React.Dispatch<React.SetStateAction<number>>;
  paywallMode: 'signup' | 'payment';
  setPaywallMode: React.Dispatch<React.SetStateAction<'signup' | 'payment'>>;
  myShop: any;
  setMyShop: (shop: any) => void;
  setAppStage: (stage: 'paywall' | 'onboarding' | 'building' | 'reveal' | 'dashboard' | null) => void;
  setOnboardingStep: (step: number) => void;
  shopData?: {
    ownerName: string;
    name: string;
    category: string;
    town: string;
    whatsapp: string;
    description: string;
    instagram: string;
    priceRange: string;
    productEstimate: string;
  };
}

export const Paywall: React.FC<PaywallFlowProps> = ({
  paywallScreen,
  setPaywallScreen,
  paywallMode,
  setPaywallMode,
  myShop,
  setMyShop,
  setAppStage,
  setOnboardingStep,
  shopData
}) => {
  // Sign up form data
  const [signupUsername, setSignupUsername] = useState(() => {
    if (shopData?.name) {
      return shopData.name
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9_-]/g, '')
        .substring(0, 20);
    }
    return '';
  });
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  
  // Field validation and visual helper states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [signingUp, setSigningUp] = useState(false);

  // Return user sign in states
  const [showSignIn, setShowSignIn] = useState(false);
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  // Payment Mode unique states (expired user)
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [otpCode, setOtpCode] = useState<string[]>(new Array(6).fill(''));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (signupUsername && usernameAvailable === null) {
      const cleaned = signupUsername;
      if (cleaned.length >= 3) {
        setCheckingUsername(true);
        const timer = setTimeout(async () => {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('handle')
              .eq('handle', cleaned)
              .maybeSingle();
            if (isMounted.current) {
              if (error) {
                console.error('Error checking handle availability on init:', error);
                setUsernameAvailable(null);
              } else {
                setUsernameAvailable(!data);
              }
              setCheckingUsername(false);
            }
          } catch (e) {
            if (isMounted.current) setCheckingUsername(false);
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Username validation check with manual cleanup and debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanUsername = (val: string) => {
    return val.toLowerCase()
      .replace(/^@/, '')
      .replace(/[^a-z0-9_-]/g, '')
      .substring(0, 20);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanUsername(e.target.value);
    setSignupUsername(cleaned);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (cleaned.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        console.log('Checking availability of handle:', cleaned);
        const { data, error } = await supabase
          .from('profiles')
          .select('handle')
          .eq('handle', cleaned)
          .maybeSingle();

        if (isMounted.current) {
          if (error) {
            console.error('Error checking handle availability:', error);
            setUsernameAvailable(null);
          } else {
            setUsernameAvailable(!data);
          }
          setCheckingUsername(false);
        }
      } catch (err) {
        console.error('Username check exception:', err);
        if (isMounted.current) {
          setCheckingUsername(false);
        }
      }
    }, 600);
  };

  // Sign Up handler
  const handleSignUpSubmit = async () => {
    if (signingUp) return;
    
    // Quick validation checks
    if (signupUsername.length < 3 || !usernameAvailable) {
      toast.error('Please choose an available username first.');
      return;
    }
    if (!signupEmail.includes('@') || !signupEmail.includes('.')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      toast.error('Passwords do not match.');
      return;
    }

    setSigningUp(true);
    try {
      console.log('Creating auth account with email:', signupEmail);
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        options: {
          data: {
            username: signupUsername
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed');

      console.log('Merchant user created in Auth:', data.user.id);

      // Create initial merchant profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          handle: signupUsername,
          display_name: signupUsername,
          onboarding_complete: false
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Error during profile creation:', profileError);
        throw profileError;
      }

      toast.success('Registration successful! Trial activated.');
      console.log('Transitioning to shop building state');
      
      // Move to shop building state since onboarding is already completed
      setAppStage('building');

    } catch (err: any) {
      console.error('Sign up sequence error:', err);
      if (err.message?.includes('already registered') || err.message?.includes('Email already exists')) {
        try {
          console.log('User already registered. Attempting automatic sign-in with provided password...');
          const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
            email: signupEmail.trim().toLowerCase(),
            password: signupPassword,
          });

          if (signinError) {
            console.error('Auto sign-in attempt failed:', signinError);
            toast.error('This email is already registered. Please check your password or use the Sign In form below.');
            return;
          }

          if (signinData?.user) {
            toast.success('Signed in successfully!');
            console.log('Logged in successfully. Transitioning to shop building state.');
            setAppStage('building');
          }
        } catch (autoSignInErr: any) {
          console.error('Auto sign-in custom execution error:', autoSignInErr);
          toast.error('Email already registered. Tap Sign In instead.');
        }
      } else {
        toast.error('Error: ' + err.message);
      }
    } finally {
      if (isMounted.current) {
        setSigningUp(false);
      }
    }
  };

  // Returning merchant sign-in bottom-sheet execution
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signinEmail || !signinPassword) {
      toast.error('Please enter both email and password.');
      return;
    }
    setSigningIn(true);
    try {
      console.log('Attempting sign in for email:', signinEmail);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signinEmail.trim().toLowerCase(),
        password: signinPassword
      });

      if (error) throw error;
      if (!data.user) throw new Error('Could not retrieve user info.');

      toast.success('Welcome back!');
      setShowSignIn(false);

      // Retrieve profile onboarding progress
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileData?.onboarding_complete) {
        setAppStage('dashboard');
      } else {
        setAppStage('onboarding');
        setOnboardingStep(1);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      toast.error('Authentication failed: ' + (err.message || 'Incorrect credentials'));
    } finally {
      if (isMounted.current) {
        setSigningIn(false);
      }
    }
  };

  // Payment Confirmation for Expired Users and pending submission
  const handleIPaid = async () => {
    if (!whatsAppNumber) {
      toast.error('Please provide your WhatsApp number for reference.');
      return;
    }
    setSubmittingPayment(true);
    try {
      if (myShop?.id) {
        console.log('Filing payment notification for shop:', myShop.id);
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            shop_id: myShop.id,
            owner_id: myShop.owner_id,
            whatsapp_number: whatsAppNumber.trim(),
            plan: 'standard',
            amount: 9,
            status: 'pending',
            receiving_number: '0776223144'
          });

        if (paymentError) throw paymentError;

        // Set local shop to pending_payment state
        const { error: shopError } = await supabase
          .from('shops')
          .update({
            subscription_status: 'pending_payment'
          })
          .eq('id', myShop.id);

        if (shopError) throw shopError;

        toast.success('Payment submitted for validation.');
        setPaymentSubmitted(true);
      } else {
        toast.error('Critical Error: Profile shop record not identified.');
      }
    } catch (err: any) {
      console.error('EcoCash confirmation reporting issue:', err);
      toast.error(err.message || 'Verification routing sequence failed.');
    } finally {
      if (isMounted.current) {
        setSubmittingPayment(false);
      }
    }
  };

  // Verify Activation Code Sequence
  const verifyCode = async () => {
    const codeStr = otpCode.join('').toUpperCase().trim();
    if (codeStr.length < 6) return;

    setSubmittingPayment(true);
    try {
      console.log('Verifying unlock identifier:', codeStr);
      const { data: codeMatch, error } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', codeStr)
        .eq('is_used', false)
        .maybeSingle();

      if (error || !codeMatch) {
        toast.error('Invalid or already used key sequence.');
        setSubmittingPayment(false);
        return;
      }

      // Mark code as used
      await supabase
        .from('activation_codes')
        .update({ is_used: true })
        .eq('id', codeMatch.id);

      // Set shop status and renewal twenty-eight days out
      const nextRenewal = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
      if (myShop?.id) {
        await supabase
          .from('shops')
          .update({
            subscription_status: 'active',
            trial_ends_at: nextRenewal.toISOString()
          })
          .eq('id', myShop.id);
          
        toast.success('Congratulations! Shop activated instantly.');
        setAppStage('dashboard');
      } else {
        toast.error('Error recovering local shop link.');
      }
    } catch (err: any) {
      console.error('Verification code exception:', err);
      toast.error('Validation sequence failed.');
    } finally {
      if (isMounted.current) {
        setSubmittingPayment(false);
      }
    }
  };

  const handleOtpBoxChange = (index: number, val: string) => {
    const char = val.toUpperCase().slice(-1);
    const updated = [...otpCode];
    updated[index] = char;
    setOtpCode(updated);

    // Auto-focus next input box on typing
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpBoxKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="bg-[#0B0B0B] min-h-screen text-white font-sans selection:bg-[#C6FF00]/30 relative flex flex-col justify-between">
      
      {/* SECTION PROGRESS DOTS */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-4 px-6 bg-[#0B0B0B]">
        {[1, 2, 3, 4].map(n => (
          <div
            key={'paywall-dot-' + n}
            style={{
              height: 4,
              borderRadius: 2,
              background: n <= paywallScreen ? '#C6FF00' : '#2A2A2A',
              width: n === paywallScreen ? 32 : 8,
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* BACK NAVIGATION COMPONENT */}
      {paywallScreen > 1 && paywallMode === 'signup' && (
        <button
          onClick={() => setPaywallScreen(prev => prev - 1)}
          className="fixed top-14 left-5 z-40 text-[#A1A1AA] hover:text-white transition-colors duration-200"
          aria-label="Back to previous screen"
        >
          <ArrowLeft className="w-5.5 h-5.5" />
        </button>
      )}

      {/* CONTENT FLUID SCROLL WRAPPER */}
      <div className="w-full max-w-md mx-auto pt-24 px-6 pb-36 flex-1 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: SUBSCRIPTION TRIAL MOTIVATION */}
          {paywallScreen === 1 && (
            <motion.div
              key="screen-p1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex justify-center mt-4">
                <div className="relative">
                  <span className="text-7xl block animate-bounce" style={{ animationDuration: '3s' }}>🎁</span>
                  {/* Subtle decorative color glow */}
                  <div className="absolute inset-0 bg-[#C6FF00]/25 blur-3xl rounded-full scale-125 z-[-1]" />
                </div>
              </div>

              <h2 className="text-white font-black text-4xl tracking-tight text-center mt-8 leading-[1.1]">
                Try ThreadZW<br />free for 3 days.
              </h2>
              
              <p className="text-[#A1A1AA] text-base leading-relaxed text-center mt-3 max-w-[300px] mx-auto">
                No payment needed to start. Experience everything ThreadZW has to offer — completely free.
              </p>

              {/* FEATURES CARD SECTION */}
              <div className="bg-[#151515] border border-[#2A2A2A] rounded-[20px] p-5 mt-7">
                <span className="text-[#A1A1AA] text-[11px] uppercase tracking-wider font-bold mb-4 block">
                  Everything included:
                </span>

                <div className="space-y-4">
                  {[
                    { emoji: "🏪", title: "Your own shop page", detail: "Live at threadzw.com/shop/@you" },
                    { emoji: "📦", title: "Unlimited products", detail: "Upload as many as you need" },
                    { emoji: "💬", title: "WhatsApp orders", detail: "Customers contact you directly" },
                    { emoji: "📊", title: "Analytics", detail: "See views and top products" }
                  ].map((feat, idx) => (
                    <div key={'f-' + idx} className="flex gap-3.5 items-start">
                      <div className="w-9 h-9 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {feat.emoji}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">{feat.title}</h4>
                        <p className="text-[#A1A1AA] text-[13px] mt-0.5 leading-normal">{feat.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DAY 3 ECO-REMINDER WARNING BOX */}
              <div className="bg-[rgba(255,122,0,0.08)] border border-[rgba(255,122,0,0.2)] rounded-2xl p-4 mt-4 flex gap-3">
                <span className="text-lg flex-shrink-0">🔔</span>
                <p className="text-[#FF7A00] text-[13px] leading-relaxed">
                  You will receive a WhatsApp reminder on day 3 before your trial ends.
                </p>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: PRICING DETAILS AND ECOCASH */}
          {paywallScreen === 2 && (
            <motion.div
              key="screen-p2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mt-4">
                <span className="text-7xl block">💸</span>
              </div>

              <h2 className="text-white font-black text-4.5xl tracking-tight text-center mt-6">
                Just $9/month<br />after your trial.
              </h2>

              <div className="text-center mt-4 flex items-baseline justify-center gap-1.5">
                <span className="text-[#C6FF00] font-black text-[64px] leading-none">$9</span>
                <span className="text-[#A1A1AA] text-2xl font-bold">/month</span>
              </div>

              <p className="text-[#A1A1AA] text-center text-[13px] mt-1">
                Less than $0.30 per day
              </p>

              {/* PAYMENT METHOD 1 (ECOCASH APP Direct) */}
              <div className="bg-[#151515] border border-[#2A2A2A] rounded-2xl p-5 mt-7">
                <div className="flex gap-3.5 items-start">
                  <div className="w-11 h-11 bg-[rgba(198,255,0,0.1)] rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                    📱
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-base">EcoCash App</h4>
                    
                    <p className="text-[#A1A1AA] text-[13px] mt-1.5 leading-relaxed">
                      Open EcoCash → Send Money → Enter number below → Send $9
                    </p>

                    <div className="bg-[#0B0B0B] border border-[#C6FF00] rounded-xl py-2 px-3 mt-3.5 flex items-center justify-center max-w-max">
                      <span className="text-[#C6FF00] font-mono font-bold text-lg select-all">
                        0776 223 144
                      </span>
                    </div>

                    <p className="text-[#A1A1AA] text-xs mt-3 leading-snug">
                      Use your WhatsApp number as the payment reference
                    </p>
                  </div>
                </div>
              </div>

              {/* PAYMENT METHOD 2 (ECOCASH SUPER APP) */}
              <div className="bg-[#151515] border border-[#2A2A2A] rounded-2xl p-5 mt-3">
                <div className="flex gap-3.5 items-start">
                  <div className="w-11 h-11 bg-[rgba(198,255,0,0.1)] rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                    📲
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-base">EcoCash Super App</h4>
                    
                    <p className="text-[#A1A1AA] text-[13px] mt-1.5 leading-relaxed">
                      Open Super App → Send Money → Enter number → Send $9
                    </p>

                    <div className="bg-[#0B0B0B] border border-[#C6FF00] rounded-xl py-2 px-3 mt-3.5 flex items-center justify-center max-w-max">
                      <span className="text-[#C6FF00] font-mono font-bold text-lg select-all">
                        0776 223 144
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* REFERENCE WARNING DETAIL */}
              <div className="bg-[rgba(198,255,0,0.06)] border border-[rgba(198,255,0,0.15)] rounded-2xl p-4 mt-4 flex gap-3">
                <span className="text-sm flex-shrink-0">⚠️</span>
                <p className="text-[#A1A1AA] text-[13px] leading-relaxed">
                  Always use your WhatsApp number as reference so we can find your payment.
                </p>
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: VERIFICATION CODE DELIVERY INSIGHT */}
          {paywallScreen === 3 && (
            <motion.div
              key="screen-p3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mt-4">
                <span className="text-7xl block animate-pulse">💬</span>
              </div>

              <h2 className="text-white font-black text-[34px] tracking-tight text-center mt-6 leading-tight">
                We send your<br />unlock code on<br />WhatsApp.
              </h2>

              <p className="text-[#A1A1AA] text-base leading-relaxed text-center mt-3 max-w-[300px] mx-auto">
                After you pay, our team verifies and sends your 6-character unlock code directly to your WhatsApp.
              </p>

              {/* VERTICAL CONNECTING STEPS PREVIEW CONTAINER */}
              <div className="relative mt-8 select-none">
                
                {/* Connecting Line background */}
                <div className="absolute left-[22px] top-4 bottom-4 w-[1px] bg-[#2A2A2A]" />

                <div className="space-y-6">
                  {[
                    { num: "1", title: "Pay via EcoCash", detail: "Send $9 to 0776 223 144" },
                    { num: "2", title: "We verify your payment", detail: "Usually within 2-4 hours during 8am-8pm ZIM time" },
                    { num: "3", title: "Code arrives on WhatsApp", detail: "A 6-character code like this:", whatsappPreview: true },
                    { num: "4", title: "Enter code in the app", detail: "Shop activates instantly 🚀" }
                  ].map((step, idx) => (
                    <div key={'s-' + idx} className="flex flex-col">
                      <div className="flex gap-4 items-start">
                        <div className="w-11 h-11 bg-[#151515] border-1.5 border-[#2A2A2A] rounded-full flex items-center justify-center flex-shrink-0 text-[#C6FF00] font-black text-base">
                          {step.num}
                        </div>
                        <div className="pt-1">
                          <h4 className="text-white font-bold text-base leading-snug">{step.title}</h4>
                          <p className="text-[#A1A1AA] text-[13px] mt-1 leading-relaxed">{step.detail}</p>
                        </div>
                      </div>

                      {/* Overlapping Whatsapp card mockup inside step 3 */}
                      {step.whatsappPreview && (
                        <div className="ml-[60px] mt-3 mb-2 bg-[#151515] border border-[#2A2A2A] rounded-xl p-4">
                          <div className="text-[#A1A1AA] text-[11px] font-bold tracking-wide uppercase mb-1">
                            ThreadZW 🎉
                          </div>
                          <span className="text-[#A1A1AA] text-[13px] block">
                            Your unlock code is:
                          </span>
                          <span className="text-[#C6FF00] font-mono font-black text-[28px] leading-tight block mt-1 tracking-[6px]">
                            8472KX
                          </span>
                          <p className="text-[#A1A1AA] text-xs mt-2.5 leading-normal">
                            Enter this in the app to activate your shop.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* TIMING ASSURANCE BOX */}
              <div className="bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.15)] rounded-2xl p-4 mt-6 flex gap-3">
                <span className="text-sm flex-shrink-0">⚡</span>
                <p className="text-[#22C55E] text-[13px] leading-relaxed">
                  Payments verified within 2-4 hours · 8am-8pm Zimbabwe time.
                </p>
              </div>
            </motion.div>
          )}

          {/* SCREEN 4: SIGN UP (Merchant Registration Setup) */}
          {paywallScreen === 4 && (
            <motion.div
              key="screen-p4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              {paywallMode === 'signup' ? (
                <>
                  {/* SIGN UP NEW VISITOR LAYOUT */}
                  <h2 className="text-white font-black text-[32px] tracking-tight leading-tight mt-2">
                    Start your free<br />3-day trial.
                  </h2>
                  
                  <p className="text-[#A1A1AA] text-base leading-relaxed mt-2 mb-6">
                    Create your account to activate your trial and build your shop.
                  </p>

                  <div className="mb-6">
                    <div className="bg-[rgba(198,255,0,0.08)] border border-[rgba(198,255,0,0.2)] rounded-full inline-flex py-1.5 px-4 items-center gap-2">
                      <span className="text-xs">🎁</span>
                      <span className="text-[#C6FF00] text-xs font-black">
                        3 days free · No payment needed
                      </span>
                    </div>
                  </div>

                  {/* FORM FIELDS */}
                  <div className="space-y-4">
                    {/* Username setup */}
                    <div>
                      <label className="text-[#A1A1AA] text-[13px] font-bold block mb-1.5">
                        Username
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={signupUsername}
                          onChange={handleUsernameChange}
                          placeholder="yourshop"
                          className="w-full bg-[#151515] text-white border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C6FF00] transition-colors pr-10 font-mono"
                        />
                        {signupUsername && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                            {checkingUsername ? (
                              <div className="w-4 h-4 border border-[#C6FF00] border-t-transparent rounded-full animate-spin" />
                            ) : usernameAvailable ? (
                              <Check className="w-4.5 h-4.5 text-[#22C55E]" />
                            ) : (
                              <X className="w-4.5 h-4.5 text-[#EF4444]" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Availability Indicators */}
                      <div className="mt-1.5">
                        {checkingUsername && (
                          <span className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
                            Checking...
                          </span>
                        )}
                        {!checkingUsername && signupUsername && (
                          <>
                            {signupUsername.length < 3 ? (
                              <span className="text-xs text-[#A1A1AA]">
                                Min 3 characters
                              </span>
                            ) : usernameAvailable ? (
                              <div className="space-y-0.5">
                                <span className="text-xs text-[#22C55E] block">
                                  ✓ @{signupUsername} is available
                                </span>
                                <span className="text-xs text-[#C6FF00] font-mono block">
                                  threadzw.com/shop/@{signupUsername}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-[#EF4444]">
                                ✕ Username taken
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Email setup */}
                    <div>
                      <label className="text-[#A1A1AA] text-[13px] font-bold block mb-1.5">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-[#151515] text-white border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C6FF00] transition-colors"
                      />
                    </div>

                    {/* Password setup */}
                    <div>
                      <label className="text-[#A1A1AA] text-[13px] font-bold block mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#151515] text-white border border-[#151515] focus:border-[#C6FF00] rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors border border-[#2A2A2A]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password setup */}
                    <div>
                      <label className="text-[#A1A1AA] text-[13px] font-bold block mb-1.5">
                        Confirm password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={signupConfirm}
                          onChange={(e) => setSignupConfirm(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full bg-[#151515] text-white border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                            signupConfirm ? (signupPassword === signupConfirm ? 'border-[#22C55E]' : 'border-[#EF4444]') : 'border-[#2A2A2A]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {signupConfirm && (
                        <div className="mt-1.5 text-xs">
                          {signupPassword === signupConfirm ? (
                            <span className="text-[#22C55E]">✓ Passwords match</span>
                          ) : (
                            <span className="text-[#EF4444]">Passwords don't match</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TERMS COMPLIANCE PILLET */}
                  <div className="bg-[rgba(198,255,0,0.04)] border border-[rgba(198,255,0,0.08)] rounded-xl p-3.5 mt-6 flex gap-3">
                    <span className="text-sm">🔒</span>
                    <p className="text-[#A1A1AA] text-xs leading-relaxed">
                      By signing up you agree to our terms. Your 3-day trial starts immediately.
                    </p>
                  </div>

                  {/* SIGN-IN PROMPT */}
                  <div className="text-center mt-6">
                    <span className="text-[#A1A1AA] text-[13px]">
                      Already have an account?{' '}
                    </span>
                    <button
                      onClick={() => setShowSignIn(true)}
                      className="text-[#C6FF00] font-black text-[13px] hover:underline"
                    >
                      Sign in →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* EXPIRATION MODE BLOCK */}
                  <h2 className="text-white font-black text-3xl tracking-tight leading-tight">
                    Your trial has ended.
                  </h2>
                  <p className="text-[#A1A1AA] text-sm mt-1 mb-4 leading-relaxed">
                    Keep your shop live for just $9/month.
                  </p>

                  <div className="flex items-baseline justify-start gap-1 pb-4 border-b border-[#1A1A1A]">
                    <span className="text-[#C6FF00] font-black text-4xl leading-none">$9</span>
                    <span className="text-[#A1A1AA] text-base font-bold">/month</span>
                  </div>

                  {/* CONDENSED HOW TO PAY */}
                  <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-4 mt-4 space-y-3">
                    <span className="text-white text-xs font-bold block">
                      PAYMENT DIRECTIVES
                    </span>
                    <p className="text-[#A1A1AA] text-xs leading-snug">
                      Open EcoCash App or Dial EcoCash USSD code → Send money to the number below:
                    </p>
                    <div className="bg-[#0B0B0B] border border-[#C6FF00]/60 rounded-lg py-1.5 px-3 max-w-max">
                      <span className="text-[#C6FF00] font-mono font-bold text-base select-all">
                        0776 223 144
                      </span>
                    </div>
                  </div>

                  {!paymentSubmitted ? (
                    <div className="mt-5 space-y-4">
                      {/* WhatsApp number submission field */}
                      <div>
                        <label className="text-[#A1A1AA] text-[13px] font-bold block mb-1.5">
                          Your WhatsApp number (Reference)
                        </label>
                        <div className="flex gap-2">
                          <div className="bg-[#151515] border border-[#2A2A2A] text-white px-3.5 py-3 rounded-xl text-sm font-bold flex items-center">
                            +263
                          </div>
                          <input
                            type="tel"
                            value={whatsAppNumber}
                            onChange={(e) => setWhatsAppNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="771234567"
                            className="flex-1 bg-[#151515] text-white border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C6FF00] transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleIPaid}
                        disabled={!whatsAppNumber || submittingPayment}
                        className={`w-full py-4 rounded-full font-black text-sm flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer ${
                          whatsAppNumber && !submittingPayment 
                            ? 'bg-[#C6FF00] text-[#0B0B0B] hover:opacity-90' 
                            : 'bg-[#1A1A1A] text-[#A1A1AA] pointer-events-none'
                        }`}
                      >
                        {submittingPayment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#0B0B0B] border-t-transparent rounded-full animate-spin" />
                            Recording payment...
                          </>
                        ) : (
                          'I Paid →'
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6">
                      
                      {/* WAITING STATE BLOCK */}
                      <div className="text-center p-5 bg-[#151515] border border-[#2A2A2A] rounded-2xl">
                        <span className="text-5xl block animate-pulse">⏳</span>
                        <h4 className="text-white font-bold text-lg mt-3">
                          Payment submitted!
                        </h4>
                        <p className="text-[#A1A1AA] text-xs leading-relaxed mt-2.5 max-w-[260px] mx-auto">
                          We're verifying your payment. Your unlock code will arrive on WhatsApp within 2-4 hours.
                        </p>
                      </div>

                      {/* SECURE CODE FORM */}
                      <div className="mt-7">
                        <span className="text-[#A1A1AA] text-[13px] font-bold block text-center mb-3">
                          Already have a code?
                        </span>

                        {/* 6 key sequence textboxes */}
                        <div className="flex justify-center gap-2 select-none mb-4">
                          {otpCode.map((digit, i) => (
                            <input
                              key={'key-' + i}
                              type="text"
                              value={digit}
                              ref={(el) => { otpInputRefs.current[i] = el; }}
                              onChange={(e) => handleOtpBoxChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpBoxKeyDown(i, e)}
                              maxLength={1}
                              className="w-[48px] h-[58px] bg-[#151515] border-1.5 focus:border-[#C6FF00] border-[#2A2A2A] rounded-xl text-center font-bold text-2xl text-[#C6FF00] focus:outline-none transition-colors"
                            />
                          ))}
                        </div>

                        <button
                          onClick={verifyCode}
                          disabled={otpCode.some(c => !c) || submittingPayment}
                          className={`w-full py-3.5 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                            !otpCode.some(c => !c) && !submittingPayment
                              ? 'bg-[#C6FF00] text-black hover:opacity-90'
                              : 'bg-[#1A1A1A] text-[#A1A1AA] pointer-events-none'
                          }`}
                        >
                          {submittingPayment ? (
                            <>
                              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Unlock Shop →'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* FIXED BUTTON AT THE VERY BOTTOM AT ONETIME */}
      {paywallScreen < 4 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0B0B0B] z-30">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => {
                if (paywallScreen === 1) setPaywallScreen(2);
                else if (paywallScreen === 2) setPaywallScreen(3);
                else if (paywallScreen === 3) setPaywallScreen(4);
              }}
              className="w-full bg-[#C6FF00] text-[#0B0B0B] font-black text-sm h-[54px] rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {paywallScreen === 1 ? 'Get Started →' : paywallScreen === 2 ? 'Got it →' : 'Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* SIGN UP CONFIRM BUTTON FIXED FOOTER FOR SCREEN 4 */}
      {paywallScreen === 4 && paywallMode === 'signup' && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0B0B0B] z-30 border-t border-[#151515]">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleSignUpSubmit}
              disabled={
                signupUsername.length < 3 || 
                !usernameAvailable || 
                signupPassword.length < 6 || 
                signupPassword !== signupConfirm || 
                !signupEmail.includes('@') || 
                signingUp
              }
              className={`w-full font-black text-sm h-[54px] rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                signupUsername.length >= 3 && 
                usernameAvailable && 
                signupPassword.length >= 6 && 
                signupPassword === signupConfirm && 
                signupEmail.includes('@') && 
                !signingUp
                  ? 'bg-[#C6FF00] text-black hover:opacity-90'
                  : 'bg-[#1A1A1A] text-[#A1A1AA] pointer-events-none'
              }`}
            >
              {signingUp ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Activate Free Trial →'
              )}
            </button>
          </div>
        </div>
      )}


      {/* RETURNING MERCHANT SIGN IN BOTTOM SHEET */}
      <AnimatePresence>
        {showSignIn && (
          <>
            {/* Backdrop cover overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSignIn(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Bottom Sheet wrapper */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-[#151515] border-t border-[#2A2A2A] rounded-t-[24px] z-50 p-6 pb-12 max-w-md mx-auto"
            >
              {/* Dismiss handle bar */}
              <div className="flex justify-center mb-6">
                <div className="w-12 h-1 bg-[#2A2A2A] rounded-full" />
              </div>

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-black text-2xl">Welcome back 👋</h3>
                <button
                  type="button"
                  onClick={() => setShowSignIn(false)}
                  className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center text-[#A1A1AA]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label className="text-[#A1A1AA] text-[13px] font-bold block mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#0B0B0B] text-white border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C6FF00] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#A1A1AA] text-[13px] font-bold block mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0B0B0B] text-white border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C6FF00] transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={signingIn}
                  className="w-full bg-[#C6FF00] text-[#0B0B0B] font-black text-sm h-[52px] rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer mt-6"
                >
                  {signingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Sign in...
                    </>
                  ) : (
                    'Sign In →'
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

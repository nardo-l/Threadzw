import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Check, Lock, Smartphone, 
  AlertCircle, Clock, ArrowRight, Eye, EyeOff, X, HelpCircle, AlertTriangle,
  Gift, Lightbulb, CreditCard, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const generateSlug = (shopName: string): string => {
  return shopName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .join('')
    .replace(/-+/g, '-');
};

export const generateUniqueSlug = async (shopName: string): Promise<string> => {
  const baseSlug = generateSlug(shopName);
  
  const { data } = await supabase
    .from('shops')
    .select('id, slug')
    .eq('slug', baseSlug)
    .maybeSingle();
  
  if (!data || (data.id && String(data.id).startsWith('local-'))) {
    return baseSlug;
  }
  
  let counter = 2;
  while (counter < 8) { // Prevent infinite loop in local fallback/sandbox mode
    const newSlug = `${baseSlug}${counter}`;
    const { data: existing } = await supabase
      .from('shops')
      .select('id, slug')
      .eq('slug', newSlug)
      .maybeSingle();
    
    if (!existing || (existing.id && String(existing.id).startsWith('local-'))) return newSlug;
    counter++;
  }
  return `${baseSlug}${Math.floor(1000 + Math.random() * 9000)}`;
};

interface PaywallFlowProps {
  paywallScreen: number;
  setPaywallScreen: React.Dispatch<React.SetStateAction<number>>;
  paywallMode: 'signup' | 'payment';
  setPaywallMode: React.Dispatch<React.SetStateAction<'signup' | 'payment'>>;
  myShop: any;
  setMyShop: (shop: any) => void;
  setAppStage: (stage: any) => void;
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
  const [fullName, setFullName] = useState('');
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

  const [currentSessionUser, setCurrentSessionUser] = useState<any>(null);

  useEffect(() => {
    isMounted.current = true;
    
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted.current && session?.user) {
        setCurrentSessionUser(session.user);
        setFullName(session.user.user_metadata?.username || '');
        setSignupEmail(session.user.email || '');
      }
    };
    checkUserSession();

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
    if (!signupUsername.trim()) {
      toast.error('Please enter a username handle.');
      return;
    }
    if (signupUsername.length < 3) {
      toast.error('Username must be at least 3 characters.');
      return;
    }
    if (usernameAvailable === false) {
      toast.error('This handle is already taken.');
      return;
    }
    if (!fullName.trim()) {
      toast.error('Please enter your full name.');
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
      const usernameHandle = signupUsername.trim().toLowerCase();
      let activeUserId = '';

      // 1. Sign up user inside Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        options: {
          data: {
            username: usernameHandle,
            display_name: fullName.trim(),
            handle: usernameHandle
          }
        }
      });

      if (signUpError) {
        // Fallback to sign-in if the user already exists in Supabase
        if (signUpError.message?.toLowerCase().includes('already registered') || signUpError.message?.toLowerCase().includes('already exists')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: signupEmail.trim().toLowerCase(),
            password: signupPassword,
          });

          if (signInError) {
            throw new Error('Email is already registered. Please check your credentials and try again.');
          }
          activeUserId = signInData.user?.id || '';
        } else {
          throw signUpError;
        }
      } else {
        activeUserId = signUpData.user?.id || '';
      }

      if (!activeUserId) {
        throw new Error('Unable to establish user session ID.');
      }

      // 2. Initialize developer database Profile relation
      await supabase.from('profiles').upsert({
        id: activeUserId,
        display_name: fullName.trim(),
        email: signupEmail.trim().toLowerCase(),
        whatsapp_number: '0789113734',
        onboarding_complete: false // Trigger overlay on dashboard
      }, { onConflict: 'id' });

      // 3. Connect and INSERT standard shop config
      const now = new Date();
      const trialEnds = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Check if user already created a shop during the onboarding flow
      const { data: existingShop } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', activeUserId)
        .maybeSingle();

      const chosenShopName = shopData?.name || `${fullName.trim()}'s Shop`;
      const generatedSlug = await generateUniqueSlug(chosenShopName);

      const shopPayload = {
        owner_id: activeUserId,
        name: chosenShopName,
        handle: usernameHandle,
        slug: existingShop?.slug || generatedSlug,
        categories: shopData?.category ? [shopData.category] : ['Clothing'],
        location: shopData?.town || 'Harare (Online)',
        whatsapp: shopData?.whatsapp || '0789113734',
        instagram: shopData?.instagram || null,
        description: shopData?.description || 'Brand new ThreadZW clothing brand',
        logo_url: null,
        banner_url: null,
        plan: 'shop',
        subscription_status: 'trial',
        trial_started_at: now.toISOString(),
        trial_ends_at: trialEnds.toISOString(),
        is_live: true
      };

      const { error: shopError } = await supabase.from('shops').upsert(shopPayload, { onConflict: 'owner_id' });

      if (shopError) {
        console.error('Shop insertion error:', shopError);
        throw shopError;
      }

      // 4. Record onboarding complete states locally
      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.setItem('threadzw_onboarding_complete', 'true');
      localStorage.removeItem('threadzw_onboarding_step');
      localStorage.removeItem('threadzw_onboarding_states');
      localStorage.setItem('threadzw_owner_name', fullName.trim());
      localStorage.setItem('threadzw_signup_email', signupEmail.trim().toLowerCase());

      toast.success('Registration successful! Trial activated. 🚀');
      
      // Move to dashboard
      setAppStage('dashboard');
    } catch (err: any) {
      console.error('SignUp Submit Error:', err);
      toast.error(err.message || 'Error occurred during secure signup.');
    } finally {
      setSigningUp(false);
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
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: signinEmail.trim().toLowerCase(),
        password: signinPassword,
      });

      if (signInError) throw signInError;

      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.setItem('threadzw_onboarding_complete', 'true');
      toast.success(`Welcome back!`);
      setShowSignIn(false);
      setAppStage('dashboard');
    } catch (err: any) {
      console.error('SignIn Error:', err);
      toast.error(err.message || 'Invalid email or password.');
    } finally {
      setSigningIn(false);
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
            amount: 5,
            status: 'pending',
            receiving_number: '0789113734'
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
      {paywallScreen >= 1 && paywallMode === 'signup' && (
        <button
          onClick={() => {
            if (paywallScreen === 1) {
              setAppStage('landing');
            } else {
              setPaywallScreen(prev => prev - 1);
            }
          }}
          className="fixed top-14 left-5 z-40 text-[#A1A1AA] hover:text-white transition-colors duration-200"
          aria-label="Back to previous screen"
        >
          <ArrowLeft className="w-5.5 h-5.5" />
        </button>
      )}

      {/* CONTENT FLUID SCROLL WRAPPER */}
      <div className="w-full max-w-md mx-auto pt-24 px-6 pb-36 flex-1 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: ACTIVATE TRIAL */}
          {paywallScreen === 1 && (
            <motion.div
              key="screen-p1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center text-center justify-center min-h-[50vh]"
            >
              <div className="flex justify-center mt-4">
                <div className="relative">
                  <span className="leading-none animate-bounce flex items-center justify-center p-4 bg-[#c8ff00]/10 rounded-3xl border border-[#c8ff00]/20"><Gift size={44} className="text-[#c8ff00]" /></span>
                  <div className="absolute inset-0 bg-[#c8ff00]/25 blur-3xl rounded-full scale-125 z-[-1]" />
                </div>
              </div>

              <h2 className="text-white font-black text-4xl tracking-tight text-center mt-8 leading-[1.1]">
                Your shop is ready.
              </h2>
              
              <p className="text-[#A1A1AA] text-base leading-relaxed text-center mt-4 max-w-[300px] mx-auto">
                Start your 3-day free trial. No payment now.
              </p>
            </motion.div>
          )}

          {/* SCREEN 2: HOW IT WORKS */}
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
                <span className="leading-none flex items-center justify-center w-16 h-16 mx-auto bg-[#c8ff00]/10 rounded-full border border-[#c8ff00]/20"><Lightbulb size={28} className="text-[#c8ff00]" /></span>
              </div>

              <h2 className="text-white font-black text-4xl tracking-tight text-center mt-6">
                Here's how ThreadZW works
              </h2>

              <div className="space-y-3 mt-8">
                {[
                  { icon: Gift, title: "3 days free", desc: "Explore everything. No payment now." },
                  { icon: Zap, title: "Then $5/month", desc: "Cheaper than a single flyer print run." },
                  { icon: Smartphone, title: "Pay via EcoCash or InnBucks", desc: "No card needed. Ever." }
                ].map((card, idx) => {
                  const IconComponent = card.icon;
                  return (
                    <div key={idx} className="bg-[#111] border border-white/5 rounded-[10px] p-5 flex gap-4 items-start">
                      <IconComponent size={24} className="text-[#c8ff00] shrink-0" />
                      <div className="text-left">
                        <h4 className="text-white font-black text-base leading-tight">{card.title}</h4>
                        <p className="text-[#A1A1AA] text-sm mt-1 leading-normal">{card.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: PAYMENT INSTRUCTIONS */}
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
                <span className="leading-none flex items-center justify-center w-16 h-16 mx-auto bg-[#c8ff00]/10 rounded-full border border-[#c8ff00]/20"><CreditCard size={28} className="text-[#c8ff00]" /></span>
              </div>

              <h2 className="text-white font-black text-3.5xl tracking-tight text-center mt-6 leading-tight">
                After your trial — how to pay
              </h2>

              {/* VERTICAL CONNECTING STEPS PREVIEW CONTAINER */}
              <div className="relative mt-8 select-none">
                {/* Connecting Line background */}
                <div className="absolute left-[22px] top-4 bottom-4 w-[1px] bg-[#222]" />

                <div className="space-y-6">
                  {[
                    { num: "1", title: "Send $5 to EcoCash +263789113734", detail: "Or InnBucks using the same number" },
                    { num: "2", title: "Submit Transaction Claim Form", detail: "Log your payment in the application" },
                    { num: "3", title: "Automated WhatsApp Link", detail: "Submit details in one-click to the team" },
                    { num: "4", title: "Direct Admin Activation", detail: "System unlocks your shopfront dynamically" }
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-4 items-start relative z-10">
                      <div className="w-11 h-11 bg-[#111] border border-white/5 rounded-full flex items-[#0B0B0B] items-center justify-center flex-shrink-0 text-[#c8ff00] font-black text-base">
                        {step.num}
                      </div>
                      <div className="pt-1 text-left">
                        <h4 className="text-white font-black text-base leading-snug">{step.title}</h4>
                        <p className="text-[#A1A1AA] text-[13px] mt-1 leading-relaxed">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[#A1A1AA] text-sm text-center font-extrabold uppercase tracking-wider mt-8 leading-relaxed">
                "No auto-charges. You stay in control."
              </p>
            </motion.div>
          )}

          {/* SCREEN 4: CREATE ACCOUNT */}
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
                currentSessionUser ? (
                  <>
                    <div className="text-center mt-4">
                      <span className="leading-none flex items-center justify-center w-16 h-16 mx-auto bg-green-500/10 rounded-full border border-green-500/20"><Check size={32} className="text-green-400" /></span>
                    </div>

                    <h2 className="text-white font-black text-3.5xl tracking-tight leading-tight mt-6 text-center animate-pulse">
                      Your Account is Secured
                    </h2>
                    
                    <p className="text-[#A1A1AA] text-base leading-relaxed mt-4 mb-6 text-center max-w-[300px] mx-auto">
                      Logged in as <span className="text-[#c8ff00] font-bold">{signupEmail || currentSessionUser.email}</span>. Tap below to activate your 3-day trial and launch your clothing brand!
                    </p>

                    <div className="bg-[#111] border border-white/5 rounded-[10px] p-5 mt-4 flex gap-4 items-start">
                      <Zap size={24} className="text-[#c8ff00] shrink-0 mt-0.5" />
                      <div className="text-left">
                        <h4 className="text-white font-black text-base leading-tight">Ready to Sell</h4>
                        <p className="text-[#A1A1AA] text-sm mt-1 leading-normal">Your custom store domain is locked and live database records are ready.</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-white font-black text-3.5xl tracking-tight leading-tight mt-2 text-center">
                      Create your account
                    </h2>
                    
                    <p className="text-[#A1A1AA] text-base leading-relaxed mt-3 mb-6 text-center">
                      Starting your 3-day free trial. No payment now.
                    </p>

                    {/* FORM FIELDS */}
                    <div className="space-y-4">
                      {/* Username Setup with Handle availability check */}
                      <div>
                        <label className="text-[#A1A1AA] text-xs font-bold block mb-1.5">
                          Username (Shop handle link)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">@</span>
                          <input
                            type="text"
                            value={signupUsername}
                            onChange={handleUsernameChange}
                            placeholder="yourbrand"
                            className="w-full bg-[#111] text-white border border-[#2a2a2a] focus:border-[#c8ff00] rounded-[10px] pl-8 pr-4.5 py-3.5 text-sm focus:outline-none transition-colors"
                          />
                        </div>
                        {signupUsername.length >= 3 && (
                          <div className="mt-1.5 text-xs text-left">
                            {checkingUsername ? (
                              <span className="text-[#A1A1AA]">Checking availability...</span>
                            ) : usernameAvailable === true ? (
                              <span className="text-[#22C55E]">✓ @{signupUsername} is available!</span>
                            ) : usernameAvailable === false ? (
                              <span className="text-[#EF4444]">✗ @{signupUsername} is taken</span>
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* Full Name Setup */}
                      <div>
                        <label className="text-[#A1A1AA] text-xs font-bold block mb-1.5">
                          Full name
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-[#111] text-white border border-[#2a2a2a] rounded-[10px] px-4.5 py-3.5 text-sm focus:outline-none focus:border-[#c8ff00] transition-colors"
                        />
                      </div>

                      {/* Email setup */}
                      <div>
                        <label className="text-[#A1A1AA] text-xs font-bold block mb-1.5">
                          Email address
                        </label>
                        <input
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full bg-[#111] text-white border border-[#2a2a2a] rounded-[10px] px-4.5 py-3.5 text-sm focus:outline-none focus:border-[#c8ff00] transition-colors"
                        />
                      </div>

                      {/* Password setup */}
                      <div>
                        <label className="text-[#A1A1AA] text-xs font-bold block mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#111] text-white border border-[#2a2a2a] focus:border-[#c8ff00] rounded-[10px] px-4.5 py-3.5 text-sm focus:outline-none transition-colors"
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
                        <label className="text-[#A1A1AA] text-xs font-bold block mb-1.5">
                          Confirm password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={signupConfirm}
                            onChange={(e) => setSignupConfirm(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full bg-[#111] text-white border rounded-[10px] px-4.5 py-3.5 text-sm focus:outline-none transition-colors ${
                              signupConfirm ? (signupPassword === signupConfirm ? 'border-[#22C55E]' : 'border-[#EF4444]') : 'border-[#2a2a2a]'
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
                          <div className="mt-1.5 text-xs text-left">
                            {signupPassword === signupConfirm ? (
                              <span className="text-[#22C55E]">✓ Passwords match</span>
                            ) : (
                              <span className="text-[#EF4444]">Passwords don't match</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NOTE BELOW FORM */}
                    <div className="bg-[#111] border border-white/5 rounded-[10px] p-4 mt-6 flex gap-3">
                      <span className="text-sm">🔒</span>
                      <p className="text-[#A1A1AA] text-xs leading-relaxed text-left">
                        By signing up you agree to our terms. Your 3-day trial starts immediately.
                      </p>
                    </div>

                    {/* SIGN-IN PROMPT */}
                    <div className="text-center mt-6">
                      <span className="text-[#A1A1AA] text-[13px]">
                        Already have an account?{' '}
                      </span>
                      <button
                        onClick={() => setShowSignIn(false)}
                        className="text-[#c8ff00] font-black text-[13px] hover:underline"
                      >
                        Sign in →
                      </button>
                    </div>
                  </>
                )
              ) : (
                <>
                  {/* EXPIRATION MODE BLOCK */}
                  {/* THREADZW PRICING: $5/month | 3-day trial — do not change without updating all instances */}
                  <h2 className="text-white font-black text-3xl tracking-tight leading-tight">
                    Continue for $5/month
                  </h2>
                  <p className="text-[#A1A1AA] text-sm mt-1 mb-4 leading-relaxed">
                    Your 3-day free trial has ended
                  </p>

                  <div className="flex items-baseline justify-start gap-1 pb-4 border-b border-[#1A1A1A]">
                    <span className="text-[#C6FF00] font-black text-4xl leading-none">$5</span>
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
                        0789 113 734
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
                        className={`w-full py-4 rounded-[10px] font-black text-sm flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer ${
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
                          'Pay $5 via EcoCash or InnBucks'
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
                          className={`w-full py-3.5 rounded-[10px] font-bold text-sm transition-all flex items-center justify-center gap-2 ${
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
              className="w-full bg-[#c8ff00] text-[#0B0B0B] font-black text-sm h-[54px] rounded-[10px] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {paywallScreen === 1 ? 'Activate Free Trial →' : 'Got it →'}
            </button>
          </div>
        </div>
      )}

      {/* SIGN UP CONFIRM BUTTON FIXED FOOTER FOR SCREEN 4 */}
      {paywallScreen === 4 && paywallMode === 'signup' && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0B0B0B] z-30 border-t border-[#151515]">
          <div className="max-w-md mx-auto mb-2">
            {currentSessionUser ? (
              <button
                onClick={async () => {
                  setSigningUp(true);
                  try {
                    // Update user profile table onboarding_complete to true
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user?.id) {
                      await supabase.from('profiles').update({
                        onboarding_complete: true
                      }).eq('id', session.user.id);
                    }
                    
                    // Mark onboarding complete in localStorage
                    localStorage.setItem('threadzw_onboarding_complete', 'true');
                    localStorage.removeItem('threadzw_onboarding_step');
                    localStorage.removeItem('threadzw_onboarding_states');
                    
                    toast.success('Welcome to ThreadZW! 🚀');
                    setAppStage('dashboard');
                  } catch (err) {
                    console.error('Failed to complete onboarding on paywall confirmation:', err);
                    setAppStage('dashboard');
                  } finally {
                    setSigningUp(false);
                  }
                }}
                disabled={signingUp}
                className="w-full bg-[#c8ff00] text-[#0B0B0B] font-black text-sm h-[54px] rounded-[10px] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {signingUp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Launching shop...
                  </>
                ) : (
                  'Activate Free Trial →'
                )}
              </button>
            ) : (
              <button
                onClick={handleSignUpSubmit}
                disabled={
                  !signupUsername.trim() ||
                  usernameAvailable === false ||
                  !fullName.trim() ||
                  signupPassword.length < 6 ||
                  signupPassword !== signupConfirm ||
                  !signupEmail.includes('@') ||
                  signingUp
                }
                className={`w-full font-black text-sm h-[54px] rounded-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  signupUsername.trim() &&
                  usernameAvailable !== false &&
                  fullName.trim() &&
                  signupPassword.length >= 6 &&
                  signupPassword === signupConfirm &&
                  signupEmail.includes('@') &&
                  !signingUp
                    ? 'bg-[#c8ff00] text-black hover:opacity-90'
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
            )}
            <p className="text-[#A1A1AA] text-[10px] mt-2 text-center">
              By signing up you agree to our terms.
            </p>
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
                    className="w-full bg-[#0B0B0B] text-white border border-[#2A2A2A] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:border-[#c8ff00] transition-colors"
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
                    className="w-full bg-[#0B0B0B] text-white border border-[#2A2A2A] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:border-[#c8ff00] transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={signingIn}
                  className="w-full bg-[#c8ff00] text-[#0B0B0B] font-black text-sm h-[52px] rounded-[10px] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer mt-6"
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

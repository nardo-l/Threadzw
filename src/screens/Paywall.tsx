import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Store, 
  Box, 
  BarChart3, 
  Clock, 
  ArrowLeft, 
  Lock, 
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';

type ViewState = 'trial' | 'expired_plan' | 'expired_payment' | 'expired_code';

export const Paywall: React.FC = () => {
  const navigate = useNavigate();
  const { paywallType } = useSubscription();
  
  // Navigation & Sub-states
  const [viewState, setViewState] = useState<ViewState>(paywallType === 'trial' ? 'trial' : 'expired_plan');
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [showNotifySheet, setShowNotifySheet] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Logic
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const isOtpComplete = otp.every(v => v !== '');

  // Trial Activation Action
  const handleActivateTrial = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/shop-centre');
    }, 1500);
  };

  // Code Activation Action
  const handleActivateShop = () => {
    setIsActivating(true);
    setTimeout(() => {
      setIsActivating(false);
      setShowSuccessOverlay(true);
    }, 1500);
  };

  // Success Overlay Action
  const handleGoToShopCentre = () => {
    setShowSuccessOverlay(false);
    navigate('/shop-centre');
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const renderStepIndicator = () => {
    const steps = [
      { id: 'expired_plan', label: 'Plan' },
      { id: 'expired_payment', label: 'Payment' },
      { id: 'expired_code', label: 'Activate' }
    ];
    
    const currentIndex = steps.findIndex(s => s.id === viewState);

    return (
      <div className="flex items-center justify-center gap-4 mb-8">
        {steps.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isActive = i === currentIndex;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  isCompleted 
                    ? 'bg-[#FF2D78] border-[#FF2D78]' 
                    : isActive 
                      ? 'border-[#FF2D78]' 
                      : 'border-[#333333]'
                }`}>
                  {isCompleted ? <Check size={14} className="text-white" strokeWidth={3} /> : (
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#FF2D78]' : 'bg-[#333333]'}`} />
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive || isCompleted ? 'text-[#FF2D78]' : 'text-[#888888]'}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="w-8 h-[1px] bg-[#333333] mb-4" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ==========================================
  // VIEW: TRIAL ACTIVATION (STATE 1)
  // ==========================================
  const renderTrialActivation = () => (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar">
      <div className="flex flex-col items-center mt-8 mb-10">
        <h1 className="text-[#FF2D78] font-pacifico text-3xl mb-8">thread</h1>
        <div className="w-16 h-16 bg-[#1a1a1a] rounded-[16px] flex items-center justify-center text-3xl mb-6 shadow-xl">
          🏪
        </div>
        <h2 className="text-white text-[24px] font-bold text-center mb-2">20 Days Free</h2>
        <p className="text-[#888888] text-[14px] text-center max-w-[280px]">
          After that it's just $6/month to keep your shop live. No payment needed now.
        </p>
      </div>

      <div className="bg-gradient-to-br from-[#9B27AF1E] to-[#FF2D781E] border border-[#FF2D7840] rounded-[16px] p-5 mb-8">
        <div className="flex flex-col gap-6">
          <div className="flex gap-4">
            <Check className="text-[#FF2D78] flex-shrink-0" size={20} />
            <div>
              <p className="text-white font-bold text-[14px] leading-tight mb-1">List 3 products</p>
              <p className="text-[#888888] text-[13px]">Add up to 3 products during your free trial.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Check className="text-[#FF2D78] flex-shrink-0" size={20} />
            <div>
              <p className="text-white font-bold text-[14px] leading-tight mb-1">WhatsApp enquiries</p>
              <p className="text-[#888888] text-[13px]">Direct connection with buyers from day one.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-8">
        <label className="text-white text-[14px] font-bold">Your WhatsApp Number</label>
        <input 
          type="tel"
          value={whatsAppNumber}
          onChange={(e) => setWhatsAppNumber(e.target.value)}
          placeholder="+263 7X XXX XXXX"
          className="w-full h-[52px] bg-[#1a1a1a] border border-[#333333] rounded-[12px] px-4 text-white text-[16px] outline-none focus:border-[#FF2D78] transition-all"
        />
        <p className="text-[#888888] text-[11px] mt-1 ml-1">We'll send your shop updates and reminders here.</p>
      </div>

      <button 
        disabled={!whatsAppNumber || isLoading}
        onClick={handleActivateTrial}
        className={`w-full h-[56px] rounded-full font-bold text-[16px] flex items-center justify-center transition-all active:scale-[0.98] ${
          whatsAppNumber && !isLoading
            ? 'bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white'
            : 'bg-[#333333] text-[#666666]'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-3">
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             <span>Activating...</span>
          </div>
        ) : 'Start Free Trial'}
      </button>

      <div className="h-20" />
    </div>
  );

  // ==========================================
  // VIEW: EXPIRED (STATE 2)
  // ==========================================
  const renderExpiredPlan = () => (
    <div className="flex-1 flex flex-col p-0 overflow-y-auto no-scrollbar">
      <div className="flex flex-col items-center mt-5 mb-5">
        <h1 className="text-[#FF2D78] font-pacifico text-2xl">thread</h1>
      </div>

      {/* Status Card */}
      <div className="mx-5 bg-[#EF444414] border border-[#EF444433] rounded-[14px] p-4 flex flex-col items-center mb-5">
        <span className="text-[#EF4444] text-[13px] font-bold">⏰ Your free trial has ended</span>
        <p className="text-[#888888] text-[13px] mt-1.5 text-center">Keep your shop live for just $6 a month.</p>
      </div>

      {/* Plan Card */}
      <div className="mx-5 mb-5 bg-gradient-to-br from-[#9B27AF1A] to-[#FF2D781A] border-1.5 border-[#FF2D78] rounded-[20px] p-6 flex flex-col items-center">
        <span className="text-white text-[12px] font-bold uppercase tracking-widest">THREAD ZW SHOP</span>
        
        <div className="flex flex-col items-center mt-3">
          <span className="text-white text-[52px] font-bold leading-none">$6</span>
          <span className="text-[#888888] text-[16px] mt-1">/month</span>
        </div>

        <div className="w-full h-[1px] bg-[#FF2D7833] my-4" />

        <div className="flex flex-col gap-3 items-center">
          {[
            'Unlimited products',
            'Verified Profile Badge',
            'Shop profile page',
            'WhatsApp enquiries',
            'New drop stories',
            'Best Dresser entry',
            'Full analytics dashboard',
            '6-character access code'
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check size={14} className="text-[#FF2D78]" strokeWidth={3} />
              <span className="text-white text-[13px]">{feature}</span>
            </div>
          ))}
        </div>

        <p className="text-[#888888] text-[11px] text-center mt-3">Billed monthly. Cancel anytime by not renewing.</p>
      </div>

      {/* Payment Instructions */}
      <div className="mx-5 mb-5 bg-[#111111] border border-[#222222] rounded-[16px] p-5">
        <h3 className="text-white text-[15px] font-bold mb-4">How to Pay</h3>
        
        <div className="flex flex-col gap-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF2D78] flex items-center justify-center text-white text-xs font-bold">1</div>
            <div className="flex-1">
              <p className="text-white font-bold text-[14px]">Send $6</p>
              <p className="text-[#888888] text-[13px] mt-1">EcoCash or InnBucks to 0776223144. Use your WhatsApp number as reference.</p>
              <div className="mt-2 bg-[#1a1a1a] rounded-[8px] p-2.5 flex justify-between items-center border border-white/5">
                <span className="text-[#888888] text-[13px]">Amount:</span>
                <span className="text-[#FF2D78] font-bold text-[16px]">$6</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF2D78] flex items-center justify-center text-white text-xs font-bold">2</div>
            <div className="flex-1">
              <p className="text-white font-bold text-[14px]">Enter Your Number</p>
              <p className="text-[#888888] text-[13px] mt-1">The WhatsApp number you used as reference.</p>
              <input 
                type="tel"
                value={whatsAppNumber}
                onChange={(e) => setWhatsAppNumber(e.target.value)}
                placeholder="+263 7X XXX XXXX"
                className="w-full mt-2.5 bg-[#0a0a0a] border border-[#222] rounded-[10px] p-3 text-white text-[15px] outline-none focus:border-[#FF2D78] transition-all"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF2D78] flex items-center justify-center text-white text-xs font-bold">3</div>
            <div className="flex-1">
              <p className="text-white font-bold text-[14px]">Receive Your Code</p>
              <p className="text-[#888888] text-[13px] mt-1">We verify and WhatsApp you a 6-character code within 2 hours. Enter it in Shop Centre to go live.</p>
              <div className="mt-1.5 inline-block bg-[#1a1a1a] px-2 py-1 rounded-[4px]">
                <span className="text-[#888888] text-[11px]">6-character code e.g. 4821ab</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-5">
        <button 
          disabled={!whatsAppNumber}
          onClick={() => setShowNotifySheet(true)}
          className={`w-full h-[56px] rounded-full font-bold text-[15px] uppercase flex items-center justify-center transition-all active:scale-[0.98] mb-4 ${
            whatsAppNumber ? 'bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white shadow-lg shadow-[#FF2D7820]' : 'bg-[#1a1a1a] text-[#555555]'
          }`}
        >
          I've Paid — Notify Admin
        </button>
      </div>

      <p className="text-[#888888] text-[11px] text-center pb-10">Only tap after sending payment.</p>
    </div>
  );

  // ==========================================
  // VIEW: EXPIRED CODE (STATE 3)
  // ==========================================
  const renderExpiredCode = () => (
    <div className="flex-1 flex flex-col p-6 items-center overflow-y-auto no-scrollbar">
      <h1 className="text-[#FF2D78] font-pacifico text-2xl mb-8 mt-4">thread</h1>
      
      <div className="w-16 h-16 bg-[#FF2D781A] rounded-full flex items-center justify-center text-[#FF2D78] mb-8">
        <Lock size={32} />
      </div>

      <h2 className="text-white text-[22px] font-bold text-center mb-2">Enter Your Access Code</h2>
      <p className="text-[#888888] text-[14px] text-center mb-10">Check WhatsApp for the 6-character code we sent you.</p>

      {/* 6-box OTP */}
      <div className="flex gap-2 justify-center mb-6">
        {otp.map((digit, i) => (
          <input 
            key={i}
            ref={el => { otpRefs.current[i] = el }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => {
              const val = e.target.value.toLowerCase();
              const newOtp = [...otp];
              newOtp[i] = val;
              setOtp(newOtp);
              if (val && i < 5) otpRefs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            className={`w-[44px] h-[52px] bg-[#1a1a1a] border-2 rounded-[10px] text-center text-[22px] font-bold text-white outline-none transition-all ${
              digit ? 'border-[#FF2D78]' : 'border-[#333333]'
            } focus:border-[#FF2D78]`}
          />
        ))}
      </div>

      <p className={`text-[12px] mb-12 ${isOtpComplete ? 'text-[#FF2D78] font-medium' : 'text-[#888888]'}`}>
        {isOtpComplete ? 'Ready to activate ✓' : 'Waiting for code...'}
      </p>

      <button 
        disabled={!isOtpComplete || isActivating}
        onClick={handleActivateShop}
        className={`w-full h-[56px] rounded-full font-bold text-[16px] flex items-center justify-center transition-all active:scale-[0.98] ${
          isOtpComplete && !isActivating ? 'bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white shadow-xl shadow-[#FF2D7820]' : 'bg-[#333333] text-[#666666]'
        }`}
      >
        {isActivating ? (
           <div className="flex items-center gap-3">
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             <span>Activating...</span>
          </div>
        ) : 'Activate My Shop'}
      </button>

      <button 
        onClick={() => window.open(`https://wa.me/263776223144?text=Hi, I need my Thread ZW access code. My number is: ${whatsAppNumber || 'None'}`, '_blank')}
        className="text-[#FF2D78] text-[13px] font-bold mt-8"
      >
        Didn't receive your code?
      </button>
    </div>
  );

  return (
    <div className={`${viewState === 'trial' ? 'relative flex-1' : 'fixed inset-0 z-[400] h-screen'} bg-[#000000] flex flex-col select-none`}>
      <AnimatePresence mode="wait">
        <motion.div 
          key={viewState}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          {viewState === 'trial' && renderTrialActivation()}
          {(viewState === 'expired_plan' || viewState === 'expired_payment') && renderExpiredPlan()}
          {viewState === 'expired_code' && renderExpiredCode()}
        </motion.div>
      </AnimatePresence>

      {/* Dev Testing Buttons */}
      <div className="fixed bottom-2 left-0 right-0 flex justify-center gap-4 z-[500] opacity-30 select-none pointer-events-none">
        <button onClick={() => setViewState('trial')} className="text-[10px] text-[#888888] pointer-events-auto">t1</button>
        <button onClick={() => setViewState('expired_plan')} className="text-[10px] text-[#888888] pointer-events-auto">t2a</button>
        <button onClick={() => setViewState('expired_payment')} className="text-[10px] text-[#888888] pointer-events-auto">t2b</button>
        <button onClick={() => setViewState('expired_code')} className="text-[10px] text-[#888888] pointer-events-auto">t2c</button>
      </div>

      {/* Bottom Sheet for Payment Notification */}
      <AnimatePresence>
        {showNotifySheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifySheet(false)}
              className="fixed inset-0 bg-black/80 z-[600]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#111111] rounded-t-[32px] p-8 z-[601] border-t border-[#222222]"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-full bg-[#FF2D781A] flex items-center justify-center border border-[#FF2D7833]">
                  <CheckCircle2 size={32} className="text-[#FF2D78]" />
                </div>
                <div>
                  <h4 className="text-white text-xl font-bold mb-2">We've been notified!</h4>
                  <p className="text-[#888888] text-[14px]">
                    Your payment is being verified. Check WhatsApp for your 6-digit code within 2 hours.
                  </p>
                </div>
                <div className="bg-[#1a1a1a] px-4 py-2 rounded-full border border-white/5">
                  <span className="text-[#888888] text-[12px]">Sent to: <span className="text-white font-mono">{whatsAppNumber}</span></span>
                </div>
                <button 
                  onClick={() => {
                    setShowNotifySheet(false);
                    setViewState('expired_code');
                  }}
                  className="w-full h-[56px] bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white rounded-full font-bold text-[16px] shadow-lg shadow-[#FF2D7820]"
                >
                  Enter My Code →
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Overlay for State 2 */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black z-[700] flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
              className="w-24 h-24 bg-[#FF2D78] rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-[#FF2D784D]"
            >
              <Check size={48} className="text-white" strokeWidth={4} />
            </motion.div>
            
            <h1 className="text-3xl font-syne font-bold text-white mb-4">Your Shop is Live! 🎉</h1>
            <p className="text-[#888888] text-[14px] leading-relaxed mb-12 max-w-xs">
              Welcome to Thread ZW. Start listing your products and reach thousands of buyers.
            </p>

            <button 
              onClick={handleGoToShopCentre}
              className="w-full h-[56px] bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white rounded-full font-bold text-[16px] shadow-lg shadow-[#FF2D7820]"
            >
              Go to Shop Centre →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

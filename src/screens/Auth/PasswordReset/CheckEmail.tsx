import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../context/AuthContext';

export const CheckEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const email = location.state?.email || 'your email';
  
  const [countdown, setCountdown] = useState(60);
  const [resendCount, setResendCount] = useState(0);
  const [showResentToast, setShowResentToast] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0 || resendCount >= 3) return;
    
    setResendCount(prev => prev + 1);
    setCountdown(60);
    
    const { error } = await resetPassword(email);
    if (!error) {
      setShowResentToast(true);
      setTimeout(() => setShowResentToast(false), 3000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-[430px] mx-auto">
      <header className="p-6 h-16" />

      <main className="flex-1 flex flex-col px-8 pt-12 gap-12">
        <div className="flex flex-col items-center gap-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="w-[72px] h-[72px] rounded-2xl bg-elevated border-2 border-primary flex items-center justify-center text-3xl shadow-xl shadow-primary/10"
          >
            <Mail size={32} className="text-primary" />
          </motion.div>

          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-3xl font-pacifico text-white">Check your inbox</h1>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-sans text-muted leading-relaxed">
                We sent a password reset link to
              </p>
              <span className="text-base font-syne font-bold text-primary">{email}</span>
              <p className="text-sm font-sans text-muted leading-relaxed">
                It expires in 15 minutes.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-card border border-white/5 p-6 flex flex-col gap-6">
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">What to do next:</span>
          <div className="flex flex-col gap-4">
            {[
              "Open your email app",
              "Find the email from Thread ZW",
              "Tap the reset link",
              "Choose your new password"
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-mono text-primary font-bold">{i + 1}</span>
                </div>
                <span className="text-sm font-sans text-white">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <button 
            onClick={() => window.location.href = 'mailto:'}
            className="w-full py-4 border border-white/10 rounded-pill text-white font-syne font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Open Email App <ArrowRight size={18} />
          </button>

          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-sans text-muted">Didn't receive it?</p>
            {resendCount < 3 ? (
              <button 
                disabled={countdown > 0}
                onClick={handleResend}
                className={`text-sm font-sans font-bold transition-all ${
                  countdown > 0 ? 'text-muted' : 'text-primary active:scale-95'
                }`}
              >
                {countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend link'}
              </button>
            ) : (
              <span className="text-xs font-sans text-amber text-center">
                Maximum resends reached. Check your spam folder.
              </span>
            )}
            
            <AnimatePresence>
              {showResentToast && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-2 text-green text-[10px] font-mono uppercase tracking-widest mt-2"
                >
                  <Check size={12} /> Sent!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-auto pb-12 flex flex-col items-center gap-4">
          <p className="text-[10px] font-mono text-muted uppercase tracking-widest text-center">
            If you don't see it, check your spam or junk folder
          </p>
          <button 
            onClick={() => navigate('/forgot-password', { state: { email } })}
            className="text-xs font-mono text-muted uppercase tracking-widest underline underline-offset-4 decoration-white/10"
          >
            Wrong email?
          </button>
        </div>
      </main>
    </div>
  );
};

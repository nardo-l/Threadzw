import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

export const SetNewPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  // Strength calculation
  const getStrength = () => {
    if (newPassword.length === 0) return 0;
    if (newPassword.length < 6) return 1;
    const hasVariety = /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
    if (newPassword.length >= 8 && hasVariety) return 3;
    if (newPassword.length >= 6) return 2;
    return 1;
  };

  const strength = getStrength();
  const strengthLabel = ['None', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', 'bg-red', 'bg-amber', 'bg-green'][strength];
  const strengthTextColor = ['', 'text-red', 'text-amber', 'text-green'][strength];

  const requirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'At least one number', met: /[0-9]/.test(newPassword) },
    { label: 'At least one uppercase letter', met: /[A-Z]/.test(newPassword) },
  ];

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canUpdate = requirements.every(r => r.met) && passwordsMatch;

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidToken(true);
      }
    });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) return;

    setIsLoading(true);
    const { error } = await updatePassword(newPassword);
    setIsLoading(false);
    
    if (error) {
      alert(error.message || 'Could not update password. Please try again.');
    } else {
      setShowSuccess(true);
      setTimeout(() => navigate('/auth?mode=signin'), 3000);
    }
  };

  if (isExpired) {
    return (
      <div className="flex flex-col min-h-screen bg-background max-w-[430px] mx-auto p-8 items-center justify-center text-center gap-8">
        <div className="w-20 h-20 rounded-2xl bg-amber/10 flex items-center justify-center text-amber">
          <AlertTriangle size={40} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-syne font-bold text-white">Link expired</h1>
          <p className="text-sm text-muted leading-relaxed">
            This reset link has expired or already been used. Reset links are valid for 15 minutes.
          </p>
        </div>
        <div className="flex flex-col w-full gap-4">
          <button 
            onClick={() => navigate('/forgot-password')}
            className="w-full py-4 bg-primary text-white font-syne font-bold rounded-pill shadow-xl"
          >
            Request New Link →
          </button>
          <button 
            onClick={() => navigate('/auth?mode=signin')}
            className="text-xs font-mono text-muted uppercase tracking-widest"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-[430px] mx-auto relative overflow-hidden">
      <header className="p-6 flex justify-center">
        <h1 className="text-2xl font-pacifico text-primary">thread</h1>
      </header>

      <main className="flex-1 flex flex-col px-8 pt-8 gap-10">
        <div className="flex flex-col items-center gap-6">
          <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-primary to-purple flex items-center justify-center text-3xl shadow-xl shadow-primary/20">
            <ShieldCheck size={32} className="text-white" />
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-pacifico text-white">Set a new password</h1>
            <p className="text-sm font-sans text-muted leading-relaxed">
              Make it something strong that you haven't used before.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="flex flex-col gap-8">
          {/* New Password */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest px-1">New Password</label>
              <div className="relative">
                <input 
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-elevated border border-white/5 focus:border-primary rounded-input p-4 pr-12 text-white font-sans outline-none transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
                >
                  {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Strength Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <div className="flex gap-1 flex-1 h-1.5 mr-4">
                  {[1, 2, 3].map(seg => (
                    <div 
                      key={seg} 
                      className={`flex-1 rounded-full transition-all duration-500 ${
                        strength >= seg ? strengthColor : 'bg-white/5'
                      }`} 
                    />
                  ))}
                </div>
                <span className={`text-[10px] font-mono uppercase tracking-widest ${strengthTextColor}`}>
                  {strengthLabel}
                </span>
              </div>
              
              {/* Requirements */}
              <div className="flex flex-col gap-2 mt-2 px-1">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                      req.met ? 'bg-green border-green' : 'border-white/20'
                    }`}>
                      {req.met && <Check size={10} className="text-white" />}
                    </div>
                    <span className={`text-[10px] font-mono transition-all ${req.met ? 'text-green' : 'text-muted'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest px-1">Confirm New Password</label>
            <div className="relative">
              <input 
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-elevated border border-white/5 focus:border-primary rounded-input p-4 pr-12 text-white font-sans outline-none transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-2 px-1 mt-1">
                {passwordsMatch ? (
                  <>
                    <Check size={12} className="text-green" />
                    <span className="text-[10px] font-mono text-green uppercase tracking-widest">Passwords match</span>
                  </>
                ) : (
                  <>
                    <span className="text-red">✕</span>
                    <span className="text-[10px] font-mono text-red uppercase tracking-widest">Passwords don't match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <button 
            disabled={!canUpdate || isLoading}
            className="w-full py-4 bg-primary text-white font-syne font-bold rounded-pill shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password →'
            )}
          </button>
        </form>
      </main>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="absolute inset-0 z-50 bg-gradient-to-br from-primary to-purple flex flex-col items-center justify-center p-8 text-center gap-8"
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-4xl font-pacifico text-white">Password updated! ✓</h2>
              <p className="text-white/80 font-sans">You can now sign in with your new password.</p>
            </div>

            <button 
              onClick={() => navigate('/auth?mode=signin')}
              className="w-full py-4 bg-white text-black font-syne font-bold rounded-pill shadow-xl active:scale-95 transition-all"
            >
              Sign In Now →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

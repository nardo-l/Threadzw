import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../../context/AuthContext';

export const RequestReset: React.FC = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return;

    setIsLoading(true);
    setError(null);

    const { error } = await resetPassword(email);
    
    setIsLoading(false);
    if (error) {
      setError(error.message || 'Could not send reset link. Please try again.');
    } else {
      navigate('/forgot-password/sent', { state: { email } });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-[430px] mx-auto">
      <header className="p-6">
        <button onClick={() => navigate('/auth?mode=signin')} className="text-white">
          <ArrowLeft size={24} />
        </button>
      </header>

      <main className="flex-1 flex flex-col px-8 pt-12 gap-12">
        <div className="flex flex-col items-center gap-8">
          <div className="w-[72px] h-[72px] rounded-2xl bg-elevated border-2 border-primary flex items-center justify-center text-3xl shadow-xl shadow-primary/10">
            <Lock size={32} className="text-primary" />
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-3xl font-pacifico text-white">Forgot your password?</h1>
            <p className="text-sm font-sans text-muted leading-relaxed max-w-[280px]">
              No stress. Enter your email and we'll send you a reset link.
            </p>
          </div>
        </div>

        <form onSubmit={handleSendLink} className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest px-1">Email address</label>
            <input 
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (email && !isValidEmail(email)) {
                  setError('Please enter a valid email address');
                } else {
                  setError(null);
                }
              }}
              placeholder="you@example.com"
              className={`w-full bg-elevated border rounded-input p-4 text-white font-sans outline-none transition-all ${
                error ? 'border-red' : 'border-white/5 focus:border-primary'
              }`}
            />
            {error && (
              <motion.span 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-sans text-red px-1"
              >
                {error}
              </motion.span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <button 
              disabled={!isValidEmail(email) || isLoading}
              className="w-full py-4 bg-primary text-white font-syne font-bold rounded-pill shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link →'
              )}
            </button>
            
            <button 
              type="button"
              onClick={() => navigate('/auth?mode=signin')}
              className="text-xs font-mono text-muted uppercase tracking-widest text-center"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

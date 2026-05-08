import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useTheme } from '../App';

export const SignUp: React.FC = () => {
  const t = useTheme();
  const navigate = useNavigate();
  const { updateUserData } = useInventory();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // Save name to context for onboarding
    updateUserData({ name });
    // Navigate to verification
    navigate('/verify', { state: { email } });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-8 pt-20 gap-10 overflow-y-auto no-scrollbar min-h-screen"
      style={{ background: t.bg_primary }}
    >
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-6xl font-pacifico" style={{ color: t.accent }}>thread</h1>
        <p className="text-sm font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Zimbabwe's Closet</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-syne font-bold" style={{ color: t.text_primary }}>Create your account</h2>
          <p className="font-sans" style={{ color: t.text_tertiary }}>Join the flyest community in ZW.</p>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest ml-1" style={{ color: t.text_tertiary }}>Full Name</label>
            <input 
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Simba Makoni"
              className="border-2 rounded-2xl p-5 outline-none focus:border-primary transition-all"
              style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_primary, '--tw-ring-color': t.accent } as any}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest ml-1" style={{ color: t.text_tertiary }}>Email Address</label>
            <input 
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="border-2 rounded-2xl p-5 outline-none focus:border-primary transition-all"
              style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_primary, '--tw-ring-color': t.accent } as any}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest ml-1" style={{ color: t.text_tertiary }}>Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-2 rounded-2xl p-5 outline-none focus:border-primary transition-all"
                style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_primary, '--tw-ring-color': t.accent } as any}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 hover:text-white"
                style={{ color: t.text_tertiary }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest ml-1" style={{ color: t.text_tertiary }}>Confirm Password</label>
            <input 
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="border-2 rounded-2xl p-5 outline-none focus:border-primary transition-all"
              style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_primary, '--tw-ring-color': t.accent } as any}
            />
          </div>

          <button 
            type="submit"
            className="mt-4 py-5 text-white rounded-pill font-bold text-lg shadow-lg active:scale-95 transition-all"
            style={{ background: t.accent, boxShadow: t.shadow }}
          >
            Create Account
          </button>
        </form>
      </div>

      <p className="mt-auto text-center text-sm" style={{ color: t.text_tertiary }}>
        Already have an account? <Link to="/login" className="font-bold" style={{ color: t.accent }}>Sign in</Link>
      </p>
    </motion.div>
  );
};

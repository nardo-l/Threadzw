import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useTheme } from '../App';

export const Login: React.FC = () => {
  const t = useTheme();
  const navigate = useNavigate();
  const { setIsAuthenticated } = useInventory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login
    setIsAuthenticated(true);
    navigate('/');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-8 pt-20 gap-12 overflow-y-auto no-scrollbar min-h-screen"
      style={{ background: t.bg_primary }}
    >
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-6xl font-pacifico" style={{ color: t.accent }}>thread</h1>
        <p className="text-sm font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Zimbabwe's Closet</p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-syne font-bold" style={{ color: t.text_primary }}>Welcome back</h2>
          <p className="font-sans" style={{ color: t.text_tertiary }}>Sign in to continue your drip journey.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
            <Link 
              to="/forgot-password" 
              className="text-xs font-bold self-end mt-1 active:opacity-70 transition-opacity" 
              style={{ color: t.accent }}
            >
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit"
            className="mt-4 py-5 text-white rounded-pill font-bold text-lg shadow-lg active:scale-95 transition-all"
            style={{ background: t.accent, boxShadow: t.shadow }}
          >
            Sign In
          </button>
        </form>
      </div>

      <p className="mt-auto text-center text-sm" style={{ color: t.text_tertiary }}>
        Don't have an account? <Link to="/signup" className="font-bold" style={{ color: t.accent }}>Sign up</Link>
      </p>
    </motion.div>
  );
};

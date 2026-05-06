import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff, Chrome } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const Login: React.FC = () => {
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
      className="flex-1 flex flex-col p-8 pt-20 gap-12 overflow-y-auto no-scrollbar"
    >
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-6xl font-pacifico text-primary">thread</h1>
        <p className="text-sm font-mono text-muted uppercase tracking-widest">Zimbabwe's Closet</p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-syne font-bold text-white">Welcome back</h2>
          <p className="text-muted font-sans">Sign in to continue your drip journey.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-card border-2 border-white/5 rounded-2xl p-5 text-white outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-card border-2 border-white/5 rounded-2xl p-5 text-white outline-none focus:border-primary transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button type="button" className="text-xs font-bold text-primary self-end mt-1">
              Forgot password?
            </button>
          </div>

          <button 
            type="submit"
            className="mt-4 py-5 bg-primary text-white rounded-pill font-bold text-lg shadow-lg shadow-primary/30 active:scale-95 transition-all"
          >
            Sign In
          </button>
        </form>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs font-mono text-muted uppercase">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button 
          onClick={() => setIsAuthenticated(true)}
          className="py-5 border-2 border-white/5 rounded-pill font-bold text-white flex items-center justify-center gap-3 hover:bg-white/5 transition-all"
        >
          <Chrome size={20} /> Continue with Google
        </button>
      </div>

      <p className="mt-auto text-center text-sm text-muted">
        Don't have an account? <Link to="/signup" className="text-primary font-bold">Sign up</Link>
      </p>
    </motion.div>
  );
};

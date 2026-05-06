import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff, Chrome } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const SignUp: React.FC = () => {
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
      className="flex-1 flex flex-col p-8 pt-20 gap-10 overflow-y-auto no-scrollbar"
    >
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-6xl font-pacifico text-primary">thread</h1>
        <p className="text-sm font-mono text-muted uppercase tracking-widest">Zimbabwe's Closet</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-syne font-bold text-white">Create your account</h2>
          <p className="text-muted font-sans">Join the flyest community in ZW.</p>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest ml-1">Full Name</label>
            <input 
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Simba Makoni"
              className="bg-card border-2 border-white/5 rounded-2xl p-5 text-white outline-none focus:border-primary transition-all"
            />
          </div>

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
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest ml-1">Confirm Password</label>
            <input 
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-card border-2 border-white/5 rounded-2xl p-5 text-white outline-none focus:border-primary transition-all"
            />
          </div>

          <button 
            type="submit"
            className="mt-4 py-5 bg-primary text-white rounded-pill font-bold text-lg shadow-lg shadow-primary/30 active:scale-95 transition-all"
          >
            Create Account
          </button>
        </form>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs font-mono text-muted uppercase">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button 
          type="button"
          className="py-5 border-2 border-white/5 rounded-pill font-bold text-white flex items-center justify-center gap-3 hover:bg-white/5 transition-all"
        >
          <Chrome size={20} /> Continue with Google
        </button>
      </div>

      <p className="mt-auto text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="text-primary font-bold">Sign in</Link>
      </p>
    </motion.div>
  );
};

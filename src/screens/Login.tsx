import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
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
      className="flex-1 flex flex-col p-8 pt-20 gap-12 overflow-y-auto no-scrollbar min-h-screen bg-[#0d0d0d]"
    >
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-6xl font-syne font-black italic text-[#C6FF00] uppercase tracking-tighter">threadZW</h1>
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#555]">SaaS Infrastructure</p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-syne font-black uppercase text-white">Owner Access</h2>
          <p className="font-sans text-[#555]">Sign in to manage your storefront.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest ml-1 text-[#555]">Business Email</label>
            <input 
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@threadzw.com"
              className="border-2 rounded-2xl p-5 outline-none focus:border-[#C6FF00] transition-all bg-[#111] border-[#222] text-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest ml-1 text-[#555]">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-2 rounded-2xl p-5 outline-none focus:border-[#C6FF00] transition-all bg-[#111] border-[#222] text-white"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 hover:text-[#C6FF00] text-[#555]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <Link 
              to="/forgot-password" 
              className="text-[10px] font-black uppercase tracking-widest self-end mt-2 active:opacity-70 transition-opacity text-[#C6FF00]"
            >
              Forgot Key?
            </Link>
          </div>

          <button 
            type="submit"
            className="mt-4 py-5 text-black rounded-full font-black uppercase tracking-widest text-lg shadow-lg active:scale-95 transition-all bg-[#C6FF00] shadow-[#C6FF00]/10"
          >
            Terminal Login ✓
          </button>
        </form>
      </div>

      <p className="mt-auto text-center text-sm text-[#555]">
        Don't have an account? <Link to="/signup" className="font-black uppercase tracking-widest text-[11px] text-[#C6FF00] ml-2">Build Store →</Link>
      </p>
    </motion.div>
  );
};

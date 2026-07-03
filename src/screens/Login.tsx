// src/screens/Login.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Clear any stale local storage session states before every login attempt
    localStorage.removeItem('threadzw_logged_in');
    localStorage.removeItem('supabase_logged_in_user_id');
    localStorage.removeItem('threadzw_owner_email');
    localStorage.removeItem('threadzw_owner_name');

    setLoading(true);
    setLoginError(null);
    setShake(false);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      // Strict validation of the authenticated session
      if (error) {
        throw error;
      }
      
      if (!data?.session || !data?.session?.user) {
        throw new Error('No authenticated user session was returned from the authentication service.');
      }

      toast.success('Signed in successfully');
      if (data?.user?.id) {
        localStorage.setItem('supabase_logged_in_user_id', data.user.id);
        localStorage.setItem('threadzw_owner_email', email.trim().toLowerCase());
      }
      localStorage.setItem('threadzw_logged_in', 'true');
      navigate('/dashboard');
    } catch (err: any) {
      // Clear password field and do NOT print raw error to developer console or chat
      setPassword('');
      setShake(true);
      setLoginError('The email/username or password you entered is incorrect. Please try again.');
      
      // Ensure all local storage session state remains cleared on failure
      localStorage.removeItem('threadzw_logged_in');
      localStorage.removeItem('supabase_logged_in_user_id');
      localStorage.removeItem('threadzw_owner_email');
      localStorage.removeItem('threadzw_owner_name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100svh',
      background: '#000000',
      maxWidth: 430,
      margin: '0 auto',
      padding: '40px 24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#ffffff'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-1.5px',
          margin: '0 0 8px'
        }}>
          ThreadZW
        </h1>
        <p style={{
          fontSize: 14,
          color: '#a1a1aa',
          margin: 0
        }}>
          SaaS Business Platform
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#ffffff',
            margin: 0
          }}>
            Owner Login
          </h2>
          <p style={{
            fontSize: 14,
            color: '#a1a1aa',
            margin: 0
          }}>
            Sign in to manage your storefront
          </p>
        </div>

        {loginError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1.5px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '15px' }}>
              ❌ Incorrect email or password
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
              Please check your credentials and try again.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginError(null);
                  setShake(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#C6FF00',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Forgot Password?
              </button>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#a1a1aa'
            }}>
              Business Email or Username
            </label>
            <input 
              type="text"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@yourshop.com or username"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 15,
                border: loginError ? '1.5px solid #ef4444' : '1.5px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                outline: 'none',
                background: '#121215',
                color: '#ffffff'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#a1a1aa'
            }}>
              Password
            </label>
            <motion.div
              animate={shake ? { x: [-10, 10, -8, 8, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              style={{ position: 'relative' }}
            >
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  paddingRight: 44,
                  fontSize: 15,
                  border: loginError ? '1.5px solid #ef4444' : '1.5px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  outline: 'none',
                  background: '#121215',
                  color: '#ffffff'
                }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </motion.div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              marginTop: 12,
              padding: '15px',
              background: '#C6FF00',
              color: '#000000',
              border: 'none',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontSize: 14,
          color: '#a1a1aa',
          marginTop: 12
        }}>
          Don't have an account?{' '}
          <Link 
            to="/signup" 
            style={{
              fontWeight: 800,
              color: '#C6FF00',
              textDecoration: 'none'
            }}
          >
            Get Started Free
          </Link>
        </p>
      </div>
    </div>
  );
};

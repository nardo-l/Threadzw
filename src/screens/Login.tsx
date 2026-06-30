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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Clear any stale local storage session states to prevent false-positive mock fallbacks
    localStorage.removeItem('threadzw_logged_in');
    localStorage.removeItem('supabase_logged_in_user_id');
    localStorage.removeItem('threadzw_owner_email');
    localStorage.removeItem('threadzw_owner_name');

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;
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
      console.error('Sign in error:', err);
      // Ensure all local storage session state remains cleared on failure
      localStorage.removeItem('threadzw_logged_in');
      localStorage.removeItem('supabase_logged_in_user_id');
      localStorage.removeItem('threadzw_owner_email');
      localStorage.removeItem('threadzw_owner_name');
      toast.error(err.message || 'Invalid login credentials');
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
                border: '1.5px solid rgba(255, 255, 255, 0.1)',
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
            <div style={{ position: 'relative' }}>
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
                  border: '1.5px solid rgba(255, 255, 255, 0.1)',
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
            </div>
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

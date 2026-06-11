// src/screens/SignUp.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserData } = useInventory();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    // Save info and go directly to onboarding flow
    updateUserData({ name });
    navigate('/signup');
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
          Create Your Storefront
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
            Get Started Free
          </h2>
          <p style={{
            fontSize: 14,
            color: '#a1a1aa',
            margin: 0
          }}>
            Create your account to start building your shop
          </p>
        </div>

        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#a1a1aa'
            }}>
              Your Name
            </label>
            <input 
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Simba Makoni"
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
              Business Email
            </label>
            <input 
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@yourshop.com"
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
              Create Password
            </label>
            <input 
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
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

          <button 
            type="submit"
            style={{
              marginTop: 12,
              padding: '15px',
              background: '#c8ff00',
              color: '#000000',
              border: 'none',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 16,
              cursor: 'pointer',
              letterSpacing: '0.5px'
            }}
          >
            Create Account — Free
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontSize: 14,
          color: '#a1a1aa',
          marginTop: 12
        }}>
          Already have an account?{' '}
          <Link 
            to="/login" 
            style={{
              fontWeight: 800,
              color: '#c8ff00',
              textDecoration: 'none'
            }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

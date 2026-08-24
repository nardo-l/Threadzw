// src/screens/Settings.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Calendar, 
  Loader2, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';
import { toast } from 'sonner';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, profile, subscription, updateProfile, updatePassword, signOut } = useAuth();
  const { shop } = useShopContext();

  const [loading, setLoading] = useState(false);

  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  // Initialize fields
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setEmail(profile.email || user?.email || '');
    } else if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  // Check if shop payment is complete
  const isPaidShop = useMemo(() => {
    return shop?.payment_status === 'paid' && shop?.payment_required === false;
  }, [shop]);

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Display Name is required.');
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await updateProfile({
        display_name: displayName.trim()
      });

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error(err?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setUpdatingPass(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;

      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error updating password:', err);
      toast.error(err?.message || 'Failed to update password.');
    } finally {
      setUpdatingPass(false);
    }
  };

  // Handle Log Out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#25D366] selection:text-black pb-32">
      {/* Top Header */}
      <header className="max-w-md mx-auto px-6 pt-10 pb-6 flex items-center justify-between border-b border-zinc-100">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black tracking-tight text-black">Settings</h1>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            Account Management
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-6 pt-8 space-y-8">
        
        {/* SECTION 1: Profile Details */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <User size={16} className="text-black" />
            <h2 className="text-xs font-black uppercase tracking-wider text-black">Profile Details</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 text-left shadow-xs space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">Display Name</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="w-full h-11 bg-white border border-zinc-200 rounded-xl px-4 text-sm text-black focus:outline-none focus:border-[#25D366] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">Email Address (Read Only)</label>
              <input 
                type="email" 
                value={email}
                readOnly
                className="w-full h-11 bg-zinc-100/60 border border-zinc-200 rounded-xl px-4 text-sm text-zinc-500 cursor-not-allowed focus:outline-none"
              />
            </div>

            <button 
              type="submit"
              disabled={savingProfile}
              className="w-full h-11 bg-black hover:bg-zinc-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </form>
        </section>

        {/* SECTION 2: Change Password */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Lock size={16} className="text-black" />
            <h2 className="text-xs font-black uppercase tracking-wider text-black">Security</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 text-left shadow-xs space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-11 bg-white border border-zinc-200 rounded-xl px-4 text-sm text-black focus:outline-none focus:border-[#25D366] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full h-11 bg-white border border-zinc-200 rounded-xl px-4 text-sm text-black focus:outline-none focus:border-[#25D366] transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={updatingPass}
              className="w-full h-11 bg-black hover:bg-zinc-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {updatingPass ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </section>

        {/* SECTION 3: Subscription & Billing */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Calendar size={16} className="text-black" />
            <h2 className="text-xs font-black uppercase tracking-wider text-black">Subscription Plan</h2>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 text-left shadow-xs space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                <span className="text-sm font-black text-black uppercase">
                  Free plan active
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Your ThreadZW clothing storefront has unlimited products, 50 unique visits and 10 WhatsApp or directions interests for life. Premium keeps customer actions open beyond those thresholds.
              </p>
            </div>
          </div>
        </section>

        {/* REPLAY WALKTHROUGH */}
        <div className="pt-2">
          <button 
            onClick={() => {
              localStorage.setItem('threadzw_needs_walkthrough', 'true');
              navigate('/dashboard');
            }}
            className="w-full h-12 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-200"
          >
            <span>Replay Dashboard Walkthrough</span>
          </button>
        </div>

        {/* LOGOUT BUTTON */}
        <div className="pt-4">
          <button 
            onClick={handleSignOut}
            className="w-full h-12 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-100"
          >
            <LogOut size={14} />
            <span>Log Out Account</span>
          </button>
        </div>

      </main>

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
};

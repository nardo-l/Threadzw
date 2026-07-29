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
  AlertTriangle,
  Bell,
  Globe,
  Send,
  Smartphone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { 
  getNotificationPreferences, 
  saveNotificationPreferences, 
  deliverDailyShopSummary,
  registerWebPushSubscription,
  sendTestWebPushNotification
} from '../lib/dailyNotificationService';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, profile, subscription, updateProfile, updatePassword, signOut } = useAuth();

  const [loading, setLoading] = useState(false);

  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  // Notification Preference State
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(true);
  const [notifTimezone, setNotifTimezone] = useState('Africa/Harare');
  const [userShopId, setUserShopId] = useState<string | null>(null);
  const [testingNotif, setTestingNotif] = useState(false);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');

  // Initialize fields & notification preferences
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setEmail(profile.email || user?.email || '');
    } else if (user) {
      setEmail(user.email || '');
    }

    if (user?.id) {
      // Load user shop ID & notification preferences
      getNotificationPreferences(user.id).then(prefs => {
        setDailySummaryEnabled(prefs.daily_summary_enabled);
        setNotifTimezone(prefs.timezone || 'Africa/Harare');
      });

      supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.id) setUserShopId(data.id);
        });
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission as any);
    } else {
      setPushStatus('unsupported');
    }
  }, [profile, user]);

  // Handle Toggle Daily Summary
  const handleToggleDailySummary = async (enabled: boolean) => {
    setDailySummaryEnabled(enabled);
    if (user?.id) {
      await saveNotificationPreferences(user.id, enabled, notifTimezone, userShopId || undefined);
      if (enabled) {
        toast.success('Daily 19:00 summary enabled');
        // Register Web Push subscription if supported
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
          const pushRes = await registerWebPushSubscription(user.id, userShopId || undefined);
          if (pushRes.success) {
            setPushStatus('granted');
          }
        }
      } else {
        toast.success('Daily summary disabled');
      }
    }
  };

  // Handle Timezone Change
  const handleTimezoneChange = async (tz: string) => {
    setNotifTimezone(tz);
    if (user?.id) {
      await saveNotificationPreferences(user.id, dailySummaryEnabled, tz, userShopId || undefined);
      toast.success(`Timezone updated to ${tz}`);
    }
  };

  // Request Push Permission & Register Web Push
  const handleRequestPushPermission = async () => {
    if (!user?.id) {
      toast.error('User session required');
      return;
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      const res = await registerWebPushSubscription(user.id, userShopId || undefined);
      if (res.success) {
        setPushStatus('granted');
        toast.success('Web Push Notifications registered!');
      } else {
        if (res.message.includes('denied')) {
          setPushStatus('denied');
          toast.error('Notification permission denied by browser.');
        } else {
          toast.info(res.message);
        }
      }
    } else {
      setPushStatus('unsupported');
      toast.info('Web Push notifications are not supported on this device/browser.');
    }
  };

  // Handle Test Web Push Notification Dispatch
  const handleTestWebPushDispatch = async () => {
    if (!user?.id) {
      toast.error('User session required');
      return;
    }

    setTestingNotif(true);
    try {
      const res = await sendTestWebPushNotification(user.id, userShopId || undefined);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message || 'Test push failed');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error dispatching test push');
    } finally {
      setTestingNotif(false);
    }
  };

  // Handle Test Daily Summary Now
  const handleTestDailySummary = async () => {
    if (!userShopId) {
      toast.error('No shop found for this account. Create a shop first.');
      return;
    }

    setTestingNotif(true);
    try {
      const res = await deliverDailyShopSummary(userShopId, { force: true });
      if (res.success) {
        toast.success('Daily Summary notification generated!');
      } else {
        toast.error(res.message || 'Failed to send test summary');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error generating test summary');
    } finally {
      setTestingNotif(false);
    }
  };

  // Calculate remaining trial days
  const trialDaysRemaining = useMemo(() => {
    if (!subscription) return 0;
    if (subscription.status === 'active') return null; // Fully subscribed
    if (!subscription.trial_ends_at) return 0;
    const ends = new Date(subscription.trial_ends_at);
    const now = new Date();
    const diffTime = ends.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [subscription]);

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
            {trialDaysRemaining !== null ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm font-black text-black uppercase">
                    Trial Mode ({trialDaysRemaining} days remaining)
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  Your shop is currently operating under the 7-day free trial. After trial expiry, product management will be locked. Upgrade to Pro for $2.99/month.
                </p>
                <button
                  onClick={() => navigate('/subscription')}
                  className="w-full mt-4 bg-zinc-900 text-white font-bold py-3 rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  Upgrade to Pro ($2.99/month)
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span className="text-sm font-black text-black uppercase">
                    Premium Account Active
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  Your Premium Merchant Subscription is active and verified. Under our standard billing tier, you have unlimited storefront access.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: Daily Shop Activity Notifications */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Bell size={16} className="text-black" />
            <h2 className="text-xs font-black uppercase tracking-wider text-black">Daily Shop Summary (19:00)</h2>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 text-left shadow-xs space-y-5">
            {/* Daily Summary Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Daily Shop Activity Briefing</h3>
                <p className="text-xs text-zinc-500 font-normal leading-relaxed mt-0.5">
                  Receive a concise summary of visitors, WhatsApp clicks, product views, and top products every day at 19:00.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={dailySummaryEnabled} 
                  onChange={(e) => handleToggleDailySummary(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
              </label>
            </div>

            <hr className="border-zinc-200/60" />

            {/* Timezone Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                <Globe size={14} className="text-zinc-500" />
                <span>Summary Delivery Timezone</span>
              </div>
              <select 
                value={notifTimezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="w-full h-10 bg-white border border-zinc-200 rounded-xl px-3 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#25D366]"
              >
                <option value="Africa/Harare">Africa/Harare (Harare, Zimbabwe / GMT+2)</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg (GMT+2)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </select>
            </div>

            {/* Browser Push Permission & Web Push Status */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-zinc-600 shrink-0" />
                  <span className="text-xs font-semibold text-zinc-700">
                    Web Push Alerts: {pushStatus === 'granted' ? 'Active' : pushStatus === 'denied' ? 'Permission Denied' : pushStatus === 'unsupported' ? 'Not Supported on Device' : 'Not Configured'}
                  </span>
                </div>
                {pushStatus !== 'granted' && pushStatus !== 'unsupported' && (
                  <button
                    onClick={handleRequestPushPermission}
                    className="text-xs font-bold text-[#25D366] hover:underline cursor-pointer"
                  >
                    Enable Push
                  </button>
                )}
              </div>
              {pushStatus === 'unsupported' && (
                <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2 font-medium">
                  Web Push is unsupported on this browser. Summary briefings will still appear in your in-app notification feed.
                </p>
              )}
            </div>

            {/* Test Action Buttons */}
            <div className="pt-2 border-t border-zinc-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button 
                onClick={handleTestWebPushDispatch}
                disabled={testingNotif}
                className="w-full h-11 bg-zinc-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                {testingNotif ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Smartphone size={14} className="text-[#25D366]" />
                    <span>Send Test Web Push</span>
                  </>
                )}
              </button>

              <button 
                onClick={handleTestDailySummary}
                disabled={testingNotif}
                className="w-full h-11 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-900 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                {testingNotif ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
                ) : (
                  <>
                    <Send size={14} className="text-zinc-600" />
                    <span>Generate In-App Summary</span>
                  </>
                )}
              </button>
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

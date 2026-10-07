import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, CheckCircle2, X } from 'lucide-react';
import {
  hasActivePushSubscription,
  subscribeToPushNotifications,
  watchNotificationPermission
} from '../services/pushNotificationService';
import { toast } from 'sonner';
import { saveNotificationPreferences } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { withTimeout } from '../lib/withTimeout';

interface NotificationPromptBannerProps {
  userId?: string;
}

const PUSH_SUBSCRIBE_TIMEOUT_MS = 30000;
const PROMPT_DISMISSED_STORAGE_PREFIX = 'threadzw_notifications_prompt_dismissed:';

const canUseBrowserPush = () => (
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window
);

export const NotificationPromptBanner: React.FC<NotificationPromptBannerProps> = ({ userId }) => {
  const { profile, updateProfile } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const syncingRef = useRef(false);

  const finishPushSetup = async (showSuccessToast = false) => {
    if (!userId || syncingRef.current) return false;

    syncingRef.current = true;
    try {
      const subscription = await withTimeout(
        subscribeToPushNotifications(),
        PUSH_SUBSCRIBE_TIMEOUT_MS,
        'PUSH_SUBSCRIBE'
      );
      if (!subscription) throw new Error('Push subscription was not created.');

      await withTimeout(
        saveNotificationPreferences({ push_enabled: true }),
        5000,
        'PUSH_PREFERENCES_SAVE'
      );

      const result = await withTimeout(
        updateProfile({ notifications_prompted: true }),
        5000,
        'NOTIFICATION_PROMPT_ENABLE'
      );
      if (result?.error) throw result.error;

      window.localStorage.setItem(
        `${PROMPT_DISMISSED_STORAGE_PREFIX}${userId}`,
        'true'
      );
      setShowPrompt(false);

      if (showSuccessToast) {
        toast.success('Phone notifications enabled on this device.');
      }
      return true;
    } catch (error: any) {
      console.error('Failed to finish push setup:', error);
      if (showSuccessToast) {
        if (error?.message?.includes('TIMEOUT')) {
          toast.info('Notification setup took too long. Try enabling notifications again from Chrome Site Controls.');
        } else if (typeof window !== 'undefined' && window.Notification?.permission === 'denied') {
          toast.info('Notifications are blocked in this browser. Enable them in Chrome settings, then try again.');
        } else if (error?.message?.includes('NOTIFICATION_PERMISSION_PENDING')) {
          toast.info('Chrome left the notification choice open. Tap Allow in the notification prompt or Chrome Site Controls; ThreadZW will finish setup automatically.');
        } else if (error?.message?.includes('VAPID_PUBLIC_KEY')) {
          toast.error('Phone notifications are not configured yet. Your in-app inbox will still work.');
        } else {
          toast.info('Notifications could not be enabled on this device. Your in-app inbox will still work.');
        }
      }
      return false;
    } finally {
      syncingRef.current = false;
    }
  };

  useEffect(() => {
    if (!userId || !canUseBrowserPush()) {
      setShowPrompt(false);
      return;
    }

    let cancelled = false;
    const dismissedKey = `${PROMPT_DISMISSED_STORAGE_PREFIX}${userId}`;

    const refreshPrompt = async () => {
      const locallyDismissed = window.localStorage.getItem(dismissedKey) === 'true';
      const permission = window.Notification.permission;
      const subscribed = await hasActivePushSubscription();

      if (cancelled) return;

      // Important Android repair path: Chrome can grant notification
      // permission after the original request timed out. If permission is
      // granted but this browser has no subscription, show the action again.
      setShowPrompt(
        !subscribed &&
        (
          (permission === 'default' && !locallyDismissed && profile?.notifications_prompted !== true) ||
          permission === 'granted'
        )
      );
    };

    const timer = window.setTimeout(() => {
      void refreshPrompt();
    }, 450);

    let stopWatching: (() => void) | undefined;

    void watchNotificationPermission(async () => {
      if (cancelled || window.Notification.permission !== 'granted') return;
      await finishPushSetup(false);
      if (!cancelled) await refreshPrompt();
    }).then(cleanup => {
      if (cancelled) cleanup();
      else stopWatching = cleanup;
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      stopWatching?.();
    };
  }, [userId, profile?.notifications_prompted]);

  const handleDismiss = async () => {
    if (!userId) return;
    setShowPrompt(false);
    window.localStorage.setItem(`${PROMPT_DISMISSED_STORAGE_PREFIX}${userId}`, 'true');
    try {
      const result = await withTimeout(
        updateProfile({ notifications_prompted: true }),
        5000,
        'NOTIFICATION_PROMPT_DISMISS'
      );
      if (result?.error) throw result.error;
    } catch (error) {
      console.warn('Could not persist notification prompt dismissal:', error);
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    const success = await finishPushSetup(true);
    if (success) {
      setLoading(false);
      return;
    }

    // Android Chrome may return "default" because its new prompt is
    // non-blocking. Keep the banner available so the user can complete the
    // choice from Chrome's Site Controls.
    if (window.Notification.permission === 'default') {
      setShowPrompt(true);
    }
    setLoading(false);
  };

  if (!showPrompt) return null;

  return (
    <section
      aria-label="Notification permission"
      className="mx-4 sm:mx-0 mb-6 rounded-2xl border border-lime-300/70 bg-gradient-to-br from-lime-50 via-white to-zinc-50 p-4 sm:p-5 shadow-sm relative overflow-hidden"
    >
      <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-lime-200/40 blur-2xl pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-lime-200/70 border border-lime-300 flex items-center justify-center shrink-0 text-lime-800">
            <BellRing size={21} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-black text-zinc-950">Stay on top of your shop</h2>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/80 border border-lime-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-lime-800">
                <CheckCircle2 size={10} /> Free
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-xl">
              Get a notification when someone visits your shop, a first-product reminder after a day if you still have none, and a weekly shop report — in your ThreadZW inbox and on your phone.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X size={14} />
            Not now
          </button>
          <button
            type="button"
            onClick={handleEnable}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-black shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <Bell size={14} />
            {loading ? 'Enabling…' : 'Enable alerts'}
          </button>
        </div>
      </div>
    </section>
  );
};

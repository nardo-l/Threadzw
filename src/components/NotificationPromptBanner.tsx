import React, { useEffect, useState } from 'react';
import { Bell, BellRing, CheckCircle2, X } from 'lucide-react';
import { subscribeToPushNotifications } from '../services/pushNotificationService';
import { toast } from 'sonner';
import { saveNotificationPreferences } from '../services/notificationService';

interface NotificationPromptBannerProps {
  userId?: string;
}

const canUseBrowserPush = () => (
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window
);

export const NotificationPromptBanner: React.FC<NotificationPromptBannerProps> = ({ userId }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !canUseBrowserPush()) return;

    // Let the dashboard settle first, then show an in-app explanation. The
    // browser permission dialog must be opened by the Enable button below.
    const timer = window.setTimeout(() => {
      setShowPrompt(window.Notification.permission === 'default');
    }, 450);

    return () => window.clearTimeout(timer);
  }, [userId]);

  const handleEnable = async () => {
    try {
      setLoading(true);
      const subscription = await subscribeToPushNotifications();
      if (!subscription) throw new Error('Push subscription was not created.');

      await saveNotificationPreferences({ push_enabled: true });
      setShowPrompt(false);
      toast.success('Phone notifications enabled on this device.');
    } catch (error: any) {
      console.error('Failed to enable push notifications:', error);
      if (typeof window !== 'undefined' && window.Notification?.permission === 'denied') {
        toast.info('Notifications are blocked in this browser. Enable them in your browser settings, then try again.');
      } else if (error?.message?.includes('VAPID_PUBLIC_KEY')) {
        toast.error('Phone notifications are not configured yet. Your in-app inbox will still work.');
      } else {
        toast.info('Notifications could not be enabled on this device. Your in-app inbox will still work.');
      }
    } finally {
      setLoading(false);
    }
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
              Get setup reminders at 12:00 and a daily shop-performance summary at 19:00, in your ThreadZW inbox and on your phone.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setShowPrompt(false)}
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

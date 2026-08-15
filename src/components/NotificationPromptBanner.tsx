import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { subscribeToPushNotifications } from '../services/pushNotificationService';
import { toast } from 'sonner';

interface NotificationPromptBannerProps {
  userId?: string;
}

export const NotificationPromptBanner: React.FC<NotificationPromptBannerProps> = ({ userId }) => {
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;

    async function checkPromptStatus() {
      // 1. Check browser permission status first
      if (!('Notification' in window)) return;

      const permission = Notification.permission;
      const localKey = `threadzw_notif_prompted_${userId}`;
      const localPrompted = localStorage.getItem(localKey) === 'true';

      // If permission was already granted or denied outside this flow, skip in-app prompt and mark prompted silently
      if (permission !== 'default') {
        if (!localPrompted) {
          localStorage.setItem(localKey, 'true');
          try {
            await supabase
              .from('profiles')
              .update({ notifications_prompted: true })
              .eq('id', userId);
          } catch (e) {
            // Column might not exist yet; gracefully ignore
          }
        }
        setShowPrompt(false);
        return;
      }

      // 2. Check profile table for notifications_prompted
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('notifications_prompted')
          .eq('id', userId)
          .maybeSingle();

        const dbPrompted = profile?.notifications_prompted === true;

        if (dbPrompted || localPrompted) {
          setShowPrompt(false);
        } else {
          // Haven't been prompted yet and permission is 'default'
          setShowPrompt(true);
        }
      } catch (err) {
        // Fallback to local storage if column doesn't exist
        if (localPrompted) {
          setShowPrompt(false);
        } else {
          setShowPrompt(true);
        }
      }
    }

    checkPromptStatus();
  }, [userId]);

  const markPromptedInDbAndLocal = async () => {
    if (userId) {
      localStorage.setItem(`threadzw_notif_prompted_${userId}`, 'true');
      try {
        await supabase
          .from('profiles')
          .update({ notifications_prompted: true })
          .eq('id', userId);
      } catch (e) {
        // ignore if column missing
      }
    }
    setShowPrompt(false);
  };

  const handleEnable = async () => {
    try {
      setLoading(true);
      await subscribeToPushNotifications();
      toast.success('Notifications enabled successfully! 🔔');
      await markPromptedInDbAndLocal();
    } catch (err: any) {
      console.error('Failed to enable push notifications:', err);
      if (err.message?.includes('denied') || Notification.permission === 'denied') {
        toast.error('Notification permission was denied.');
      } else {
        toast.info('Could not register push subscription on this device.');
      }
      // Still mark prompted so we don't nag repeatedly
      await markPromptedInDbAndLocal();
    } finally {
      setLoading(false);
    }
  };

  const handleNotNow = async () => {
    await markPromptedInDbAndLocal();
  };

  if (!showPrompt) return null;

  return (
    <div className="mx-4 sm:mx-0 mb-6 bg-gradient-to-r from-lime-500/15 via-zinc-900/5 to-white border border-lime-500/30 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-lime-500/20 border border-lime-500/40 flex items-center justify-center shrink-0 text-lime-700">
          <Bell size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-900 mb-1">Turn on notifications</h3>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Get your daily shop summary, WhatsApp order alerts and Pro reminders instantly.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end">
        <button
          onClick={handleNotNow}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 transition-colors cursor-pointer"
        >
          Not now
        </button>
        <button
          onClick={handleEnable}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {loading ? 'Enabling...' : 'Enable'}
        </button>
      </div>
    </div>
  );
};

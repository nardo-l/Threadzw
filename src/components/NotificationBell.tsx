import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const NotificationBell: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!user?.id) return;

    async function fetchUnreadCount() {
      try {
        const res = await fetch(`/api/notifications?profileId=${user.id}`);
        const data = await res.json();
        if (data && data.notifications) {
          const unread = data.notifications.filter((n: any) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        // Fallback or ignore network error
      }
    }

    fetchUnreadCount();

    // Poll every 30s or listen to supabase realtime
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <button
      onClick={() => navigate('/notifications')}
      className={`relative p-2 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer text-zinc-700 hover:text-zinc-900 ${className}`}
      title="Notifications"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BEF715] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#84cc16]"></span>
        </span>
      )}
    </button>
  );
};

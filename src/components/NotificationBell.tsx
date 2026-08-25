import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications } from '../services/notificationService';

export const NotificationBell: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    async function refreshUnreadCount() {
      try {
        const data = await fetchNotifications();
        if (mounted) {
          setUnreadCount(Number(data.unreadCount ?? (data.notifications || []).filter((n: any) => !n.read).length));
        }
      } catch {
        // Keep the existing badge state during transient network failures.
      }
    }

    void refreshUnreadCount();
    const interval = window.setInterval(refreshUnreadCount, 30000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [user?.id]);

  return (
    <button
      onClick={() => navigate('/notifications')}
      className={`relative p-2 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer text-zinc-700 hover:text-zinc-900 ${className}`}
      title="Notifications"
      aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  ShoppingBag, 
  Crown, 
  CheckCircle2, 
  XCircle, 
  Gift, 
  Bell, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  fetchNotifications as fetchNotificationFeed,
  markAllNotificationsRead,
  markNotificationRead
} from '../services/notificationService';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  target_url: string;
  created_at: string;
}

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await fetchNotificationFeed();
      if (data && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      const data = await markAllNotificationsRead();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    // Mark single as read if unread
    if (!item.read && user?.id) {
      try {
        await markNotificationRead(item.id);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
      } catch (e) {
        // ignore
      }
    }

    if (item.target_url) {
      navigate(item.target_url);
    } else {
      navigate('/dashboard');
    }
  };

  const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSecs < 60) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'daily_summary':
      case 'daily_performance_summary':
      case 'summary':
        return <TrendingUp size={20} className="text-lime-600" />;
      case 'new_order':
      case 'order':
        return <ShoppingBag size={20} className="text-emerald-600" />;
      case 'pro_expiry':
      case 'expiry':
        return <Crown size={20} className="text-amber-600" />;
      case 'setup_reminder':
      case 'first_product_reminder':
        return <Gift size={20} className="text-indigo-600" />;
      case 'pro_activated':
      case 'subscription':
        return <CheckCircle2 size={20} className="text-purple-600" />;
      case 'order_cancelled':
      case 'cancelled':
        return <XCircle size={20} className="text-rose-600" />;
      case 'welcome':
        return <Gift size={20} className="text-indigo-600" />;
      default:
        return <Bell size={20} className="text-zinc-600" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'daily_summary':
      case 'daily_performance_summary':
      case 'summary':
        return 'bg-lime-500/10 border-lime-500/20';
      case 'new_order':
      case 'order':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'pro_expiry':
      case 'expiry':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'setup_reminder':
      case 'first_product_reminder':
        return 'bg-indigo-500/10 border-indigo-500/20';
      case 'pro_activated':
      case 'subscription':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'order_cancelled':
      case 'cancelled':
        return 'bg-rose-500/10 border-rose-500/20';
      case 'welcome':
        return 'bg-indigo-500/10 border-indigo-500/20';
      default:
        return 'bg-zinc-100 border-zinc-200';
    }
  };

  const hasUnread = notifications.some(n => !n.read);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111] font-sans pb-24">
      {/* Header */}
      <header className="max-w-2xl mx-auto px-5 pt-4 pb-4 flex items-center justify-between sticky top-0 z-30 bg-[#F8F9FA]/90 backdrop-blur-md border-b border-zinc-200/60">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-zinc-200/60 rounded-xl transition-colors cursor-pointer text-zinc-800"
            title="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Notifications</h1>
        </div>

        {notifications.length > 0 && hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-200/50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400">
            <div className="animate-spin rounded-full h-8 v-8 border-b-2 border-zinc-800"></div>
          </div>
        ) : notifications.length === 0 ? (
          /* State B: Empty State */
          <div className="flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="w-20 h-20 bg-white shadow-sm border border-zinc-200/80 rounded-3xl flex items-center justify-center mb-5 relative">
              <Bell size={36} className="text-zinc-400" />
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-[#BEF715] border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-900">
                0
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-1.5">No notifications yet</h2>
            <p className="text-sm text-zinc-500 max-w-sm mb-6 leading-relaxed">
              You’ll see setup nudges, daily performance summaries and important account updates here.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors shadow-xs cursor-pointer"
            >
              <Clock size={16} className="text-zinc-500" />
              Check back later
            </button>
          </div>
        ) : (
          /* State A: List view */
          <div className="space-y-3">
            {notifications.map(item => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                  item.read 
                    ? 'bg-white border-zinc-200/80 hover:border-zinc-300' 
                    : 'bg-lime-500/[0.04] border-lime-500/30 hover:border-lime-500/50'
                }`}
              >
                {/* Leading Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${getIconBg(item.type)}`}>
                  {renderIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`text-sm tracking-tight truncate ${item.read ? 'font-semibold text-zinc-800' : 'font-bold text-zinc-900'}`}>
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-[#84cc16]"></span>
                      )}
                      <span className="text-[11px] font-medium text-zinc-400">
                        {getRelativeTime(item.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 line-clamp-2 leading-relaxed">
                    {item.body}
                  </p>
                </div>

                {/* Chevron */}
                <div className="self-center text-zinc-400 shrink-0">
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

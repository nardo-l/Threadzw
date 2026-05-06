import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Tag, 
  TrendingDown,
  Trophy,
  Star as StarIcon,
  Store,
  LineChart,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { formatDistanceToNow, parseISO } from 'date-fns';

type NotificationType = 
  | 'new_drop' | 'price_drop' | 'low_stock' | 'restock' 
  | 'new_shop' | 'trial_reminder' | 'payment_confirmed' 
  | 'best_dresser_nominee' | 'voting_open' | 'voting_reminder' 
  | 'round_win' | 'final_win';

interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: any;
  read: boolean;
  created_at: string;
}

export const NotificationsView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setBuyerFlowState, setCurrentShopId, setCurrentProductId } = useInventory();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Shop' | 'Drops' | 'Wishlist' | 'Best Dresser'>('All');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    if (!user?.id) return;
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (filter === 'All') return notifications;
    return notifications.filter(n => {
      if (filter === 'Shop') return ['low_stock', 'restock', 'trial_reminder', 'payment_confirmed'].includes(n.type);
      if (filter === 'Drops') return ['new_drop', 'new_shop'].includes(n.type);
      if (filter === 'Wishlist') return ['price_drop'].includes(n.type);
      if (filter === 'Best Dresser') return ['best_dresser_nominee', 'voting_open', 'voting_reminder', 'round_win', 'final_win'].includes(n.type);
      return true;
    });
  }, [notifications, filter]);

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);

    switch (n.type) {
      case 'new_drop':
      case 'price_drop':
      case 'restock':
        if (n.data?.product_id) {
          setCurrentProductId(n.data.product_id);
          setBuyerFlowState('productDetail');
          navigate('/');
        }
        break;
      case 'new_shop':
        if (n.data?.shop_id) {
          setCurrentShopId(n.data.shop_id);
          setBuyerFlowState('shopProfile');
          navigate('/');
        }
        break;
      case 'trial_reminder':
      case 'payment_confirmed':
        navigate('/shop-centre');
        break;
      case 'best_dresser_nominee':
      case 'voting_open':
      case 'voting_reminder':
      case 'round_win':
      case 'final_win':
        setBuyerFlowState('bestDresser');
        navigate('/');
        break;
      default:
        break;
    }
  };

  const getIcon = (type: NotificationType) => {
    const iconSize = 20;
    switch (type) {
      case 'new_drop': return { icon: <Tag size={iconSize} />, color: '#FF2D78', bg: '#FF2D781A' };
      case 'price_drop': return { icon: <TrendingDown size={iconSize} />, color: '#22c55e', bg: '#22c55e1A' };
      case 'low_stock': return { icon: <AlertTriangle size={iconSize} />, color: '#f59e0b', bg: '#f59e0b1A' };
      case 'restock': return { icon: <LineChart size={iconSize} />, color: '#3b82f6', bg: '#3b82f61A' };
      case 'new_shop': return { icon: <Store size={iconSize} />, color: '#9333ea', bg: '#9333ea1A' };
      case 'trial_reminder': return { icon: <Clock size={iconSize} />, color: '#ef4444', bg: '#ef44441A' };
      case 'payment_confirmed': return { icon: <CheckCircle2 size={iconSize} />, color: '#22c55e', bg: '#22c55e1A' };
      case 'best_dresser_nominee': return { icon: <StarIcon size={iconSize} />, color: '#FF2D78', bg: '#FF2D781A' };
      case 'voting_open': return { icon: <Bell size={iconSize} />, color: '#3b82f6', bg: '#3b82f61A' };
      case 'voting_reminder': return { icon: <Bell size={iconSize} />, color: '#f59e0b', bg: '#f59e0b1A' };
      case 'round_win': return { icon: <Trophy size={iconSize} />, color: '#f59e0b', bg: '#f59e0b1A' };
      case 'final_win': return { icon: <Trophy size={iconSize} />, color: '#f59e0b', bg: '#f59e0b1A' };
      default: return { icon: <Bell size={iconSize} />, color: '#888', bg: '#222' };
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-sans pb-[100px]">
      {/* Header */}
      <div className="px-6 flex items-center justify-between py-5 sticky top-0 bg-black/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2 text-white">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white text-[20px] font-bold">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="text-[#FF2D78] text-[13px] font-bold active:scale-95 transition-transform"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="px-6 mb-6 overflow-x-auto no-scrollbar flex items-center gap-2">
        {['All', 'Shop', 'Drops', 'Wishlist', 'Best Dresser'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all
              ${filter === f 
                ? 'bg-[#FF2D78] text-white shadow-[0_4px_12px_rgba(255,45,120,0.3)]' 
                : 'bg-[#111] text-[#888] border border-[#222]'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 px-6 space-y-3">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-[80px] bg-[#111] rounded-[16px] animate-pulse" />
          ))
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mb-4">
              <Bell size={24} className="text-[#333]" />
            </div>
            <h3 className="text-white font-bold text-[16px]">No notifications yet</h3>
            <p className="text-[#888] text-[13px] max-w-[200px] mt-1">
              We'll let you know when something exciting happens.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((n) => {
              const { icon, color, bg } = getIcon(n.type);
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 rounded-[16px] border transition-all active:scale-[0.98] flex items-start gap-4 cursor-pointer
                    ${n.read ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-[#111] border-[#222]'}`}
                >
                  <div 
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 shadow-sm" 
                    style={{ backgroundColor: bg, color: color }}
                  >
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-[14px] font-bold truncate ${n.read ? 'text-[#888]' : 'text-white'}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <div className="w-2 h-2 bg-[#FF2D78] rounded-full shrink-0 shadow-[0_0_8px_rgba(255,45,120,0.4)]" />
                      )}
                    </div>
                    <p className={`text-[12px] leading-[1.4] line-clamp-2 ${n.read ? 'text-[#555]' : 'text-[#888]'}`}>
                      {n.body}
                    </p>
                    <p className="text-[10px] text-[#444] mt-2 font-mono uppercase tracking-wider">
                      {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Bell, ArrowLeft, Loader2, Info, Check, Trash2, 
  ShoppingBag, Eye, AlertTriangle, MessageCircle, Package 
} from 'lucide-react';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { toast } from 'sonner';

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: 'sale' | 'view_milestone' | 'low_stock' | 'request' | 'system';
  read: boolean;
  created_at: string;
}

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: dbData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (dbData && dbData.length > 0) {
        setNotifications(dbData.map(n => ({
          id: n.id,
          title: n.title,
          content: n.body || n.message || n.content || '',
          type: (n.type as any) || 'system',
          read: n.read || false,
          created_at: n.created_at
        })));
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Try running RPC
      await supabase.rpc('mark_all_notifications_read', { p_user_id: session.user.id });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch (err) {
      // Offline fallback
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('Marked read locally');
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success('Cleaned notification feed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C6FF00] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Group notifications simple logic
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#070709] text-white pb-32 font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <div className="px-5 pt-8 pb-4 border-b border-white/[0.02] flex items-center justify-between sticky top-0 bg-[#070709]/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase font-black uppercase">Live Updates</span>
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              )}
            </div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase mt-0.5">Notifications</h1>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={handleMarkAllRead} 
              className="text-[10px] font-black uppercase tracking-wider text-[#C6FF00] hover:underline"
            >
              Read All
            </button>
            <span className="text-zinc-700 font-bold">•</span>
            <button 
              onClick={handleClearAll} 
              className="text-[10px] font-black uppercase tracking-wider text-red-400 hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="px-5 mt-6 space-y-4">
        
        {notifications.length === 0 ? (
          <div className="bg-white/[0.01] border-2 border-dashed border-white/5 rounded-3xl py-20 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 mb-4 shadow-inner">
              <Bell size={24} />
            </div>
            <h3 className="font-extrabold text-sm text-white">All Clear!</h3>
            <p className="text-xs text-zinc-500 max-w-xs mt-1.5 leading-relaxed">
              No outstanding warehouse alerts or buyer intents. We will notify you when buyers take action on your products.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => {
              // Icon mapping based on type
              const getDetails = (t: string) => {
                switch (t) {
                  case 'sale':
                    return {
                      icon: <ShoppingBag size={15} />,
                      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                    };
                  case 'low_stock':
                    return {
                      icon: <Package size={15} />,
                      color: 'bg-red-500/10 text-red-400 border-red-500/10'
                    };
                  case 'view_milestone':
                    return {
                      icon: <Eye size={15} />,
                      color: 'bg-sky-500/10 text-sky-400 border-sky-500/10'
                    };
                  case 'request':
                    return {
                      icon: <MessageCircle size={15} />,
                      color: 'bg-amber-500/10 text-[#C6FF00] border-[#C6FF00]/10'
                    };
                  default:
                    return {
                      icon: <Info size={15} />,
                      color: 'bg-zinc-500/10 text-zinc-400 border-white/5'
                    };
                }
              };

              const details = getDetails(item.type);

              return (
                <div 
                  key={item.id} 
                  className={`bg-white/[0.02] border rounded-2xl p-4 flex gap-4 transition-all ${
                    item.read ? 'border-white/[0.04]' : 'border-[#C6FF00]/20 bg-[#C6FF00]/[0.01]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${details.color} border flex items-center justify-center shrink-0`}>
                    {details.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-[13px] font-extrabold text-white leading-tight ${!item.read ? 'text-[#C6FF00]' : ''}`}>
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF00] shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                      {item.content}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-3.5">
                      <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>

                      {!item.read && (
                        <button 
                          onClick={() => {
                            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
                          }}
                          className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-[#C6FF00] uppercase tracking-widest hover:underline"
                        >
                          <Check size={10} />
                          <span>Mark Read</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center pt-8">
          <p className="text-[10px] font-mono font-bold text-zinc-500 tracking-wider uppercase">End of Sync feed</p>
        </div>

      </div>

      <BottomNavBar />
    </div>
  );
};

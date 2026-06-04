import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Calendar, MapPin, Clock, Check, ChevronRight, Filter, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  town: string;
  event_type: string;
  cover_image_url: string;
  event_date: string;
  start_time: string;
  end_time: string;
  is_free: boolean;
  ticket_price: number;
  rsvp_count: number;
  is_verified: boolean;
}

export const EventsView: React.FC = () => {
  const { session } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userTown, setUserTown] = useState(localStorage.getItem('thread_user_town') || 'Harare');
  const [rsvpedEvents, setRsvpedEvents] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const filterOptions = ['all', 'fashion', 'music', 'campus', 'sneakers', 'nightlife', 'popup'];

  const fetchEvents = async (typeFilter = filter, town = userTown) => {
    setLoading(true);
    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });
      
      if (typeFilter !== 'all') {
        query = query.eq('event_type', typeFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        // Sort: local events first, then others
        const sorted = [...data].sort((a, b) => {
          if (a.town === town && b.town !== town) return -1;
          if (a.town !== town && b.town === town) return 1;
          return 0;
        });
        setEvents(sorted);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchRSVPs = async () => {
    if (!session?.user?.id) return;
    try {
      const { data } = await supabase
        .from('event_rsvps')
        .select('event_id')
        .eq('user_id', session.user.id);
      if (data) setRsvpedEvents(data.map(r => r.event_id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchRSVPs();
  }, [filter, userTown]);

  const handleRSVP = async (event: Event) => {
    if (!session?.user?.id) {
      toast.error('Please sign in to RSVP');
      return;
    }
    
    const isRsvped = rsvpedEvents.includes(event.id);
    
    // Optimistic update
    if (isRsvped) {
      setRsvpedEvents(prev => prev.filter(id => id !== event.id));
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, rsvp_count: Math.max(0, e.rsvp_count - 1) } : e));
    } else {
      setRsvpedEvents(prev => [...prev, event.id]);
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, rsvp_count: e.rsvp_count + 1 } : e));
    }
    
    try {
      if (isRsvped) {
        await supabase.from('event_rsvps').delete().eq('event_id', event.id).eq('user_id', session.user.id);
        await supabase.rpc('decrement_rsvp_count', { p_event_id: event.id });
      } else {
        await supabase.from('event_rsvps').insert({ event_id: event.id, user_id: session.user.id });
        await supabase.rpc('increment_rsvp_count', { p_event_id: event.id });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Top Bar */}
      <div className="bg-black/80 backdrop-blur-xl px-6 py-6 flex flex-col sticky top-0 z-30 shadow-sm border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-bold tracking-tighter text-white">Events Hub</h1>
          <button 
            onClick={() => {
              const newTown = prompt('Change town:', userTown);
              if (newTown) {
                setUserTown(newTown);
                localStorage.setItem('thread_user_town', newTown);
              }
            }}
            className="h-10 px-4 rounded-full bg-white/5 flex items-center gap-2 text-xs font-bold text-white/60"
          >
            <span>📍 {userTown}</span>
          </button>
        </div>
        
        {/* Filter Chips */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-2">
          {filterOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`
                whitespace-nowrap px-6 py-2.5 rounded-full text-[13px] font-bold transition-all border
                ${filter === opt 
                  ? 'bg-[#C6FF00] text-white border-[#C6FF00] shadow-lg shadow-[#C6FF00]/20' 
                  : 'bg-transparent text-white/40 border-white/10'}
              `}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Banner */}
      <div 
        className="mx-6 my-6 rounded-[32px] p-8 min-h-[160px] flex flex-col justify-between relative overflow-hidden shadow-xl shadow-[#C6FF00]/10"
        style={{ background: 'linear-gradient(135deg, #9B27AF, #C6FF00)' }}
      >
        <div className="relative z-10">
          <h2 className="text-white font-bold text-xl tracking-tight">The Weekend Guide 🔥</h2>
          <p className="text-white/80 text-[14px] mt-1 font-medium max-w-[200px]">3 major events happening in {userTown} this week.</p>
        </div>
        <button className="relative z-10 self-end px-5 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest">Explore Now</button>
        
        {/* Artistic details */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-16 -mb-16" />
      </div>

      {/* Events List */}
      <div className="px-6 space-y-6 pb-28">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-8 h-8 border-4 border-[#C6FF00] border-t-transparent rounded-full animate-spin" />
            <p className="text-white/20 text-sm">Finding vibes...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/40 font-medium">No events found</p>
            <p className="text-white/20 text-xs mt-1">Check back later or try a different filter</p>
          </div>
        ) : (
          events.map(event => (
            <motion.div
              layoutId={event.id}
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="bg-[#111111] rounded-[24px] overflow-hidden shadow-sm active:scale-[0.98] transition-all border border-white/5"
            >
              <div className="h-[220px] relative">
                <img 
                  src={event.cover_image_url} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 border border-white/10">
                  <span>{getEventTypeEmoji(event.event_type)}</span>
                  <span>{event.event_type}</span>
                </div>
                
                <div className="absolute bottom-4 left-4 px-4 py-2 rounded-xl bg-[#C6FF00] text-white text-[11px] font-bold">
                  {new Date(event.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}
                </div>

                {event.is_verified && (
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#C6FF00] text-white flex items-center justify-center shadow-lg">
                    <Check size={16} strokeWidth={3} />
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-white font-bold text-[19px] leading-tight tracking-tight">{event.title}</h3>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-white/40 text-[13px] font-medium">
                    <MapPin size={14} className="text-[#C6FF00]" />
                    <span>{event.location} · {event.town}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/40 text-[13px] font-medium">
                    <Clock size={14} className="text-[#9B27AF]" />
                    <span>{event.start_time}{event.end_time ? ` - ${event.end_time}` : ' onwards'}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between pt-5 border-t border-white/5">
                  <div className="flex items-center">
                    <div className="flex -space-x-2 mr-3">
                      {[1,2,3].map(i => (
                        <div key={`rsvp-avatar-${i}`} className="w-8 h-8 rounded-full border-2 border-[#111111] bg-white/5 flex items-center justify-center text-[10px] text-white/40 overflow-hidden font-bold">
                          {i}
                        </div>
                      ))}
                    </div>
                    <span className="text-white/20 text-xs font-bold uppercase tracking-wider">{event.rsvp_count > 0 ? `+${event.rsvp_count}` : '0'} going</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRSVP(event);
                    }}
                    className={`
                      px-6 h-11 rounded-full text-[13px] font-bold transition-all
                      ${rsvpedEvents.includes(event.id)
                        ? 'bg-white/10 text-white'
                        : 'bg-[#C6FF00] text-white shadow-lg'}
                    `}
                  >
                    {rsvpedEvents.includes(event.id) ? '✓ Registered' : 'GET TICKET'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Event Detail Overlay */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailView 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)}
            isRsvped={rsvpedEvents.includes(selectedEvent.id)}
            onRSVP={() => handleRSVP(selectedEvent)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const EventDetailView: React.FC<{ 
  event: Event; 
  onClose: () => void;
  isRsvped: boolean;
  onRSVP: () => void;
}> = ({ event, onClose, isRsvped, onRSVP }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center"
    >
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-[430px] h-[92vh] bg-white rounded-t-[40px] overflow-y-auto no-scrollbar shadow-2xl"
      >
        <div className="relative h-96">
          <img src={event.cover_image_url} className="w-full h-full object-cover" alt={event.title} referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-[#111111] hover:scale-105 active:scale-95 transition-all"
          >
            <ChevronRight size={26} className="rotate-180" />
          </button>
          
          <div className="absolute bottom-10 left-8 right-8">
            <h2 className="text-[#111111] text-4xl font-bold font-syne leading-tight tracking-tighter">{event.title}</h2>
          </div>
        </div>

        <div className="px-8 pb-20 relative z-20">
          <div className="flex gap-2.5 mb-10 overflow-x-auto no-scrollbar">
            <div className="px-5 py-3 rounded-2xl bg-[#C6FF00] text-white text-[12px] font-bold flex items-center gap-2 whitespace-nowrap">
              <span>{getEventTypeEmoji(event.event_type)}</span>
              <span className="uppercase tracking-widest">{event.event_type}</span>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-[#F5F5F5] text-[#111111] text-[12px] font-bold flex items-center gap-2 whitespace-nowrap">
              <Calendar size={14} className="text-[#9B27AF]" />
              <span>{new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</span>
            </div>
          </div>

          <p className="text-[#888888] text-[16px] leading-[1.6] mb-10 font-medium">
            {event.description || "The culture is calling. Don't miss out on Zimbabwe's most anticipated fashion and art convergence. Limited space available."}
          </p>

          <div className="bg-[#F5F5F5] rounded-[32px] p-8 space-y-6">
             <DetailItem icon="📍" label="VENUE" value={event.location} />
             <DetailItem icon="🕐" label="DOORS OPEN" value={`${event.start_time} ${event.end_time ? `- ${event.end_time}` : 'onwards'}`} />
             <DetailItem icon="🎫" label="ADMISSION" value={event.is_free ? 'COMPLIMENTARY' : `$${event.ticket_price}`} />
             <DetailItem icon="👥" label="COMMUNITY" value={`${event.rsvp_count} attendees`} />
          </div>

          <button 
            onClick={onRSVP}
            className={`
              w-full h-16 rounded-[24px] font-bold text-[16px] mt-10 transition-all active:scale-[0.98] shadow-xl
              ${isRsvped 
                ? 'bg-[#F5F5F5] text-[#111111]' 
                : 'bg-gradient-to-r from-[#9B27AF] to-[#C6FF00] text-white shadow-[#C6FF00]/20'}
            `}
          >
            {isRsvped ? '✓ BOOKED · VIEW TICKET' : 'SECURE MY SPOT'}
          </button>

          <div className="mt-12 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1a1a1a]">Event Fits 📸</h3>
              <button className="text-[#C6FF00] text-sm font-bold">Upload Yours →</button>
            </div>
            
            <div className="flex flex-col items-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
              <p className="text-gray-400 text-xs text-center px-10 leading-relaxed">
                Fits will appear after the event. Come back to see who was best dressed!
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DetailItem = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xl shadow-sm">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-[#1a1a1a]">{value}</span>
    </div>
  </div>
);

const getEventTypeEmoji = (type: string) => {
  switch (type.toLowerCase()) {
    case 'fashion': return '👗';
    case 'music': return '🎵';
    case 'campus': return '🎓';
    case 'sneakers': return '👟';
    case 'nightlife': return '🌙';
    case 'popup': return '🏪';
    default: return '🎪';
  }
};

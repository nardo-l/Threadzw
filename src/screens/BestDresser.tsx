import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Instagram, ChevronRight, Award, Star, Check, Clock, AlertCircle, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BestDresserEntryForm } from '../components/BestDresserEntryForm';
import { useBestDresser } from '../hooks/useBestDresser';
import { ScreenError } from '../components/ui/ScreenError';

export const BestDresser: React.FC = () => {
  const navigate = useNavigate();
  const { nominees, currentRound, loading, error, refetch } = useBestDresser();
  const [activeTab, setActiveTab] = useState<'Bracket' | 'Nominees' | 'Hall of Fame' | 'Enter'>('Bracket');
  const [showEntryForm, setShowEntryForm] = useState(false);

  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const storageKey = `thread_bestdresser_entry_${currentMonthYear.replace(/\s+/g, '_').toLowerCase()}`;
  const [existingEntry, setExistingEntry] = useState<any>(null);

  useEffect(() => {
    const entry = localStorage.getItem(storageKey);
    if (entry) {
      setExistingEntry(JSON.parse(entry));
    }
  }, [storageKey, showEntryForm]);

  const matchups = [
    { id: 1, p1: nominees[0], p2: nominees[1], winner: nominees[0], live: false },
    { id: 2, p1: nominees[2], p2: nominees[3], winner: null, live: true },
    { id: 3, p1: nominees[4], p2: nominees[5], winner: nominees[4], live: false },
    { id: 4, p1: nominees[6], p2: nominees[7], winner: nominees[6], live: false },
  ];

  if (loading) {
    return (
      <div className="flex flex-col pb-32 bg-background min-h-screen">
        <div className="p-6 space-y-6">
          <div className="h-8 w-48 bg-card rounded-lg shimmer-bg" />
          <div className="h-12 w-full bg-card rounded-pill shimmer-bg" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-card rounded-card shimmer-bg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ScreenError 
        icon={<Radio size={32} />}
        heading="Best Dresser Error"
        body={error}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col pb-32">
      {/* Header */}
      <div className="p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-card text-white">
            <ArrowLeft size={24} />
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-pacifico text-white">Best Dresser</h1>
            <p className="text-[10px] font-mono text-muted uppercase tracking-widest">{currentMonthYear}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 p-3 rounded-pill w-fit">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">{currentRound || 'Quarter Finals Live'}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/5 overflow-x-auto no-scrollbar">
          {['Bracket', 'Nominees', 'Hall of Fame', 'Enter'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === tab ? 'text-primary' : 'text-muted'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'Bracket' && (
          <div className="flex flex-col gap-8">
            {/* Countdown */}
            <div className="bg-card rounded-card p-4 border border-white/5 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-muted uppercase">Next round closes in</span>
                <span className="text-xl font-syne font-bold text-white">2d 14h 32m</span>
              </div>
              <button className="p-3 rounded-full bg-primary/10 text-primary">
                <Clock size={20} />
              </button>
            </div>

            {/* Matchups */}
            <div className="flex flex-col gap-6">
              {matchups.map(match => (
                <div key={match.id} className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    {/* Player 1 */}
                    <div className={`flex-1 bg-card rounded-2xl p-4 border-2 transition-all relative overflow-hidden ${
                      match.live ? 'border-primary animate-pulse' : match.winner?.id === match.p1?.id ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/5 opacity-50'
                    }`}>
                      <div className="aspect-square bg-black rounded-xl mb-3 flex items-center justify-center text-4xl relative overflow-hidden">
                        {match.p1?.image_url ? (
                          <img src={match.p1.image_url} alt={match.p1.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          match.p1?.imageEmoji || '👤'
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">{match.p1?.name || 'Nominee'}</h4>
                      <span className="text-[8px] font-mono text-primary uppercase">{match.p1?.personality || 'Style Icon'}</span>
                      {match.winner?.id === match.p1?.id && (
                        <div className="absolute top-2 right-2 text-primary">
                          <Check size={12} />
                        </div>
                      )}
                      {match.winner && match.winner.id !== match.p1?.id && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest -rotate-12">Eliminated</span>
                        </div>
                      )}
                    </div>

                    <div className="font-syne font-black text-white/20 text-2xl italic">VS</div>

                    {/* Player 2 */}
                    <div className={`flex-1 bg-card rounded-2xl p-4 border-2 transition-all relative overflow-hidden ${
                      match.live ? 'border-primary animate-pulse' : match.winner?.id === match.p2?.id ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/5 opacity-50'
                    }`}>
                      <div className="aspect-square bg-black rounded-xl mb-3 flex items-center justify-center text-4xl relative overflow-hidden">
                        {match.p2?.image_url ? (
                          <img src={match.p2.image_url} alt={match.p2.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          match.p2?.imageEmoji || '👤'
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">{match.p2?.name || 'Nominee'}</h4>
                      <span className="text-[8px] font-mono text-primary uppercase">{match.p2?.personality || 'Style Icon'}</span>
                      {match.winner?.id === match.p2?.id && (
                        <div className="absolute top-2 right-2 text-primary">
                          <Check size={12} />
                        </div>
                      )}
                      {match.winner && match.winner.id !== match.p2?.id && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest -rotate-12">Eliminated</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full py-4 bg-primary text-white font-bold rounded-pill shadow-lg shadow-primary/30 flex items-center justify-center gap-3">
              <Instagram size={20} /> Vote Now on Instagram
            </button>
            <p className="text-[10px] font-mono text-muted text-center uppercase tracking-widest">
              Voting on our Instagram story. Winner advances here.
            </p>
          </div>
        )}

        {activeTab === 'Nominees' && (
          <div className="grid grid-cols-2 gap-4">
            {nominees.map((nominee, i) => (
              <div key={nominee.id || i} className="bg-card rounded-card p-4 border border-white/5 flex flex-col gap-3 relative overflow-hidden">
                <div className="aspect-square bg-black rounded-xl flex items-center justify-center text-5xl relative overflow-hidden">
                  {nominee.image_url ? (
                    <img src={nominee.image_url} alt={nominee.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    nominee.imageEmoji || '👤'
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{nominee.name || nominee.display_name}</h4>
                  <p className="text-[10px] font-mono text-muted">{nominee.handle || nominee.instagram_handle}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-[8px] font-mono font-bold uppercase px-2 py-1 rounded-pill ${
                    nominee.status === 'In' || nominee.status === 'Approved — Nominated' ? 'bg-primary/10 text-primary' : 'bg-white/5 text-muted'
                  }`}>
                    {nominee.status === 'In' || nominee.status === 'Approved — Nominated' ? 'Still In' : 'Eliminated'}
                  </span>
                  <span className="text-[10px] font-mono text-secondary">{(nominee.votes || 0).toLocaleString()} votes</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Hall of Fame' && (
          <div className="flex flex-col gap-4">
            {[
              { name: 'Tafadzwa', month: 'March 2026', personality: 'The Nonchalant', votes: 4520 },
              { name: 'Simba', month: 'February 2026', personality: 'The Hustler', votes: 3890 },
              { name: 'Rudo', month: 'January 2026', personality: 'The Creative', votes: 5120 },
            ].map((champ, i) => (
              <div key={i} className="bg-card rounded-card p-6 border border-secondary/20 flex items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 blur-2xl rounded-full -mr-8 -mt-8" />
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <Award size={32} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-pacifico text-white">{champ.name}</h4>
                      <p className="text-[10px] font-mono text-muted uppercase tracking-widest">{champ.month}</p>
                    </div>
                    <div className="flex items-center gap-1 text-secondary">
                      <Star size={12} fill="currentColor" />
                      <span className="text-[10px] font-mono font-bold">CHAMP</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-[10px] font-mono text-primary uppercase">{champ.personality}</span>
                    <span className="text-[10px] font-mono text-muted">{champ.votes.toLocaleString()} votes</span>
                  </div>
                </div>
              </div>
            ))}
            <button 
              onClick={() => setActiveTab('Enter')}
              className="mt-8 w-full py-4 border-2 border-primary text-primary font-bold rounded-pill hover:bg-primary hover:text-white transition-all"
            >
              Submit Your Outfit for May
            </button>
          </div>
        )}

        {activeTab === 'Enter' && (
          <div className="flex flex-col gap-8">
            {existingEntry ? (
              <div className="flex flex-col gap-6">
                <div className="bg-card rounded-card p-6 border border-white/5 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-green uppercase tracking-widest font-bold">Entry Submitted</span>
                      <h3 className="text-xl font-syne font-bold text-white">Your Submission</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-pill text-[10px] font-mono font-bold uppercase ${
                      existingEntry.status === 'Approved — Nominated' ? 'bg-green/10 text-green' :
                      existingEntry.status === 'Rejected' ? 'bg-red/10 text-red' : 'bg-amber/10 text-amber'
                    }`}>
                      {existingEntry.status}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 bg-elevated p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-muted uppercase">Name:</span>
                      <span className="text-sm font-sans text-white font-bold">{existingEntry.displayName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-muted uppercase">Instagram:</span>
                      <span className="text-sm font-mono text-primary font-bold">@{existingEntry.handle}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-muted uppercase">Post:</span>
                      <span className="text-[10px] font-mono text-muted truncate">{existingEntry.postUrl}</span>
                    </div>
                  </div>

                  {existingEntry.status === 'Rejected' && (
                    <div className="bg-red/5 border border-red/20 p-4 rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-red">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-mono uppercase font-bold">Rejection Reason</span>
                      </div>
                      <p className="text-xs font-sans text-muted">Post did not tag @threadzw in the photo. Please ensure all tags are visible.</p>
                      <button 
                        onClick={() => {
                          localStorage.removeItem(storageKey);
                          setExistingEntry(null);
                          setShowEntryForm(true);
                        }}
                        className="mt-2 w-full py-3 bg-primary text-white font-bold rounded-pill text-xs"
                      >
                        Submit New Entry
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-elevated border-l-4 border-primary p-5 rounded-r-2xl flex flex-col gap-2">
                  <div className="text-[10px] font-mono text-primary uppercase tracking-widest font-bold">Next Steps</div>
                  <p className="text-xs font-sans text-muted leading-relaxed">
                    We are currently reviewing your entry. If selected, you will be notified via the app and featured in the nominees section.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                <div className="bg-card rounded-card p-8 border border-white/5 text-center flex flex-col gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Trophy size={40} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-syne font-bold text-white">Enter Best Dresser</h3>
                    <p className="text-sm text-muted">Show off your drip and win $30 cash + Brand Ambassador status.</p>
                  </div>
                  <button 
                    onClick={() => setShowEntryForm(true)}
                    className="w-full py-4 bg-primary text-white font-bold rounded-pill shadow-lg shadow-primary/30"
                  >
                    Start Entry Form
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                    <span className="text-2xl">💰</span>
                    <span className="text-xs font-bold text-white">$30 Cash Prize</span>
                    <p className="text-[10px] text-muted">Paid via Paynow</p>
                  </div>
                  <div className="bg-card p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                    <span className="text-2xl">🎖️</span>
                    <span className="text-xs font-bold text-white">Ambassador</span>
                    <p className="text-[10px] text-muted">Get the verified badge</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {showEntryForm && (
          <BestDresserEntryForm onClose={() => setShowEntryForm(false)} />
        )}
      </div>
    </div>
  );
};

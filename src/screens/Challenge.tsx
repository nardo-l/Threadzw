
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search as SearchIcon, 
  X, 
  Check, 
  ChevronRight, 
  Copy, 
  Share2, 
  Calendar,
  Music,
  ShoppingBag,
  Utensils,
  Zap,
  Loader2,
  Trophy,
  Smile,
  AlertCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { searchYouTube, generateSongDecoys, YouTubeSong } from '../services/youtubeService';

// --- Types ---

interface ChallengeItem {
  id: string;
  title: string;
  image_url: string;
  display_order: number;
}

interface Attempt {
  id: string;
  participant_name: string;
  correct_count: number;
  total_questions: number;
  percentage: number;
  created_at: string;
  guess_outfit_id: string;
  guess_food_id: string;
  guess_activity_id: string;
  guess_song_video_id: string;
  guess_birthday: string;
}

// --- Helper Functions ---

const generateBirthdayDecoys = (realDate: string) => {
  const real = new Date(realDate);
  const decoys: string[] = [];
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  while (decoys.length < 3) {
    const fakeMonth = Math.floor(Math.random() * 12);
    const fakeDay = Math.floor(Math.random() * 28) + 1;
    const fakeYear = real.getFullYear() - Math.floor(Math.random() * 5);
    
    const fakeDate = `${months[fakeMonth]} ${fakeDay}, ${fakeYear}`;
    const realFormatted = `${months[real.getMonth()]} ${real.getDate()}, ${real.getFullYear()}`;
    
    if (fakeDate !== realFormatted && !decoys.includes(fakeDate)) {
      decoys.push(fakeDate);
    }
  }
  
  const realFormatted = `${months[real.getMonth()]} ${real.getDate()}, ${real.getFullYear()}`;
  const allOptions = [realFormatted, ...decoys];
  
  return allOptions.sort(() => Math.random() - 0.5);
};

// --- Main Component ---

export const Challenge = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams();
  
  // Navigation State
  const [screen, setScreen] = useState<'intro' | 'create' | 'created' | 'friend_intro' | 'friend_flow' | 'friend_result' | 'dashboard' | 'not_found'>('intro');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Creation State
  const [outfits, setOutfits] = useState<ChallengeItem[]>([]);
  const [foods, setFoods] = useState<ChallengeItem[]>([]);
  const [activities, setActivities] = useState<ChallengeItem[]>([]);
  
  const [selectedOutfit, setSelectedOutfit] = useState<ChallengeItem | null>(null);
  const [selectedSong, setSelectedSong] = useState<YouTubeSong | null>(null);
  const [selectedFood, setSelectedFood] = useState<ChallengeItem | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ChallengeItem | null>(null);
  const [selectedBirthday, setSelectedBirthday] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeSong[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [createdChallenge, setCreatedChallenge] = useState<any>(null);
  const [creatingMessageIndex, setCreatingMessageIndex] = useState(0);

  // Friend Flow State
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [participantName, setParticipantName] = useState('');
  const [guessOutfitId, setGuessOutfitId] = useState('');
  const [guessSongVideoId, setGuessSongVideoId] = useState('');
  const [guessFoodId, setGuessFoodId] = useState('');
  const [guessActivityId, setGuessActivityId] = useState('');
  const [guessBirthday, setGuessBirthday] = useState('');
  const [attemptResult, setAttemptResult] = useState<any>(null);

  // Dashboard State
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

  // Initialization
  useEffect(() => {
    if (urlSlug) {
      loadChallengeBySlug(urlSlug);
    } else {
      // If we are on /challenge/create but not signed in, navigate to auth
      // For now, let's just show intro if no slug
      setScreen('intro');
    }
  }, [urlSlug]);

  // Fetch Data for creation
  useEffect(() => {
    if (screen === 'create') {
      fetchChallengeItems();
    }
  }, [screen]);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        handleSearchSongs();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Loading Message Cycle
  useEffect(() => {
    if (loading && screen === 'create' && step === 5) {
      const messages = [
        "Finding decoy songs...",
        "Shuffling answers...",
        "Generating your link...",
        "Almost ready..."
      ];
      const timer = setInterval(() => {
        setCreatingMessageIndex(prev => (prev + 1) % messages.length);
      }, 1500);
      return () => clearInterval(timer);
    }
  }, [loading, screen, step]);

  const loadChallengeBySlug = async (slug: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_outfits!outfit_id (*),
          challenge_foods!food_id (*),
          challenge_activities!activity_id (*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        setScreen('not_found');
        return;
      }
      
      setActiveChallenge(data);
      setScreen('friend_intro');
    } catch (err) {
      console.error(err);
      setScreen('not_found');
    } finally {
      setLoading(false);
    }
  };

  const fetchChallengeItems = async () => {
    setLoading(true);
    try {
      const [outfitRes, foodRes, activityRes] = await Promise.all([
        supabase.from('challenge_outfits').select('*').eq('is_active', true).order('display_order', { ascending: true }),
        supabase.from('challenge_foods').select('*').eq('is_active', true).order('display_order', { ascending: true }),
        supabase.from('challenge_activities').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      ]);

      setOutfits(outfitRes.data || []);
      setFoods(foodRes.data || []);
      setActivities(activityRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSongs = async () => {
    setSearching(true);
    const results = await searchYouTube(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleCreateChallenge = async () => {
    if (!session) {
      toast.error('Please sign in to create a challenge');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Generate slug
      const { data: slugData, error: slugError } = await supabase.rpc('generate_challenge_slug');
      if (slugError) throw slugError;
      const slug = slugData;
      
      // 2. Generate decoys
      const songOptions = await generateSongDecoys(selectedSong!);
      
      // Get real birthday formatted as string
      const birthDate = new Date(selectedBirthday);
      const birthdayOptions = generateBirthdayDecoys(selectedBirthday);
      
      // 3. Insert
      const { data: challenge, error } = await supabase
        .from('challenges')
        .insert({
          creator_id: session.user.id,
          creator_name: profile?.display_name || session.user.email?.split('@')[0] || 'User',
          creator_avatar_url: profile?.avatar_url,
          slug,
          outfit_id: selectedOutfit!.id,
          food_id: selectedFood!.id,
          activity_id: selectedActivity!.id,
          song: selectedSong,
          birthday: selectedBirthday,
          song_options: songOptions,
          birthday_options: birthdayOptions
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setCreatedChallenge(challenge);
      setScreen('created');
    } catch (err) {
      console.error(err);
      toast.error('Could not create challenge. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttempt = async () => {
    setLoading(true);
    try {
      let correct = 0;
      if (guessOutfitId === activeChallenge.outfit_id) correct++;
      if (guessSongVideoId === activeChallenge.song.videoId) correct++;
      if (guessFoodId === activeChallenge.food_id) correct++;
      if (guessActivityId === activeChallenge.activity_id) correct++;
      
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
      const realBirthday = new Date(activeChallenge.birthday);
      const realFormatted = `${months[realBirthday.getMonth()]} ${realBirthday.getDate()}, ${realBirthday.getFullYear()}`;
      if (guessBirthday === realFormatted) correct++;
      
      const percentage = Math.round((correct / 5) * 100);
      
      const { data: attempt, error } = await supabase
        .from('challenge_attempts')
        .insert({
          challenge_id: activeChallenge.id,
          participant_name: participantName.trim(),
          guess_outfit_id: guessOutfitId,
          guess_food_id: guessFoodId,
          guess_activity_id: guessActivityId,
          guess_song_video_id: guessSongVideoId,
          guess_birthday: guessBirthday,
          correct_count: correct,
          total_questions: 5,
          percentage
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setAttemptResult({ correct, percentage, attempt });
      setScreen('friend_result');
    } catch (err) {
      console.error(err);
      toast.error('Could not submit attempt.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoaderboardData = async (challengeId: string) => {
    setLoadingLeaderboard(true);
    try {
      const { data, error } = await supabase
        .from('challenge_attempts')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('percentage', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setAttempts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // --- RENDERING HELPERS ---

  const renderProgressBar = () => (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black p-4 pb-0">
      <div className="h-1 w-full flex gap-1 rounded-full overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div 
            key={`challenge-progress-${i}`} 
            className="h-full flex-1 transition-all duration-500"
            style={{ 
              background: i < step ? 'linear-gradient(to right, #FF2D78, #FF2D78)' : i === step ? '#FF2D78' : '#e5e7eb',
              opacity: i <= step ? 1 : 0.3
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <button 
          onClick={() => step === 1 ? (urlSlug ? navigate('/') : setScreen('intro')) : setStep(step - 1)}
          className="p-2 -ml-2 text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-[12px] font-medium text-[#888]">
          Step {step} of 5
        </span>
        <div className="w-10" /> {/* Spacer */}
      </div>
    </div>
  );

  const ProgressMessages = [
    "Finding decoy songs...",
    "Shuffling answers...",
    "Generating your link...",
    "Almost ready..."
  ];

  // --- Screens ---

  if (screen === 'intro') {
    return (
      <div className="min-h-screen flex flex-col p-6 items-center justify-center text-center bg-[#0d0d0d]">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-[#FF2D78]/10">
          <Zap size={40} className="text-[#FF2D78] animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold mb-4 font-display text-white">Thread Challenge</h1>
        <p className="text-[15px] mb-8 max-w-sm text-[#888]">
          Create a personal challenge and see who knows you best! Share your link and top the leaderboard.
        </p>
        
        <div className="space-y-4 w-full max-w-xs">
          <button 
            onClick={() => {
              if (session) {
                setScreen('create');
                setStep(1);
              } else {
                toast.error('Sign in to start your challenge');
                navigate('/auth');
              }
            }}
            className="w-full h-14 rounded-full font-bold text-white shadow-lg bg-[#FF2D78]"
          >
            Start My Challenge 🎯
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full h-14 rounded-full font-bold border border-[#222] text-white"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'create' && loading && step === 5) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0d0d0d]">
        <Loader2 className="animate-spin mb-6 text-[#FF2D78]" size={40} />
        <h2 className="text-xl font-bold mb-2 text-white">Building your challenge...</h2>
        <p className="text-[14px] animate-fade-in text-[#888]">
          {ProgressMessages[creatingMessageIndex]}
        </p>
      </div>
    );
  }

  if (screen === 'create') {
    return (
      <div className="min-h-screen pt-20 pb-28 px-5 bg-[#0d0d0d]">
        {renderProgressBar()}
        
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <header>
                <h1 className="text-2xl font-bold font-display text-white">Pick your outfit</h1>
                <p className="text-[14px] mt-1 text-[#888]">Which one is most you?</p>
              </header>
              <div className="grid grid-cols-2 gap-3">
                {outfits.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedOutfit(item)}
                    className="aspect-[3/4] rounded-[16px] overflow-hidden relative cursor-pointer group active:scale-[0.98] transition-all"
                    style={{ 
                      border: selectedOutfit?.id === item.id ? `2.5px solid #FF2D78` : '2px solid transparent',
                      boxShadow: selectedOutfit?.id === item.id ? `0 0 0 3px rgba(255,45,120,0.1)` : 'none'
                    }}
                  >
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-white text-[13px] font-bold">{item.title}</span>
                    </div>
                    {selectedOutfit?.id === item.id && (
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white bg-[#FF2D78]">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <header>
                <h1 className="text-2xl font-bold font-display text-white">Pick your song</h1>
                <p className="text-[14px] mt-1 text-[#888]">The one that's always on repeat right now.</p>
              </header>

              {!selectedSong ? (
                <div className="space-y-4">
                  <div className="relative group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888]" size={18} />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for a song..."
                      className="w-full h-12 rounded-xl border transition-all pl-11 pr-10 outline-none bg-[#111] border-[#222] text-white shadow-none"
                    />
                    {searching && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#FF2D78]" size={16} />
                    )}
                    {searchQuery && !searching && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888]">
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {searchResults.map(result => (
                      <div 
                        key={result.videoId}
                        onClick={() => setSelectedSong(result)}
                        className="flex items-center p-3 rounded-xl border group hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer bg-[#111] border-[#222]"
                      >
                       <img src={result.thumbnail} alt={result.title} className="w-[60px] h-11 rounded object-cover" />
                       <div className="ml-3 flex-1 min-w-0">
                         <h3 className="text-[14px] font-bold truncate text-white">{result.title}</h3>
                         <p className="text-[12px] mt-0.5 text-[#888]">{result.channelTitle}</p>
                       </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border flex items-center bg-[#FF2D78]/10 border-[#FF2D78]/20">
                  <img src={selectedSong.thumbnail} alt={selectedSong.title} className="w-20 h-14 rounded-lg object-cover" />
                  <div className="ml-4 flex-1 min-w-0">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-[#FF2D78]">Your Song:</span>
                    <h3 className="text-[15px] font-bold mt-1 truncate text-white">{selectedSong.title}</h3>
                    <p className="text-[12px] mt-0.5 text-[#888]">{selectedSong.channelTitle}</p>
                  </div>
                  <button onClick={() => setSelectedSong(null)} className="ml-4 text-[11px] font-bold px-3 py-1.5 rounded-full border border-[#222] text-[#888]">
                    Change
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <header>
                <h1 className="text-2xl font-bold font-display text-white">Pick your favourite</h1>
                <p className="text-[14px] mt-1 text-[#888]">Food or drink you always go for</p>
              </header>
              <div className="grid grid-cols-2 gap-3">
                {foods.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedFood(item)}
                    className="aspect-square rounded-[16px] overflow-hidden relative cursor-pointer active:scale-[0.98] transition-all"
                    style={{ 
                      border: selectedFood?.id === item.id ? `2.5px solid #FF2D78` : '2px solid transparent',
                      boxShadow: selectedFood?.id === item.id ? `0 0 0 3px rgba(255,45,120,0.1)` : 'none'
                    }}
                  >
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                      <span className="text-white text-[13px] font-bold">{item.title}</span>
                    </div>
                    {selectedFood?.id === item.id && (
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white bg-[#FF2D78]">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <header>
                <h1 className="text-2xl font-bold font-display text-white">What's your vibe?</h1>
                <p className="text-[14px] mt-1 text-[#888]">Pick your favourite activity</p>
              </header>
              <div className="grid grid-cols-2 gap-3">
                {activities.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedActivity(item)}
                    className="aspect-square rounded-[16px] overflow-hidden relative cursor-pointer active:scale-[0.98] transition-all"
                    style={{ 
                      border: selectedActivity?.id === item.id ? `2.5px solid #FF2D78` : '2px solid transparent',
                      boxShadow: selectedActivity?.id === item.id ? `0 0 0 3px rgba(255,45,120,0.1)` : 'none'
                    }}
                  >
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                      <span className="text-white text-[14px] font-bold w-full text-center">{item.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <header>
                <h1 className="text-2xl font-bold font-display text-white">When's your birthday?</h1>
                <p className="text-[14px] mt-1 text-[#888]">Your friends will have to guess</p>
              </header>

              <div className="flex gap-2">
                <select 
                  className="w-1/4 h-14 rounded-xl border outline-none px-2 text-center text-lg appearance-none bg-[#111] border-[#222] text-white"
                  value={selectedBirthday ? new Date(selectedBirthday).getDate() : ''}
                  onChange={(e) => {
                    const date = selectedBirthday ? new Date(selectedBirthday) : new Date();
                    date.setDate(parseInt(e.target.value));
                    setSelectedBirthday(date.toISOString().split('T')[0]);
                  }}
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                
                <select 
                  className="flex-1 h-14 rounded-xl border outline-none px-4 text-lg appearance-none bg-[#111] border-[#222] text-white"
                  value={selectedBirthday ? new Date(selectedBirthday).getMonth() : ''}
                  onChange={(e) => {
                    const date = selectedBirthday ? new Date(selectedBirthday) : new Date();
                    date.setMonth(parseInt(e.target.value));
                    setSelectedBirthday(date.toISOString().split('T')[0]);
                  }}
                >
                  <option value="">Month</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>

                <select 
                  className="w-[30%] h-14 rounded-xl border outline-none px-2 text-center text-lg appearance-none bg-[#111] border-[#222] text-white"
                  value={selectedBirthday ? new Date(selectedBirthday).getFullYear() : ''}
                  onChange={(e) => {
                    const date = selectedBirthday ? new Date(selectedBirthday) : new Date();
                    date.setFullYear(parseInt(e.target.value));
                    setSelectedBirthday(date.toISOString().split('T')[0]);
                  }}
                >
                  <option value="">Year</option>
                  {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-2xl border flex items-start gap-4 bg-blue-500/10 border-blue-500/20">
                <span className="text-xl">🔒</span>
                <p className="text-[12px] leading-relaxed text-[#888]">
                   Your real birthday is only used to create the challenge. Friends only see shuffled options.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed bottom-0 left-0 right-0 p-5 pb-8 bg-gradient-to-t from-black via-black/80 to-transparent">
          <button 
            disabled={
              (step === 1 && !selectedOutfit) ||
              (step === 2 && !selectedSong) ||
              (step === 3 && !selectedFood) ||
              (step === 4 && !selectedActivity) ||
              (step === 5 && !selectedBirthday) ||
              loading
            }
            onClick={() => {
              if (step < 5) setStep(step + 1);
              else handleCreateChallenge();
            }}
            className="w-full h-14 rounded-full font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-[#FF2D78]"
            style={{ 
              opacity: (
                (step === 1 && !selectedOutfit) ||
                (step === 2 && !selectedSong) ||
                (step === 3 && !selectedFood) ||
                (step === 4 && !selectedActivity) ||
                (step === 5 && !selectedBirthday)
              ) ? 0.5 : 1
            }}
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (
              step === 5 ? 'Create My Challenge →' : `Next: ${
                step === 1 ? 'Pick Your Song' : 
                step === 2 ? 'Pick Your Food' : 
                step === 3 ? 'Pick Your Activity' : 'Pick Your Birthday'
              } →`
            )}
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'created') {
    return (
      <div className="min-h-screen pt-20 pb-28 px-6 flex flex-col items-center text-center overflow-hidden bg-[#0d0d0d]">
         {/* Confetti Animation Placeholder */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={`confetti-${i}`}
              className="absolute w-2 h-2 rounded-full animate-confetti-fall"
              style={{ 
                left: `${Math.random() * 100}%`,
                background: ['#FF2D78', '#A855F7', '#22C55E', '#F59E0B'][Math.floor(Math.random() * 4)],
                animationDuration: `${2 + Math.random() * 2}s`,
                animationDelay: `${Math.random() * 1}s`
              }}
            />
          ))}
        </div>

        <div className="animate-bounce-in">
          <span className="text-6xl mb-6 block">🎯</span>
        </div>
        <h1 className="text-3xl font-bold font-display mt-4 text-white">Your Challenge is Live!</h1>
        <p className="text-[14px] font-mono mt-2 text-[#FF2D78]">@{createdChallenge?.slug}</p>

        <div className="mt-8 w-full max-w-sm bg-[#111] border rounded-[24px] p-6 shadow-xl border-[#222]">
          <p className="text-[12px] font-medium text-left mb-3 text-[#888]">Your challenge link:</p>
          <div className="flex items-center gap-3 p-3 rounded-2xl mb-6 bg-[#0d0d0d] border border-[#222]">
            <span className="flex-1 text-[13px] font-mono truncate text-white">
              https://threadzw.com/challenge/{createdChallenge?.slug}
            </span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`https://threadzw.com/challenge/${createdChallenge?.slug}`);
                toast.success('Link copied!');
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 bg-[#FF2D78]/10 text-[#FF2D78]"
            >
              <Copy size={16} />
            </button>
          </div>

          <div className="space-y-3">
             <button 
                onClick={async () => {
                  const link = `https://threadzw.com/challenge/${createdChallenge?.slug}`;
                  const text = `Do you really know me? 🎯\nTake my Thread ZW challenge and find out!\n\n${link}\n\n#ThreadZW #ZimbabweChallenge`;
                  if (navigator.share) {
                    try { await navigator.share({ title: 'My Thread ZW Challenge', text, url: link }); } catch (e) {}
                  } else {
                    navigator.clipboard.writeText(link);
                    toast.success('Link copied!');
                  }
                }}
                className="w-full h-14 rounded-full font-bold text-white flex items-center justify-center gap-3 bg-[#FF2D78]"
              >
                <Share2 size={18} />
                Share Challenge
              </button>
              
              <button 
                onClick={() => {
                  const link = `https://threadzw.com/challenge/${createdChallenge?.slug}`;
                  const text = encodeURIComponent(`Do you really know me? 🎯\nTake my challenge: ${link}`);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="w-full h-14 rounded-full font-bold text-white flex items-center justify-center gap-3"
                style={{ background: '#25D366' }}
              >
                 <span className="text-lg">💬</span>
                 Share on WhatsApp
              </button>
          </div>
        </div>

        <button 
          onClick={() => {
            setScreen('dashboard');
            fetchLoaderboardData(createdChallenge.id);
          }}
          className="mt-8 font-bold flex items-center gap-2 transition-opacity hover:opacity-80 text-white"
        >
          View Results Dashboard <ChevronRight size={18} />
        </button>

        <style>{`
          @keyframes confetti-fall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          .animate-confetti-fall {
            animation: confetti-fall linear infinite;
          }
          .animate-bounce-in {
             animation: bounce-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          @keyframes bounce-in {
             0% { transform: scale(0); }
             70% { transform: scale(1.1); }
             100% { transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  if (screen === 'friend_intro') {
    return (
      <div className="min-h-screen flex flex-col p-6 items-center justify-center text-center bg-[#0d0d0d]">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#FF2D78]">
            <img 
              src={activeChallenge?.creator_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChallenge?.creator_name || 'User')}&background=random`} 
              alt="Creator" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-2 border-2 border-black">
            <Zap size={16} className="text-black" />
          </div>
        </div>

        <div className="mt-6">
          <h1 className="text-2xl font-bold text-white">{activeChallenge?.creator_name}</h1>
          <p className="text-lg mt-1 text-[#888]">challenged you! 🎯</p>
        </div>

        <div className="mt-8 w-full max-w-sm rounded-[24px] border p-6 space-y-4 bg-[#111] border-[#222]">
          <p className="text-[13px] text-[#888]">
            <span className="font-bold text-white">{activeChallenge?.attempt_count}</span> people have tried this challenge
          </p>
          <div className="h-px w-full bg-[#222]" />
          <p className="text-[13px] font-medium text-[#888]">
            5 questions • Guess their preferences • See your score
          </p>
        </div>

        <div className="mt-8 w-full max-w-sm text-left">
          <label className="text-[13px] font-bold mb-2 block text-white">Your name</label>
          <input 
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full h-14 rounded-2xl px-4 text-base outline-none border focus:border-[#FF2D78] transition-all bg-[#111] border-[#222] text-white"
          />
          
          <button 
            disabled={!participantName.trim()}
            onClick={() => {
              setScreen('friend_flow');
              setStep(1);
            }}
            className="w-full h-14 rounded-full font-bold text-white mt-6 shadow-xl active:scale-[0.98] transition-all bg-[#FF2D78]"
            style={{ opacity: participantName.trim() ? 1 : 0.5 }}
          >
            Start Challenge 🎯
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'friend_flow') {
    const creatorName = activeChallenge?.creator_name;
    return (
      <div className="min-h-screen pt-20 pb-28 px-5 bg-[#0d0d0d]">
        {renderProgressBar()}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="f1" className="space-y-6">
               <header>
                <h1 className="text-2xl font-bold font-display text-white">
                  Which outfit did {creatorName} pick?
                </h1>
              </header>
              <div className="grid grid-cols-2 gap-3">
                {outfits.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setGuessOutfitId(item.id)}
                    className="aspect-[3/4] rounded-[16px] overflow-hidden relative"
                    style={{ border: guessOutfitId === item.id ? `2.5px solid #FF2D78` : '2px solid transparent' }}
                  >
                    <img src={item.image_url} alt="Option" className="w-full h-full object-cover" />
                    {guessOutfitId === item.id && (
                       <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white bg-[#FF2D78]">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="f2" className="space-y-6">
              <header>
                <h1 className="text-2xl font-bold font-display text-white">
                  What song is always on {creatorName}'s playlist?
                </h1>
              </header>
              <div className="space-y-3">
                {activeChallenge.song_options.map((song: YouTubeSong) => (
                  <div 
                    key={song.videoId}
                    onClick={() => setGuessSongVideoId(song.videoId)}
                    className="flex items-center p-3 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] bg-[#111]"
                    style={{ 
                      borderColor: guessSongVideoId === song.videoId ? '#FF2D78' : '#222' 
                    }}
                  >
                    <img src={song.thumbnail} alt="Thumbnail" className="w-14 h-11 rounded-lg object-cover" />
                    <div className="ml-3 flex-1 min-w-0">
                      <h3 className="text-sm font-bold truncate text-white">{song.title}</h3>
                      <p className="text-xs mt-0.5 text-[#888]">{song.channelTitle}</p>
                    </div>
                    {guessSongVideoId === song.videoId && (
                       <div className="w-6 h-6 rounded-full flex items-center justify-center text-white bg-[#FF2D78]">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="f3" className="space-y-6">
               <header>
                <h1 className="text-2xl font-bold font-display text-white">
                  What's {creatorName}'s favourite food or drink?
                </h1>
              </header>
              <div className="grid grid-cols-2 gap-3">
                {foods.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setGuessFoodId(item.id)}
                    className="aspect-square rounded-[16px] overflow-hidden relative"
                    style={{ border: guessFoodId === item.id ? `2.5px solid #FF2D78` : '2px solid transparent' }}
                  >
                    <img src={item.image_url} alt="Option" className="w-full h-full object-cover" />
                    {guessFoodId === item.id && (
                       <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white bg-[#FF2D78]">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="f4" className="space-y-6">
               <header>
                <h1 className="text-2xl font-bold font-display text-white">
                  What's {creatorName}'s favourite activity?
                </h1>
              </header>
              <div className="grid grid-cols-2 gap-3">
                {activities.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setGuessActivityId(item.id)}
                    className="aspect-square rounded-[16px] overflow-hidden relative"
                    style={{ border: guessActivityId === item.id ? `2.5px solid #FF2D78` : '2px solid transparent' }}
                  >
                    <img src={item.image_url} alt="Option" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-sm font-bold text-center">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="f5" className="space-y-6">
               <header>
                <h1 className="text-2xl font-bold font-display text-white">
                   When is {creatorName}'s birthday?
                </h1>
              </header>
              <div className="space-y-3">
                {activeChallenge.birthday_options.map((option: string, idx: number) => (
                  <div 
                    key={`${option}-${idx}`}
                    onClick={() => setGuessBirthday(option)}
                    className="p-5 rounded-[18px] border text-center transition-all active:scale-[0.98] cursor-pointer"
                    style={{ 
                      background: guessBirthday === option ? 'rgba(255,45,120,0.1)' : '#111', 
                      borderColor: guessBirthday === option ? '#FF2D78' : '#222' 
                    }}
                  >
                    <span className="text-[16px] font-bold text-white">{option}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed bottom-0 left-0 right-0 p-5 pb-8 bg-gradient-to-t from-black via-black/80 to-transparent">
          <button 
            disabled={
              (step === 1 && !guessOutfitId) ||
              (step === 2 && !guessSongVideoId) ||
              (step === 3 && !guessFoodId) ||
              (step === 4 && !guessActivityId) ||
              (step === 5 && !guessBirthday) ||
              loading
            }
            onClick={() => {
              if (step < 5) setStep(step + 1);
              else handleSubmitAttempt();
            }}
            className="w-full h-14 rounded-full font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center bg-[#FF2D78]"
            style={{ 
              opacity: (
                (step === 1 && !guessOutfitId) ||
                (step === 2 && !guessSongVideoId) ||
                (step === 3 && !guessFoodId) ||
                (step === 4 && !guessActivityId) ||
                (step === 5 && !guessBirthday)
              ) ? 0.5 : 1
            }}
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (
              step === 5 ? 'See How You Did! 🎯' : 'Continue'
            )}
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'friend_result') {
    const res = attemptResult;
    const scoreColor = res.percentage === 100 ? '#FFD700' : 
                      res.percentage >= 80 ? '#10b981' :
                      res.percentage >= 60 ? '#FF2D78' :
                      res.percentage >= 40 ? '#f59e0b' : '#ef4444';
    
    const scoreMsg = res.percentage === 100 ? "You know them perfectly! 👑" :
                     res.percentage >= 80 ? "You really know them! 🔥" :
                     res.percentage >= 60 ? "Pretty good! 😎" :
                     res.percentage >= 40 ? "Average guess 🤔" : "You don't know them 😭";

    return (
      <div className="min-h-screen pt-20 pb-28 px-6 flex flex-col items-center bg-[#0d0d0d]">
         <div className="relative flex flex-col items-center">
            <div 
              className="w-36 h-36 rounded-full border-[5px] flex flex-col items-center justify-center animate-scale-in"
              style={{ borderColor: scoreColor }}
            >
              <div className="flex items-baseline">
                <span className="text-5xl font-black" style={{ color: scoreColor }}>{res.percentage}</span>
                <span className="text-xl font-bold ml-0.5" style={{ color: scoreColor }}>%</span>
              </div>
            </div>
            <h2 className="text-xl font-bold mt-6 text-center text-white">{scoreMsg}</h2>
         </div>

         <div className="mt-10 w-full max-w-sm rounded-[24px] border p-6 bg-[#111] border-[#222]">
            <h3 className="text-sm font-bold mb-4 text-white">Question Breakdown</h3>
            <div className="space-y-4">
               {[
                 { name: 'Outfit', correct: guessOutfitId === activeChallenge.outfit_id },
                 { name: 'Song', correct: guessSongVideoId === activeChallenge.song.videoId },
                 { name: 'Food', correct: guessFoodId === activeChallenge.food_id },
                 { name: 'Activity', correct: guessActivityId === activeChallenge.activity_id },
                 { name: 'Birthday', correct: guessBirthday.includes(new Date(activeChallenge.birthday).getFullYear().toString()) } // Simple check
               ].map((q, idx) => (
                 <div key={`question-breakdown-${idx}`} className="flex items-center justify-between py-1 border-b last:border-0 border-[#222]">
                   <span className="text-[13px] text-[#888]">{q.name}</span>
                   <div className="flex items-center gap-1.5">
                     {q.correct ? (
                       <>
                         <Check size={14} className="text-[#10b981]" strokeWidth={3} />
                         <span className="text-[13px] font-bold text-[#10b981]">Correct</span>
                       </>
                     ) : (
                       <>
                         <X size={14} className="text-[#ef4444]" strokeWidth={3} />
                         <span className="text-[13px] font-bold text-[#ef4444]">Wrong</span>
                       </>
                     )}
                   </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="mt-10 w-full max-w-sm space-y-3">
            <button 
              onClick={async () => {
                const text = `I scored ${res.percentage}% on ${activeChallenge.creator_name}'s Thread Challenge! 🎯\nCan you beat me?\n\nhttps://threadzw.com/challenge/${activeChallenge.slug}`;
                if (navigator.share) {
                   try { await navigator.share({ title: 'My Score', text }); } catch(e) {}
                } else {
                   navigator.clipboard.writeText(text);
                   toast.success('Result copied!');
                }
              }}
              className="w-full h-14 rounded-full font-bold text-white shadow-lg active:scale-[0.98] transition-all bg-[#FF2D78]"
            >
              📤 Share My Score
            </button>

            <button 
              onClick={() => {
                setScreen('intro');
                setStep(1);
              }}
              className="w-full h-14 rounded-full font-bold border active:scale-[0.98] transition-all border-[#222] text-white"
            >
              Create My Own Challenge →
            </button>
         </div>
      </div>
    );
  }

  if (screen === 'dashboard') {
    const avgScore = attempts.length > 0 
      ? Math.round(attempts.reduce((acc, curr) => acc + curr.percentage, 0) / attempts.length)
      : 0;
    const topScore = attempts.length > 0 
      ? Math.max(...attempts.map(a => a.percentage))
      : 0;

    return (
      <div className="min-h-screen pt-4 pb-28 bg-[#0d0d0d]">
        <header className="flex items-center px-5 mb-6">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-white">
            <ArrowLeft size={22} />
          </button>
          <h1 className="ml-2 text-lg font-bold text-white">My Challenge Dashboard</h1>
        </header>

        <div className="px-5 grid grid-cols-3 gap-3 mb-8">
           <div className="p-4 rounded-2xl border text-center bg-[#111] border-[#222]">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-[#888]">Attempts</p>
              <h2 className="text-2xl font-black text-white">{attempts.length}</h2>
           </div>
           <div className="p-4 rounded-2xl border text-center bg-[#111] border-[#222]">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-[#888]">Avg Score</p>
              <h2 className="text-2xl font-black text-[#FF2D78]">{avgScore}<span className="text-xs font-bold ml-0.5">%</span></h2>
           </div>
           <div className="p-4 rounded-2xl border text-center bg-[#111] border-[#222]">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-[#888]">Top Score</p>
              <h2 className="text-2xl font-black text-[#10b981]">{topScore}<span className="text-xs font-bold ml-0.5">%</span></h2>
           </div>
        </div>

        <div className="mx-5 mb-8 p-4 rounded-2xl border bg-[#111] border-[#222]">
           <div className="flex items-center justify-between mb-4">
              <span className="text-[12px] font-medium text-[#888]">Share your challenge:</span>
              <div className="flex gap-2">
                 <button 
                  onClick={() => {
                    const link = `https://threadzw.com/challenge/${createdChallenge?.slug}`;
                    navigator.clipboard.writeText(link);
                    toast.success('Link copied!');
                  }}
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-[#222] text-white"
                 >
                   Copy Link
                 </button>
              </div>
           </div>
        </div>

        <div className="px-5">
           <h3 className="text-lg font-bold mb-4 text-white">Leaderboard 🏆</h3>
           
           {loadingLeaderboard ? (
             <div className="space-y-3">
               {[1, 2, 3, 4].map(i => (
                 <div key={`leaderboard-shimmer-${i}`} className="h-20 rounded-2xl animate-pulse bg-[#111]" />
               ))}
             </div>
           ) : attempts.length === 0 ? (
             <div className="py-12 flex flex-col items-center text-center opacity-60">
                <span className="text-4xl mb-4">🎯</span>
                <p className="text-base font-bold text-white">No attempts yet</p>
                <p className="text-sm mt-1 text-[#888]">Share your challenge link with friends to get started!</p>
             </div>
           ) : (
             <div className="space-y-3">
                {attempts.map((a, idx) => {
                   const color = a.percentage === 100 ? '#FFD700' : a.percentage >= 80 ? '#10b981' : a.percentage >= 60 ? '#FF2D78' : a.percentage >= 40 ? '#f59e0b' : '#ef4444';
                   return (
                     <div key={a.id} className="overflow-hidden rounded-[20px] border border-[#222] bg-[#111]">
                        <div 
                          className="p-4 flex items-center cursor-pointer active:scale-[0.99] transition-all"
                          onClick={() => setExpandedAttempt(expandedAttempt === a.id ? null : a.id)}
                        >
                           <div className="w-10 text-center font-black text-lg text-[#555]">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                           </div>
                           <div className="ml-2 flex-1 min-w-0">
                              <h4 className="text-[15px] font-bold truncate text-white">{a.participant_name}</h4>
                              <p className="text-[12px] mt-0.5 text-[#888]">{a.correct_count}/5 correct</p>
                           </div>
                           <div className="w-11 h-11 rounded-full border-[2.5px] flex items-center justify-center transition-all" style={{ borderColor: color }}>
                              <span className="text-[13px] font-black" style={{ color }}>{a.percentage}%</span>
                           </div>
                        </div>
                     </div>
                   );
                })}
             </div>
           )}
        </div>
      </div>
    );
  }

  if (screen === 'not_found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#0d0d0d]">
        <AlertCircle size={60} className="text-[#ef4444]" />
        <h1 className="text-2xl font-bold mt-6 text-white">Challenge Not Found</h1>
        <p className="text-[15px] mt-2 mb-8 text-[#888]">
          The link might be broken or the challenge has been deleted.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-4 rounded-full font-bold text-white shadow-lg bg-[#FF2D78]"
        >
          Back to Thread ZW
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
      <Loader2 className="animate-spin text-[#FF2D78]" size={32} />
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Share2, RefreshCw, Trophy, Users, CheckCircle2, XCircle, Music } from 'lucide-react';
import html2canvas from 'html2canvas';
import { spotifyService, SpotifySession } from '../../services/spotifyService';
import { youtubeService, YouTubeSession } from '../../services/youtubeService';
import { toast } from 'sonner';

interface MusifyResultsProps {
  artist: any;
  correctCount: number;
  maxStreak: number;
  questions: any[];
  onPlayAgain: () => void;
  onTryAnother: () => void;
  onShowLeaderboard: () => void;
}

export const MusifyResults: React.FC<MusifyResultsProps> = ({
  artist,
  correctCount,
  maxStreak,
  questions,
  onPlayAgain,
  onTryAnother,
  onShowLeaderboard
}) => {
  const [count, setCount] = useState(0);
  const [spotifySession, setSpotifySession] = useState<SpotifySession | null>(null);
  const [youtubeSession, setYoutubeSession] = useState<YouTubeSession | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingYT, setIsSavingYT] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const percentage = Math.round((correctCount / 10) * 100);

  useEffect(() => {
    // Load Spotify session
    const savedSpotify = localStorage.getItem('musify_spotify_session');
    if (savedSpotify) {
      setSpotifySession(JSON.parse(savedSpotify));
    }

    // Load YouTube session
    const savedYT = localStorage.getItem('musify_youtube_session');
    if (savedYT) {
      setYoutubeSession(JSON.parse(savedYT));
    }

    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
        const session = event.data.payload as SpotifySession;
        setSpotifySession(session);
        localStorage.setItem('musify_spotify_session', JSON.stringify(session));
        toast.success('Spotify connected! 🎵');
      }
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const session = event.data.payload as YouTubeSession;
        setYoutubeSession(session);
        localStorage.setItem('musify_youtube_session', JSON.stringify(session));
        toast.success('YouTube Music connected! 🍿');
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const handleConnectSpotify = async () => {
    try {
      const url = await spotifyService.getAuthUrl();
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        url,
        'spotify_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (err) {
      toast.error('Failed to connect to Spotify');
    }
  };

  const handleSaveToSpotify = async () => {
    if (!spotifySession) return;
    setIsSaving(true);
    toast.loading('Creating playlist and adding tracks...', { id: 'spotify-save' });

    try {
      // 1. Create a playlist
      const playlistName = `${artist?.name || 'Musify'} Favorites · Musify Trivia`;
      const playlist = await spotifyService.createPlaylist(spotifySession, playlistName);
      
      if (playlist.error) {
        if (playlist.error.status === 401) {
          toast.error('Spotify session expired. Please reconnect.', { id: 'spotify-save' });
          setSpotifySession(null);
          localStorage.removeItem('musify_spotify_session');
          return;
        }
        throw new Error(playlist.error.message);
      }

      // 2. Search and add tracks
      const trackUris: string[] = [];
      const correctQuestions = questions.filter(q => q.isCorrect);
      
      for (const q of correctQuestions) {
        const query = encodeURIComponent(`${artist.name} ${q.correctTrack.title}`);
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
          headers: { 'Authorization': `Bearer ${spotifySession.access_token}` }
        });
        const searchData = await searchRes.json();
        if (searchData.tracks?.items?.[0]) {
          trackUris.push(searchData.tracks.items[0].uri);
        }
      }

      if (trackUris.length > 0) {
        await spotifyService.addTracks(spotifySession, playlist.id, trackUris.join(','));
        toast.success(`Successfully saved ${trackUris.length} tracks to Spotify!`, { id: 'spotify-save' });
      } else {
        toast.info('No tracks found to save.', { id: 'spotify-save' });
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save tracks: ' + err.message, { id: 'spotify-save' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectYouTube = async () => {
    try {
      const url = await youtubeService.getAuthUrl();
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(url, 'youtube_oauth', `width=${width},height=${height},left=${left},top=${top}`);
    } catch (err) {
      toast.error('Failed to connect to Google');
    }
  };

  const handleSaveToYouTube = async () => {
    if (!youtubeSession) return;
    setIsSavingYT(true);
    toast.loading('Creating YouTube playlist...', { id: 'yt-save' });

    try {
      const videoIds = questions.filter(q => q.isCorrect).map(q => q.correctTrack.videoId);
      if (videoIds.length === 0) {
        toast.info('No correct tracks to save.', { id: 'yt-save' });
        return;
      }

      const playlistTitle = `${artist?.name || 'Musify'} Favorites · Musify Trivia`;
      const result = await youtubeService.createAndPopulatePlaylist(
        youtubeSession.access_token,
        playlistTitle,
        videoIds
      );

      if (result.error) throw new Error(result.error);
      toast.success(`Saved ${videoIds.length} tracks to YouTube Music!`, { id: 'yt-save' });
    } catch (err: any) {
      toast.error('Failed to save to YouTube: ' + err.message, { id: 'yt-save' });
    } finally {
      setIsSavingYT(false);
    }
  };

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = percentage / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= percentage) {
        setCount(percentage);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [percentage]);

  const getResultInfo = () => {
    if (percentage === 100) return { title: 'Perfect Score! 👑', color: '#FFD700' };
    if (percentage >= 80) return { title: 'Certified Fan 🔥', color: '#22c55e' };
    if (percentage >= 60) return { title: 'Real Listener 🎵', color: '#C6FF00' };
    if (percentage >= 40) return { title: 'Getting There 😤', color: '#f59e0b' };
    return { title: 'Study The Discography 😭', color: '#ef4444' };
  };

  const result = getResultInfo();
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        backgroundColor: '#000',
        useCORS: true
      });
      const imageData = canvas.toDataURL('image/png');
      const blob = await (await fetch(imageData)).blob();
      const file = new File([blob], 'musify_score.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Musify — ThreadZW',
          text: `I scored ${percentage}% on ${artist?.name || 'an artist'} · Zimbabwe ThreadZW 🎵`
        });
      } else {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = 'musify_score.png';
        link.click();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-10 px-6 overflow-y-auto no-scrollbar pb-20 relative bg-black">
      {/* Circle Score */}
      <div className="flex flex-col items-center">
        <div className="relative w-[160px] h-[160px] flex items-center justify-center">
          <svg width="160" height="160" className="rotate-[-90deg]">
            <circle
              cx="80" cy="80" r={radius}
              fill="none"
              stroke="#222"
              strokeWidth="6"
            />
            <motion.circle
              cx="80" cy="80" r={radius}
              fill="none"
              stroke={result.color}
              strokeWidth="6"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black italic" style={{ color: result.color }}>{count}%</span>
            <span className="text-[#888] text-[14px] font-bold mt-[-4px]">{correctCount}/10</span>
          </div>
        </div>

        <h2 className="mt-6 text-white text-3xl font-[Impact] tracking-tight text-center uppercase italic px-4 leading-none">
          {result.title}
        </h2>

        <div className="mt-4 flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
          <div className="w-5 h-5 rounded-full overflow-hidden">
            <img src={artist?.image || ''} alt="" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
          </div>
          <span className="text-[#888] text-[13px] font-bold uppercase tracking-wider">{artist?.name || 'Unknown Artist'}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-10 grid grid-cols-3 gap-3 bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex flex-col items-center">
          <span className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-1.5">Correct</span>
          <span className="text-white text-xl font-black">{correctCount}/10</span>
        </div>
        <div className="w-px h-full bg-white/10 mx-auto" />
        <div className="flex flex-col items-center">
          <span className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-1.5">Streak</span>
          <span className="text-white text-xl font-black">{maxStreak}🔥</span>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="mt-8">
        <h3 className="text-[#888] text-[12px] font-bold uppercase tracking-widest mb-4">Question Review</h3>
        <div className="flex flex-col gap-2">
          {questions.map((q, idx) => (
            <div key={`question-review-${idx}`} className="flex items-center gap-3 py-1.5 border-b border-white/5">
              <span className="text-[#333] text-[11px] font-mono min-w-4">{idx + 1}</span>
              <div className="w-8 h-8 rounded bg-white/5 overflow-hidden flex-shrink-0">
                <img src={q.correctTrack?.cover} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <span className="flex-1 text-white/60 text-[13px] truncate">{q.correctTrack?.title || 'Unknown'}</span>
              {q.isCorrect ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <XCircle size={16} className="text-red-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-10 flex flex-col gap-3">
        {/* Spotify Section */}
        {spotifySession ? (
          <button
            onClick={handleSaveToSpotify}
            disabled={isSaving}
            className="w-full h-13 rounded-full bg-[#1DB954] text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-[#1DB954]/20 disabled:opacity-50"
          >
            <Music size={18} />
            {isSaving ? 'Saving...' : 'Save correct tracks to Spotify'}
          </button>
        ) : (
          <button
            onClick={handleConnectSpotify}
            className="w-full h-13 rounded-full bg-white text-black font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Music size={18} fill="black" />
            Connect Spotify for Playlist
          </button>
        )}

        {/* YouTube Music Section */}
        {youtubeSession ? (
          <button
            onClick={handleSaveToYouTube}
            disabled={isSavingYT}
            className="w-full h-13 rounded-full bg-[#f00] text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-[#f00]/20 disabled:opacity-50"
          >
            <Music size={18} />
            {isSavingYT ? 'Saving...' : 'Save correct tracks to YT Music'}
          </button>
        ) : (
          <button
            onClick={handleConnectYouTube}
            className="w-full h-13 rounded-full bg-[#111] border border-[#222] text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Music size={18} fill="white" />
            Connect YouTube Music
          </button>
        )}

        <button
          onClick={handleShare}
          className="w-full h-13 rounded-full bg-gradient-to-r from-[#9B27AF] to-[#C6FF00] text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Share2 size={18} />
          Share My Score
        </button>

        <button
          onClick={onPlayAgain}
          className="w-full h-12 rounded-full bg-[#111] border border-[#222] text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <RefreshCw size={18} />
          Play Again ↺
        </button>

        <div className="grid grid-cols-2 gap-3 mt-1">
          <button
            onClick={onShowLeaderboard}
            className="h-12 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] text-[#888] text-[13px] font-bold flex items-center justify-center gap-2"
          >
            <Users size={16} />
            Ranking
          </button>
          <button
            onClick={onTryAnother}
            className="h-12 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] text-[#888] text-[13px] font-bold"
          >
            New Artist →
          </button>
        </div>
      </div>

      {/* HIDDEN SHARE CARD FOR CAPTURE */}
      <div className="fixed left-[-9999px] top-0">
        <div 
          ref={shareCardRef}
          id="musify-share-card"
          className="w-[320px] bg-black rounded-[24px] overflow-hidden flex flex-col border border-white/10"
        >
          <div className="relative h-[180px]">
            <img src={artist?.image || ''} alt="" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            <div className="absolute bottom-4 left-5">
              <p className="text-[#C6FF00] text-[12px] font-black uppercase tracking-[0.2em] mb-1">Score Result</p>
              <h2 className="text-white text-2xl font-[Impact] uppercase italic tracking-tighter italic">{artist?.name || 'Unknown Artist'}</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg width="80" height="80" className="rotate-[-90deg]">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="#222" strokeWidth="4" />
                  <circle cx="40" cy="40" r="36" fill="none" stroke={result.color} strokeWidth="4" strokeDasharray={2*Math.PI*36} strokeDashoffset={2*Math.PI*36*(1-percentage/100)} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-black italic" style={{ color: result.color }}>{percentage}%</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-[Arial Black] uppercase text-[15px] italic leading-tight">{result.title}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[#444] text-[9px] font-bold uppercase tracking-widest">Correct</span>
                    <span className="text-white text-[13px] font-black">{correctCount}/10</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#444] text-[9px] font-bold uppercase tracking-widest">Streak</span>
                    <span className="text-white text-[13px] font-black">{maxStreak}🔥</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 p-4 bg-[#0a0a0a] flex items-center justify-between border-t border-white/5">
            <div className="flex flex-col">
              <span className="text-[#444] text-[10px] font-bold uppercase tracking-widest">Beat this on Musify</span>
              <span className="text-white/40 text-[10px] font-medium">ThreadZW · Zimbabwe</span>
            </div>
            <div className="text-[#C6FF00] font-mono text-[14px] font-black tracking-tighter">musify</div>
          </div>
        </div>
      </div>
    </div>
  );
};

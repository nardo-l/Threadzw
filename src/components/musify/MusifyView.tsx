/*
MUSIFY FEATURE ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT STATE (Phase 1):
  Two modes:
  
  1. Native Mode (Primary):
     YouTube IFrame API plays
     real music clips.
     Full ThreadZW UI and scoring.
     Score saved to Supabase.
  
  2. Muzify Shell (Fallback):
     Muzify.com wrapped in
     ThreadZW header shell.
     Manual score entry after.
     
MIGRATION PLAN (Phase 2):
  Replace YouTube IFrame with
  a proper music API:
  
  Option A — Spotify Web SDK:
    Requires Spotify Premium users.
    30-second previews for free.
    Official licensed audio.
  
  Option B — Deezer API:
    30-second previews free.
    No user auth required.
    CORS proxy needed.
  
  Option C — Custom audio hosting:
    Upload short clips manually
    to Supabase storage.
    Full control, manual curation.
  
  Option D — License directly:
    For scale — license short
    clips from a music licensing
    service like Epidemic Sound
    or Artlist for game use.
    
MIGRATION PLAN (Phase 3):
  Full custom music quiz engine:
    - Artist/track database
    - Audio clip management
    - Leaderboards
    - Artist challenges
    - Weekly competitions
    - Fashion-music identity system
    
  By Phase 3 the Muzify shell
  fallback can be removed.
  All logic is native ThreadZW.
*/

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ExternalLink, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { toast } from 'sonner';

import { MusifyHome } from './MusifyHome';
import { MusifyLoading } from './MusifyLoading';
import { MusifyArtistConfirm } from './MusifyArtistConfirm';
import { MusifyQuiz } from './MusifyQuiz';
import { MusifyResults } from './MusifyResults';
import { MusifyLeaderboard } from './MusifyLeaderboard';

// YouTube API Integration
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_BASE = 'https://www.googleapis.com/youtube/v3';

if (!YOUTUBE_API_KEY) {
  console.error('Missing VITE_YOUTUBE_API_KEY in AI Studio secrets');
} else {
  console.log('YouTube API key loaded ✓', YOUTUBE_API_KEY.substring(0, 8) + '...');
}

const logQuotaUsage = (units: number, reason: string) => {
  console.log('📊 YouTube quota used:', units, 'units for:', reason);
};

const searchArtist = async (query: string) => {
  console.log('YouTube searchArtist:', query);
  
  try {
    // Search for artist channel
    const channelParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'channel',
      maxResults: '3',
      key: YOUTUBE_API_KEY
    });
    
    const channelRes = await fetch(YOUTUBE_BASE + '/search?' + channelParams.toString());
    logQuotaUsage(100, 'channel search');
    
    if (!channelRes.ok) {
      const errData = await channelRes.json();
      console.error('YouTube channel search error:', errData);
      throw new Error(errData.error?.message || 'YouTube API error');
    }
    
    const channelData = await channelRes.json();
    console.log('Channel search results:', channelData);
    
    const channel = channelData.items?.[0];
    
    // Also search for music videos to get artist thumbnail
    const videoParams = new URLSearchParams({
      part: 'snippet',
      q: query + ' official music video',
      type: 'video',
      videoCategoryId: '10',
      maxResults: '1',
      key: YOUTUBE_API_KEY
    });
    
    const videoRes = await fetch(YOUTUBE_BASE + '/search?' + videoParams.toString());
    logQuotaUsage(100, 'video search for thumbnail');
    
    const videoData = await videoRes.json();
    const firstVideo = videoData.items?.[0];
    
    const artistImage = channel?.snippet?.thumbnails?.high?.url || 
                       channel?.snippet?.thumbnails?.medium?.url || 
                       firstVideo?.snippet?.thumbnails?.high?.url || 
                       null;
    
    const artistName = channel?.snippet?.title || 
                       firstVideo?.snippet?.channelTitle || 
                       query;
    
    const channelId = channel?.id?.channelId || 
                       firstVideo?.snippet?.channelId || 
                       null;
    
    if (!channelId && !firstVideo) {
      console.log('No results found for:', query);
      return null;
    }
    
    return {
      id: channelId,
      name: artistName,
      image: artistImage,
      query: query
    };
    
  } catch (err) {
    console.error('searchArtist YouTube error:', err);
    throw err;
  }
};

const parseYouTubeDuration = (duration: string) => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  return hours * 3600 + minutes * 60 + seconds;
};

const getArtistTracks = async (artist: any) => {
  console.log('getArtistTracks for:', artist);
  
  try {
    // 1. Check Supabase Cache First
    const { data: cached, error: fetchError } = await supabase
      .from('musify_tracks_cache')
      .select('tracks, created_at')
      .eq('artist_name', artist.name.toLowerCase())
      .maybeSingle();

    if (cached && !fetchError) {
      const cacheDate = new Date(cached.created_at);
      const isFresh = (Date.now() - cacheDate.getTime()) < 1000 * 60 * 60 * 24 * 7; // 7 days
      if (isFresh && cached.tracks && cached.tracks.length > 0) {
        console.log('Using cached tracks for:', artist.name);
        return cached.tracks;
      }
    }

    const searchQueries = [
      artist.query + ' official audio',
      artist.query + ' official music video',
      artist.query + ' audio'
    ];
    
    const allTracks: any[] = [];
    
    for (const searchQuery of searchQueries) {
      if (allTracks.length >= 40) break;
      
      const params = new URLSearchParams({
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        videoCategoryId: '10',
        maxResults: '20',
        key: YOUTUBE_API_KEY,
        order: 'relevance'
      });
      
      const res = await fetch(YOUTUBE_BASE + '/search?' + params.toString());
      logQuotaUsage(100, `track search: ${searchQuery}`);
      
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.items?.length) continue;
      
      const tracks = data.items
        .filter((item: any) => {
          if (!item.id?.videoId || !item.snippet?.title) return false;
          const title = item.snippet.title.toLowerCase();
          const skipKeywords = ['playlist', 'compilation', 'mix', 'interview', 'reaction', 'karaoke', 'documentary', 'shorts', '#shorts', 'live at', 'concert', 'tour', 'behind the scenes'];
          return !skipKeywords.some(k => title.includes(k));
        })
        .map((item: any) => {
          let title = item.snippet.title;
          const cleanPatterns = [
            / \(Official (Music )?Video\)/gi,
            / \(Official Audio\)/gi,
            / \[Official.*?\]/gi,
            / - Official.*/gi,
            / \(Lyrics?\)/gi,
            / \[Lyrics?\]/gi,
            / \(Audio\)/gi,
            / ft\..*$/gi,
            / feat\..*$/gi,
            / \(ft\..*?\)/gi
          ];
          cleanPatterns.forEach(p => { title = title.replace(p, '').trim(); });
          
          return {
            id: item.id.videoId,
            videoId: item.id.videoId,
            title: title || item.snippet.title,
            artist: item.snippet.channelTitle?.replace(/ - Topic$/gi, '').replace(/VEVO$/gi, '').trim(),
            cover: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
            preview: null
          };
        });
      
      allTracks.push(...tracks);
      await new Promise(r => setTimeout(r, 150));
    }
    
    // Deduplicate by cleaned title
    const seen = new Set();
    const uniqueTracks = allTracks.filter(t => {
      const key = t.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Fetch durations for unique tracks (limit to top 30)
    const limitedTracks = uniqueTracks.slice(0, 30);
    if (limitedTracks.length > 0) {
      try {
        const ids = limitedTracks.map(t => t.videoId).join(',');
        const res = await fetch(`${YOUTUBE_BASE}/videos?part=contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`);
        if (res.ok) {
          const data = await res.json();
          const durationMap = new Map();
          data.items?.forEach((item: any) => {
            durationMap.set(item.id, parseYouTubeDuration(item.contentDetails.duration));
          });
          limitedTracks.forEach((track: any) => {
            track.durationSec = durationMap.get(track.videoId) || 0;
          });
        }
      } catch (e) {
        console.error('Error fetching durations:', e);
      }
    }

    // 3. Save to Supabase Cache
    if (limitedTracks.length > 0) {
      const { error: upsertError } = await supabase
        .from('musify_tracks_cache')
        .upsert({
          artist_name: artist.name.toLowerCase(),
          tracks: limitedTracks,
          updated_at: new Date().toISOString()
        }, { onConflict: 'artist_name' });
      
      if (upsertError) console.error('Cache upsert error:', upsertError);
    }

    return limitedTracks;
  } catch (err) {
    console.error('getArtistTracks error:', err);
    return [];
  }
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const generateQuizQuestions = (tracks: any[], count = 10, skippedVideoIds: string[] = []) => {
  const availableTracks = tracks.filter(t => !skippedVideoIds.includes(t.videoId));
  if (availableTracks.length < 3) throw new Error('Not enough music videos found.');
  const shuffled = [...availableTracks].sort(() => Math.random() - 0.5);
  const quizTracks = shuffled.slice(0, Math.min(count, availableTracks.length));
  
  return quizTracks.map((correct, i) => {
    const decoyPool = shuffled.filter(t => t.id !== correct.id);
    const shuffledDecoys = decoyPool.sort(() => Math.random() - 0.5);
    const decoy1 = shuffledDecoys[0] || correct;
    const decoy2 = shuffledDecoys[1] || correct;

    const options = [
      { key: 'a', title: correct.title, cover: correct.cover, trackId: correct.id, isCorrect: true },
      { key: 'b', title: decoy1.title, cover: decoy1.cover, trackId: decoy1.id, isCorrect: false },
      { key: 'c', title: decoy2.title, cover: decoy2.cover, trackId: decoy2.id, isCorrect: false }
    ].sort(() => Math.random() - 0.5);

    const [optA, optB, optC] = options.map((o, idx) => ({ ...o, key: ['a', 'b', 'c'][idx] as 'a' | 'b' | 'c' }));
    const correctOption = [optA, optB, optC].find(o => o.isCorrect)!.key;

    // Calculate a random start time once per question
    let startTime = 30; // Fallback
    if (correct.durationSec && correct.durationSec > 20) {
      const margin = 15;
      const range = Math.max(0, correct.durationSec - (margin * 2));
      startTime = Math.floor(margin + Math.random() * range);
    }

    return {
      questionNumber: i + 1,
      correctTrack: correct,
      startTime: startTime,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      correctOption,
      userAnswer: null,
      isCorrect: null,
      timeTakenMs: null
    };
  });
};

export const MusifyView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile } = useAuth();
  const { setBuyerFlowState } = useInventory();

  const [musifyScreen, setMusifyScreen] = useState<'home' | 'loading' | 'artist_confirm' | 'quiz' | 'results' | 'leaderboard' | 'shell'>('home');
  const [musifyMode, setMusifyMode] = useState<'native' | 'shell'>('shell');
  const [showMuzifyFallbackSheet, setShowMuzifyFallbackSheet] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [muzifyShellUrl, setMuzifyShellUrl] = useState('https://muzify.com');
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);
  const [showShellLoader, setShowShellLoader] = useState(false);
  const [showScoreEntry, setShowScoreEntry] = useState(false);
  const [enteredScore, setEnteredScore] = useState(5);
  
  const failureCount = useRef(0);
  const [artistData, setArtistData] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCQI] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [artistQuery, setArtistQuery] = useState('');
  const [replaysLeft, setReplaysLeft] = useState(1);
  const questionStartTime = useRef<number | null>(null);

  // YouTube IFrame Player State
  const [youTubeReady, setYouTubeReady] = useState(!!(window as any).YT);
  const playerRef = useRef<any>(null);
  const clipTimerRef = useRef<any>(null);
  const playbackTimeoutRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [clipProgress, setClipProgress] = useState(0);
  const [clipDuration] = useState(5000);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const isPreloadedRef = useRef(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isPreloadedRef.current = isPreloaded;
  }, [isPreloaded]);

  const getStartTime = (question: any) => {
    return question.startTime || 15;
  };

  const [isMuted, setIsMuted] = useState(false);
  const [skippedVideoIds, setSkippedVideoIds] = useState<string[]>([]);
  const [hasStartedClip, setHasStartedClip] = useState(false);

  const blockedVideoIds = useRef(new Set<string>());

  const handleVideoError = async (errorCode: number, videoId: string) => {
    console.error('YouTube error:', getYouTubeErrorMessage(errorCode), 'videoId:', videoId);
    
    failureCount.current += 1;
    console.log('Video failure count:', failureCount.current);
    
    if (failureCount.current >= 2 && musifyMode === 'native') {
      setShowMuzifyFallbackSheet(true);
    }

    // Mark as blocked
    blockedVideoIds.current.add(videoId);
    
    if (errorCode === 101 || errorCode === 150) {
      console.log('Video embedding blocked:', videoId);
      // Try to find another video for the same song
      await tryAlternativeVideo();
    } else if (errorCode === 100) {
      console.log('Video not found:', videoId);
      skipCurrentQuestion();
    } else {
      console.log('Unknown error, skipping');
      skipCurrentQuestion();
    }
  };

  const skipCurrentQuestion = () => {
    toast.error('Video unavailable, skipping.');
    
    setTimeout(() => {
      setCQI(prev => {
        const nextIndex = prev + 1;
        if (nextIndex < questions.length) {
          setReplaysLeft(difficulty === 'hard' ? 0 : 1);
          setHasStartedClip(false);
          return nextIndex;
        } else {
          finishQuiz();
          return prev;
        }
      });
    }, 1500);
  };

  const tryAlternativeVideo = async () => {
    const question = questions[currentQuestionIndex];
    if (!question) return;
    
    const songTitle = question.correctTrack.title;
    const artistName = question.correctTrack.artist;
    
    toast.success('Finding alternative video...');
    
    try {
      // Search YouTube for this specific song again
      const params = new URLSearchParams({
        part: 'snippet',
        q: artistName + ' ' + songTitle + ' official audio',
        type: 'video',
        videoCategoryId: '10',
        maxResults: '10',
        key: YOUTUBE_API_KEY
      });
      
      const res = await fetch(YOUTUBE_BASE + '/search?' + params.toString());
      const data = await res.json();
      
      if (!data.items?.length) {
        skipCurrentQuestion();
        return;
      }
      
      // Find a video not in blocked list
      const alternative = data.items.find((item: any) => 
        item.id?.videoId && !blockedVideoIds.current.has(item.id.videoId)
      );
      
      if (!alternative) {
        skipCurrentQuestion();
        return;
      }
      
      const altVideoId = alternative.id.videoId;
      console.log('Trying alternative:', altVideoId);
      
      // Update the question's video
      setQuestions(prev => prev.map((q, i) => 
        i === currentQuestionIndex 
          ? { ...q, correctTrack: { ...q.correctTrack, videoId: altVideoId } }
          : q
      ));
      
      // Reset state so user has to tap again
      setHasStartedClip(false);
      setIsPlaying(false);
      setIsBuffering(false);
      
      toast.success('Tap play to try again.');
      
    } catch (err) {
      console.error('Alternative search error:', err);
      skipCurrentQuestion();
    }
  };

  const getYouTubeErrorMessage = (code: number) => {
    switch (code) {
      case 2: return 'Invalid video ID';
      case 5: return 'HTML5 player error — try another artist';
      case 100: return 'Video not found or private';
      case 101:
      case 150: return 'Video embedding blocked by uploader';
      default: return 'Video error ' + code;
    }
  };

  const toggleMute = () => {
    if (playerRef.current) {
      try {
        if (isMuted) {
          playerRef.current.unMute();
          playerRef.current.setVolume(80);
        } else {
          playerRef.current.mute();
        }
      } catch (e) {}
    }
    setIsMuted(prev => !prev);
  };

  const playerInitializationPromise = useRef<Promise<any> | null>(null);

  const createPlayer = (videoId: string) => {
    // If initialization is already in progress, return that promise
    if (playerInitializationPromise.current) {
      return playerInitializationPromise.current;
    }

    // If player already exists and is healthy, return it
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      if (videoId) {
        try {
          playerRef.current.mute();
          playerRef.current.loadVideoById({
            videoId: videoId,
            startSeconds: 0,
          });
        } catch (e) {
          console.warn('Existing player load failed, recreating...', e);
        }
      }
      return Promise.resolve(playerRef.current);
    }

    playerInitializationPromise.current = new Promise<any>((resolve) => {
      console.log('Creating initial YT player for video:', videoId || 'dummy');
      
      if (!window.YT || !window.YT.Player) {
        console.error('YT.Player not available');
        playerInitializationPromise.current = null;
        resolve(null);
        return;
      }

      const container = document.getElementById('musify-yt-player');
      if (!container) {
        console.error('Player container #musify-yt-player not found in DOM');
        playerInitializationPromise.current = null;
        resolve(null);
        return;
      }

      // Increase timeout for global connections (30s)
      const timeout = setTimeout(() => {
        console.error('Player ready timeout (30s reached)');
        playerInitializationPromise.current = null;
        resolve(null);
        toast.error('Player initialization timed out. Try refreshing.');
      }, 30000);

      try {
        const newPlayer = new window.YT.Player('musify-yt-player', {
          videoId: videoId || 'dQw4w9WgXcQ',
          width: 320,
          height: 180,
          playerVars: {
            autoplay: videoId ? 1 : 0,
            mute: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            start: 0,
            playsinline: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              clearTimeout(timeout);
              console.log('Initial Player ready ✓');
              playerRef.current = event.target;
              playerInitializationPromise.current = null;
              if (!videoId) event.target.stopVideo();
              resolve(event.target);
            },
            onStateChange: (event: any) => {
              const state = event.data;
              const YT_STATES = (window as any).YT?.PlayerState || { PLAYING: 1, PAUSED: 2, ENDED: 0, BUFFERING: 3 };
              
              if (state === YT_STATES.PLAYING) {
                console.log('Playback confirmed ✓');
                setIsPlaying(true);
                setIsBuffering(false);
                
                if (!isMuted) {
                  try {
                    event.target.unMute();
                    event.target.setVolume(100);
                  } catch (e) {}
                }
              } else if (state === YT_STATES.BUFFERING) {
                setIsBuffering(true);
              } else if (state === YT_STATES.PAUSED || state === YT_STATES.ENDED) {
                setIsPlaying(false);
              }
            },
            onError: (event: any) => {
              clearTimeout(timeout);
              playerInitializationPromise.current = null;
              const currentVideoId = playerRef.current?.getVideoData?.()?.video_id || videoId;
              handleVideoError(event.data, currentVideoId);
              resolve(null);
            }
          }
        });
        
        // Safety fallback if player object is created but events never fire
        playerRef.current = newPlayer;
      } catch (err) {
        clearTimeout(timeout);
        playerInitializationPromise.current = null;
        console.error('new YT.Player error:', err);
        resolve(null);
      }
    });

    return playerInitializationPromise.current;
  };

  const playClip = async (videoId: string) => {
    console.log('playClip triggered:', videoId);
    
    if (!window.YT || !window.YT.Player) {
      console.error('YouTube API not ready');
      toast.error('Player loading. Try again.');
      return;
    }
    
    const question = questions[currentQuestionIndex];
    if (!question || !question.correctTrack) return;
    const startSec = getStartTime(question);

    const executePlayback = (p: any) => {
      try {
        console.log('Executing playback at', startSec);
        
        // Awaken audio engine once per session on first interaction
        if (!isAudioUnlocked) {
          try {
            p.unMute();
            p.setVolume(100);
          } catch (e) {}
          setIsAudioUnlocked(true);
        }

        p.mute(); // Start muted for bypass
        p.loadVideoById({
          videoId: videoId,
          startSeconds: startSec,
        });
        p.playVideo();
        
        // Unmute immediately in the same call stack
        if (!isMuted) {
          setTimeout(() => {
            try {
              p.unMute();
              p.setVolume(100);
            } catch (e) {}
          }, 150); // Tiny delay to allow load to register
        }
        
        setIsPlaying(false); // Reset state to trigger effect clean start
        setIsBuffering(true);
        setClipProgress(0);
        setHasStartedClip(true);
        
        if (clipTimerRef.current) {
          clearInterval(clipTimerRef.current);
          clipTimerRef.current = null;
        }

        // Secondary safety unmute
        let attempts = 0;
        const safetyInterval = setInterval(() => {
          if (isPlayingRef.current || attempts > 10) {
            clearInterval(safetyInterval);
            return;
          }
          attempts++;
          if (p.getPlayerState() !== 1) {
            p.playVideo();
            if (!isMuted) p.unMute();
          }
        }, 1000);
      } catch (err) {
        console.error('executePlayback failed:', err);
      }
    };

    // SYNC FLOW: If player is already alive, use it now to keep gesture context
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      executePlayback(playerRef.current);
      return;
    }
    
    // ASYNC FLOW: Only if player needs creation
    const player = await createPlayer(videoId);
    if (player) executePlayback(player);
  };

  const preloadClip = (videoId: string) => {
    if (!youTubeReady || !playerRef.current || isPlaying) return;
    
    const question = questions[currentQuestionIndex];
    if (!question || !question.correctTrack) return;
    const startSec = getStartTime(question);

    try {
      console.log('Pre-loading video:', videoId);
      playerRef.current._isPreloading = videoId;
      playerRef.current.mute(); // Ensure muted during preload
      playerRef.current.loadVideoById({
        videoId: videoId,
        startSeconds: startSec,
      });
    } catch (err) {
      console.warn('Preload fail:', err);
    }
  };

  // Effect to trigger pre-loading when question index changes
  useEffect(() => {
    if (musifyScreen === 'quiz' && questions[currentQuestionIndex] && !isPlaying && !hasStartedClip) {
      setIsPreloaded(false);
      const videoId = questions[currentQuestionIndex].correctTrack.videoId;
      if (videoId) {
        // Just preload muted, don't auto-play
        preloadClip(videoId);
      }
    }
  }, [currentQuestionIndex, musifyScreen, questions]);

  // Move the timer starting logic to the onStateChange event in createPlayer
  // or use an effect that watches isPlaying. Let's use an effect.

  useEffect(() => {
    if (isPlaying && playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }

    if (isPlaying && musifyScreen === 'quiz' && !clipTimerRef.current) {
      const startTime = Date.now();
      const duration = clipDuration;
      
      clipTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / duration) * 100);
        setClipProgress(progress);
        
        if (elapsed >= duration) {
          stopClipWithFade();
          // Also set isPlaying to false to trigger cleanup
          setIsPlaying(false);
        }
      }, 16); // Smoother updates
    }
    
    return () => {
      if (!isPlaying && clipTimerRef.current) {
        clearInterval(clipTimerRef.current);
        clipTimerRef.current = null;
      }
    };
  }, [isPlaying, musifyScreen]);

  const stopClip = () => {
    if (clipTimerRef.current) {
      clearInterval(clipTimerRef.current);
      clipTimerRef.current = null;
    }
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    if (playerRef.current) {
      try {
        playerRef.current.stopVideo();
      } catch (e) {}
    }
    setIsPlaying(false);
    setIsBuffering(false);
  };

  const stopClipWithFade = () => {
    if (!playerRef.current) {
      stopClip();
      return;
    }
    
    let vol = 80;
    const fadeOut = setInterval(() => {
      vol = Math.max(0, vol - 8);
      try {
        if (playerRef.current) playerRef.current.setVolume(vol);
      } catch (e) {}
      if (vol <= 0) {
        clearInterval(fadeOut);
        stopClip();
      }
    }, 30);
  };

  const handleTimeOut = () => {
    if (difficulty === 'hard') {
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion || currentQuestion.userAnswer) return;
      handleAnswer(null as any); 
    }
  };

  useEffect(() => {
    if (location.state?.directShell) {
      console.log('Direct shell entry triggered');
      openMuzifyHome();
      // Clear state to prevent re-trigger on back/refresh
      window.history.replaceState({}, document.title);
    }
  }, []);

  useEffect(() => {
    // Only load the script once
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
      
      (window as any).onYouTubeIframeAPIReady = () => {
        console.log('YouTube IFrame API ready ✓');
        setYouTubeReady(true);
      };
    } else {
      setYouTubeReady(true);
    }

    return () => {
      stopClip();
    };
  }, []); // Run only once on mount

  // Effect to pre-initialize player and handle screen-specific lifecycle
  useEffect(() => {
    if (youTubeReady && (musifyScreen === 'home' || musifyScreen === 'loading')) {
      createPlayer('');
    }
    
    // Explicitly do NOT destroy the player here to avoid DOM synchronization issues with AnimatePresence
    // The previous effect's return only stops the clip.
  }, [musifyScreen, youTubeReady]);

  const openMuzifyWithArtist = (artistName: string) => {
    // Try Muzify artist deep link
    // Muzify URL format: muzify.com/quiz/[artist-slug]
    const slug = artistName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const muzifyUrl = `https://muzify.com/quiz/${slug}`;
    
    console.log('Opening Muzify for:', artistName, 'URL:', muzifyUrl);
    
    setMuzifyShellUrl(muzifyUrl);
    setArtistQuery(artistName);
    setMusifyScreen('shell');
    setShowShellLoader(true);
    
    setTimeout(() => {
      setShowShellLoader(false);
    }, 2000);
  };

  const openMuzifyHome = () => {
    setMuzifyShellUrl('https://muzify.com');
    setMusifyScreen('shell');
    setShowShellLoader(true);
    
    setTimeout(() => {
      setShowShellLoader(false);
    }, 2000);
  };

  const saveMuzifyScore = async () => {
    if (!session?.user?.id) return;
    
    const loading = toast.loading('Saving score...');
    
    try {
      const { error } = await supabase
        .from('musify_sessions')
        .insert({
          user_id: session.user.id,
          artist_query: artistQuery,
          artist_name: artistQuery,
          correct_count: enteredScore,
          total_questions: 10,
          score_percentage: enteredScore * 10,
          completed: true,
          platform: 'muzify'
        });

      if (error) throw error;
      
      // Update leaderboard
      await supabase
        .from('musify_leaderboard')
        .upsert({
          user_id: session.user.id,
          display_name: profile?.display_name || 'Anonymous User',
          avatar_url: profile?.avatar_url,
          artist_name: artistQuery,
          best_score: enteredScore,
          best_percentage: enteredScore * 10,
          total_plays: 1,
          total_correct: enteredScore,
          difficulty: 'normal',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,artist_name' });
      
      toast.success('Score saved to your profile ✓', { id: loading });
      setShowScoreEntry(false);
      setMusifyScreen('home');
    } catch (err) {
      console.error('Save Muzify score error:', err);
      toast.error('Failed to save score', { id: loading });
    }
  };

  const handleArtistSearch = async (overrideQuery?: string) => {
    const rawQuery = typeof overrideQuery === 'string' ? overrideQuery : searchQuery;
    const query = rawQuery?.trim() || '';
    
    console.log('Musify search:', query);
    
    if (!query) {
      toast.error('Enter an artist name.');
      return;
    }

    if (musifyMode === 'shell') {
      openMuzifyWithArtist(query);
      return;
    }
    
    if (musifyMode === 'native') {
      if (!YOUTUBE_API_KEY) {
        toast.error('YouTube API key not configured.');
        return;
      }
      
      setArtistQuery(query);
      setMusifyScreen('loading');
      
      try {
        // Check Supabase cache
        const { data: cached } = await supabase
          .from('musify_artist_cache')
          .select('*')
          .eq('artist_query', query.toLowerCase())
          .maybeSingle();
        
        const cacheAge = cached ? Date.now() - new Date(cached.cached_at).getTime() : Infinity;
        const cacheValid = cacheAge < 24 * 60 * 60 * 1000;
        
        if (cached && cacheValid) {
          console.log('Cache hit ✓');
          setArtistData({
            name: cached.artist_name,
            image: cached.artist_image,
            query: query
          });
          setTracks(cached.tracks || []);
          setMusifyScreen('artist_confirm');
          return;
        }
        
        console.log('Fetching from YouTube...');
        const artist = await searchArtist(query);
        console.log('Artist found:', artist);
        
        if (!artist) {
          toast.error('Artist not found. Try a different spelling.');
          setMusifyScreen('home');
          return;
        }
        
        const tracks = await getArtistTracks(artist);
        console.log('Tracks found:', tracks.length);
        
        if (tracks.length < 3) {
          toast.error('Not enough videos found for ' + artist.name + '. Try another artist.');
          setMusifyScreen('home');
          return;
        }
        
        setArtistData(artist);
        setTracks(tracks);
        
        // Cache results
        try {
          await supabase.from('musify_artist_cache').upsert({
            artist_query: query.toLowerCase(),
            artist_name: artist.name,
            artist_image: artist.image,
            tracks: tracks,
            cached_at: new Date().toISOString()
          }, { onConflict: 'artist_query' });
          console.log('Cached ✓');
        } catch (cacheErr) {
          console.error('Cache error (non-blocking):', cacheErr);
        }
        
        setMusifyScreen('artist_confirm');
        
      } catch (err: any) {
        console.error('Search failed:', err);
        
        if (err.message?.includes('quota') || err.message?.includes('403')) {
          toast.error('Daily search limit reached. Try again tomorrow.');
        } else if (err.message?.includes('401')) {
          toast.error('YouTube API key invalid. Check configuration.');
        } else {
          toast.error('Search failed: ' + err.message);
        }
        setMusifyScreen('home');
      }
    }
  };

  const startQuiz = () => {
    const generated = generateQuizQuestions(tracks, 10, skippedVideoIds);
    setQuestions(generated);
    setCQI(0);
    setCorrectCount(0);
    setCurrentStreak(0);
    setMaxStreak(0);
    setIsPlaying(false);
    setIsBuffering(false);
    setIsAudioUnlocked(false);
    setMusifyScreen('quiz');
    setReplaysLeft(difficulty === 'hard' ? 0 : 1);
    setHasStartedClip(false);
  };

  const handleAnswer = (selectedOption: 'a' | 'b' | 'c') => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion || currentQuestion.userAnswer) return;

    const answerTime = Date.now() - (questionStartTime.current || Date.now());
    stopClip();

    const isCorrect = selectedOption === currentQuestion.correctOption;
    
    setQuestions(prev => prev.map((q, i) => i === currentQuestionIndex ? {
      ...q,
      userAnswer: selectedOption || 'timeout',
      isCorrect,
      timeTakenMs: answerTime
    } : q));

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setCurrentStreak(prev => {
        const next = prev + 1;
        setMaxStreak(max => Math.max(max, next));
        return next;
      });
    } else {
      setCurrentStreak(0);
    }

    setTimeout(() => {
      setCQI(prev => {
        const nextIndex = prev + 1;
        if (nextIndex < questions.length) {
          setReplaysLeft(difficulty === 'hard' ? 0 : 1);
          setHasStartedClip(false);
          // Wait for user to press play
          return nextIndex;
        } else {
          finishQuiz();
          return prev;
        }
      });
    }, 1500);
  };

  const finishQuiz = async () => {
    stopClip();
    setMusifyScreen('results');
    
    // Save to Leaderboard
    if (artistData) {
      try {
        const percentage = Math.round((correctCount / 10) * 100);
        await supabase.from('musify_leaderboard').insert({
          user_id: session?.user?.id,
          display_name: profile?.display_name || 'Anonymous',
          handle: profile?.handle,
          avatar_url: profile?.avatar_url,
          artist_name: artistData.name,
          score: correctCount,
          best_percentage: percentage,
          max_streak: maxStreak,
          difficulty: difficulty
        });
      } catch (err) {
        console.error('Leaderboard save error:', err);
      }
    }
  };

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('musify_leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(20);
      
      if (!error) setLeaderboard(data || []);
      setMusifyScreen('leaderboard');
    } catch (err) {
      console.error('Leaderboard load error:', err);
    }
  };

  const saveSession = async () => {
    if (!session?.user?.id || !artistData) {
      console.warn('Skipping session save: Missing user or artist data');
      return;
    }
    try {
      const scorePercentage = Math.round((correctCount / 10) * 100);
      const { data: savedSession } = await supabase.from('musify_sessions').insert({
        user_id: session.user.id,
        artist_query: artistQuery,
        artist_name: artistData.name || 'Unknown Artist',
        artist_image: artistData.image || null,
        total_questions: 10,
        correct_count: correctCount,
        score_percentage: scorePercentage,
        max_streak: maxStreak,
        difficulty,
        completed: true
      }).select().single();

      if (!savedSession) return;

      const questionsToInsert = questions.map(q => ({
        session_id: savedSession.id,
        question_number: q.questionNumber,
        correct_track_id: q.correctTrack?.id || null,
        correct_title: q.correctTrack?.title || 'Unknown',
        correct_artist: q.correctTrack?.artist || 'Unknown',
        correct_album: q.correctTrack?.album || '',
        correct_preview_url: q.correctTrack?.preview || null,
        correct_cover_url: q.correctTrack?.cover || null,
        option_a_title: q.optionA?.title || '',
        option_a_cover: q.optionA?.cover || null,
        option_a_track_id: q.optionA?.trackId || null,
        option_b_title: q.optionB?.title || '',
        option_b_cover: q.optionB?.cover || null,
        option_b_track_id: q.optionB?.trackId || null,
        option_c_title: q.optionC?.title || '',
        option_c_cover: q.optionC?.cover || null,
        option_c_track_id: q.optionC?.trackId || null,
        correct_option: q.correctOption,
        user_answer: q.userAnswer,
        is_correct: q.isCorrect,
        time_taken_ms: q.timeTakenMs || 0
      }));

      await supabase.from('musify_questions').insert(questionsToInsert);

      await supabase.from('musify_leaderboard').upsert({
        user_id: session.user.id,
        display_name: profile?.display_name || 'Anonymous',
        avatar_url: profile?.avatar_url,
        artist_name: artistData.name || 'Unknown Artist',
        best_score: correctCount,
        best_percentage: scorePercentage,
        total_plays: 1,
        total_correct: correctCount,
        max_streak: maxStreak,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,artist_name' });

    } catch (err) {
      console.error('Save session error:', err);
    }
  };



  // Iframe timeout detection
  useEffect(() => {
    if (musifyScreen !== 'shell') return;
    
    const timeout = setTimeout(() => {
      if (!iframeLoaded) {
        console.log('iframe load timeout — assuming blocked');
        setIframeBlocked(true);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [musifyScreen, iframeLoaded]);

  return (
    <div className="fixed inset-0 bg-black z-[100] overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {musifyScreen === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            <MusifyHome 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleArtistSearch}
              musifyMode={musifyMode}
              setMusifyMode={setMusifyMode}
              openMuzifyHome={openMuzifyHome}
              onBack={() => {
                setBuyerFlowState('home');
                navigate('/');
              }}
            />
          </motion.div>
        )}

        {musifyScreen === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            <MusifyLoading artistName={artistQuery} />
          </motion.div>
        )}

        {musifyScreen === 'artist_confirm' && (
          <motion.div
            key="artist_confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            <MusifyArtistConfirm 
              artist={artistData}
              trackCount={tracks.length}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              onStart={startQuiz}
              onCancel={() => setMusifyScreen('home')}
            />
          </motion.div>
        )}

        {musifyScreen === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            <MusifyQuiz 
              questions={questions}
              currentIndex={currentQuestionIndex}
              onAnswer={handleAnswer}
              isPlaying={isPlaying}
              isBuffering={isBuffering}
              isPreloaded={isPreloaded}
              progress={clipProgress}
              onReplay={() => {
                if (replaysLeft > 0) {
                  setReplaysLeft(prev => prev - 1);
                  const question = questions[currentQuestionIndex];
                  if (question?.correctTrack?.videoId) {
                    playClip(question.correctTrack.videoId);
                    questionStartTime.current = Date.now();
                  }
                }
              }}
              replaysLeft={replaysLeft}
              currentStreak={currentStreak}
              correctCount={correctCount}
              onPlayClip={() => {
                const question = questions[currentQuestionIndex];
                if (question?.correctTrack?.videoId) {
                  playClip(question.correctTrack.videoId);
                  if (!questionStartTime.current) {
                    questionStartTime.current = Date.now();
                  }
                }
              }}
              hasStartedClip={hasStartedClip}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onBack={() => {
                stopClip();
                setMusifyScreen('home');
              }}
            />
          </motion.div>
        )}

        {musifyScreen === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            <MusifyResults 
              artist={artistData}
              correctCount={correctCount}
              maxStreak={maxStreak}
              questions={questions}
              onPlayAgain={startQuiz}
              onTryAnother={() => setMusifyScreen('home')}
              onShowLeaderboard={() => setMusifyScreen('leaderboard')}
            />
          </motion.div>
        )}

        {musifyScreen === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            <MusifyLeaderboard 
              artistName={artistData?.name}
              onBack={() => setMusifyScreen('results')}
            />
          </motion.div>
        )}

        {musifyScreen === 'shell' && (
          <motion.div
            key="shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full bg-black"
          >
            <MuzifyShellScreen 
              url={muzifyShellUrl}
              onBack={() => {
                setMusifyScreen('home');
                setMusifyMode('native');
                setIframeLoaded(false);
                setIframeBlocked(false);
                if (artistQuery) setShowScoreEntry(true);
              }}
              iframeLoaded={iframeLoaded}
              setIframeLoaded={setIframeLoaded}
              iframeBlocked={iframeBlocked}
              setIframeBlocked={setIframeBlocked}
              onOpenInBrowser={() => {
                window.open(muzifyShellUrl, '_blank');
                setShowReturnPrompt(true);
              }}
              artistName={artistQuery}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent YouTube Hidden Player Container - Off-screen with real size */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -100 }}>
        <div
          id="musify-yt-player"
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            width: '200px',
            height: '120px',
            opacity: 0.01,
            pointerEvents: 'none',
            zIndex: -1
          }}
        />
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showMuzifyFallbackSheet && (
          <MuzifyFallbackSheet 
            onClose={() => setShowMuzifyFallbackSheet(false)}
            onTryAgain={() => {
              setShowMuzifyFallbackSheet(false);
              setMusifyMode('native');
              setMusifyScreen('home');
              failureCount.current = 0;
            }}
            onOpenMuzify={() => {
              setShowMuzifyFallbackSheet(false);
              openMuzifyHome();
            }}
          />
        )}

        {showReturnPrompt && (
          <ReturnPromptOverlay onDismiss={() => setShowReturnPrompt(false)} />
        )}

        {showScoreEntry && (
          <ScoreEntrySheet 
            enteredScore={enteredScore}
            setEnteredScore={setEnteredScore}
            onSave={saveMuzifyScore}
            onSkip={() => {
              setShowScoreEntry(false);
              setMusifyScreen('home');
            }}
            artistName={artistQuery}
          />
        )}

        {showShellLoader && (
          <ShellLoader artistName={artistQuery} />
        )}
      </AnimatePresence>
    </div>
  );
};

const MuzifyFallbackSheet: React.FC<{ 
  onClose: () => void, 
  onTryAgain: () => void, 
  onOpenMuzify: () => void 
}> = ({ onClose, onTryAgain, onOpenMuzify }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 z-[1000] backdrop-blur-sm flex items-end"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      className="w-full bg-[#111] rounded-t-[20px] p-7 pt-4 border-t border-white/5"
      onClick={e => e.stopPropagation()}
    >
      <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />
      
      <div className="text-center">
        <span className="text-4xl">⚡</span>
        <h3 className="text-white font-bold text-xl mt-4">Try ThreadZW Quiz instead?</h3>
        <p className="text-[#888] text-sm mt-2 max-w-[280px] mx-auto leading-relaxed">
          Play music clips directly inside ThreadZW without leaving the app.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          onClick={onOpenMuzify}
          className="w-full bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center">
            <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-lg">🔄</div>
            <div className="ml-3.5 text-left">
              <p className="text-white font-bold text-[15px]">Reload Muzify</p>
              <p className="text-[#888] text-xs mt-0.5">Refresh the shell experience</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#555] group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={onTryAgain}
          className="w-full bg-pink-500/5 border border-pink-500/20 rounded-2xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#9B27AF] to-[#FF2D78] flex items-center justify-center text-lg">⚡</div>
            <div className="ml-3.5 text-left">
              <p className="text-white font-bold text-[15px]">ThreadZW Quiz</p>
              <p className="text-[#888] text-xs mt-0.5">YouTube clips inside the app</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#FF2D78]" />
        </button>
      </div>
    </motion.div>
  </motion.div>
);
  
const MuzifyShellScreen: React.FC<{
  url: string,
  onBack: () => void,
  iframeLoaded: boolean,
  setIframeLoaded: (v: boolean) => void,
  iframeBlocked: boolean,
  setIframeBlocked: (v: boolean) => void,
  onOpenInBrowser: () => void,
  artistName: string
}> = ({ url, onBack, iframeLoaded, setIframeLoaded, iframeBlocked, setIframeBlocked, onOpenInBrowser, artistName }) => (
  <div className="relative w-full h-full flex flex-col">
    {/* Header */}
    <div className="fixed top-0 inset-x-0 h-[52px] bg-black border-b border-[#111] px-4 flex items-center justify-between z-[9999]">
      <button 
        onClick={onBack}
        className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10"
      >
        <ArrowLeft size={18} className="text-white" />
      </button>
      
      <div className="flex items-center gap-2">
        <span className="text-[#FF2D78] font-pacifico text-base">thread</span>
        <span className="text-[#333] text-sm">×</span>
        <span className="text-[#888] font-mono text-sm tracking-tight">musify</span>
      </div>

      <button 
        onClick={onOpenInBrowser}
        className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10"
      >
        <ExternalLink size={14} className="text-white" />
      </button>
    </div>

    {/* Content */}
    <div className="flex-1 pt-[52px]">
      {!iframeBlocked ? (
        <div className="relative w-full h-full">
          <iframe
            src={url}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: iframeLoaded ? 'block' : 'none'
            }}
            onLoad={() => {
              setIframeLoaded(true);
              console.log('iframe loaded');
            }}
            onError={() => {
              setIframeBlocked(true);
              console.log('iframe blocked');
            }}
            allow="autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="Muzify Music Quiz"
          />
          
          {!iframeLoaded && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-center px-10">
              <div className="w-8 h-8 border-2 border-[#FF2D78] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[#888] font-mono text-xs uppercase tracking-widest">Loading Muzify...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center px-8 text-center pb-20">
          <span className="text-5xl">🎵</span>
          <h2 className="text-white font-bold text-2xl mt-6">Open Muzify in Browser</h2>
          <p className="text-[#888] text-[14px] mt-2 mb-8 leading-relaxed max-w-[280px]">
            Muzify works best in your browser. We'll bring you back to ThreadZW when you're done.
          </p>
          
          <div className="w-full bg-[#111] border border-[#222] rounded-2xl p-4 text-left mb-8">
            <p className="text-[#555] text-[10px] uppercase font-bold tracking-widest mb-2.5">When you're done:</p>
            <p className="text-white text-[13px] leading-relaxed">
              Just tap the back button in your browser to return to Thread ZW
            </p>
          </div>

          <button
            onClick={onOpenInBrowser}
            className="w-full h-14 rounded-full bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#FF2D78]/20 active:scale-[0.98] transition-transform"
          >
            <span>🎵</span>
            <span>Open Muzify →</span>
          </button>

          <button
            onClick={onBack}
            className="mt-5 text-[#555] text-sm font-medium hover:text-[#888] transition-colors"
          >
            Or try the ThreadZW quiz instead
          </button>
        </div>
      )}
    </div>
  </div>
);

const ReturnPromptOverlay: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <motion.div
    initial={{ y: 100 }}
    animate={{ y: 0 }}
    exit={{ y: 100 }}
    className="fixed bottom-0 inset-x-0 z-[10000] p-4 pt-1 pb-8 bg-[#111] border-t border-[#222]"
  >
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-white font-bold text-[14px]">↩ Back to ThreadZW</h4>
        <p className="text-[#888] text-[12px] mt-0.5">Tap browser back when done</p>
      </div>
      <button 
        onClick={onDismiss}
        className="text-[#FF2D78] font-bold text-[13px] px-4 py-2"
      >
        Got it
      </button>
    </div>
  </motion.div>
);

const ScoreEntrySheet: React.FC<{
  enteredScore: number,
  setEnteredScore: (v: number) => void,
  onSave: () => void,
  onSkip: () => void,
  artistName: string
}> = ({ enteredScore, setEnteredScore, onSave, onSkip, artistName }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/80 z-[1000] backdrop-blur-md flex items-center justify-center p-6"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="w-full max-w-[340px] bg-[#111] border border-white/10 rounded-[28px] p-8 text-center"
    >
      <span className="text-4xl">🎵</span>
      <h3 className="text-white font-bold text-xl mt-4">How did you do?</h3>
      <p className="text-[#888] text-sm mt-2 leading-relaxed">
        Enter your score to save it to your ThreadZW profile
      </p>

      <div className="mt-8 flex items-center justify-between px-4">
        <button 
          onClick={() => setEnteredScore(Math.max(0, enteredScore - 1))}
          className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-white"
        >
          -
        </button>
        <div className="flex flex-col items-center">
          <span className="text-5xl font-black text-white">{enteredScore}</span>
          <span className="text-[#555] font-mono text-xs mt-1 uppercase tracking-widest">/ 10</span>
        </div>
        <button 
          onClick={() => setEnteredScore(Math.min(10, enteredScore + 1))}
          className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-white"
        >
          +
        </button>
      </div>

      <div className="mt-8 mb-8 overflow-x-auto no-scrollbar pb-2">
        <div className="flex gap-2">
          {Array.from({ length: 11 }).map((_, i) => (
            <button
              key={`score-select-${i}`}
              onClick={() => setEnteredScore(i)}
              className={`
                min-w-[44px] h-[44px] rounded-xl flex items-center justify-center font-bold text-sm transition-all
                ${enteredScore === i 
                  ? 'bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white' 
                  : 'bg-[#1a1a1a] text-[#555]'}
              `}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[#444] text-[11px] uppercase font-bold tracking-widest">Artist:</span>
          <span className="text-white font-bold text-sm">{artistName}</span>
        </div>
      </div>

      <button
        onClick={onSave}
        className="w-full h-13 rounded-full bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#FF2D78]/20 transition-transform active:scale-95"
      >
        <span>Save Score</span>
        <ArrowRight size={18} />
      </button>

      <button
        onClick={onSkip}
        className="mt-4 text-[#444] text-xs font-bold uppercase tracking-widest hover:text-[#777] transition-colors"
      >
        Skip
      </button>
    </motion.div>
  </motion.div>
);

const ShellLoader: React.FC<{ artistName: string }> = ({ artistName }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black z-[11000] flex flex-col items-center justify-center p-10 text-center"
  >
    <div className="flex items-center justify-center gap-2.5 mb-8">
      <span className="text-[#FF2D78] font-[Pacifico] text-[20px]">thread</span>
      <span className="text-[#333] text-xl">×</span>
      <span className="text-[#888] font-mono text-[18px] tracking-tight">musify</span>
    </div>

    <div className="w-9 h-9 border-[3px] border-[#FF2D78] border-t-transparent rounded-full animate-spin mb-6" />
    
    <p className="text-[#888] font-mono text-[13px] uppercase tracking-[0.2em]">Opening Muzify...</p>
    
    {artistName && (
      <div className="mt-4 px-4 py-2 bg-white/5 rounded-full border border-white/10">
        <span className="text-[#555] text-[11px] font-bold uppercase mr-2.5">Artist:</span>
        <span className="text-white font-bold text-xs">{artistName}</span>
      </div>
    )}
  </motion.div>
);

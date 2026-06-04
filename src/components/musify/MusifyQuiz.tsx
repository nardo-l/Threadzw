import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Check, X, ArrowLeft, Volume2, VolumeX, Flame, ChevronLeft, Play } from 'lucide-react';

interface MusifyQuizProps {
  questions: any[];
  currentIndex: number;
  onAnswer: (option: 'a' | 'b' | 'c') => void;
  isPlaying: boolean;
  isPreloaded: boolean;
  progress: number;
  onReplay: () => void;
  replaysLeft: number;
  currentStreak: number;
  correctCount: number;
  onPlayClip: () => void;
  hasStartedClip: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onBack: () => void;
  isBuffering: boolean;
}

export const MusifyQuiz: React.FC<MusifyQuizProps> = ({
  questions,
  currentIndex,
  onAnswer,
  isPlaying,
  isPreloaded,
  progress,
  onReplay,
  replaysLeft,
  currentStreak,
  correctCount,
  onPlayClip,
  hasStartedClip,
  isMuted,
  onToggleMute,
  onBack,
  isBuffering
}) => {
  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const [showFeedback, setShowFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [streakCelebration, setStreakCelebration] = useState<number | null>(null);

  useEffect(() => {
    if (currentQuestion.userAnswer) {
      if (currentQuestion.isCorrect) {
        setShowFeedback('correct');
        if (currentStreak > 0 && currentStreak % 3 === 0) {
          setStreakCelebration(currentStreak);
        }
      } else {
        setShowFeedback('wrong');
      }

      const timer = setTimeout(() => {
        setShowFeedback('none');
        setStreakCelebration(null);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion.userAnswer, currentQuestion.isCorrect, currentStreak]);

  const options = [
    { key: 'a', data: currentQuestion.optionA },
    { key: 'b', data: currentQuestion.optionB },
    { key: 'c', data: currentQuestion.optionC }
  ];

  const getOptionState = (key: string) => {
    if (!currentQuestion.userAnswer) return 'default';
    if (key === currentQuestion.correctOption) return 'correct';
    if (key === currentQuestion.userAnswer && !currentQuestion.isCorrect) return 'wrong';
    return 'fade';
  };

  return (
    <div className="flex-1 relative flex flex-col h-full overflow-y-auto overflow-x-hidden scrollbar-hide bg-[#0A0A0A]">
      {/* YouTube Hidden Player and Global Styles remain same */}
      <style>{`
        @keyframes eqBar {
          0%, 100% { height: 4px; }
          50% { height: 24px; }
        }
        @keyframes playPulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 45, 120, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(255, 45, 120, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 45, 120, 0); }
        }
        .eq-bar {
          width: 3px;
          background: #C6FF00;
          border-radius: 1px;
          animation: eqBar 0.5s ease-in-out infinite;
        }
        .waveform-bar {
          width: 2px;
          background: #C6FF00;
          border-radius: 1px;
          transition: height 0.2s ease;
        }
      `}</style>

      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-center bg-cover scale-110 blur-[60px] opacity-10 brightness-[0.1]"
          style={{ backgroundImage: `url(${currentQuestion.correctTrack?.cover})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]" />
      </div>

      <div className="relative z-10 flex flex-col pb-10 min-h-full">
        {/* Top Bar */}
        <div className="pt-6 px-6 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-zinc-900/80 flex items-center justify-center border border-white/5 active:scale-95"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 rounded-full border border-white/5">
              <Flame size={18} className="text-orange-500 fill-orange-500" />
              <span className="text-white font-bold text-sm">{currentStreak}</span>
            </div>
          </div>
          
          <div className="bg-zinc-900/80 border border-white/10 rounded-full px-5 py-2">
            <span className="text-white font-bold text-[14px] font-mono">
              {currentIndex + 1} <span className="text-zinc-600">/</span> {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onToggleMute}
              className="w-10 h-10 rounded-full bg-zinc-900/80 flex items-center justify-center border border-white/5 active:scale-95"
            >
              {isMuted ? <VolumeX size={20} className="text-white/40" /> : <Volume2 size={20} className="text-white" />}
            </button>
            <div className="flex flex-col items-end">
              <span className="text-zinc-500 font-bold text-[9px] uppercase leading-none mb-0.5 tracking-widest">Score</span>
              <span className="text-white font-black text-lg leading-none">{correctCount}</span>
            </div>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-6 px-6">
          {questions.map((q, i) => (
            <div 
              key={`quiz-progress-dot-${i}`}
              className={`
                h-2 rounded-full transition-all duration-300
                ${i === currentIndex 
                  ? 'w-6 bg-[#C6FF00]' 
                  : q.userAnswer 
                    ? q.isCorrect ? 'w-2 bg-green-500' : 'w-2 bg-red-500'
                    : 'w-2 bg-zinc-800'}
              `}
            />
          ))}
        </div>

        {/* Central Card */}
        <div className="mx-6 mt-6 rounded-[32px] bg-[#121212] border border-white/5 p-6 shadow-2xl relative overflow-hidden flex-shrink-0 min-h-[340px]">
          {/* Subtle Pink Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#C6FF00]/10 blur-[60px] rounded-full" />
          
          <div className="relative z-10 flex flex-col items-center w-full">
            {/* Image Area - Robust Aspect Ratio */}
            <div className="w-full relative rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black group/cover">
              <div className="pt-[56.25%]" /> {/* 16:9 Aspect Ratio Spacer */}
              <img
                src={currentQuestion.correctTrack?.cover}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
                style={{
                  filter: (isPlaying || hasStartedClip || currentQuestion.userAnswer) ? 'none' : 'blur(25px) brightness(0.4)',
                  transform: (isPlaying || hasStartedClip || currentQuestion.userAnswer) ? 'scale(1)' : 'scale(1.1)',
                  opacity: (isPlaying || hasStartedClip || currentQuestion.userAnswer) ? 1 : 0.4
                }}
                referrerPolicy="no-referrer"
              />
              
              {/* Tap to Play Overlay */}
              {!hasStartedClip && !isPlaying && !currentQuestion.userAnswer && (
                 <div 
                   className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md cursor-pointer group/tap"
                   onClick={onPlayClip}
                 >
                   <motion.div
                     animate={{ scale: [1, 1.1, 1] }}
                     transition={{ duration: 2, repeat: Infinity }}
                     className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black shadow-2xl group-hover/tap:scale-110 transition-transform"
                   >
                     <Play size={40} fill="currentColor" strokeWidth={0} className="ml-1" />
                   </motion.div>
                   <p className="text-white font-black text-lg mt-4 uppercase tracking-[0.2em] animate-pulse">Tap to Play</p>
                   <p className="text-white/60 text-xs mt-1">Experience the song snippet</p>
                 </div>
              )}

              {/* Branding Overlay */}
              <div className="absolute top-3 left-4 opacity-40">
                <span className="text-white font-black text-xl italic tracking-tighter">MUSIFY</span>
              </div>

              {/* Playing Overlay */}
              {isPlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <div className="flex items-center gap-1.5 h-8">
                    {[0, 1, 2, 3, 4, 5, 6].map(idx => (
                      <div key={`audio-stream-bar-${idx}`} className="eq-bar" style={{ animationDelay: `${idx * 80}ms` }} />
                    ))}
                  </div>
                  <span className="text-white font-mono text-[9px] mt-4 uppercase tracking-[0.3em] font-black">Streaming Audio</span>
                </div>
              )}
            </div>

            {/* Waveform Visualization */}
            <div className="w-full h-4 flex items-center justify-center gap-[3px] mt-6 px-1">
              {Array.from({ length: 40 }).map((_, i) => {
                const isActive = (i / 40) < (progress / 100);
                const randomHeight = isPlaying ? (isActive ? 12 + Math.random() * 8 : 4) : 2;
                return (
                  <div 
                    key={`waveform-bar-${i}`} 
                    className={`w-[2px] rounded-full transition-all duration-200 ${isActive ? 'bg-[#C6FF00]' : 'bg-white/10'}`}
                    style={{ height: `${2 + randomHeight}px` }}
                  />
                );
              })}
            </div>

            {/* Status & Info */}
            <div className="w-full mt-5 min-h-[80px] flex flex-col items-center">
              {!currentQuestion.userAnswer ? (
                <div className="text-center">
                  <p className="text-white font-black text-xl tracking-tighter italic">
                    {isPlaying ? "Recognizing melody..." : 
                     isPreloaded ? "Audio Primed & Ready" : "Ready for the drop?"}
                  </p>
                  <p className="text-zinc-500 text-xs mt-1 font-medium">
                    {isPreloaded && !hasStartedClip ? "Instant Playback Enabled" : "Guess from the 5s clip"}
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center w-full"
                >
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/50 rounded-full border border-white/5 mb-3">
                    {currentQuestion.isCorrect ? (
                      <Check size={14} className="text-green-500" strokeWidth={4} />
                    ) : (
                      <X size={14} className="text-red-500" strokeWidth={4} />
                    )}
                    <span className="text-[13px] font-bold text-white tracking-tight">
                      {currentQuestion.isCorrect ? "Correct Guess!" : "Nice try!"}
                    </span>
                  </div>
                  <h4 className="text-white text-2xl font-black tracking-tighter leading-none truncate w-full px-2">{currentQuestion.correctTrack?.title}</h4>
                  <p className="text-[#C6FF00] text-sm font-bold mt-1 uppercase tracking-wider">{currentQuestion.correctTrack?.artist}</p>
                </motion.div>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-auto w-full pt-4">
              <motion.button
                onClick={onPlayClip}
                disabled={isPlaying}
                animate={(!hasStartedClip && !isPlaying) ? {
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    "0 12px 32px rgba(255, 45, 120, 0.2)",
                    "0 12px 48px rgba(255, 45, 120, 0.4)",
                    "0 12px 32px rgba(255, 45, 120, 0.2)"
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full py-4.5 rounded-full flex items-center justify-center gap-3 font-black text-lg transition-all relative overflow-hidden
                  ${isPlaying 
                    ? 'bg-zinc-800 text-zinc-500' 
                    : 'bg-gradient-to-r from-[#C6FF00] to-[#922DFF] text-white'
                  }
                `}
              >
                {isPlaying ? (
                  <div className="flex items-center gap-2">
                    <span className="uppercase tracking-[0.2em] text-[10px] font-black">Streaming</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse [animation-delay:200ms]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse [animation-delay:400ms]" />
                    </div>
                  </div>
                ) : (
                  <>
                    {(hasStartedClip && !isPlaying && isBuffering && !isPreloaded) ? (
                      <div className="flex items-center gap-2">
                        <span className="uppercase tracking-[0.2em] text-[10px] font-black">Buffering</span>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {hasStartedClip ? (
                          <RotateCcw size={20} strokeWidth={3} />
                        ) : (
                          <div className="relative">
                            <Play size={20} fill="currentColor" strokeWidth={0} />
                            {isPreloaded && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#121212]"
                              />
                            )}
                          </div>
                        )}
                        <span className="uppercase tracking-[0.15em]">
                          {hasStartedClip ? "Play Again" : isPreloaded ? "Instant Play" : "Play Clip"}
                        </span>
                      </>
                    )}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Options List - LOCKED UNTIL PLAYED */}
        <div className="mt-12 px-6">
          <div className="flex items-center justify-between ml-1 mb-5">
            <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em]">
              Choose the correct one
            </p>
            {!hasStartedClip && (
              <motion.span 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[#C6FF00] text-[10px] font-bold uppercase tracking-wider"
              >
                Listen first
              </motion.span>
            )}
          </div>
          
          <div className="flex flex-col gap-3.5">
            {options.map(opt => {
              const state = getOptionState(opt.key);
              const isLocked = !hasStartedClip && !currentQuestion.userAnswer;
              
              return (
                <button
                  key={opt.key}
                  disabled={!!currentQuestion.userAnswer || isLocked}
                  onClick={() => onAnswer(opt.key as 'a' | 'b' | 'c')}
                  className={`
                    w-full flex items-center gap-4 p-5 rounded-[28px] border-2 transition-all duration-300 relative group
                    ${state === 'default' 
                      ? (isLocked 
                          ? 'bg-zinc-900/20 border-transparent opacity-40 grayscale' 
                          : 'bg-[#161616] border-zinc-800/50 hover:bg-[#1a1a1a] hover:border-zinc-700 active:scale-[0.98]') 
                      : ''
                    }
                    ${state === 'correct' ? 'bg-green-500/10 border-green-500/60' : ''}
                    ${state === 'wrong' ? 'bg-red-500/10 border-red-500/60' : ''}
                    ${state === 'fade' ? 'opacity-20 border-transparent blur-[2px]' : ''}
                  `}
                >
                  <div className="w-14 h-14 rounded-[16px] bg-zinc-800 overflow-hidden flex-shrink-0 border border-white/5 shadow-inner">
                    <img 
                      src={opt.data?.cover} 
                      alt="" 
                      className={`w-full h-full object-cover transition-all duration-1000 ${currentQuestion.userAnswer ? 'blur-0 opacity-100' : 'blur-2xl opacity-20 group-hover:opacity-30'}`}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1 truncate">
                      {opt.data?.artist || 'Unknown Artist'}
                    </p>
                    <p className={`text-lg font-bold truncate leading-tight ${state === 'correct' ? 'text-green-500' : 'text-zinc-100'}`}>
                      {opt.data?.title || 'Unknown Title'}
                    </p>
                  </div>

                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/5
                    ${state === 'correct' ? 'bg-green-500 text-white' : ''}
                    ${state === 'wrong' ? 'bg-red-500 text-white' : ''}
                    ${state === 'default' ? 'bg-zinc-800 text-zinc-400 group-hover:bg-[#C6FF00] group-hover:text-white group-hover:scale-110' : ''}
                    ${state === 'fade' ? 'bg-transparent text-zinc-600' : ''}
                  `}>
                    {state === 'correct' ? <Check size={18} strokeWidth={3} /> : 
                     state === 'wrong' ? <X size={18} strokeWidth={3} /> : 
                     <Play size={16} fill="currentColor" className={state === 'default' ? "ml-0.5" : "opacity-20"} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Global Feedback Overlay */}
      <AnimatePresence>
        {showFeedback !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none ${showFeedback === 'correct' ? 'bg-green-500/10' : 'bg-red-500/5'}`}
          >
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`
                w-24 h-24 rounded-full flex items-center justify-center border-4
                ${showFeedback === 'correct' ? 'bg-green-500 border-white/20 text-white shadow-[0_0_60px_rgba(34,197,94,0.4)]' : 'bg-red-500 border-white/20 text-white shadow-[0_0_60px_rgba(239,68,68,0.4)]'}
              `}
            >
              {showFeedback === 'correct' ? <Check size={48} strokeWidth={4} /> : <X size={48} strokeWidth={4} />}
            </motion.div>
            
            {streakCelebration && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mt-6 text-center"
              >
                <p className="text-[#C6FF00] font-black text-3xl italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(255,45,120,0.4)]">
                  🔥 {streakCelebration} IN A ROW!
                </p>
                <p className="text-white text-sm font-bold uppercase tracking-widest mt-1">Certified Fan</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

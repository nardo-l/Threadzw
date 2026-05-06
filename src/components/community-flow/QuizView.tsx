import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const FALLBACK_QUESTIONS = [
  {
    id: 'q1',
    question_number: 1,
    question_text: "What's your go-to shoe?",
    question_emoji: '👟',
    quiz_answers: [
      { id: 'q1a', answer_key: 'a', answer_text: 'Air Force 1s', personality_result: 'nonchalant', image_url: null },
      { id: 'q1b', answer_key: 'b', answer_text: 'Jordans', personality_result: 'life_of_the_party', image_url: null },
      { id: 'q1c', answer_key: 'c', answer_text: 'Timbs', personality_result: 'hustler', image_url: null },
      { id: 'q1d', answer_key: 'd', answer_text: 'Whatever fits the fit', personality_result: 'creative', image_url: null }
    ]
  },
  {
    id: 'q2',
    question_number: 2,
    question_text: "Friday night, where are you?",
    question_emoji: '🌙',
    quiz_answers: [
      { id: 'q2a', answer_key: 'a', answer_text: 'In the cut', personality_result: 'nonchalant', image_url: null },
      { id: 'q2b', answer_key: 'b', answer_text: 'Small function', personality_result: 'chill', image_url: null },
      { id: 'q2c', answer_key: 'c', answer_text: 'Biggest party in Harare', personality_result: 'life_of_the_party', image_url: null },
      { id: 'q2d', answer_key: 'd', answer_text: 'Depends on the outfit', personality_result: 'ghost', image_url: null }
    ]
  },
  {
    id: 'q3',
    question_number: 3,
    question_text: "Your style in one word?",
    question_emoji: '🎨',
    quiz_answers: [
      { id: 'q3a', answer_key: 'a', answer_text: 'Clean', personality_result: 'nonchalant', image_url: null },
      { id: 'q3b', answer_key: 'b', answer_text: 'Loud', personality_result: 'life_of_the_party', image_url: null },
      { id: 'q3c', answer_key: 'c', answer_text: 'Rare', personality_result: 'ghost', image_url: null },
      { id: 'q3d', answer_key: 'd', answer_text: 'Effortless', personality_result: 'chill', image_url: null }
    ]
  },
  {
    id: 'q4',
    question_number: 4,
    question_text: "Your Harare vibe?",
    question_emoji: '🏙️',
    quiz_answers: [
      { id: 'q4a', answer_key: 'a', answer_text: 'Avondale — quiet money', personality_result: 'nonchalant', image_url: null },
      { id: 'q4b', answer_key: 'b', answer_text: "Sam Levy's — seen", personality_result: 'life_of_the_party', image_url: null },
      { id: 'q4c', answer_key: 'c', answer_text: 'Mbare — real culture', personality_result: 'hustler', image_url: null },
      { id: 'q4d', answer_key: 'd', answer_text: 'Eastlea — under the radar', personality_result: 'ghost', image_url: null }
    ]
  },
  {
    id: 'q5',
    question_number: 5,
    question_text: "Music that matches your drip?",
    question_emoji: '🎵',
    quiz_answers: [
      { id: 'q5a', answer_key: 'a', answer_text: 'Afrobeats', personality_result: 'chill', image_url: null },
      { id: 'q5b', answer_key: 'b', answer_text: 'Drill — hard fits only', personality_result: 'hustler', image_url: null },
      { id: 'q5c', answer_key: 'c', answer_text: 'R&B', personality_result: 'creative', image_url: null },
      { id: 'q5d', answer_key: 'd', answer_text: 'Whatever hits different', personality_result: 'ghost', image_url: null }
    ]
  },
  {
    id: 'q6',
    question_number: 6,
    question_text: "How do you find your fits?",
    question_emoji: '🛍️',
    quiz_answers: [
      { id: 'q6a', answer_key: 'a', answer_text: 'Thrift — rare finds', personality_result: 'ghost', image_url: null },
      { id: 'q6b', answer_key: 'b', answer_text: 'Brand stores', personality_result: 'hustler', image_url: null },
      { id: 'q6c', answer_key: 'c', answer_text: 'Online — ahead of curve', personality_result: 'creative', image_url: null },
      { id: 'q6d', answer_key: 'd', answer_text: 'Someone always brings me', personality_result: 'nonchalant', image_url: null }
    ]
  },
  {
    id: 'q7',
    question_number: 7,
    question_text: "People describe your style as?",
    question_emoji: '💭',
    quiz_answers: [
      { id: 'q7a', answer_key: 'a', answer_text: 'Lowkey but noticed', personality_result: 'nonchalant', image_url: null },
      { id: 'q7b', answer_key: 'b', answer_text: 'Loud and intentional', personality_result: 'life_of_the_party', image_url: null },
      { id: 'q7c', answer_key: 'c', answer_text: 'Creative and unexpected', personality_result: 'creative', image_url: null },
      { id: 'q7d', answer_key: 'd', answer_text: 'Consistent and reliable', personality_result: 'hustler', image_url: null }
    ]
  },
  {
    id: 'q8',
    question_number: 8,
    question_text: "Your color palette?",
    question_emoji: '🌈',
    quiz_answers: [
      { id: 'q8a', answer_key: 'a', answer_text: 'All black everything', personality_result: 'ghost', image_url: null },
      { id: 'q8b', answer_key: 'b', answer_text: 'Earth tones', personality_result: 'chill', image_url: null },
      { id: 'q8c', answer_key: 'c', answer_text: 'Whatever pops', personality_result: 'life_of_the_party', image_url: null },
      { id: 'q8d', answer_key: 'd', answer_text: 'Depends on the vibe', personality_result: 'creative', image_url: null }
    ]
  },
  {
    id: 'q9',
    question_number: 9,
    question_text: "Fit preference?",
    question_emoji: '✂️',
    quiz_answers: [
      { id: 'q9a', answer_key: 'a', answer_text: 'Oversized — comfort drip', personality_result: 'chill', image_url: null },
      { id: 'q9b', answer_key: 'b', answer_text: 'Fitted — tailored', personality_result: 'hustler', image_url: null },
      { id: 'q9c', answer_key: 'c', answer_text: 'Mixed — depends on day', personality_result: 'nonchalant', image_url: null },
      { id: 'q9d', answer_key: 'd', answer_text: 'I wear what I feel', personality_result: 'creative', image_url: null }
    ]
  },
  {
    id: 'q10',
    question_number: 10,
    question_text: "Your drip motto?",
    question_emoji: '🔥',
    quiz_answers: [
      { id: 'q10a', answer_key: 'a', answer_text: 'Less is more', personality_result: 'nonchalant', image_url: null },
      { id: 'q10b', answer_key: 'b', answer_text: 'More is more', personality_result: 'life_of_the_party', image_url: null },
      { id: 'q10c', answer_key: 'c', answer_text: 'Rarity over everything', personality_result: 'ghost', image_url: null },
      { id: 'q10d', answer_key: 'd', answer_text: 'Art over fashion', personality_result: 'creative', image_url: null }
    ]
  }
];

const BallAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [ballState, setBallState] = useState<{ x: number; y: number; trail: { x: number; y: number }[] }>({
    x: -16,
    y: 60,
    trail: []
  });
  
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const isMountedRef = useRef(true);
  
  const DURATION = 2000;

  useEffect(() => {
    isMountedRef.current = true;
    
    const animate = (timestamp: number) => {
      if (!isMountedRef.current) return;
      
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      
      // Ball X: left to right
      const containerWidth = window.innerWidth;
      const ballX = progress * (containerWidth + 32) - 16;
      
      // Ball Y: sine wave oscillation
      const centerY = 60;
      const amplitude = 22;
      const frequency = 6;
      const ballY = centerY + amplitude * Math.sin(progress * Math.PI * 2 * frequency);
      
      // Add to trail
      trailRef.current.push({
        x: ballX + 8,
        y: ballY
      });
      
      if (trailRef.current.length > 200) {
        trailRef.current.shift();
      }
      
      setBallState({
        x: ballX,
        y: ballY,
        trail: [...trailRef.current]
      });
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          if (isMountedRef.current) {
            onComplete();
          }
        }, 200);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      isMountedRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        width: '100%',
        height: 120,
        position: 'relative',
        overflow: 'visible'
      }}>
        <svg style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible'
        }}>
          <polyline
            points={ballState.trail.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(155,39,175,0.3)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={ballState.trail.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#FF2D78"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
        </svg>
        
        <div style={{
          position: 'absolute',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF2D78, #9B27AF)',
          boxShadow: '0 0 16px rgba(255,45,120,0.9), 0 0 32px rgba(255,45,120,0.4)',
          left: ballState.x,
          top: ballState.y - 8,
          transform: 'none',
          pointerEvents: 'none'
        }} />
      </div>
      
      <p style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontFamily: 'monospace',
        marginTop: 24,
        letterSpacing: 3,
        textTransform: 'uppercase'
      }}>
        Reading your drip...
      </p>
    </div>
  );
};

export const QuizView: React.FC = () => {
  const { setCommunityScreen, updateUserData, setBuyerFlowState } = useInventory();
  const { session, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizScreen, setQuizScreen] = useState<'questions' | 'loading' | 'result'>('questions');
  const [selectedAnswerKey, setSelectedAnswerKey] = useState<string | null>(null);
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchQuizData = useCallback(async () => {
    console.log('QuizView: Starting fetchQuizData');
    setLoadingQuiz(true);
    try {
      const { data: questions, error } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          quiz_answers (
            id,
            answer_key,
            answer_text,
            personality_result,
            image_url,
            display_order
          )
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Quiz fetch error from Supabase:', error);
        throw error;
      }

      console.log('QuizView: Fetch successful, count:', questions?.length);

      const sorted = (questions || []).map(q => ({
        ...q,
        quiz_answers: (q.quiz_answers || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
      }));

      if (sorted.length > 0) {
        setQuizQuestions(sorted);
      } else {
        console.warn('QuizView: No active questions in DB, using fallback');
        setQuizQuestions(FALLBACK_QUESTIONS);
      }
    } catch (err) {
      console.error('Quiz critical fetch error:', err);
      setQuizQuestions(FALLBACK_QUESTIONS);
    } finally {
      console.log('QuizView: Setting loadingQuiz to false');
      setLoadingQuiz(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  const calculatePersonality = useCallback((selections: Record<string, string>) => {
    try {
      const scores: Record<string, number> = {
        nonchalant: 0,
        chill: 0,
        life_of_the_party: 0,
        hustler: 0,
        ghost: 0,
        creative: 0
      };
      
      quizQuestions.forEach(question => {
        const selectedKey = selections[question.id];
        if (!selectedKey) return;
        
        const selectedAnswer = question.quiz_answers.find(
          (a: any) => a.answer_key === selectedKey
        );
        
        if (selectedAnswer) {
          const resultType = selectedAnswer.personality_result || 'nonchalant';
          scores[resultType] = (scores[resultType] || 0) + 1;
        }
      });
      
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      return sorted[0]?.[0] || 'nonchalant';
    } catch (e) {
      console.error('Error calculatePersonality:', e);
      return 'nonchalant';
    }
  }, [quizQuestions]);

  const handleBallComplete = useCallback(async () => {
    console.log('--- BALL ANIMATION COMPLETE ---');
    try {
      // Calculate personality
      console.log('Calculating personality from answers:', answers);
      const result = calculatePersonality(answers);
      console.log('Result calculated:', result);
      
      // Update local storage and context immediately to avoid race conditions with DB
      updateUserData({ personality: result });
      
      if (session) {
        // Sync in background - do not await
        (async () => {
          try {
            await updateProfile({ personality_type: result });
            await supabase.from('personality_results').upsert({
              user_id: session.user.id,
              personality_type: result,
              selections: answers,
              is_current: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
          } catch (syncErr) {
            console.error('Non-blocking DB sync error:', syncErr);
          }
        })();
      }
      
      console.log('Final step: update screens');
      if (isMounted.current) {
        setCommunityScreen('quizResult');
        setBuyerFlowState('quizResult');
      }
    } catch (err) {
      console.error('handleBallComplete critical error:', err);
      if (isMounted.current) {
        setCommunityScreen('quizResult');
        setBuyerFlowState('quizResult');
      }
    }
  }, [answers, session, updateProfile, updateUserData, setCommunityScreen, setBuyerFlowState, calculatePersonality]);

  useEffect(() => {
    if (quizScreen !== 'loading') return;
    
    console.log('BALL ANIMATION MOUNTED (quizScreen === loading)');
    
    // Safety net — extreme fallback if animation totally fails to call onComplete
    const safetyTimer = setTimeout(() => {
      console.warn('BALL ANIMATION SAFETY TIMEOUT - FORCING RESULT');
      if (isMounted.current) {
        handleBallComplete();
      }
    }, 6000);
    
    return () => {
      console.log('Cleaning up loading safety timer');
      clearTimeout(safetyTimer);
    };
  }, [quizScreen, handleBallComplete]);

  const handleSelect = async (questionId: string, answerKey: string) => {
    setSelectedAnswerKey(answerKey);
    const newAnswers = { ...answers, [questionId]: answerKey };
    setAnswers(newAnswers);

    setTimeout(async () => {
      if (currentStep < quizQuestions.length - 1) {
        if (isMounted.current) {
          setCurrentStep(prev => prev + 1);
          setSelectedAnswerKey(null);
        }
      } else {
        console.log('Quiz screen changing to loading');
        console.log('Answers:', newAnswers);
        console.log('Questions:', quizQuestions?.length);
        if (isMounted.current) {
          setQuizScreen('loading');
        }
      }
    }, 400);
  };

  const handleClose = () => {
    if (Object.keys(answers).length > 0) {
      if (window.confirm("Exit quiz? Your progress will be lost.")) {
        setCommunityScreen('hub');
        navigate('/');
      }
    } else {
      setCommunityScreen('hub');
      navigate('/');
    }
  };

  const currentQuestion = quizQuestions[currentStep];

  if (loadingQuiz) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF2D78]/20 border-t-[#FF2D78] rounded-full animate-spin" />
        <p className="mt-4 text-[#888] font-mono text-[13px] tracking-widest uppercase">Reading your vibe...</p>
      </div>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-white font-bold">Something went wrong loading the quiz.</p>
        <button 
          onClick={handleClose}
          className="mt-4 px-6 h-12 bg-[#FF2D78] rounded-full text-white font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (quizScreen === 'loading') {
    return <BallAnimation onComplete={handleBallComplete} />;
  }

  const getQuestionFontSize = (text: string) => {
    if (text.length < 30) return 'text-[26px]';
    if (text.length < 50) return 'text-[22px]';
    return 'text-[18px]';
  };

  const gradients = [
    'from-[#1a1a2a] to-[#2a1a3a]',
    'from-[#1a2a1a] to-[#0a1a0a]',
    'from-[#2a1a1a] to-[#3a0a0a]',
    'from-[#1a1a1a] to-[#2a2a2a]'
  ];

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col font-sans">
      {/* Top Bar */}
      <div className="px-5 pt-12 pb-2 flex items-center justify-between">
        <button 
          onClick={handleClose}
          className="w-9 h-9 rounded-full bg-[#111] flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <X size={18} />
        </button>
        <span className="text-white font-mono font-bold text-[14px]">
          {currentStep + 1}/{quizQuestions.length}
        </span>
      </div>

      {/* Progress Bars */}
      <div className="px-5 mt-2 flex gap-[3px]">
        {quizQuestions.map((_, idx) => (
          <div key={idx} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: '0%' }}
              animate={{ 
                width: idx < currentStep ? '100%' : (idx === currentStep ? '100%' : '0%') 
              }}
              transition={{ duration: idx === currentStep ? 0.4 : 0 }}
              className="h-full bg-[#FF2D78]"
            />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col pt-8 min-h-full"
          >
            {/* Question Section */}
            <div className="px-5 mb-8">
              <span className="text-[28px] mb-2 block">{currentQuestion?.question_emoji}</span>
              <h2 className={`text-white font-bold leading-tight uppercase ${getQuestionFontSize(currentQuestion?.question_text || '')}`} style={{ fontFamily: "'Bebas Neue', 'Arial Black', sans-serif", letterSpacing: '0.02em' }}>
                {currentQuestion?.question_text}
              </h2>
            </div>

            {/* Answers Grid */}
            <div className="px-5 pb-20">
              <div className="grid grid-cols-2 gap-2.5">
                {currentQuestion?.quiz_answers.map((answer: any, idx: number) => {
                  const isSelected = selectedAnswerKey === answer.answer_key;
                  const isAnySelected = selectedAnswerKey !== null;

                  return (
                    <motion.button
                      key={answer.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => !isAnySelected && handleSelect(currentQuestion.id, answer.answer_key)}
                      className={`
                        relative aspect-[4/5] rounded-[16px] overflow-hidden transition-all duration-300
                        ${isSelected ? 'border-[3px] border-[#FF2D78] scale-[0.97] brightness-75' : 'border-2 border-transparent'}
                        ${isAnySelected && !isSelected ? 'opacity-40' : 'opacity-100'}
                      `}
                    >
                      {answer.image_url ? (
                        <>
                          <img 
                            src={answer.image_url} 
                            alt={answer.answer_text} 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                          <span className="absolute bottom-3 left-3 right-3 text-white font-bold text-[13px] leading-tight text-left shadow-black" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                            {answer.answer_text}
                          </span>
                        </>
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${gradients[idx % gradients.length]} flex flex-col items-center justify-center p-4 text-center`}>
                          <span className="text-[24px] mb-2 opacity-80">{currentQuestion.question_emoji}</span>
                          <span className="text-white font-bold text-[14px]">
                            {answer.answer_text}
                          </span>
                        </div>
                      )}

                      {/* Selected Indicator */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute top-2.5 right-2.5 w-7 h-7 bg-[#FF2D78] rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                          >
                            <span className="text-white font-bold text-[14px]">✓</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};


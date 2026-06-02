import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const FALLBACK_QUESTIONS = [
  // ... (keeping FALLBACK_QUESTIONS as is)
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

  const ACCENT_COLOR = '#FF2D78';

  useEffect(() => {
    isMountedRef.current = true;
    
    const animate = (timestamp: number) => {
      if (!isMountedRef.current) return;
      
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      
      const containerWidth = window.innerWidth;
      const ballX = progress * (containerWidth + 32) - 16;
      
      const centerY = 60;
      const amplitude = 22;
      const frequency = 6;
      const ballY = centerY + amplitude * Math.sin(progress * Math.PI * 2 * frequency);
      
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
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]">
      <div className="w-full h-[120px] relative overflow-visible">
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          <polyline
            points={ballState.trail.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={`${ACCENT_COLOR}1A`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={ballState.trail.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={ACCENT_COLOR}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        </svg>
        
        <div 
          className="absolute w-5 h-5 rounded-full bg-gradient-to-br from-[#9B27AF] to-[#FF2D78] pointer-events-none"
          style={{
            boxShadow: `0 0 20px ${ACCENT_COLOR}66`,
            left: ballState.x,
            top: ballState.y - 10
          }} 
        />
      </div>
      
      <p className="text-[#888888] text-[12px] font-bold mt-8 tracking-[4px] uppercase">
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

  const ACCENT_COLOR = '#FF2D78';

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchQuizData = useCallback(async () => {
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

      if (error) throw error;

      const sorted = (questions || []).map(q => ({
        ...q,
        quiz_answers: (q.quiz_answers || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
      }));

      if (sorted.length > 0) {
        setQuizQuestions(sorted);
      } else {
        setQuizQuestions(FALLBACK_QUESTIONS);
      }
    } catch (err) {
      console.error('Quiz critical fetch error:', err);
      setQuizQuestions(FALLBACK_QUESTIONS);
    } finally {
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
    try {
      const result = calculatePersonality(answers);
      updateUserData({ personality: result } as any);
      
      if (session) {
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
    
    const safetyTimer = setTimeout(() => {
      if (isMounted.current) {
        handleBallComplete();
      }
    }, 6000);
    
    return () => {
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
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 rounded-full animate-spin border-[#FF2D78]/10 border-t-[#FF2D78]" />
        <p className="mt-6 font-bold text-[13px] tracking-widest uppercase text-[#888888]">Reading your vibe...</p>
      </div>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 text-center bg-white">
        <p className="font-bold text-[#111111]">Something went wrong loading the quiz.</p>
        <button 
          onClick={handleClose}
          className="mt-6 px-8 h-14 rounded-full text-white font-bold bg-[#FF2D78] shadow-lg"
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
    if (text.length < 30) return 'text-[32px]';
    if (text.length < 50) return 'text-[28px]';
    return 'text-[24px]';
  };

  const gradients = [
    'from-[#F0F4FF] to-[#E0E7FF]',
    'from-[#F0FFF4] to-[#DCFCE7]',
    'from-[#FFF0F0] to-[#FEE2E2]',
    'from-[#F5F5F5] to-[#EFEFEF]'
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col font-sans bg-white">
      {/* Top Bar */}
      <div className="px-5 pt-12 pb-2 flex items-center justify-between">
        <button 
          onClick={handleClose}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform bg-[#F5F5F5] text-[#111111]"
        >
          <X size={18} />
        </button>
        <span className="font-bold text-[14px] text-[#888888]">
          {currentStep + 1}/{quizQuestions.length}
        </span>
      </div>

      {/* Progress Bars */}
      <div className="px-5 mt-4 flex gap-[4px]">
        {quizQuestions.map((_, idx) => (
          <div key={`quiz-progress-bar-${idx}`} className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#F5F5F5]">
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
            className="flex flex-col pt-12 min-h-full"
          >
            {/* Question Section */}
            <div className="px-6 mb-10">
              <span className="text-[36px] mb-4 block">{currentQuestion?.question_emoji}</span>
              <h2 className={`font-bold leading-tight text-[#111111] ${getQuestionFontSize(currentQuestion?.question_text || '')}`} style={{ letterSpacing: '-0.02em' }}>
                {currentQuestion?.question_text}
              </h2>
            </div>

            {/* Answers Grid */}
            <div className="px-5 pb-24">
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion?.quiz_answers.map((answer: any, idx: number) => {
                  const isSelected = selectedAnswerKey === answer.answer_key;
                  const isAnySelected = selectedAnswerKey !== null;

                  return (
                    <motion.button
                      key={answer.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => !isAnySelected && handleSelect(currentQuestion.id, answer.answer_key)}
                      className={`
                        relative aspect-[4/5] rounded-[24px] overflow-hidden transition-all duration-300 border-2
                        ${isSelected ? 'border-[#FF2D78]' : 'border-transparent'}
                      `}
                      style={{ 
                        opacity: isAnySelected && !isSelected ? 0.5 : 1,
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        zIndex: isSelected ? 10 : 1
                      }}
                    >
                      {answer.image_url ? (
                        <>
                          <img 
                            src={answer.image_url} 
                            alt={answer.answer_text} 
                            className="absolute inset-0 w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <span className="absolute bottom-4 left-4 right-4 text-white font-bold text-[15px] leading-tight text-left">
                            {answer.answer_text}
                          </span>
                        </>
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${gradients[idx % gradients.length]} flex flex-col items-center justify-center p-5 text-center`}>
                          <span className="text-[28px] mb-4 opacity-50">{currentQuestion.question_emoji}</span>
                          <span className="font-bold text-[15px] text-[#111111]">
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
                            className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg bg-[#FF2D78]"
                          >
                            <span className="text-white font-bold text-[16px]">✓</span>
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


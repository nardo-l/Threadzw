import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const QuizFlow: React.FC = () => {
  const { setBuyerFlowState } = useInventory();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(10).fill(-1));
  const [loading, setLoading] = useState(false);

  const questions = [
    { emoji: '👟', q: "What's your go-to shoe?", options: ["Air Force 1s", "Jordans", "Timbs", "Whatever's clean"] },
    { emoji: '🌙', q: "Friday night vibe?", options: ["In the cut", "Low-key function", "Big party", "Depends on the bag"] },
    { emoji: '🎨', q: "Style in one word?", options: ["Clean", "Loud", "Rare", "Effortless"] },
    { emoji: '🏙️', q: "Your Harare vibe?", options: ["Local explorer", "Main character", "Underground", "Boujee only"] },
    { emoji: '🎵', q: "Music that matches your fit?", options: ["ZimDancehall", "Hip Hop", "Amapiano", "Alt/Indie"] },
    { emoji: '🛍️', q: "How do you shop?", options: ["Hunt for grails", "Latest drops only", "Market day", "Gifted items"] },
    { emoji: '💭', q: "People say your style is...", options: ["Different", "Rich", "Chill", "Aggressive"] },
    { emoji: '🌈', q: "Go-to color palette?", options: ["Vibrant", "Earth tones", "All black", "Monochrome"] },
    { emoji: '✂️', q: "Fit preference?", options: ["Skinny", "Wide leg", "Boxy", "Tailored"] },
    { emoji: '🔥', q: "Your drip motto?", options: ["Quality over quantity", "Confidence is the only fit", "Never seen before", "Simple is elite"] },
  ];

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentStep] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (selectedAnswers[currentStep] === -1) return;
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setLoading(true);
      setTimeout(() => {
        setBuyerFlowState('quizResult');
      }, 1000);
    }
  };

  const currentQ = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black">
           <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-4 border-[#333] border-t-[#C6FF00]"
           />
           <span className="text-white font-bold text-[18px] mt-6">Analyzing your drip...</span>
        </div>
     );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Top Bar */}
      <div className="px-5 py-4 flex items-center sticky top-0 bg-black z-20">
        <button onClick={() => setBuyerFlowState('home')}>
          <X className="text-white" size={24} />
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 mt-2">
        <div className="flex justify-between items-center mb-2">
           <span className="text-[#888] text-[12px]">Question {currentStep + 1} of {questions.length}</span>
        </div>
        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
           <motion.div 
            animate={{ width: `${progress}%` }}
            className="h-full bg-linear-to-r from-[#9B27AF] to-[#C6FF00]" 
           />
        </div>
      </div>

      {/* Question Card */}
      <div className="mx-5 mt-8 bg-[#111] border border-[#222] rounded-[20px] p-6">
        <span className="text-[24px] mb-3 block">{currentQ.emoji}</span>
        <h2 className="text-white font-bold text-[20px] leading-[1.4]">
          {currentQ.q}
        </h2>
      </div>

      {/* Options */}
      <div className="px-5 mt-6 space-y-2.5">
        {currentQ.options.map((opt, i) => (
          <button 
            key={`quiz-opt-${currentStep}-${i}`}
            onClick={() => handleSelect(i)}
            className={`w-full flex items-center justify-between p-4 px-[18px] rounded-[14px] border-1.5 transition-all text-left
              ${selectedAnswers[currentStep] === i 
                ? 'bg-[#C6FF001A] border-[#C6FF00] border-l-3' 
                : 'bg-[#111] border-[#222]'}`}
          >
            <span className={`text-[14px] ${selectedAnswers[currentStep] === i ? 'text-white font-bold' : 'text-white'}`}>
              {opt}
            </span>
            {selectedAnswers[currentStep] === i && (
              <div className="w-2 h-2 bg-[#C6FF00] rounded-full shadow-[0_0_8px_#C6FF00]" />
            )}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <div className="mt-auto p-4 px-5 bg-black border-t border-[#111] pb-10">
        <button 
          onClick={handleNext}
          disabled={selectedAnswers[currentStep] === -1}
          className={`w-full h-[52px] rounded-full font-bold text-[15px] flex items-center justify-center transition-all
            ${selectedAnswers[currentStep] !== -1 ? 'bg-linear-to-r from-[#9B27AF] to-[#C6FF00] text-white active:scale-[0.98]' : 'bg-[#333] text-[#666]'}`}
        >
          {currentStep === questions.length - 1 ? "See My Result →" : "Next →"}
        </button>
      </div>
    </div>
  );
};

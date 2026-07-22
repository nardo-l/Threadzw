import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight } from 'lucide-react';

export const GuidedWalkthrough = () => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const needsWalkthrough = localStorage.getItem('threadzw_needs_walkthrough');
    const isCompleted = localStorage.getItem('threadzw_walkthrough_completed');
    if (needsWalkthrough === 'true' && isCompleted !== 'true') {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const steps = [
    { title: "Store", description: "Customize your storefront here." },
    { title: "Products", description: "Add your first product." },
    { title: "Dashboard", description: "Track your business here." }
  ];

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.removeItem('threadzw_needs_walkthrough');
    localStorage.setItem('threadzw_walkthrough_completed', 'true');
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleDismiss();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
      >
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-zinc-900 text-lg">Step {step + 1} of {steps.length}</h3>
          <button onClick={handleDismiss} className="p-2 hover:bg-zinc-100 rounded-full">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-black text-xl text-zinc-900">{steps[step].title}</h4>
          <p className="text-zinc-600 font-medium">{steps[step].description}</p>
        </div>

        <button 
          onClick={handleNext}
          className="w-full mt-4 h-12 bg-zinc-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
        >
          {step === steps.length - 1 ? "Finish" : "Next"}
          {step !== steps.length - 1 && <ArrowRight className="w-4 h-4" />}
        </button>
      </motion.div>
    </div>
  );
};

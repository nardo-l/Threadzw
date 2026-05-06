import React from 'react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon: React.ReactNode | string;
  heading: string;
  body: string;
  buttonLabel?: string;
  buttonAction?: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  heading,
  body,
  buttonLabel,
  buttonAction,
  secondaryLabel,
  secondaryAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
      <div className="w-16 h-16 bg-card border border-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
        {typeof icon === 'string' ? (
          <span className="text-4xl">{icon}</span>
        ) : (
          <div className="text-muted">{icon}</div>
        )}
      </div>
      
      <h3 className="text-xl font-syne font-bold text-white mb-3">
        {heading}
      </h3>
      
      <p className="text-sm font-sans text-muted leading-relaxed max-w-[260px] mb-8">
        {body}
      </p>
      
      {buttonLabel && buttonAction && (
        <button 
          onClick={buttonAction}
          className="w-full max-w-[280px] py-4 bg-primary text-white font-syne font-bold rounded-pill shadow-lg shadow-primary/20 transition-all active:scale-95 mb-4"
        >
          {buttonLabel}
        </button>
      )}
      
      {secondaryLabel && secondaryAction && (
        <button 
          onClick={secondaryAction}
          className="text-xs font-mono text-muted uppercase tracking-widest hover:text-white transition-colors"
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
};

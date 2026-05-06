import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ScreenErrorProps {
  icon: React.ReactNode;
  heading: string;
  body: string;
  onRetry: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
}

export const ScreenError: React.FC<ScreenErrorProps> = ({
  icon,
  heading,
  body,
  onRetry,
  secondaryLabel,
  secondaryAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
      <div className="w-16 h-16 bg-card border border-red/20 rounded-2xl flex items-center justify-center mb-6 shadow-xl text-red">
        {icon}
      </div>
      
      <h3 className="text-xl font-syne font-bold text-white mb-3">
        {heading}
      </h3>
      
      <p className="text-sm font-sans text-muted leading-relaxed max-w-[260px] mb-8">
        {body}
      </p>
      
      <button 
        onClick={onRetry}
        className="w-full max-w-[280px] py-4 bg-primary text-white font-syne font-bold rounded-pill shadow-lg shadow-primary/20 transition-all active:scale-95 mb-4 flex items-center justify-center gap-2"
      >
        <RefreshCw size={18} />
        Try Again
      </button>
      
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

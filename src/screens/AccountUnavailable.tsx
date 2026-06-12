import React from 'react';
import { AlertTriangle, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccountUnavailableProps {
  variant: 'suspended' | 'deleted';
}

export const AccountUnavailable: React.FC<AccountUnavailableProps> = ({ variant }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[10000] bg-gradient-to-br from-primary to-purple flex flex-col items-center justify-center p-8 text-center gap-10">
      <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-2xl">
        <AlertTriangle size={40} />
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-pacifico text-white">Account unavailable</h1>
        <p className="text-base font-sans text-white/80 leading-relaxed max-w-[300px]">
          {variant === 'suspended' 
            ? "Your account has been suspended. Contact Thread ZW support if you think this is a mistake."
            : "This account no longer exists."}
        </p>
      </div>

      <div className="flex flex-col w-full gap-4 max-w-[300px]">
        <button 
          onClick={() => window.open('https://wa.me/263770000000', '_blank')}
          className="w-full py-4 bg-white/10 border border-white/20 text-white font-syne font-bold rounded-pill backdrop-blur-md flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <MessageCircle size={18} />
          Contact Support
        </button>
        
        <button 
          onClick={() => {
            localStorage.clear();
            navigate('/auth?mode=signin');
          }}
          className="text-xs font-mono text-white/60 uppercase tracking-widest hover:text-white transition-colors"
        >
          Sign In with Different Account
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Lock } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useNavigate } from 'react-router-dom';

export const SessionExpiredOverlay: React.FC = () => {
  const { sessionExpired, logout } = useInventory();
  const navigate = useNavigate();

  if (!sessionExpired) return null;

  const handleSignIn = () => {
    logout();
    navigate('/auth?mode=signin');
    window.location.reload(); // Ensure state is fully cleared
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-card border border-white/5 rounded-card p-8 w-full max-w-[340px] flex flex-col items-center text-center gap-6 shadow-2xl">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Lock size={32} />
        </div>
        
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-syne font-bold text-white">Session expired</h3>
          <p className="text-sm font-sans text-muted leading-relaxed">
            Please sign in again to continue.
          </p>
        </div>

        <button 
          onClick={handleSignIn}
          className="w-full py-4 bg-primary text-white font-syne font-bold rounded-pill shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          Sign In →
        </button>
      </div>
    </div>
  );
};

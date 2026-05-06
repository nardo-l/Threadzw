import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, Toast as ToastType } from '../context/ToastContext';

const ToastIcon: React.FC<{ type: ToastType['type'] }> = ({ type }) => {
  switch (type) {
    case 'success': return <CheckCircle2 size={18} className="text-green" />;
    case 'error': return <XCircle size={18} className="text-red" />;
    case 'warning': return <AlertTriangle size={18} className="text-amber" />;
    case 'info': return <Info size={18} className="text-blue" />;
    case 'action': return null;
    default: return null;
  }
};

const ToastItem: React.FC<{ toast: ToastType }> = ({ toast }) => {
  const { dismissToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => dismissToast(toast.id), 200);
  };

  const borderColors = {
    success: 'border-l-green',
    error: 'border-l-red',
    warning: 'border-l-amber',
    info: 'border-l-blue',
    action: 'border-l-primary',
  };

  return (
    <div 
      onClick={handleDismiss}
      className={`
        pointer-events-auto
        flex items-center gap-3 p-3 px-4.5
        bg-[#1f1f1f] border border-[#2a2a2a] rounded-[100px]
        shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        max-w-full w-fit
        transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
        ${isExiting ? 'translate-y-5 opacity-0' : 'translate-y-0 opacity-100'}
        animate-in fade-in slide-in-from-bottom-5
        border-l-2 ${borderColors[toast.type]}
      `}
    >
      <ToastIcon type={toast.type} />
      <span className="text-[13px] font-sans text-white whitespace-nowrap overflow-hidden text-ellipsis">
        {toast.message}
      </span>
      
      {toast.action && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toast.action?.onClick();
            handleDismiss();
          }}
          className="ml-2 px-3 py-1 bg-primary text-black text-[11px] font-mono font-bold rounded-full transition-transform active:scale-95"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'action';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, action?: ToastAction, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType, action?: ToastAction, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    const defaultDuration = type === 'action' ? 6000 : type === 'warning' ? 5000 : type === 'error' ? 4000 : 3000;
    
    const newToast: Toast = {
      id,
      message,
      type,
      action,
      duration: duration || defaultDuration,
    };

    setToasts((prev) => {
      // Max 2 toasts visible at once
      const next = [...prev, newToast];
      if (next.length > 2) {
        return next.slice(next.length - 2);
      }
      return next;
    });

    setTimeout(() => {
      dismissToast(id);
    }, newToast.duration);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

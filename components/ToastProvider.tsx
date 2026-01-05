'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { Toast as ToastType } from './ui/Toast';

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastType | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({
      id: Date.now().toString(),
      message,
      type,
    });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </ToastContext.Provider>
  );
}


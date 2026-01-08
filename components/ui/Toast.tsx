'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, XCircle } from 'lucide-react';
import { useEffect } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastProps {
  toast: Toast | null;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed top-6 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-lg pointer-events-none"
        >
          <div
            className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border ${
              toast.type === 'success'
                ? 'bg-green-600/90 border-green-400 text-white'
                : 'bg-red-600/90 border-red-400 text-white'
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base sm:text-lg text-center">
                {toast.message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


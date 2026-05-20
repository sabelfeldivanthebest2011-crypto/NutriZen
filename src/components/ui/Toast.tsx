import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string;
  onUndo?: () => void;
  onClose: () => void;
  isVisible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, onUndo, onClose, isVisible }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
           initial={{ y: 100, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: 100, opacity: 0 }}
           className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm"
        >
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-primary-400">
                 <CheckCircle2 size={20} />
              </div>
              <span className="text-white font-bold text-sm">{message}</span>
            </div>
            {onUndo && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onUndo();
                  onClose();
                }}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl transition-colors group"
              >
                <RotateCcw size={14} className="text-white group-active:rotate-[-180deg] transition-transform" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Отменить</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

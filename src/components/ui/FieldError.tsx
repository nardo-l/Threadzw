import React from 'react';
import { XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FieldErrorProps {
  message: string | null | undefined;
}

export const FieldError: React.FC<FieldErrorProps> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-1.5 mt-1.5 overflow-hidden"
        >
          <XCircle size={12} className="text-red flex-shrink-0" />
          <span className="text-[12px] font-sans text-red leading-none">
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

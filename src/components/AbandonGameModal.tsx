import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../hooks/useSound';

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AbandonGameModal({ open, onConfirm, onCancel }: Props) {
  const [focusIndex, setFocusIndex] = useState(0); // 0 = YES, 1 = NO
  const sound = useSound();

  // Reset focus when opened
  useEffect(() => {
    if (open) setFocusIndex(0);
  }, [open]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (focusIndex === 0) onConfirm();
      else onCancel();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setFocusIndex((prev) => (prev === 0 ? 1 : 0));
    }
  }, [open, focusIndex, onConfirm, onCancel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 100 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            className="relative flex flex-col items-center gap-10 px-16 py-12"
            style={{
              background: 'rgba(10, 10, 26, 0.95)',
              border: '3px solid #FFD700',
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.05)',
              borderRadius: '4px',
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#FFD700',
                fontSize: '16px',
                textShadow: '0 0 15px rgba(255, 215, 0, 0.5)',
              }}
            >
              Abandon Game?
            </div>

            <div className="flex gap-6">
              <button
                onClick={() => { sound.playClickSound(); onConfirm(); }}
                className="px-6 py-3 cursor-pointer transition-all hover:scale-105"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '12px',
                  color: '#ff4444',
                  background: focusIndex === 0 ? 'rgba(255, 68, 68, 0.25)' : 'rgba(255, 68, 68, 0.1)',
                  border: `2px solid ${focusIndex === 0 ? '#ff6666' : '#ff4444'}`,
                  borderRadius: '2px',
                  boxShadow: focusIndex === 0 ? '0 0 12px rgba(255,68,68,0.4)' : 'none',
                }}
              >
                YES
              </button>
              <button
                onClick={() => { sound.playClickSound(); onCancel(); }}
                className="px-6 py-3 cursor-pointer transition-all hover:scale-105"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '12px',
                  color: '#21C19A',
                  background: focusIndex === 1 ? 'rgba(33, 193, 154, 0.25)' : 'rgba(33, 193, 154, 0.1)',
                  border: `2px solid ${focusIndex === 1 ? '#2AD4A8' : '#21C19A'}`,
                  borderRadius: '2px',
                  boxShadow: focusIndex === 1 ? '0 0 12px rgba(33,193,154,0.4)' : 'none',
                }}
              >
                NO
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

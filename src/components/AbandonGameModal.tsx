import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AbandonGameModal({ open, onConfirm, onCancel }: Props) {
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
            className="relative flex flex-col items-center gap-6 px-10 py-8"
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
                onClick={onConfirm}
                className="px-6 py-3 cursor-pointer transition-all hover:scale-105"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '12px',
                  color: '#ff4444',
                  background: 'rgba(255, 68, 68, 0.1)',
                  border: '2px solid #ff4444',
                  borderRadius: '2px',
                }}
              >
                YES
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-3 cursor-pointer transition-all hover:scale-105"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '12px',
                  color: '#21C19A',
                  background: 'rgba(33, 193, 154, 0.1)',
                  border: '2px solid #21C19A',
                  borderRadius: '2px',
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

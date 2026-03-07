import { motion } from 'framer-motion';

interface Props {
  onPlayAgain: () => void;
}

export default function LoseScreen({ onPlayAgain }: Props) {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #0a0a0a 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <motion.div
        className="relative z-10 text-center"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div
          className="text-3xl md:text-5xl mb-6"
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#ff4444',
            textShadow: '0 0 30px rgba(255, 0, 0, 0.5), 2px 2px 0 #5a0000',
          }}
        >
          BACK TO THE PIPELINE.
        </div>
        <div
          className="mb-8"
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#777',
            fontSize: '11px',
          }}
        >
          Product shipped faster. Better luck next quarter.
        </div>
      </motion.div>

      <motion.button
        onClick={onPlayAgain}
        className="relative z-10 px-8 py-4 text-sm tracking-wider cursor-pointer"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: '#ff4444',
          backgroundColor: '#000',
          border: '3px solid #ff4444',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        PLAY AGAIN
      </motion.button>
    </motion.div>
  );
}

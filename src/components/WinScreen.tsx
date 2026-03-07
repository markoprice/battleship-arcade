import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Props {
  onPlayAgain: () => void;
}

export default function WinScreen({ onPlayAgain }: Props) {
  useEffect(() => {
    // Gold confetti explosion
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FFFFFF'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FFFFFF'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a1a 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="text-center"
      >
        <div
          className="text-4xl md:text-6xl mb-4"
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#FFD700',
            textShadow: '0 0 40px rgba(255, 215, 0, 0.8), 3px 3px 0 #8B6914',
          }}
        >
          DEAL CLOSED.
        </div>
        <div className="text-6xl mb-6">🏆</div>
        <div
          className="mb-8"
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#aaa',
            fontSize: '11px',
          }}
        >
          Sales wins. Product couldn't ship fast enough.
        </div>
      </motion.div>

      <motion.button
        onClick={onPlayAgain}
        className="px-8 py-4 text-sm tracking-wider cursor-pointer"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: '#FFD700',
          backgroundColor: '#000',
          border: '3px solid #FFD700',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        PLAY AGAIN
      </motion.button>
    </motion.div>
  );
}

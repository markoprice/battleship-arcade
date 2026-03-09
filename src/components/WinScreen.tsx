import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import bgImage from '../assets/background.jpg';
import ArcadeCanvas from './ArcadeCanvas';
import { useSound } from '../hooks/useSound';

interface Props {
  onPlayAgain: () => void;
}

export default function WinScreen({ onPlayAgain }: Props) {
  const sound = useSound();
  useEffect(() => {
    // Gold confetti explosion
    const duration = 3000;
    const end = Date.now() + duration;
    let rafId: number;

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
        rafId = requestAnimationFrame(frame);
      }
    };
    frame();

    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <ArcadeCanvas>
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: '#0a0a1a' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-black/30" />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="relative z-10 text-center"
      >
        <div
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#FFD700',
            fontSize: '48px',
            textShadow: '0 0 40px rgba(255, 215, 0, 0.8), 3px 3px 0 #8B6914',
            marginBottom: '24px',
          }}
        >
          DEAL CLOSED.
        </div>
        <div style={{ fontSize: '64px', marginBottom: '32px' }}>🏆</div>
        <div
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#aaa',
            fontSize: '12px',
            marginBottom: '48px',
          }}
        >
          Sales wins. Maybe stick to coding, Product.
        </div>
      </motion.div>

      <motion.button
        onClick={() => { sound.playClickSound(); onPlayAgain(); }}
        className="relative z-10 tracking-wider cursor-pointer"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: '#FFD700',
          backgroundColor: '#000',
          border: '3px solid #FFD700',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          padding: '16px 40px',
          fontSize: '14px',
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
    </ArcadeCanvas>
  );
}

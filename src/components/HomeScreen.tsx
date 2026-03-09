import { motion } from 'framer-motion';
import homeBg from '../assets/01-home_bg.jpg';

interface Props {
  onStart: () => void;
}

export default function HomeScreen({ onStart }: Props) {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ backgroundColor: '#0a0a1a' }}
    >
      {/* Background image: contain so full height is always visible */}
      <img
        src={homeBg}
        alt="Battleship"
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
        style={{ pointerEvents: 'none' }}
      />

      {/* Button positioned in the water below the boat */}
      <div
        className="absolute left-1/2 z-10"
        style={{ top: '80%', transform: 'translateX(-50%)', maxWidth: '90vw' }}
      >
        <motion.button
          onClick={onStart}
          className="text-3xl md:text-4xl tracking-wider cursor-pointer transition-transform duration-200 hover:scale-[1.08] active:scale-95"
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#FFD700',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            border: '3px solid #FFD700',
            padding: 'clamp(12px, 3vh, 24px) clamp(24px, 5vw, 64px)',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.7), 0 0 40px rgba(255, 215, 0, 0.3)',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.3), inset 0 0 15px rgba(255, 215, 0, 0.1)',
            whiteSpace: 'nowrap',
          }}
          animate={{
            boxShadow: [
              '0 0 8px rgba(255, 215, 0, 0.15), inset 0 0 8px rgba(255, 215, 0, 0.03)',
              '0 0 25px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(255, 215, 0, 0.1)',
              '0 0 8px rgba(255, 215, 0, 0.15), inset 0 0 8px rgba(255, 215, 0, 0.03)',
            ],
            borderColor: [
              'rgba(255, 215, 0, 0.4)',
              'rgba(255, 215, 0, 0.9)',
              'rgba(255, 215, 0, 0.4)',
            ],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}

        >
          PRESS START
        </motion.button>
      </div>
    </motion.div>
  );
}

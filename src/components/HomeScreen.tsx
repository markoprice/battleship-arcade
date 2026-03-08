import { motion } from 'framer-motion';
import homeBg from '../assets/01-home_bg.png';

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
        style={{ top: '80%', transform: 'translateX(-50%)' }}
      >
        <motion.button
          onClick={onStart}
          className="px-16 py-7 text-2xl md:text-3xl tracking-wider cursor-pointer"
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#FFD700',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            border: '3px solid #FFD700',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.3), inset 0 0 15px rgba(255, 215, 0, 0.1)',
          }}
          animate={{
            textShadow: [
              '0 0 10px rgba(255, 215, 0, 0.3)',
              '0 0 25px rgba(255, 215, 0, 0.9), 0 0 50px rgba(255, 215, 0, 0.4)',
              '0 0 10px rgba(255, 215, 0, 0.3)',
            ],
            boxShadow: [
              '0 0 10px rgba(255, 215, 0, 0.2), inset 0 0 10px rgba(255, 215, 0, 0.05)',
              '0 0 30px rgba(255, 215, 0, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.15)',
              '0 0 10px rgba(255, 215, 0, 0.2), inset 0 0 10px rgba(255, 215, 0, 0.05)',
            ],
            borderColor: [
              'rgba(255, 215, 0, 0.6)',
              'rgba(255, 215, 0, 1)',
              'rgba(255, 215, 0, 0.6)',
            ],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          PRESS START
        </motion.button>
      </div>
    </motion.div>
  );
}

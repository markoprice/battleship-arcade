import { motion } from 'framer-motion';
import bgImage from '../assets/background.jpg';
import ArcadeCanvas from './ArcadeCanvas';

interface Props {
  onPlayAgain: () => void;
}

export default function LoseScreen({ onPlayAgain }: Props) {
  return (
    <ArcadeCanvas>
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-black/60" />

      <motion.div
        className="relative z-10 text-center"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#ff4444',
            fontSize: '40px',
            textShadow: '0 0 30px rgba(255, 0, 0, 0.5), 2px 2px 0 #5a0000',
            marginBottom: '32px',
          }}
        >
          BACK TO THE PIPELINE.
        </div>
        <div
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#777',
            fontSize: '12px',
            marginBottom: '48px',
          }}
        >
          Product shipped faster. Better luck next quarter.
        </div>
      </motion.div>

      <motion.button
        onClick={onPlayAgain}
        className="relative z-10 tracking-wider cursor-pointer"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: '#ff4444',
          backgroundColor: '#000',
          border: '3px solid #ff4444',
          padding: '16px 40px',
          fontSize: '14px',
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
    </ArcadeCanvas>
  );
}

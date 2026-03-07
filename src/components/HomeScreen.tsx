import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import homeBg from '../assets/01-home_bg.png';

interface Props {
  onStart: () => void;
}

export default function HomeScreen({ onStart }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setVisible((v) => !v), 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${homeBg})` }}
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 mb-24">
        <button
          onClick={onStart}
          className="px-8 py-4 text-lg tracking-wider cursor-pointer transition-transform hover:scale-105"
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: visible ? '#FFD700' : 'transparent',
            backgroundColor: '#000',
            border: `3px solid ${visible ? '#FFD700' : '#000'}`,
            textShadow: visible ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
          }}
        >
          PRESS START
        </button>
      </div>
    </motion.div>
  );
}

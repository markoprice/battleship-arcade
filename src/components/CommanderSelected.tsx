import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Character } from '../types';
import StarfieldBackground from './StarfieldBackground';
import ArcadeCanvas from './ArcadeCanvas';

interface Props {
  player: Character;
  ai: Character;
  onStart: () => void;
}

function LargePortrait({ character, side, delay }: { character: Character; side: 'left' | 'right'; delay: number }) {
  const isSales = character.team === 'sales';
  const borderColor = isSales ? '#3969CA' : '#21C19A';
  const glowColor = isSales ? 'rgba(57, 105, 202, 0.6)' : 'rgba(33, 193, 154, 0.6)';
  const tintBg = isSales
    ? 'linear-gradient(135deg, #1a2a5e 0%, #2a3d7a 50%, #1a2a5e 100%)'
    : 'linear-gradient(135deg, #0a3d2e 0%, #1a5e4a 50%, #0a3d2e 100%)';

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ x: side === 'left' ? -300 : 300, opacity: 0, scale: 0.5 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay, type: 'spring', bounce: 0.3 }}
    >
      {/* Portrait */}
      <motion.div
        className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center text-6xl mb-4 overflow-hidden"
        style={{
          background: tintBg,
          border: `3px solid ${borderColor}`,
          boxShadow: `0 0 30px ${glowColor}, inset 0 0 20px rgba(0,0,0,0.5)`,
        }}
        animate={{
          boxShadow: [
            `0 0 30px ${glowColor}, inset 0 0 20px rgba(0,0,0,0.5)`,
            `0 0 60px ${glowColor}, inset 0 0 30px rgba(0,0,0,0.3)`,
            `0 0 30px ${glowColor}, inset 0 0 20px rgba(0,0,0,0.5)`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.8 }}
      >
        {character.portrait ? (
          <img src={character.portrait} alt={character.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        ) : (
          isSales ? '🎯' : '💻'
        )}
      </motion.div>

      {/* Name */}
      <motion.div
        className="text-center mb-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.4, duration: 0.5 }}
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: '#FFD700',
          fontSize: '14px',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
        }}
      >
        {character.name}
      </motion.div>

      {/* Title */}
      <motion.div
        className="text-center mb-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.6, duration: 0.5 }}
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: '#aaa',
          fontSize: '9px',
        }}
      >
        {character.title}
      </motion.div>

      {/* Team badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.8, type: 'spring' }}
        className="px-4 py-1.5"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: borderColor,
          fontSize: '10px',
          border: `2px solid ${borderColor}`,
          background: 'rgba(0,0,0,0.6)',
          textShadow: `0 0 8px ${glowColor}`,
        }}
      >
        {isSales ? 'GTM' : 'ENG'}
      </motion.div>

      {/* Stats with animated bars */}
      <div className="w-full max-w-xs space-y-2 mt-4">
        {character.stats.map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-2">
            <span
              className="shrink-0 text-right"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#ccc',
                fontSize: '7px',
                width: '80px',
              }}
            >
              {stat.label}
            </span>
            <div
              className="flex-1 h-3 rounded-sm overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <motion.div
                className="h-full rounded-sm"
                initial={{ width: 0 }}
                animate={{ width: `${stat.value}%` }}
                transition={{ duration: 0.8, delay: delay + 0.9 + i * 0.15, ease: 'easeOut' }}
                style={{
                  background: isSales
                    ? 'linear-gradient(90deg, #3969CA, #9B59B6)'
                    : 'linear-gradient(90deg, #21C19A, #2ECC71)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function CommanderSelected({ player, ai, onStart }: Props) {
  // Use ref to avoid resetting the timer when onStart callback reference changes
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;

  // Auto-advance after animations settle (~3.5s)
  useEffect(() => {
    const timer = setTimeout(() => {
      onStartRef.current();
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ArcadeCanvas>
      <div className="absolute inset-0 overflow-hidden">
      <StarfieldBackground />
      <motion.div
        className="relative z-10 flex flex-col h-full items-center justify-center pb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Characters side by side with VS in center */}
        <div className="flex items-center justify-center gap-8 md:gap-16">
          <LargePortrait character={player} side="left" delay={0.2} />

          {/* VS splash */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.8, duration: 0.6, type: 'spring', bounce: 0.5 }}
          >
            <motion.span
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#FFD700',
                fontSize: '56px',
                textShadow: '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)',
              }}
              animate={{
                textShadow: [
                  '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)',
                  '0 0 50px rgba(255, 215, 0, 1), 0 0 100px rgba(255, 215, 0, 0.6)',
                  '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              VS
            </motion.span>
          </motion.div>

          <LargePortrait character={ai} side="right" delay={0.4} />
        </div>

      </motion.div>
      </div>
    </ArcadeCanvas>
  );
}

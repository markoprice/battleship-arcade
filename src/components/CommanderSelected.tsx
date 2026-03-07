import { motion } from 'framer-motion';
import type { Character } from '../types';
import StarfieldBackground from './StarfieldBackground';

interface Props {
  player: Character;
  ai: Character;
  onStart: () => void;
}

function LargePortrait({ character, side }: { character: Character; side: 'left' | 'right' }) {
  const isSales = character.team === 'sales';
  const borderColor = isSales ? '#3969CA' : '#21C19A';
  const glowColor = isSales ? 'rgba(57, 105, 202, 0.6)' : 'rgba(33, 193, 154, 0.6)';
  const tintBg = isSales
    ? 'linear-gradient(135deg, #1a2a5e 0%, #2a3d7a 50%, #1a2a5e 100%)'
    : 'linear-gradient(135deg, #0a3d2e 0%, #1a5e4a 50%, #0a3d2e 100%)';

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ x: side === 'left' ? -200 : 200, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: 'spring' }}
    >
      {/* Portrait */}
      <div
        className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center text-6xl mb-4"
        style={{
          background: tintBg,
          border: `3px solid ${borderColor}`,
          boxShadow: `0 0 30px ${glowColor}, inset 0 0 20px rgba(0,0,0,0.5)`,
        }}
      >
        {isSales ? '🎯' : '💻'}
      </div>

      {/* Name */}
      <div
        className="text-center mb-1"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: '#FFD700',
          fontSize: '14px',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
        }}
      >
        {character.name}
      </div>

      {/* Title */}
      <div
        className="text-center mb-1"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: '#aaa',
          fontSize: '9px',
        }}
      >
        {character.title}
      </div>

      {/* Nickname */}
      <div
        className="text-center mb-4"
        style={{
          fontFamily: '"Press Start 2P", cursive',
          color: isSales ? '#7B9FE8' : '#5DE8C5',
          fontSize: '8px',
        }}
      >
        "{character.nickname}"
      </div>

      {/* Stats */}
      <div className="w-full max-w-xs space-y-2">
        {character.stats.map((stat) => (
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
                transition={{ duration: 1, delay: 0.5 }}
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
  return (
    <div className="fixed inset-0 overflow-hidden">
      <StarfieldBackground />
      <motion.div
        className="relative z-10 flex flex-col h-full p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Title */}
        <div className="text-center mb-6 pt-4">
          <motion.h1
            className="text-2xl md:text-3xl tracking-wider"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#FFD700',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 2px 2px 0 #8B6914',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            COMMANDER SELECTED
          </motion.h1>
          <div
            className="mt-2 h-0.5 mx-auto"
            style={{
              width: '80%',
              background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
            }}
          />
        </div>

        {/* Characters side by side */}
        <div className="flex-1 flex items-center justify-center gap-8 md:gap-16">
          <LargePortrait character={player} side="left" />

          <div
            className="text-4xl font-bold"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#FFD700',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
            }}
          >
            VS
          </div>

          <LargePortrait character={ai} side="right" />
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-between mt-4 pb-4">
          <span
            className="text-xs"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#3969CA',
            }}
          >
            HUMAN PLAYER
          </span>
          <button
            onClick={onStart}
            className="px-6 py-3 text-sm tracking-wider cursor-pointer transition-all hover:scale-105"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#FFD700',
              backgroundColor: '#000',
              border: '3px solid #FFD700',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            }}
          >
            PRESS START
          </button>
          <span
            className="text-xs"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#21C19A',
            }}
          >
            COMPUTER PLAYER
          </span>
        </div>
      </motion.div>
    </div>
  );
}

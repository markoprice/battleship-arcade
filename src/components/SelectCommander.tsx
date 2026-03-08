import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Character } from '../types';
import { salesCharacters, productCharacters } from '../data/characters';
import CharacterCard from './CharacterCard';
import StarfieldBackground from './StarfieldBackground';

interface Props {
  onSelect: (player: Character, ai: Character) => void;
}

export default function SelectCommander({ onSelect }: Props) {
  const [selectedSales, setSelectedSales] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [rouletteActive, setRouletteActive] = useState(false);
  const [rouletteIndex, setRouletteIndex] = useState(0);
  const rouletteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rouletteCountRef = useRef(0);
  const startDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rouletteStartedRef = useRef(false);

  const salesChar = salesCharacters.find((c) => c.id === selectedSales) ?? null;
  const productChar = productCharacters.find((c) => c.id === selectedProduct) ?? null;
  const canStart = salesChar !== null && productChar !== null && !rouletteActive;

  // Start roulette when Sales character is selected
  const startRoulette = useCallback(() => {
    setRouletteActive(true);
    rouletteCountRef.current = 0;
    const totalSpins = 12 + Math.floor(Math.random() * 6); // 12-17 spins
    const finalIndex = Math.floor(Math.random() * productCharacters.length);

    const spin = (count: number) => {
      const idx = count % productCharacters.length;
      setRouletteIndex(idx);
      rouletteCountRef.current = count;

      if (count < totalSpins) {
        // Speed up then slow down
        const progress = count / totalSpins;
        const delay = progress < 0.5 ? 80 : 80 + (progress - 0.5) * 400;
        rouletteTimerRef.current = setTimeout(() => spin(count + 1), delay);
      } else {
        // Land on final
        setRouletteIndex(finalIndex);
        setSelectedProduct(productCharacters[finalIndex].id);
        setRouletteActive(false);
        rouletteStartedRef.current = false;
      }
    };

    spin(0);
  }, []);

  // Cleanup roulette on unmount
  useEffect(() => {
    return () => {
      if (rouletteTimerRef.current) clearTimeout(rouletteTimerRef.current);
      if (startDelayRef.current) clearTimeout(startDelayRef.current);
    };
  }, []);

  const handleSalesSelect = (charId: string) => {
    if (rouletteActive || rouletteStartedRef.current) return;
    rouletteStartedRef.current = true;
    setSelectedSales(charId);
    setSelectedProduct(null);
    // Clear any pending start delay
    if (startDelayRef.current) clearTimeout(startDelayRef.current);
    // Start roulette after a brief moment
    startDelayRef.current = setTimeout(() => startRoulette(), 300);
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <StarfieldBackground />
      <motion.div
        className="relative z-10 flex flex-col h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Title */}
        <div className="text-center pt-6 pb-2">
          <h1
            className="text-xl md:text-2xl tracking-wider"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#FFD700',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 2px 2px 0 #8B6914',
            }}
          >
            SELECT COMMANDER
          </h1>
          <div
            className="mt-3 h-0.5"
            style={{
              width: 'min(60%, 500px)',
              margin: '0 auto',
              background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
            }}
          />
        </div>

        {/* Main content area */}
        <div
          className="flex-1 flex items-start justify-center min-h-0 overflow-auto px-2"
          style={{ paddingTop: '16px' }}
        >
          {/* SALES vertical label */}
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              writingMode: 'vertical-lr',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              fontFamily: '"Press Start 2P", cursive',
              color: '#3969CA',
              fontSize: 'clamp(16px, 2.5vw, 28px)',
              textShadow: '0 0 15px rgba(57, 105, 202, 0.6)',
              letterSpacing: '8px',
              padding: '0 8px',
              alignSelf: 'center',
            }}
          >
            SALES
          </div>

          {/* Sales cards */}
          <div className="grid grid-cols-2 gap-2 shrink-0" style={{ maxWidth: '340px' }}>
            {salesCharacters.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                selected={selectedSales === char.id}
                onClick={() => handleSalesSelect(char.id)}
                compact
              />
            ))}
          </div>

          {/* Center divider / matchup area */}
          <div className="flex flex-col items-center justify-center px-4 self-center" style={{ minWidth: '80px' }}>
            <AnimatePresence>
              {canStart && salesChar && productChar ? (
                <motion.div
                  className="flex flex-col items-center gap-4"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                >
                  {/* Player portrait */}
                  <motion.div
                    className="overflow-hidden flex items-center justify-center"
                    style={{
                      width: '80px',
                      height: '80px',
                      border: '2px solid #3969CA',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, #1a2a5e, #2a3d7a)',
                      boxShadow: '0 0 15px rgba(57, 105, 202, 0.5)',
                    }}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                  >
                    {salesChar.portrait && (
                      <img src={salesChar.portrait} alt={salesChar.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                    )}
                  </motion.div>

                  {/* VS */}
                  <motion.span
                    style={{
                      fontFamily: '"Press Start 2P", cursive',
                      color: '#FFD700',
                      fontSize: '24px',
                      textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                    }}
                    animate={{
                      textShadow: [
                        '0 0 20px rgba(255, 215, 0, 0.8)',
                        '0 0 40px rgba(255, 215, 0, 1)',
                        '0 0 20px rgba(255, 215, 0, 0.8)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    VS
                  </motion.span>

                  {/* AI portrait */}
                  <motion.div
                    className="overflow-hidden flex items-center justify-center"
                    style={{
                      width: '80px',
                      height: '80px',
                      border: '2px solid #21C19A',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, #0a3d2e, #1a5e4a)',
                      boxShadow: '0 0 15px rgba(33, 193, 154, 0.5)',
                    }}
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    {productChar.portrait && (
                      <img src={productChar.portrait} alt={productChar.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                    )}
                  </motion.div>

                  {/* PLACE YOUR FLEET button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => {
                      if (salesChar && productChar) {
                        onSelect(salesChar, productChar);
                      }
                    }}
                    className="px-6 py-3 text-xs tracking-wider cursor-pointer transition-transform duration-200 hover:scale-[1.08] active:scale-95 mt-2"
                    style={{
                      fontFamily: '"Press Start 2P", cursive',
                      color: '#FFD700',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '3px solid #FFD700',
                      textShadow: '0 0 15px rgba(255, 215, 0, 0.6)',
                      boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    PLACE YOUR FLEET
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                >
                  <div
                    style={{
                      fontFamily: '"Press Start 2P", cursive',
                      color: '#FFD700',
                      fontSize: '20px',
                      textShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
                    }}
                  >
                    VS
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Product cards */}
          <div className="grid grid-cols-2 gap-2 shrink-0" style={{ maxWidth: '340px' }}>
            {productCharacters.map((char, idx) => {
              const isRouletteHighlighted = rouletteActive && rouletteIndex === idx;
              return (
                <div
                  key={char.id}
                  style={{
                    transform: isRouletteHighlighted ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.08s ease',
                    boxShadow: isRouletteHighlighted
                      ? '0 0 20px rgba(255, 215, 0, 0.8)'
                      : 'none',
                    borderRadius: '4px',
                  }}
                >
                  <CharacterCard
                    character={char}
                    selected={selectedProduct === char.id || isRouletteHighlighted}
                    onClick={() => {}}
                    compact
                  />
                </div>
              );
            })}
          </div>

          {/* PRODUCT vertical label */}
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              writingMode: 'vertical-lr',
              textOrientation: 'mixed',
              fontFamily: '"Press Start 2P", cursive',
              color: '#21C19A',
              fontSize: 'clamp(16px, 2.5vw, 28px)',
              textShadow: '0 0 15px rgba(33, 193, 154, 0.6)',
              letterSpacing: '8px',
              padding: '0 8px',
              alignSelf: 'center',
            }}
          >
            PRODUCT
          </div>
        </div>

        {/* Bottom labels */}
        <div className="flex justify-between px-8 pb-4" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <div
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#3969CA',
              fontSize: '9px',
              textShadow: '0 0 8px rgba(57, 105, 202, 0.5)',
            }}
          >
            HUMAN PLAYER
          </div>
          <div
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#21C19A',
              fontSize: '9px',
              textShadow: '0 0 8px rgba(33, 193, 154, 0.5)',
            }}
          >
            COMPUTER OPPONENT
          </div>
        </div>
      </motion.div>
    </div>
  );
}

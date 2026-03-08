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
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedSalesRef = useRef<string | null>(null);

  const salesChar = salesCharacters.find((c) => c.id === selectedSales) ?? null;
  const productChar = productCharacters.find((c) => c.id === selectedProduct) ?? null;

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
        const finalChar = productCharacters[finalIndex];
        setSelectedProduct(finalChar.id);
        setRouletteActive(false);
        rouletteStartedRef.current = false;
        // Auto-advance to matchup preview after a brief pause
        autoAdvanceRef.current = setTimeout(() => {
          const sc = salesCharacters.find((c) => c.id === selectedSalesRef.current);
          if (sc) {
            onSelect(sc, finalChar);
          }
        }, 1200);
      }
    };

    spin(0);
  }, []);

  // Cleanup roulette on unmount
  useEffect(() => {
    return () => {
      if (rouletteTimerRef.current) clearTimeout(rouletteTimerRef.current);
      if (startDelayRef.current) clearTimeout(startDelayRef.current);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  const handleSalesSelect = (charId: string) => {
    if (rouletteActive || rouletteStartedRef.current) return;
    rouletteStartedRef.current = true;
    setSelectedSales(charId);
    selectedSalesRef.current = charId;
    setSelectedProduct(null);
    // Clear any pending start delay
    if (startDelayRef.current) clearTimeout(startDelayRef.current);
    // Start roulette after a brief moment
    startDelayRef.current = setTimeout(() => startRoulette(), 300);
  };

  const handleDeselectSales = () => {
    if (rouletteActive) return;
    setSelectedSales(null);
    selectedSalesRef.current = null;
    setSelectedProduct(null);
    rouletteStartedRef.current = false;
    if (rouletteTimerRef.current) clearTimeout(rouletteTimerRef.current);
    if (startDelayRef.current) clearTimeout(startDelayRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
  };

  const handleDeselectProduct = () => {
    if (rouletteActive) return;
    setSelectedProduct(null);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    // Re-run roulette
    rouletteStartedRef.current = true;
    if (startDelayRef.current) clearTimeout(startDelayRef.current);
    startDelayRef.current = setTimeout(() => startRoulette(), 300);
  };

  // Stacked vertical label component
  const StackedLabel = ({ text, color }: { text: string; color: string }) => (
    <div
      className="flex flex-col items-center justify-center shrink-0 gap-1.5"
      style={{ padding: '0 16px', alignSelf: 'flex-start', paddingTop: '0px' }}
    >
      {text.split('').map((letter, i) => (
        <span
          key={i}
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color,
            fontSize: 'clamp(18px, 2.5vw, 32px)',
            textShadow: `0 0 15px ${color}66`,
            lineHeight: 1.2,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );

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
          {/* SALES stacked label */}
          <StackedLabel text="SALES" color="#3969CA" />

          {/* Sales panel */}
          <div className="flex flex-col items-center shrink-0" style={{ maxWidth: '340px' }}>
            <AnimatePresence mode="wait">
              {salesChar && !rouletteActive ? (
                <motion.div
                  key="sales-selected"
                  className="relative"
                  style={{ width: '340px' }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.3, type: 'spring' }}
                >
                  {/* Deselect X button */}
                  <button
                    onClick={handleDeselectSales}
                    className="absolute cursor-pointer z-10 flex items-center justify-center"
                    style={{
                      top: '4px',
                      right: '4px',
                      width: '24px',
                      height: '24px',
                      fontFamily: '"Press Start 2P", cursive',
                      fontSize: '10px',
                      color: '#9B8FB8',
                      background: 'rgba(0,0,0,0.6)',
                      border: '1px solid #9B8FB8',
                      borderRadius: '2px',
                    }}
                  >
                    X
                  </button>
                  <CharacterCard
                    character={salesChar}
                    selected
                    onClick={() => {}}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="sales-grid"
                  className="grid grid-cols-2 gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {salesCharacters.map((char) => (
                    <CharacterCard
                      key={char.id}
                      character={char}
                      selected={selectedSales === char.id}
                      onClick={() => handleSalesSelect(char.id)}
                      compact
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <div
              className="text-center mt-3"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#3969CA',
                fontSize: '9px',
                textShadow: '0 0 8px rgba(57, 105, 202, 0.5)',
              }}
            >
              HUMAN PLAYER
            </div>
          </div>

          {/* Center spacer */}
          <div style={{ minWidth: '40px' }} />

          {/* Product panel */}
          <div className="flex flex-col items-center shrink-0" style={{ maxWidth: '340px' }}>
            <AnimatePresence mode="wait">
              {productChar && !rouletteActive ? (
                <motion.div
                  key="product-selected"
                  className="relative"
                  style={{ width: '340px' }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.3, type: 'spring' }}
                >
                  {/* Deselect X button */}
                  <button
                    onClick={handleDeselectProduct}
                    className="absolute cursor-pointer z-10 flex items-center justify-center"
                    style={{
                      top: '4px',
                      right: '4px',
                      width: '24px',
                      height: '24px',
                      fontFamily: '"Press Start 2P", cursive',
                      fontSize: '10px',
                      color: '#9B8FB8',
                      background: 'rgba(0,0,0,0.6)',
                      border: '1px solid #9B8FB8',
                      borderRadius: '2px',
                    }}
                  >
                    X
                  </button>
                  <CharacterCard
                    character={productChar}
                    selected
                    onClick={() => {}}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="product-grid"
                  className="grid grid-cols-2 gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
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
                </motion.div>
              )}
            </AnimatePresence>
            <div
              className="text-center mt-3"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#21C19A',
                fontSize: '9px',
                textShadow: '0 0 8px rgba(33, 193, 154, 0.5)',
              }}
            >
              AI OPPONENT
            </div>
          </div>

          {/* PRODUCT stacked label */}
          <StackedLabel text="PRODUCT" color="#21C19A" />
        </div>
      </motion.div>
    </div>
  );
}

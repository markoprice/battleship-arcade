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

        {/* Panels */}
        <div
          className="flex-1 flex gap-4 min-h-0 overflow-hidden px-4"
          style={{ maxWidth: '900px', margin: '0 auto', width: '100%', paddingTop: '12px' }}
        >
          {/* Sales Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            <div
              className="flex flex-col p-3 rounded overflow-auto min-h-0"
              style={{
                border: '2px solid #3969CA',
                background: 'rgba(57, 105, 202, 0.1)',
                boxShadow: '0 0 15px rgba(57, 105, 202, 0.3)',
              }}
            >
              <h2
                className="text-center mb-3 text-sm md:text-base"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  color: '#3969CA',
                  textShadow: '0 0 10px rgba(57, 105, 202, 0.5)',
                }}
              >
                SALES
              </h2>
              <div className="grid grid-cols-2 gap-2" style={{ alignContent: 'start', maxWidth: '360px', margin: '0 auto' }}>
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
            </div>
            <div
              className="text-center mt-2"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#3969CA',
                fontSize: '10px',
              }}
            >
              HUMAN PLAYER
            </div>
          </div>

          {/* Product Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            <div
              className="flex flex-col p-3 rounded overflow-auto min-h-0"
              style={{
                border: '2px solid #21C19A',
                background: 'rgba(33, 193, 154, 0.1)',
                boxShadow: '0 0 15px rgba(33, 193, 154, 0.3)',
              }}
            >
              <h2
                className="text-center mb-3 text-sm md:text-base"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  color: '#21C19A',
                  textShadow: '0 0 10px rgba(33, 193, 154, 0.5)',
                }}
              >
                PRODUCT
              </h2>
              <div className="grid grid-cols-2 gap-2" style={{ alignContent: 'start', maxWidth: '360px', margin: '0 auto' }}>
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
            </div>
            <div
              className="text-center mt-2"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#21C19A',
                fontSize: '10px',
              }}
            >
              COMPUTER OPPONENT
            </div>
          </div>
        </div>

        {/* PLACE YOUR FLEET - only visible when both selected */}
        <div className="flex justify-center" style={{ padding: '12px 0' }}>
          <AnimatePresence>
            {canStart && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => {
                  if (salesChar && productChar) {
                    onSelect(salesChar, productChar);
                  }
                }}
                className="px-10 py-4 text-sm tracking-wider cursor-pointer transition-transform duration-200 hover:scale-[1.08] active:scale-95"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  color: '#FFD700',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '3px solid #FFD700',
                  textShadow: '0 0 15px rgba(255, 215, 0, 0.6)',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                }}
              >
                PLACE YOUR FLEET
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

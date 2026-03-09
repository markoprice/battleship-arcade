import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Character } from '../types';
import { salesCharacters, productCharacters } from '../data/characters';
import CharacterCard from './CharacterCard';
import StarfieldBackground from './StarfieldBackground';
import ArcadeCanvas from './ArcadeCanvas';
import ExitButton from './ExitButton';

interface Props {
  onSelect: (player: Character, ai: Character) => void;
  onExit?: () => void;
}

export default function SelectCommander({ onSelect, onExit }: Props) {
  const [selectedSales, setSelectedSales] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [rouletteActive, setRouletteActive] = useState(false);
  const [forceGridView, setForceGridView] = useState(false);
  const [rouletteIndex, setRouletteIndex] = useState(0);
  const [bothSelected, setBothSelected] = useState(false);
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
    setForceGridView(true);
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
        setForceGridView(false);
        rouletteStartedRef.current = false;
        setBothSelected(true);
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
    setForceGridView(true);
    setSelectedSales(charId);
    selectedSalesRef.current = charId;
    // If Product was already manually selected, skip roulette and go straight to bothSelected
    if (selectedProduct) {
      setBothSelected(true);
      setForceGridView(false);
      rouletteStartedRef.current = false;
      return;
    }
    // Clear any pending start delay
    if (startDelayRef.current) clearTimeout(startDelayRef.current);
    // Start roulette after a brief moment
    startDelayRef.current = setTimeout(() => startRoulette(), 300);
  };

  const handleDeselectSales = () => {
    if (rouletteActive) return;
    setSelectedSales(null);
    selectedSalesRef.current = null;
    // Do NOT clear Product selection — deselections are independent
    setBothSelected(false);
    rouletteStartedRef.current = false;
    if (rouletteTimerRef.current) clearTimeout(rouletteTimerRef.current);
    if (startDelayRef.current) clearTimeout(startDelayRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
  };

  const handleDeselectProduct = () => {
    if (rouletteActive) return;
    setSelectedProduct(null);
    setBothSelected(false);
    setForceGridView(false);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    // Do NOT re-run roulette — just show the product grid for manual pick
    rouletteStartedRef.current = false;
  };

  const handleManualProductSelect = (charId: string) => {
    if (rouletteActive) return;
    // Cancel any pending roulette start
    if (startDelayRef.current) clearTimeout(startDelayRef.current);
    rouletteStartedRef.current = false;
    setForceGridView(false);
    setSelectedProduct(charId);
    setBothSelected(true);
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
            fontSize: '24px',
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
    <ArcadeCanvas>
      {onExit && <ExitButton onExit={onExit} />}
      <div className="absolute inset-0 overflow-hidden">
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

        {/* Main content area — column layout wrapping cards row + button */}
        <div
          className="flex-1 flex flex-col items-center min-h-0 overflow-auto px-2"
          style={{ paddingTop: '16px' }}
        >
          {/* Commander cards row */}
          <div className="flex items-start justify-center">
          {/* SALES stacked label */}
          <StackedLabel text="SALES" color="#3969CA" />

          {/* Sales panel */}
          <div className="flex flex-col items-center shrink-0" style={{ maxWidth: '340px' }}>
            <AnimatePresence mode="wait">
              {salesChar && !rouletteActive && !forceGridView ? (
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
              className="text-center mt-6"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#3969CA',
                fontSize: '13px',
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
                          onClick={() => !rouletteActive && handleManualProductSelect(char.id)}
                          compact
                        />
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
            <div
              className="text-center mt-6"
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: '#21C19A',
                fontSize: '13px',
                textShadow: '0 0 8px rgba(33, 193, 154, 0.5)',
              }}
            >
              AI OPPONENT
            </div>
          </div>

          {/* ENG stacked label */}
          <StackedLabel text="ENG" color="#21C19A" />
          </div>

          {/* PLACE YOUR FLEET button — inside commander section, directly under cards */}
          <AnimatePresence>
            {bothSelected && salesChar && productChar && (
              <motion.div
                className="flex justify-center"
                style={{ marginTop: '48px' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, type: 'spring' }}
              >
                <button
                  onClick={() => onSelect(salesChar, productChar)}
                  className="cursor-pointer transition-transform hover:scale-[1.05]"
                  style={{
                    fontFamily: '"Press Start 2P", cursive',
                    color: '#FFD700',
                    fontSize: '22px',
                    width: '440px',
                    height: '90px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    border: '3px solid #FFD700',
                    borderRadius: '2px',
                    textShadow: '0 0 15px rgba(255, 215, 0, 0.6)',
                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.05)',
                    letterSpacing: '2px',
                  }}
                >
                  PLACE YOUR FLEET {'>>'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      </div>
    </ArcadeCanvas>
  );
}

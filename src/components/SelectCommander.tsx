import { useState } from 'react';
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

  const salesChar = salesCharacters.find((c) => c.id === selectedSales) ?? null;
  const productChar = productCharacters.find((c) => c.id === selectedProduct) ?? null;
  const canStart = salesChar !== null && productChar !== null;

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
        <div className="text-center pt-8">
          <h1
            className="text-2xl md:text-3xl tracking-wider"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#FFD700',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 2px 2px 0 #8B6914',
            }}
          >
            SELECT COMMANDER
          </h1>
          <div
            className="mt-3 h-0.5 mx-auto"
            style={{
              width: '60%',
              maxWidth: '600px',
              background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
            }}
          />
        </div>

        {/* Panels */}
        <div
          className="flex-1 flex gap-6 min-h-0 overflow-hidden px-6"
          style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', paddingTop: '24px' }}
        >
          {/* Sales Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            <div
              className="flex-1 flex flex-col p-4 rounded overflow-auto min-h-0"
              style={{
                border: '2px solid #3969CA',
                background: 'rgba(57, 105, 202, 0.1)',
                boxShadow: '0 0 15px rgba(57, 105, 202, 0.3)',
              }}
            >
              <h2
                className="text-center mb-4 text-sm md:text-base"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  color: '#3969CA',
                  textShadow: '0 0 10px rgba(57, 105, 202, 0.5)',
                }}
              >
                SALES
              </h2>
              <div className="grid grid-cols-2 gap-3 flex-1 overflow-auto" style={{ alignContent: 'start' }}>
                {salesCharacters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    selected={selectedSales === char.id}
                    onClick={() => setSelectedSales(char.id)}
                    compact
                  />
                ))}
              </div>
            </div>
            <div
              className="text-center mt-3"
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
              className="flex-1 flex flex-col p-4 rounded overflow-auto min-h-0"
              style={{
                border: '2px solid #21C19A',
                background: 'rgba(33, 193, 154, 0.1)',
                boxShadow: '0 0 15px rgba(33, 193, 154, 0.3)',
              }}
            >
              <h2
                className="text-center mb-4 text-sm md:text-base"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  color: '#21C19A',
                  textShadow: '0 0 10px rgba(33, 193, 154, 0.5)',
                }}
              >
                PRODUCT
              </h2>
              <div className="grid grid-cols-2 gap-3 flex-1 overflow-auto" style={{ alignContent: 'start' }}>
                {productCharacters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    selected={selectedProduct === char.id}
                    onClick={() => setSelectedProduct(char.id)}
                    compact
                  />
                ))}
              </div>
            </div>
            <div
              className="text-center mt-3"
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

        {/* PRESS START - only visible when both selected */}
        <div className="flex justify-center" style={{ padding: '16px 0' }}>
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
                PRESS START
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

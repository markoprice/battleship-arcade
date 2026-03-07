import { useState } from 'react';
import { motion } from 'framer-motion';
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
        className="relative z-10 flex flex-col h-full p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Title */}
        <div className="text-center mb-4 pt-2">
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
            className="mt-2 h-0.5 mx-auto"
            style={{
              width: '80%',
              background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
            }}
          />
        </div>

        {/* Panels */}
        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          {/* Sales Panel */}
          <div
            className="flex-1 flex flex-col p-3 rounded"
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
            <div className="grid grid-cols-2 gap-2 flex-1 overflow-auto">
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

          {/* Product Panel */}
          <div
            className="flex-1 flex flex-col p-3 rounded"
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
            <div className="grid grid-cols-2 gap-2 flex-1 overflow-auto">
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
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-between mt-4 pb-2">
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
            onClick={() => {
              if (canStart && salesChar && productChar) {
                onSelect(salesChar, productChar);
              }
            }}
            disabled={!canStart}
            className="px-6 py-3 text-sm tracking-wider cursor-pointer transition-all"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: canStart ? '#FFD700' : '#555',
              backgroundColor: '#000',
              border: `3px solid ${canStart ? '#FFD700' : '#333'}`,
              opacity: canStart ? 1 : 0.5,
              textShadow: canStart ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
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

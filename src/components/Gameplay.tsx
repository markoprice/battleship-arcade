import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Character, Board, PlacedShip } from '../types';
import { ships } from '../data/ships';
import StarfieldBackground from './StarfieldBackground';

interface Props {
  playerCharacter: Character;
  aiCharacter: Character;
  playerBoard: Board;
  aiBoard: Board;
  playerShips: PlacedShip[];
  aiShips: PlacedShip[];
  isPlayerTurn: boolean;
  calloutText: string;
  onPlayerFire: (row: number, col: number) => 'hit' | 'miss' | 'already' | 'sunk' | 'win';
  onAIFire: () => { row: number; col: number; result: 'hit' | 'miss' | 'sunk' | 'lose' };
  onEndPlayerTurn: () => void;
  onStartPlayerTurn: () => void;
  onWin: () => void;
  onLose: () => void;
  playExplosion: () => void;
  playSplash: () => void;
  playShipSunk: () => void;
}

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function PlayerCard({
  character,
  borderColor,
  teamLabel,
  isActive,
  isSales,
}: {
  character: Character;
  borderColor: string;
  teamLabel: string;
  isActive: boolean;
  isSales: boolean;
}) {
  return (
    <motion.div
      className="flex items-center gap-2 mb-2"
      animate={{ scale: isActive ? 1.1 : 0.9, opacity: isActive ? 1 : 0.6 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="flex items-center justify-center rounded overflow-hidden"
        style={{
          width: isActive ? '48px' : '36px',
          height: isActive ? '48px' : '36px',
          border: `2px solid ${borderColor}`,
          background: isSales
            ? 'linear-gradient(135deg, rgba(57,105,202,0.4), rgba(57,105,202,0.15))'
            : 'linear-gradient(135deg, rgba(33,193,154,0.4), rgba(33,193,154,0.15))',
          fontSize: isActive ? '20px' : '16px',
          transition: 'all 0.3s ease',
          boxShadow: isActive ? `0 0 12px ${borderColor}66` : 'none',
        }}
      >
        {character.portrait ? (
          <img src={character.portrait} alt={character.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        ) : (
          isSales ? '🎯' : '💻'
        )}
      </div>
      <div>
        <div
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#FFD700',
            fontSize: isActive ? '10px' : '8px',
            transition: 'all 0.3s ease',
          }}
        >
          {character.name.toUpperCase()}
        </div>
        <div
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#aaa',
            fontSize: '6px',
            marginTop: '2px',
          }}
        >
          {character.title}
        </div>
        <div
          className="px-2 py-0.5 text-center mt-1 inline-block"
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: borderColor,
            fontSize: '5px',
            border: `1px solid ${borderColor}`,
            background: 'rgba(0,0,0,0.5)',
          }}
        >
          {teamLabel}
        </div>
      </div>
    </motion.div>
  );
}

function GameGrid({
  board,
  borderColor,
  isEnemy,
  isActive,
  onCellClick,
  disabled,
}: {
  board: Board;
  borderColor: string;
  isEnemy: boolean;
  isActive: boolean;
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
}) {
  // Active grid is bigger, inactive is smaller
  const cellSize = isActive ? 'clamp(26px, 3.8vw, 48px)' : 'clamp(20px, 2.8vw, 36px)';
  const labelWidth = isActive ? 'clamp(20px, 2.8vw, 36px)' : 'clamp(16px, 2vw, 28px)';
  const headerFont = isActive ? 'clamp(6px, 0.8vw, 9px)' : 'clamp(4px, 0.6vw, 7px)';

  return (
    <motion.div
      className="flex flex-col items-center"
      animate={{ opacity: isActive ? 1 : 0.7 }}
      transition={{ duration: 0.3 }}
    >
      {/* Grid */}
      <div>
        {/* Column headers */}
        <div className="flex">
          <div style={{ width: labelWidth }} />
          {COLS.map((col) => (
            <div
              key={col}
              className="text-center"
              style={{
                width: cellSize,
                fontFamily: '"Press Start 2P", cursive',
                color: borderColor,
                fontSize: headerFont,
                paddingBottom: '2px',
              }}
            >
              {col}
            </div>
          ))}
        </div>

        {Array.from({ length: 10 }, (_, row) => (
          <div key={row} className="flex">
            <div
              className="flex items-center justify-center"
              style={{
                width: labelWidth,
                fontFamily: '"Press Start 2P", cursive',
                color: borderColor,
                fontSize: headerFont,
              }}
            >
              {row + 1}
            </div>
            {Array.from({ length: 10 }, (_, col) => {
              const cell = board[row][col];
              const isHit = cell.state === 'hit';
              const isMiss = cell.state === 'miss';
              const isShip = cell.state === 'ship' && !isEnemy;
              const canClick = isEnemy && !isHit && !isMiss && !disabled;

              return (
                <div
                  key={col}
                  className="transition-all"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    border: `1px solid ${borderColor}33`,
                    background: isHit
                      ? 'rgba(255, 100, 0, 0.4)'
                      : isMiss
                        ? 'rgba(255, 255, 255, 0.05)'
                        : isShip
                          ? 'rgba(0, 255, 100, 0.25)'
                          : 'rgba(0, 0, 0, 0.3)',
                    cursor: canClick ? 'crosshair' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isActive ? '14px' : '10px',
                    boxShadow: isHit ? '0 0 8px rgba(255, 100, 0, 0.5)' : 'none',
                  }}
                  onClick={() => {
                    if (canClick && onCellClick) onCellClick(row, col);
                  }}
                >
                  {isHit && '🔥'}
                  {isMiss && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.4)' }}
                    />
                  )}
                  {isShip && !isHit && (
                    <span style={{ fontSize: isActive ? 'clamp(10px, 1.5vw, 18px)' : 'clamp(8px, 1vw, 14px)', opacity: 0.7 }}>🚢</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ShipTracker({
  placedShips,
  borderColor,
}: {
  placedShips: PlacedShip[];
  borderColor: string;
}) {
  return (
    <div className="flex gap-2 flex-wrap justify-center mb-2">
      {ships.map((ship) => {
        const placed = placedShips.find((s) => s.shipId === ship.id);
        const sunk = placed?.sunk ?? false;
        return (
          <div
            key={ship.id}
            className="flex items-center gap-1 px-2 py-1"
            style={{
              border: `1px solid ${sunk ? '#ff4444' : borderColor}`,
              background: sunk ? 'rgba(255,0,0,0.15)' : 'rgba(0,0,0,0.3)',
              borderRadius: '2px',
              opacity: sunk ? 0.5 : 1,
            }}
          >
            <span style={{ fontSize: '10px' }}>🚢</span>
            <span
              style={{
                fontFamily: '"Press Start 2P", cursive',
                fontSize: '5px',
                color: sunk ? '#ff4444' : '#ccc',
                textDecoration: sunk ? 'line-through' : 'none',
              }}
            >
              {ship.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Gameplay({
  playerCharacter,
  aiCharacter,
  playerBoard,
  aiBoard,
  playerShips,
  aiShips,
  isPlayerTurn,
  calloutText,
  onPlayerFire,
  onAIFire,
  onEndPlayerTurn,
  onStartPlayerTurn,
  onWin,
  onLose,
  playExplosion,
  playSplash,
  playShipSunk,
}: Props) {
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clear all pending timeouts on unmount (e.g. abandon game)
  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
    };
  }, []);

  const handlePlayerShot = useCallback(
    (row: number, col: number) => {
      if (!isPlayerTurn || processingRef.current) return;
      const result = onPlayerFire(row, col);
      if (result === 'already') return;

      processingRef.current = true;
      setProcessing(true);

      if (result === 'hit') {
        playExplosion();
      } else if (result === 'miss') {
        playSplash();
      } else if (result === 'sunk') {
        playShipSunk();
      } else if (result === 'win') {
        playShipSunk();
        processingRef.current = false;
        setProcessing(false);
        timeoutIdsRef.current.push(setTimeout(() => onWin(), 1000));
        return;
      }

      // End player turn, start AI turn
      timeoutIdsRef.current.push(setTimeout(() => {
        onEndPlayerTurn();
        // AI fires after a delay
        timeoutIdsRef.current.push(setTimeout(() => {
          const aiResult = onAIFire();
          if (aiResult.result === 'hit') {
            playExplosion();
          } else if (aiResult.result === 'miss') {
            playSplash();
          } else if (aiResult.result === 'sunk') {
            playShipSunk();
          } else if (aiResult.result === 'lose') {
            playShipSunk();
            processingRef.current = false;
            setProcessing(false);
            timeoutIdsRef.current.push(setTimeout(() => onLose(), 1000));
            return;
          }

          timeoutIdsRef.current.push(setTimeout(() => {
            onStartPlayerTurn();
            processingRef.current = false;
            setProcessing(false);
          }, 500));
        }, 800));
      }, 500));
    },
    [
      isPlayerTurn,
      processing,
      onPlayerFire,
      onAIFire,
      onEndPlayerTurn,
      onStartPlayerTurn,
      onWin,
      onLose,
      playExplosion,
      playSplash,
      playShipSunk,
    ]
  );

  // Auto-unlock processing if stuck
  useEffect(() => {
    if (processing) {
      const timeout = setTimeout(() => {
        processingRef.current = false;
        setProcessing(false);
        onStartPlayerTurn();
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [processing, onStartPlayerTurn]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <StarfieldBackground />
      <motion.div
        className="relative z-10 flex flex-col h-full p-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Turn indicator */}
        <div className="text-center mb-1">
          <span
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: isPlayerTurn ? '#FFD700' : '#ff4444',
              fontSize: '10px',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            }}
          >
            {isPlayerTurn && !processing ? 'YOUR TURN - FIRE!' : processing ? 'FIRING...' : "OPPONENT'S TURN"}
          </span>
        </div>

        {/* Ship trackers */}
        <div className="flex justify-between px-4 mb-1">
          <div className="flex-1">
            <ShipTracker placedShips={playerShips} borderColor="#3969CA" />
          </div>
          <div className="flex-1">
            <ShipTracker placedShips={aiShips} borderColor="#21C19A" />
          </div>
        </div>

        {/* Grids with player cards */}
        <div className="flex-1 flex items-center justify-center gap-4 md:gap-8 overflow-auto">
          {/* Player side */}
          <div className="flex flex-col items-center">
            <PlayerCard
              character={playerCharacter}
              borderColor="#3969CA"
              teamLabel="SALES"
              isActive={!isPlayerTurn && !processing}
              isSales
            />
            <GameGrid
              board={playerBoard}
              borderColor="#3969CA"
              isEnemy={false}
              isActive={!isPlayerTurn && !processing}
            />
          </div>
          {/* AI side */}
          <div className="flex flex-col items-center">
            <PlayerCard
              character={aiCharacter}
              borderColor="#21C19A"
              teamLabel="PRODUCT"
              isActive={isPlayerTurn && !processing}
              isSales={false}
            />
            <GameGrid
              board={aiBoard}
              borderColor="#21C19A"
              isEnemy
              isActive={isPlayerTurn && !processing}
              onCellClick={handlePlayerShot}
              disabled={!isPlayerTurn || processing}
            />
          </div>
        </div>

        {/* NBA Jam Callout */}
        <AnimatePresence>
          {calloutText && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 50 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '32px',
                  color: '#FFD700',
                  textShadow:
                    '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 100, 0, 0.5), 3px 3px 0 #8B0000',
                  transform: 'rotate(-5deg)',
                }}
              >
                {calloutText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Character, Board, PlacedShip } from '../types';
import { ships } from '../data/ships';
import StarfieldBackground from './StarfieldBackground';
import ArcadeCanvas from './ArcadeCanvas';

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

// Fixed cell sizes — both boards always identical
const CELL_SIZE = 'clamp(24px, 3.2vw, 40px)';
const LABEL_WIDTH = 'clamp(18px, 2.4vw, 30px)';
const HEADER_FONT = 'clamp(5px, 0.7vw, 8px)';

function PlayerCard({
  character,
  borderColor,
  teamLabel,
  isSales,
}: {
  character: Character;
  borderColor: string;
  teamLabel: string;
  isSales: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        className="flex items-center justify-center rounded overflow-hidden"
        style={{
          width: '40px',
          height: '40px',
          border: `2px solid ${borderColor}`,
          background: isSales
            ? 'linear-gradient(135deg, rgba(57,105,202,0.4), rgba(57,105,202,0.15))'
            : 'linear-gradient(135deg, rgba(33,193,154,0.4), rgba(33,193,154,0.15))',
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
            fontSize: '9px',
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
    </div>
  );
}

// Missile that travels horizontally from attacker side to target cell
function MissileEffect({
  targetRow,
  targetCol,
  fromSide,
  result,
  onComplete,
}: {
  targetRow: number;
  targetCol: number;
  fromSide: 'left' | 'right';
  result: 'hit' | 'miss' | 'sunk' | 'win';
  onComplete: () => void;
}) {
  const isHit = result === 'hit' || result === 'sunk' || result === 'win';
  const startX = fromSide === 'left' ? '-80px' : 'calc(100% + 80px)';
  const endX = `calc(${LABEL_WIDTH} + ${targetCol} * ${CELL_SIZE} + ${CELL_SIZE} / 2)`;
  const endY = `calc(${targetRow} * ${CELL_SIZE} + ${CELL_SIZE} / 2 + 18px)`;

  return (
    <>
      {/* Missile projectile — travels horizontally */}
      <motion.div
        style={{
          position: 'absolute',
          zIndex: 30,
          pointerEvents: 'none',
          fontSize: '20px',
          filter: 'drop-shadow(0 0 8px rgba(255, 150, 0, 0.8))',
          transform: fromSide === 'left' ? 'scaleX(1)' : 'scaleX(-1)',
        }}
        initial={{ top: endY, left: startX, opacity: 1, scale: 1 }}
        animate={{
          top: endY,
          left: endX,
          opacity: 1,
          scale: 0.8,
        }}
        transition={{ duration: 0.45, ease: 'easeIn' }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 400);
        }}
      >
        🚀
      </motion.div>
      {/* Impact effect */}
      <motion.div
        style={{
          position: 'absolute',
          zIndex: 25,
          pointerEvents: 'none',
          top: `calc(${targetRow} * ${CELL_SIZE} + 18px)`,
          left: `calc(${LABEL_WIDTH} + ${targetCol} * ${CELL_SIZE})`,
          width: CELL_SIZE,
          height: CELL_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0, 1, 1, 0], scale: [0, 0, 1.5, 1.2, 0] }}
        transition={{ duration: 1, times: [0, 0.45, 0.55, 0.75, 1] }}
      >
        {isHit ? (
          <div style={{
            width: '200%',
            height: '200%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,100,0,0.9) 0%, rgba(255,50,0,0.6) 40%, transparent 70%)',
            boxShadow: '0 0 30px rgba(255,100,0,0.8), 0 0 60px rgba(255,50,0,0.4)',
          }} />
        ) : (
          <div style={{
            width: '200%',
            height: '200%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(100,180,255,0.8) 0%, rgba(50,120,255,0.4) 40%, transparent 70%)',
            boxShadow: '0 0 20px rgba(100,180,255,0.6)',
          }} />
        )}
      </motion.div>
    </>
  );
}

function GameGrid({
  board,
  borderColor,
  isEnemy,
  isBeingAttacked,
  onCellClick,
  disabled,
}: {
  board: Board;
  borderColor: string;
  isEnemy: boolean;
  isBeingAttacked: boolean;
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
}) {
  return (
    <motion.div
      className="flex flex-col items-center"
      animate={{ opacity: isBeingAttacked ? 1 : 0.6 }}
      transition={{ duration: 0.3 }}
      style={{
        border: isBeingAttacked ? `2px solid ${borderColor}` : '2px solid transparent',
        boxShadow: isBeingAttacked ? `0 0 20px ${borderColor}66, 0 0 40px ${borderColor}33` : 'none',
        borderRadius: '4px',
        padding: '4px',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Grid */}
      <div>
        {/* Column headers */}
        <div className="flex">
          <div style={{ width: LABEL_WIDTH }} />
          {COLS.map((col) => (
            <div
              key={col}
              className="text-center"
              style={{
                width: CELL_SIZE,
                fontFamily: '"Press Start 2P", cursive',
                color: borderColor,
                fontSize: HEADER_FONT,
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
                width: LABEL_WIDTH,
                fontFamily: '"Press Start 2P", cursive',
                color: borderColor,
                fontSize: HEADER_FONT,
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
                    width: CELL_SIZE,
                    height: CELL_SIZE,
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
                    fontSize: '12px',
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
                    <div style={{ width: '60%', height: '60%', background: 'rgba(0, 255, 100, 0.5)', borderRadius: '2px', border: '1px solid rgba(0, 255, 100, 0.7)' }} />
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
            <div style={{ display: 'flex', gap: '1px' }}>
              {Array.from({ length: ships.find(s => s.id === ship.id)?.size ?? 1 }, (_, i) => (
                <div key={i} style={{ width: '6px', height: '6px', background: sunk ? '#ff4444' : borderColor, borderRadius: '1px', opacity: sunk ? 0.4 : 0.7 }} />
              ))}
            </div>
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
  const [missileAnim, setMissileAnim] = useState<{
    row: number;
    col: number;
    result: 'hit' | 'miss' | 'sunk' | 'win';
    fromSide: 'left' | 'right';
    targetBoard: 'player' | 'ai';
  } | null>(null);

  const cancelledRef = useRef(false);

  // Clear all pending timeouts on unmount (e.g. abandon game)
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
    };
  }, []);

  // Store pending shot info so we can defer onPlayerFire until after missile lands
  const pendingShotRef = useRef<{ row: number; col: number } | null>(null);

  const handlePlayerShot = useCallback(
    (row: number, col: number) => {
      if (!isPlayerTurn || processingRef.current) return;
      // Quick check if cell already hit/missed (without updating board yet)
      const cell = aiBoard[row][col];
      if (cell.state === 'hit' || cell.state === 'miss') return;

      processingRef.current = true;
      setProcessing(true);

      // Store the shot coordinates; defer onPlayerFire until missile lands
      pendingShotRef.current = { row, col };
      // We don't know the result yet, but we know if it's a ship or water
      const pendingResult = cell.state === 'ship' ? 'hit' : 'miss';
      // Player fires from left side toward AI board (right)
      setMissileAnim({ row, col, result: pendingResult as 'hit' | 'miss' | 'sunk' | 'win', fromSide: 'left', targetBoard: 'ai' });
    },
    [
      isPlayerTurn,
      processing,
      aiBoard,
    ]
  );

  // Handle missile animation completion — NOW fire and update board
  const handleMissileComplete = useCallback(() => {
    if (cancelledRef.current) return;
    const shot = pendingShotRef.current;
    if (!shot) return;
    pendingShotRef.current = null;
    setMissileAnim(null);

    // Actually fire now and update the board
    const result = onPlayerFire(shot.row, shot.col);
    if (result === 'already') {
      processingRef.current = false;
      setProcessing(false);
      return;
    }

    if (result === 'hit') {
      playExplosion();
    } else if (result === 'miss') {
      playSplash();
    } else if (result === 'sunk') {
      playShipSunk();
    } else if (result === 'win') {
      playShipSunk();
      timeoutIdsRef.current.push(setTimeout(() => {
        processingRef.current = false;
        setProcessing(false);
        onWin();
      }, 1000));
      return;
    }

    // End player turn, start AI turn with missile animation
    timeoutIdsRef.current.push(setTimeout(() => {
      onEndPlayerTurn();
      timeoutIdsRef.current.push(setTimeout(() => {
        if (cancelledRef.current) return;
        const aiResult = onAIFire();

        // Show AI missile animation from right side toward player board
        setMissileAnim({
          row: aiResult.row,
          col: aiResult.col,
          result: aiResult.result === 'lose' ? 'win' : aiResult.result as 'hit' | 'miss' | 'sunk' | 'win',
          fromSide: 'right',
          targetBoard: 'player',
        });

        // After AI missile animation, show results
        timeoutIdsRef.current.push(setTimeout(() => {
          if (cancelledRef.current) return;
          setMissileAnim(null);

          if (aiResult.result === 'hit') playExplosion();
          else if (aiResult.result === 'miss') playSplash();
          else if (aiResult.result === 'sunk') playShipSunk();
          else if (aiResult.result === 'lose') {
            playShipSunk();
            timeoutIdsRef.current.push(setTimeout(() => {
              processingRef.current = false;
              setProcessing(false);
              onLose();
            }, 1000));
            return;
          }

          timeoutIdsRef.current.push(setTimeout(() => {
            onStartPlayerTurn();
            processingRef.current = false;
            setProcessing(false);
          }, 500));
        }, 850));
      }, 800));
    }, 500));
  }, [
    onPlayerFire,
    onAIFire,
    onEndPlayerTurn,
    onStartPlayerTurn,
    onWin,
    onLose,
    playExplosion,
    playSplash,
    playShipSunk,
  ]);

  // Auto-unlock processing if stuck
  useEffect(() => {
    if (processing) {
      const timeout = setTimeout(() => {
        processingRef.current = false;
        setProcessing(false);
        onStartPlayerTurn();
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [processing, onStartPlayerTurn]);

  return (
    <ArcadeCanvas>
      <div className="absolute inset-0 overflow-hidden">
      <StarfieldBackground />
      <motion.div
        className="relative z-10 flex flex-col h-full p-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Turn indicator banner with fade animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isPlayerTurn ? 'player' : 'opponent'}
            className="text-center mb-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.3 }}
          >
            <span
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: isPlayerTurn ? '#FFD700' : '#ff4444',
                fontSize: 'clamp(10px, 1.2vw, 14px)',
                textShadow: isPlayerTurn
                  ? '0 0 10px rgba(255, 215, 0, 0.5)'
                  : '0 0 10px rgba(255, 68, 68, 0.5)',
              }}
            >
              {isPlayerTurn && !processing ? 'YOUR TURN' : processing ? 'FIRING...' : "OPPONENT'S TURN"}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Ship trackers */}
        <div className="flex justify-between px-4 mb-1">
          <div className="flex-1">
            <ShipTracker placedShips={playerShips} borderColor="#3969CA" />
          </div>
          <div className="flex-1">
            <ShipTracker placedShips={aiShips} borderColor="#21C19A" />
          </div>
        </div>

        {/* Grids with player cards BELOW — both boards identical size */}
        <div className="flex-1 flex items-center justify-center gap-4 md:gap-8 overflow-auto">
          {/* Player side (left) */}
          <div className="flex flex-col items-center relative">
            <GameGrid
              board={playerBoard}
              borderColor="#3969CA"
              isEnemy={false}
              isBeingAttacked={!isPlayerTurn && !processing}
            />
            {/* AI missile animation on player board */}
            <AnimatePresence>
              {missileAnim && missileAnim.targetBoard === 'player' && (
                <MissileEffect
                  targetRow={missileAnim.row}
                  targetCol={missileAnim.col}
                  fromSide={missileAnim.fromSide}
                  result={missileAnim.result}
                  onComplete={() => {}}
                />
              )}
            </AnimatePresence>
            <PlayerCard
              character={playerCharacter}
              borderColor="#3969CA"
              teamLabel="SALES"
              isSales
            />
          </div>
          {/* AI side (right) */}
          <div className="flex flex-col items-center relative">
            <GameGrid
              board={aiBoard}
              borderColor="#21C19A"
              isEnemy
              isBeingAttacked={isPlayerTurn || (!!missileAnim && missileAnim.targetBoard === 'ai')}
              onCellClick={handlePlayerShot}
              disabled={!isPlayerTurn || processing}
            />
            {/* Player missile animation on AI board */}
            <AnimatePresence>
              {missileAnim && missileAnim.targetBoard === 'ai' && (
                <MissileEffect
                  targetRow={missileAnim.row}
                  targetCol={missileAnim.col}
                  fromSide={missileAnim.fromSide}
                  result={missileAnim.result}
                  onComplete={handleMissileComplete}
                />
              )}
            </AnimatePresence>
            <PlayerCard
              character={aiCharacter}
              borderColor="#21C19A"
              teamLabel="PRODUCT"
              isSales={false}
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
    </ArcadeCanvas>
  );
}

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
  onAIPeekTarget: () => { row: number; col: number; predictedResult: 'hit' | 'miss' };
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

// Fixed pixel sizes inside 1344x756 canvas — no viewport units
const CELL_SIZE = 32;
const LABEL_WIDTH = 22;
const HEADER_FONT = 7;

// Hit indicator for regular hits
function FireAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <motion.div
        style={{
          position: 'absolute',
          inset: '15%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(255,120,20,0.7) 0%, rgba(200,60,0,0.3) 60%, transparent 85%)',
        }}
        animate={{
          opacity: [0.7, 0.9, 0.7],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          inset: '30%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(255,180,50,0.8) 0%, rgba(255,100,0,0.3) 70%, transparent 90%)',
        }}
        animate={{
          opacity: [0.6, 0.85, 0.6],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
    </div>
  );
}

// Sunk ship fire — more intense, flickering flames with multiple layers
function SunkFireAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <motion.div
        style={{
          position: 'absolute',
          inset: '5%',
          borderRadius: '40%',
          background: 'radial-gradient(ellipse at center, rgba(255,80,0,0.9) 0%, rgba(200,40,0,0.5) 50%, rgba(150,20,0,0.2) 80%, transparent 100%)',
        }}
        animate={{
          opacity: [0.8, 1, 0.75, 0.95, 0.8],
          scale: [0.95, 1.08, 0.98, 1.05, 0.95],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          inset: '15%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(255,200,50,0.9) 0%, rgba(255,120,0,0.6) 50%, transparent 90%)',
        }}
        animate={{
          opacity: [0.7, 1, 0.6, 0.9, 0.7],
          scale: [1, 1.1, 0.9, 1.05, 1],
          y: [0, -1, 1, -0.5, 0],
        }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      />
      <motion.div
        style={{
          position: 'absolute',
          left: '25%',
          right: '25%',
          top: '5%',
          bottom: '40%',
          borderRadius: '50% 50% 40% 40%',
          background: 'radial-gradient(ellipse at bottom, rgba(255,160,30,0.8) 0%, rgba(255,80,0,0.3) 60%, transparent 100%)',
        }}
        animate={{
          opacity: [0.5, 0.9, 0.4, 0.8, 0.5],
          scaleY: [0.8, 1.15, 0.7, 1.1, 0.8],
          x: [-1, 1, -0.5, 0.5, -1],
        }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
      />
    </div>
  );
}

// Arcade-style splash animation for misses
function SplashAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <motion.div
        style={{
          position: 'absolute',
          inset: '20%',
          borderRadius: '50%',
          border: '2px solid rgba(100,180,255,0.6)',
          background: 'transparent',
        }}
        animate={{
          scale: [0.5, 1.2, 0.5],
          opacity: [0.8, 0.2, 0.8],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          inset: '35%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100,180,255,0.5) 0%, rgba(50,120,200,0.2) 60%, transparent 100%)',
        }}
        animate={{
          opacity: [0.6, 0.3, 0.6],
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
    </div>
  );
}

// Underwater missile stream animation between player photos
function MissileStream({
  direction,
  onComplete,
}: {
  direction: 'left-to-right' | 'right-to-left';
  onComplete: () => void;
}) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '6px',
        marginTop: '-3px',
        overflow: 'hidden',
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          width: '100%',
          height: '100%',
          background: direction === 'left-to-right'
            ? 'linear-gradient(90deg, transparent 0%, rgba(100,200,255,0.1) 10%, rgba(100,200,255,0.4) 30%, rgba(150,220,255,0.8) 60%, rgba(200,240,255,1) 85%, rgba(255,255,255,0.9) 95%, transparent 100%)'
            : 'linear-gradient(270deg, transparent 0%, rgba(100,200,255,0.1) 10%, rgba(100,200,255,0.4) 30%, rgba(150,220,255,0.8) 60%, rgba(200,240,255,1) 85%, rgba(255,255,255,0.9) 95%, transparent 100%)',
        }}
        initial={{ x: direction === 'left-to-right' ? '-100%' : '100%' }}
        animate={{ x: direction === 'left-to-right' ? '100%' : '-100%' }}
        transition={{ duration: 0.6, ease: 'easeIn' }}
        onAnimationComplete={onComplete}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: '-8px',
          width: '100%',
          height: '22px',
          background: direction === 'left-to-right'
            ? 'linear-gradient(90deg, transparent 0%, rgba(80,160,220,0.05) 20%, rgba(100,200,255,0.15) 50%, rgba(150,220,255,0.3) 80%, transparent 100%)'
            : 'linear-gradient(270deg, transparent 0%, rgba(80,160,220,0.05) 20%, rgba(100,200,255,0.15) 50%, rgba(150,220,255,0.3) 80%, transparent 100%)',
          filter: 'blur(3px)',
        }}
        initial={{ x: direction === 'left-to-right' ? '-100%' : '100%' }}
        animate={{ x: direction === 'left-to-right' ? '100%' : '-100%' }}
        transition={{ duration: 0.6, ease: 'easeIn' }}
      />
    </motion.div>
  );
}

// Compute per-cell border edges for ship group outlines
function getShipBorders(
  row: number,
  col: number,
  board: Board,
): { top: boolean; right: boolean; bottom: boolean; left: boolean } {
  const cell = board[row][col];
  const shipId = cell.shipId;
  if (!shipId) return { top: false, right: false, bottom: false, left: false };

  // Check if adjacent cell belongs to the same ship
  const sameShip = (r: number, c: number) => {
    if (r < 0 || r >= 10 || c < 0 || c >= 10) return false;
    return board[r][c].shipId === shipId;
  };

  return {
    top: !sameShip(row - 1, col),
    right: !sameShip(row, col + 1),
    bottom: !sameShip(row + 1, col),
    left: !sameShip(row, col - 1),
  };
}

function isShipSunk(shipId: string | undefined, placedShips: PlacedShip[]): boolean {
  if (!shipId) return false;
  const placed = placedShips.find((s) => s.shipId === shipId);
  return placed?.sunk ?? false;
}

function GameGrid({
  board,
  borderColor,
  isEnemy,
  isBeingAttacked,
  onCellClick,
  disabled,
  gridRef,
  placedShips,
}: {
  board: Board;
  borderColor: string;
  isEnemy: boolean;
  isBeingAttacked: boolean;
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
  gridRef?: React.RefObject<HTMLDivElement | null>;
  placedShips: PlacedShip[];
}) {
  return (
    <motion.div
      ref={gridRef}
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
          <div style={{ width: `${LABEL_WIDTH}px` }} />
          {COLS.map((col) => (
            <div
              key={col}
              className="text-center"
              style={{
                width: `${CELL_SIZE}px`,
                fontFamily: '"Press Start 2P", cursive',
                color: borderColor,
                fontSize: `${HEADER_FONT}px`,
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
                width: `${LABEL_WIDTH}px`,
                fontFamily: '"Press Start 2P", cursive',
                color: borderColor,
                fontSize: `${HEADER_FONT}px`,
              }}
            >
              {row + 1}
            </div>
            {Array.from({ length: 10 }, (_, col) => {
              const cell = board[row][col];
              const isHit = cell.state === 'hit';
              const isMiss = cell.state === 'miss';
              const hasShip = (cell.state === 'ship' || cell.state === 'hit') && !!cell.shipId;
              const showShipCell = cell.state === 'ship' && !isEnemy;
              const canClick = isEnemy && !isHit && !isMiss && !disabled;
              const sunk = hasShip && isShipSunk(cell.shipId, placedShips);

              // Compute ship group border edges (only for own ships or sunk enemy ships)
              const showBorders = hasShip && (!isEnemy || sunk);
              const borders = showBorders ? getShipBorders(row, col, board) : null;
              const shipBorderColor = sunk ? '#ff4444' : 'rgba(0, 255, 100, 0.8)';
              const shipBorderWidth = '2px';

              return (
                <div
                  key={col}
                  style={{
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    borderTop: borders?.top
                      ? `${shipBorderWidth} solid ${shipBorderColor}`
                      : (borders && !borders.top)
                        ? (sunk ? '0px solid transparent' : `1px solid ${shipBorderColor}22`)
                        : `1px solid ${borderColor}33`,
                    borderRight: borders?.right
                      ? `${shipBorderWidth} solid ${shipBorderColor}`
                      : (borders && !borders.right)
                        ? (sunk ? '0px solid transparent' : `1px solid ${shipBorderColor}22`)
                        : `1px solid ${borderColor}33`,
                    borderBottom: borders?.bottom
                      ? `${shipBorderWidth} solid ${shipBorderColor}`
                      : (borders && !borders.bottom)
                        ? (sunk ? '0px solid transparent' : `1px solid ${shipBorderColor}22`)
                        : `1px solid ${borderColor}33`,
                    borderLeft: borders?.left
                      ? `${shipBorderWidth} solid ${shipBorderColor}`
                      : (borders && !borders.left)
                        ? (sunk ? '0px solid transparent' : `1px solid ${shipBorderColor}22`)
                        : `1px solid ${borderColor}33`,
                    background: isHit
                      ? (sunk ? 'rgba(255, 40, 0, 0.4)' : 'rgba(255, 80, 0, 0.3)')
                      : isMiss
                        ? 'rgba(0, 0, 0, 0.3)'
                        : showShipCell
                          ? 'rgba(0, 255, 100, 0.15)'
                          : 'rgba(0, 0, 0, 0.3)',
                    cursor: canClick ? 'crosshair' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                  onClick={() => {
                    if (canClick && onCellClick) onCellClick(row, col);
                  }}
                >
                  {isHit && (sunk ? <SunkFireAnimation /> : <FireAnimation />)}
                  {isMiss && <SplashAnimation />}
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
  boardWidth,
}: {
  placedShips: PlacedShip[];
  borderColor: string;
  boardWidth: number;
}) {
  return (
    <div className="flex flex-col" style={{ gap: '4px', width: `${boardWidth}px` }}>
      {ships.map((ship) => {
        const placed = placedShips.find((s) => s.shipId === ship.id);
        const sunk = placed?.sunk ?? false;
        return (
          <div
            key={ship.id}
            className="flex items-center"
            style={{
              padding: '4px 8px',
              gap: '8px',
              border: `1px solid ${sunk ? '#ff4444' : borderColor}44`,
              background: sunk ? 'rgba(255,0,0,0.1)' : 'rgba(0,0,0,0.3)',
              borderRadius: '3px',
              opacity: sunk ? 0.5 : 1,
            }}
          >
            <div style={{ display: 'flex', gap: '2px' }}>
              {Array.from({ length: ship.size }, (_, i) => (
                <div key={i} style={{
                  width: '10px',
                  height: '10px',
                  background: sunk ? '#ff4444' : borderColor,
                  borderRadius: '2px',
                  opacity: sunk ? 0.4 : 0.7,
                }} />
              ))}
            </div>
            <span
              style={{
                fontFamily: '"Press Start 2P", cursive',
                fontSize: '7px',
                color: sunk ? '#ff4444' : '#ccc',
                textDecoration: sunk ? 'line-through' : 'none',
              }}
            >
              {ship.name}
            </span>
            {sunk && (
              <span style={{
                fontFamily: '"Press Start 2P", cursive',
                fontSize: '6px',
                color: '#ff4444',
                marginLeft: 'auto',
              }}>
                SUNK
              </span>
            )}
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
  onAIPeekTarget,
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

  const cancelledRef = useRef(false);

  const playerGridRef = useRef<HTMLDivElement>(null);
  const aiGridRef = useRef<HTMLDivElement>(null);

  // Missile stream animation state
  const [missileDirection, setMissileDirection] = useState<'left-to-right' | 'right-to-left' | null>(null);

  // Track which grid was last hit for callout positioning
  const [calloutSide, setCalloutSide] = useState<'player' | 'ai'>('ai');

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

  // Handle AI shot — starts missile animation from right to left
  const fireAIShot = useCallback(() => {
    if (cancelledRef.current) return;
    setMissileDirection('right-to-left');
  }, []);

  // Called when AI missile stream reaches the player side
  const handleAIMissileComplete = useCallback(() => {
    setMissileDirection(null);
    if (cancelledRef.current) return;

    onAIPeekTarget();
    const aiResult = onAIFire();
    setCalloutSide('player');

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
  }, [onAIPeekTarget, onAIFire, onStartPlayerTurn, onLose, playExplosion, playSplash, playShipSunk]);

  // Called when player missile stream reaches the AI side
  const handlePlayerMissileComplete = useCallback(() => {
    setMissileDirection(null);
    if (cancelledRef.current) return;
    const shot = pendingShotRef.current;
    if (!shot) {
      processingRef.current = false;
      setProcessing(false);
      return;
    }
    pendingShotRef.current = null;

    const result = onPlayerFire(shot.row, shot.col);
    if (result === 'already') {
      processingRef.current = false;
      setProcessing(false);
      return;
    }

    setCalloutSide('ai');

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

    // End player turn, start AI turn
    timeoutIdsRef.current.push(setTimeout(() => {
      onEndPlayerTurn();
      timeoutIdsRef.current.push(setTimeout(() => {
        if (cancelledRef.current) return;
        fireAIShot();
      }, 800));
    }, 500));
  }, [onPlayerFire, fireAIShot, onEndPlayerTurn, onWin, playExplosion, playSplash, playShipSunk]);

  const handlePlayerShot = useCallback(
    (row: number, col: number) => {
      if (!isPlayerTurn || processingRef.current) return;
      const cell = aiBoard[row][col];
      if (cell.state === 'hit' || cell.state === 'miss') return;

      processingRef.current = true;
      setProcessing(true);
      pendingShotRef.current = { row, col };
      // Show missile stream from left (player) to right (AI)
      setMissileDirection('left-to-right');
    },
    [isPlayerTurn, aiBoard]
  );

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

  const photoSize = 80;

  return (
    <ArcadeCanvas>
      <div className="absolute inset-0 overflow-hidden gameplay-container">
      <StarfieldBackground />
      <motion.div
        className="relative z-10 flex flex-col h-full"
        style={{ padding: '8px 12px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Top area: grids + center ship trackers */}
        <div className="flex-1 flex items-start justify-center" style={{ gap: '16px', paddingTop: '4px' }}>
          {/* Player side (left) */}
          <div className="flex flex-col items-center" style={{ position: 'relative' }}>
            <GameGrid
              board={playerBoard}
              borderColor="#3969CA"
              isEnemy={false}
              isBeingAttacked={!isPlayerTurn}
              gridRef={playerGridRef}
              placedShips={playerShips}
            />
            {/* Ship sunk callout over player grid */}
            <AnimatePresence>
              {calloutText && calloutSide === 'player' && (
                <motion.div
                  className="absolute pointer-events-none flex items-center justify-center"
                  style={{ top: '30%', left: 0, right: 0, zIndex: 55 }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div style={{
                    fontFamily: '"Press Start 2P", cursive',
                    fontSize: '14px',
                    color: '#ff4444',
                    textShadow: '0 0 20px rgba(255, 68, 68, 0.8), 2px 2px 0 #500',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,68,68,0.4)',
                  }}>
                    {calloutText}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CENTER COLUMN — ship statuses */}
          <div className="flex flex-col items-center justify-start" style={{ width: '200px', paddingTop: '20px', gap: '12px' }}>
            <div style={{ width: '100%' }}>
              <div style={{ fontFamily: '"Press Start 2P", cursive', fontSize: '6px', color: '#3969CA', marginBottom: '4px', textAlign: 'center' }}>YOUR FLEET</div>
              <ShipTracker placedShips={playerShips} borderColor="#3969CA" boardWidth={200} />
            </div>
            <div style={{ width: '80%', height: '1px', background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ width: '100%' }}>
              <div style={{ fontFamily: '"Press Start 2P", cursive', fontSize: '6px', color: '#21C19A', marginBottom: '4px', textAlign: 'center' }}>ENEMY FLEET</div>
              <ShipTracker placedShips={aiShips} borderColor="#21C19A" boardWidth={200} />
            </div>
          </div>

          {/* AI side (right) */}
          <div className="flex flex-col items-center" style={{ position: 'relative' }}>
            <GameGrid
              board={aiBoard}
              borderColor="#21C19A"
              isEnemy
              isBeingAttacked={isPlayerTurn}
              onCellClick={handlePlayerShot}
              disabled={!isPlayerTurn || processing}
              gridRef={aiGridRef}
              placedShips={aiShips}
            />
            {/* Ship sunk callout over AI grid */}
            <AnimatePresence>
              {calloutText && calloutSide === 'ai' && (
                <motion.div
                  className="absolute pointer-events-none flex items-center justify-center"
                  style={{ top: '30%', left: 0, right: 0, zIndex: 55 }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div style={{
                    fontFamily: '"Press Start 2P", cursive',
                    fontSize: '14px',
                    color: '#FFD700',
                    textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 2px 2px 0 #8B0000',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,215,0,0.4)',
                  }}>
                    {calloutText}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom: player photos + turn indicator + missile stream */}
        <div className="flex items-center justify-center" style={{ gap: '24px', paddingBottom: '8px', paddingTop: '8px' }}>
          {/* Player photo + turn label */}
          <div className="flex flex-col items-center" style={{ gap: '4px' }}>
            <div style={{
              width: `${photoSize}px`,
              height: `${photoSize}px`,
              borderRadius: '8px',
              border: `3px solid ${isPlayerTurn ? '#3969CA' : 'rgba(57,105,202,0.3)'}`,
              overflow: 'hidden',
              boxShadow: isPlayerTurn ? '0 0 15px rgba(57,105,202,0.5)' : 'none',
              transition: 'border-color 0.3s, box-shadow 0.3s',
            }}>
              {playerCharacter.portrait ? (
                <img src={playerCharacter.portrait} alt={playerCharacter.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
              ) : (
                <div className="flex items-center justify-center" style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(57,105,202,0.4), rgba(57,105,202,0.15))', fontSize: '32px' }}>
                  {String.fromCodePoint(0x1F3AF)}
                </div>
              )}
            </div>
            <AnimatePresence mode="wait">
              {isPlayerTurn && (
                <motion.div key="player-turn" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 3 }} transition={{ duration: 0.3 }}>
                  <span style={{ fontFamily: '"Press Start 2P", cursive', color: processing ? '#ff8800' : '#FFD700', fontSize: '8px', textShadow: '0 0 8px rgba(255, 215, 0, 0.5)' }}>
                    {processing ? 'FIRING...' : 'YOUR TURN'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* VS divider + missile stream area */}
          <div style={{ position: 'relative', width: '200px', height: `${photoSize + 30}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: '"Press Start 2P", cursive', fontSize: '14px', color: 'rgba(255,255,255,0.2)' }}>VS</span>
            <AnimatePresence>
              {missileDirection && (
                <MissileStream
                  key={missileDirection + '-' + Date.now()}
                  direction={missileDirection}
                  onComplete={missileDirection === 'left-to-right' ? handlePlayerMissileComplete : handleAIMissileComplete}
                />
              )}
            </AnimatePresence>
          </div>

          {/* AI photo + turn label */}
          <div className="flex flex-col items-center" style={{ gap: '4px' }}>
            <div style={{
              width: `${photoSize}px`,
              height: `${photoSize}px`,
              borderRadius: '8px',
              border: `3px solid ${!isPlayerTurn ? '#21C19A' : 'rgba(33,193,154,0.3)'}`,
              overflow: 'hidden',
              boxShadow: !isPlayerTurn ? '0 0 15px rgba(33,193,154,0.5)' : 'none',
              transition: 'border-color 0.3s, box-shadow 0.3s',
            }}>
              {aiCharacter.portrait ? (
                <img src={aiCharacter.portrait} alt={aiCharacter.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
              ) : (
                <div className="flex items-center justify-center" style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(33,193,154,0.4), rgba(33,193,154,0.15))', fontSize: '32px' }}>
                  {String.fromCodePoint(0x1F4BB)}
                </div>
              )}
            </div>
            <AnimatePresence mode="wait">
              {!isPlayerTurn && (
                <motion.div key="ai-turn" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 3 }} transition={{ duration: 0.3 }}>
                  <span style={{ fontFamily: '"Press Start 2P", cursive', color: '#ff4444', fontSize: '8px', textShadow: '0 0 8px rgba(255, 68, 68, 0.5)' }}>
                    {"OPPONENT'S TURN"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      </div>
    </ArcadeCanvas>
  );
}

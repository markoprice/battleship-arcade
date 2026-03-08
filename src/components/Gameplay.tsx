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

// Subtle 80s arcade hit indicator — soft warm glow, no hyperactive animation
function FireAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Warm orange base glow — slow gentle pulse */}
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
      {/* Inner bright core — subtle flicker */}
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

function PlayerCard({
  character,
  borderColor,
  teamLabel,
  isSales,
  boardWidth,
}: {
  character: Character;
  borderColor: string;
  teamLabel: string;
  isSales: boolean;
  boardWidth: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-2" style={{ width: `${boardWidth}px`, padding: '0 4px' }}>
      <div
        className="flex items-center justify-center rounded overflow-hidden flex-shrink-0"
        style={{
          width: '52px',
          height: '52px',
          border: `2px solid ${borderColor}`,
          background: isSales
            ? 'linear-gradient(135deg, rgba(57,105,202,0.4), rgba(57,105,202,0.15))'
            : 'linear-gradient(135deg, rgba(33,193,154,0.4), rgba(33,193,154,0.15))',
        }}
      >
        {character.portrait ? (
          <img src={character.portrait} alt={character.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        ) : (
          <span style={{ fontSize: '20px' }}>{isSales ? '\uD83C\uDFAF' : '\uD83D\uDCBB'}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#FFD700',
            fontSize: '10px',
          }}
        >
          {character.name.toUpperCase()}
        </div>
        <div
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#aaa',
            fontSize: '7px',
            marginTop: '3px',
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

// Missile animation removed per user request

// Compute per-cell border edges for ship group outlines
function getShipBorders(
  row: number,
  col: number,
  board: Board,
  placedShips: PlacedShip[],
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
              const borders = showBorders ? getShipBorders(row, col, board, placedShips) : null;
              const shipBorderColor = sunk ? '#ff4444' : 'rgba(0, 255, 100, 0.8)';
              const shipBorderWidth = '2px';

              return (
                <div
                  key={col}
                  style={{
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    borderTop: borders?.top ? `${shipBorderWidth} solid ${shipBorderColor}` : (borders && !borders.top) ? `1px solid ${shipBorderColor}22` : `1px solid ${borderColor}33`,
                    borderRight: borders?.right ? `${shipBorderWidth} solid ${shipBorderColor}` : (borders && !borders.right) ? `1px solid ${shipBorderColor}22` : `1px solid ${borderColor}33`,
                    borderBottom: borders?.bottom ? `${shipBorderWidth} solid ${shipBorderColor}` : (borders && !borders.bottom) ? `1px solid ${shipBorderColor}22` : `1px solid ${borderColor}33`,
                    borderLeft: borders?.left ? `${shipBorderWidth} solid ${shipBorderColor}` : (borders && !borders.left) ? `1px solid ${shipBorderColor}22` : `1px solid ${borderColor}33`,
                    background: isHit
                      ? (sunk ? 'rgba(255, 40, 0, 0.4)' : 'rgba(255, 80, 0, 0.3)')
                      : isMiss
                        ? 'rgba(255, 255, 255, 0.05)'
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
                  {isHit && <FireAnimation />}
                  {isMiss && (
                    <div
                      style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}
                    />
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

  // Refs for player card containers
  const playerCardContainerRef = useRef<HTMLDivElement>(null);
  const aiCardContainerRef = useRef<HTMLDivElement>(null);
  const playerGridRef = useRef<HTMLDivElement>(null);
  const aiGridRef = useRef<HTMLDivElement>(null);

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

  // Handle AI shot — fire and update board
  const fireAIShot = useCallback(() => {
    if (cancelledRef.current) return;

    const aiResult = onAIFire();

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
  }, [
    onAIFire,
    onStartPlayerTurn,
    onLose,
    playExplosion,
    playSplash,
    playShipSunk,
  ]);

  // Process player shot result and trigger AI turn
  const processPlayerShot = useCallback(() => {
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
  }, [
    onPlayerFire,
    fireAIShot,
    onEndPlayerTurn,
    onWin,
    playExplosion,
    playSplash,
    playShipSunk,
  ]);

  const handlePlayerShot = useCallback(
    (row: number, col: number) => {
      if (!isPlayerTurn || processingRef.current) return;
      const cell = aiBoard[row][col];
      if (cell.state === 'hit' || cell.state === 'miss') return;

      processingRef.current = true;
      setProcessing(true);

      pendingShotRef.current = { row, col };
      // Small delay for feel, then process
      const id = setTimeout(() => processPlayerShot(), 150);
      timeoutIdsRef.current.push(id);
    },
    [
      isPlayerTurn,
      processing,
      aiBoard,
      processPlayerShot,
    ]
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

  const boardWidth = LABEL_WIDTH + CELL_SIZE * 10 + 12;

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
        {/* Grids with center column for turn indicator + ship trackers */}
        <div className="flex-1 flex items-start justify-center" style={{ gap: '16px', paddingTop: '4px' }}>
          {/* Player side (left) */}
          <div className="flex flex-col items-center">
            {/* Player card ABOVE grid */}
            <div ref={playerCardContainerRef}>
              <PlayerCard
                character={playerCharacter}
                borderColor="#3969CA"
                teamLabel="SALES"
                isSales
                boardWidth={boardWidth}
              />
            </div>
            <GameGrid
              board={playerBoard}
              borderColor="#3969CA"
              isEnemy={false}
              isBeingAttacked={!isPlayerTurn}
              gridRef={playerGridRef}
              placedShips={playerShips}
            />
          </div>

          {/* CENTER COLUMN — turn indicator + ship statuses */}
          <div className="flex flex-col items-center justify-start" style={{ width: '200px', paddingTop: '70px', gap: '12px' }}>
            {/* Turn indicator */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isPlayerTurn ? 'player' : 'opponent'}
                className="text-center"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.3 }}
              >
                <span
                  style={{
                    fontFamily: '"Press Start 2P", cursive',
                    color: isPlayerTurn ? '#FFD700' : '#ff4444',
                    fontSize: '11px',
                    textShadow: isPlayerTurn
                      ? '0 0 10px rgba(255, 215, 0, 0.5)'
                      : '0 0 10px rgba(255, 68, 68, 0.5)',
                  }}
                >
                  {isPlayerTurn && !processing ? 'YOUR TURN' : processing ? 'FIRING...' : "OPPONENT'S TURN"}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Divider */}
            <div style={{ width: '80%', height: '1px', background: 'rgba(255,255,255,0.15)' }} />

            {/* Player ship tracker */}
            <div style={{ width: '100%' }}>
              <div style={{
                fontFamily: '"Press Start 2P", cursive',
                fontSize: '6px',
                color: '#3969CA',
                marginBottom: '4px',
                textAlign: 'center',
              }}>YOUR FLEET</div>
              <ShipTracker placedShips={playerShips} borderColor="#3969CA" boardWidth={200} />
            </div>

            {/* Divider */}
            <div style={{ width: '80%', height: '1px', background: 'rgba(255,255,255,0.15)' }} />

            {/* AI ship tracker */}
            <div style={{ width: '100%' }}>
              <div style={{
                fontFamily: '"Press Start 2P", cursive',
                fontSize: '6px',
                color: '#21C19A',
                marginBottom: '4px',
                textAlign: 'center',
              }}>ENEMY FLEET</div>
              <ShipTracker placedShips={aiShips} borderColor="#21C19A" boardWidth={200} />
            </div>
          </div>

          {/* AI side (right) */}
          <div className="flex flex-col items-center">
            {/* AI card ABOVE grid */}
            <div ref={aiCardContainerRef}>
              <PlayerCard
                character={aiCharacter}
                borderColor="#21C19A"
                teamLabel="PRODUCT"
                isSales={false}
                boardWidth={boardWidth}
              />
            </div>
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
          </div>
        </div>

        {/* NBA Jam Callout */}
        <AnimatePresence>
          {calloutText && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
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

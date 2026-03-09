import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Character, Board, PlacedShip } from '../types';
import { ships } from '../data/ships';
import StarfieldBackground from './StarfieldBackground';
import ArcadeCanvas from './ArcadeCanvas';
import ExitButton from './ExitButton';

interface Props {
  playerCharacter: Character;
  aiCharacter: Character;
  playerBoard: Board;
  aiBoard: Board;
  playerShips: PlacedShip[];
  aiShips: PlacedShip[];
  isPlayerTurn: boolean;
  onPlayerFire: (row: number, col: number) => { result: 'hit' | 'miss' | 'already' | 'sunk' | 'win'; shipName?: string };
  onAIPeekTarget: () => { row: number; col: number; predictedResult: 'hit' | 'miss' };
  onAIFire: () => { row: number; col: number; result: 'hit' | 'miss' | 'sunk' | 'lose'; shipName?: string };
  onEndPlayerTurn: () => void;
  onStartPlayerTurn: () => void;
  onWin: () => void;
  onLose: () => void;
  onExit?: () => void;
  playExplosion: () => void;
  playSplash: () => void;
  playShipSunk: () => void;
  playClickSound: () => void;
}

// NBA Jam-style callout phrases
const SALES_CELEBRATORY = ['KABOOM!', 'BOOMSHAKALAKA!', 'WITH AUTHORITY!', 'RAZZLE DAZZLE!', 'COUNT IT!', 'YES!'];
const ENG_WARNING = ['UH-OH!', 'WATCH OUT!', "THAT'S GOTTA HURT!", "THAT'S TROUBLE!", 'BIG PROBLEMS!', 'INCOMING!', 'NOT GOOD!', 'THIS LOOKS BAD!', 'AHOY MATEYS!'];

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// Fixed pixel sizes inside 1344x756 canvas — no viewport units
const CELL_SIZE = 32;
const LABEL_WIDTH = 22;
const HEADER_FONT = 7;

// Hit indicator for regular hits
function FireAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Outer glow — fills most of the cell */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '0%',
          borderRadius: '30%',
          background: 'radial-gradient(ellipse at center, rgba(255,100,10,0.95) 0%, rgba(220,60,0,0.7) 40%, rgba(180,30,0,0.35) 70%, transparent 95%)',
        }}
        animate={{
          opacity: [0.85, 1, 0.85],
          scale: [0.95, 1.08, 0.95],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Inner bright core */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '15%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(255,220,80,1) 0%, rgba(255,150,30,0.85) 50%, rgba(255,80,0,0.4) 80%, transparent 100%)',
        }}
        animate={{
          opacity: [0.8, 1, 0.8],
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      />
      {/* Bright white-yellow hotspot center */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '30%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,200,0.95) 0%, rgba(255,200,50,0.6) 60%, transparent 100%)',
        }}
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
      />
    </div>
  );
}

// Sunk ship fire — slow burn, intense but not distracting
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
          opacity: [0.8, 0.95, 0.8],
          scale: [0.97, 1.04, 0.97],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          inset: '15%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(255,200,50,0.9) 0%, rgba(255,120,0,0.6) 50%, transparent 90%)',
        }}
        animate={{
          opacity: [0.7, 0.9, 0.7],
          scale: [1, 1.05, 1],
          y: [0, -0.5, 0],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
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
          opacity: [0.5, 0.75, 0.5],
          scaleY: [0.9, 1.05, 0.9],
          x: [-0.5, 0.5, -0.5],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
    </div>
  );
}

// Arcade-style splash animation for misses — single outward ripple then settles to static
function SplashAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Single outward ripple ring */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '20%',
          borderRadius: '50%',
          border: '2px solid rgba(100,180,255,0.6)',
          background: 'transparent',
        }}
        initial={{ scale: 0.3, opacity: 0.8 }}
        animate={{ scale: 1.4, opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      {/* Inner glow that fades out */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '25%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100,180,255,0.5) 0%, rgba(50,120,200,0.2) 60%, transparent 100%)',
        }}
        initial={{ opacity: 0.7, scale: 0.5 }}
        animate={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      {/* Static settled state — fades in as ripple fades out */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(40, 60, 90, 0.4)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6, ease: 'easeIn' }}
      >
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'rgba(150,200,255,0.5)',
        }} />
      </motion.div>
    </div>
  );
}


/**
 * Top-down naval vessel silhouette definitions.
 * Each ship has a hull outline (main polygon) plus optional superstructure
 * detail polygons (bridge, turrets, island, conning tower) for realism.
 *
 * Coordinates are in normalised units where one cell = 1.0.
 * Horizontal orientation; ships pointing right (bow on the right).
 * Slightly inset from cell edges so grid lines remain visible.
 */
const INSET = 0.08;
interface ShipShape {
  hull: [number, number][];
  details: [number, number][][]; // additional superstructure polygons
}
const SHIP_SILHOUETTES: Record<string, ShipShape> = {
  // Carrier (5 cells) — long flat flight deck, small island superstructure near rear
  carrier: {
    hull: [
      // Stern (flat back)
      [INSET, 0.32],
      // Port side runs forward
      [3.8, 0.30],
      // Bow tapers to a gentle point
      [4.4, 0.22],
      [4.8, 0.38],
      [5 - INSET, 0.50],
      [4.8, 0.62],
      [4.4, 0.78],
      // Starboard side runs back
      [3.8, 0.70],
      [INSET, 0.68],
    ],
    details: [
      // Island superstructure (small rectangle, starboard side, near rear)
      [
        [0.7, 0.32],
        [1.5, 0.32],
        [1.5, 0.42],
        [0.7, 0.42],
      ],
    ],
  },
  // Battleship (4 cells) — wide hull, turret bumps along centerline
  battleship: {
    hull: [
      // Stern
      [INSET, 0.28],
      // Port side widens
      [0.3, 0.22],
      [2.6, 0.22],
      // Bow narrows to a pointed prow
      [3.2, 0.18],
      [3.6, 0.30],
      [4 - INSET, 0.50],
      [3.6, 0.70],
      [3.2, 0.82],
      // Starboard side
      [2.6, 0.78],
      [0.3, 0.78],
      [INSET, 0.72],
    ],
    details: [
      // Front turret
      [
        [2.4, 0.38],
        [2.9, 0.38],
        [2.9, 0.62],
        [2.4, 0.62],
      ],
      // Rear turret
      [
        [0.5, 0.38],
        [1.0, 0.38],
        [1.0, 0.62],
        [0.5, 0.62],
      ],
      // Bridge (center)
      [
        [1.4, 0.35],
        [2.0, 0.35],
        [2.0, 0.65],
        [1.4, 0.65],
      ],
    ],
  },
  // Destroyer (3 cells) — narrow hull, raised bridge near front
  destroyer: {
    hull: [
      // Stern
      [INSET, 0.32],
      [0.2, 0.26],
      // Port side
      [2.0, 0.24],
      // Bow tapers
      [2.5, 0.20],
      [2.8, 0.35],
      [3 - INSET, 0.50],
      [2.8, 0.65],
      [2.5, 0.80],
      // Starboard side
      [2.0, 0.76],
      [0.2, 0.74],
      [INSET, 0.68],
    ],
    details: [
      // Bridge superstructure (forward)
      [
        [1.5, 0.34],
        [2.1, 0.34],
        [2.1, 0.66],
        [1.5, 0.66],
      ],
    ],
  },
  // Submarine (3 cells) — rounded cigar body, conning tower bump
  submarine: {
    hull: [
      // Rounded stern
      [0.25, 0.30],
      [INSET, 0.42],
      [INSET, 0.58],
      [0.25, 0.70],
      // Body runs forward
      [2.75, 0.70],
      // Rounded bow
      [3 - INSET, 0.58],
      [3 - INSET, 0.42],
      [2.75, 0.30],
    ],
    details: [
      // Conning tower (small raised bump, center-aft)
      [
        [1.1, 0.28],
        [1.7, 0.28],
        [1.7, 0.40],
        [1.1, 0.40],
      ],
    ],
  },
  // Patrol boat (2 cells) — small speedboat, pointed bow, narrow stern
  patrol: {
    hull: [
      // Stern (narrow)
      [INSET, 0.38],
      [0.15, 0.28],
      // Port side
      [1.3, 0.24],
      // Bow point
      [1.7, 0.35],
      [2 - INSET, 0.50],
      [1.7, 0.65],
      // Starboard side
      [1.3, 0.76],
      [0.15, 0.72],
      [INSET, 0.62],
    ],
    details: [
      // Small cabin/bridge
      [
        [0.5, 0.36],
        [0.9, 0.36],
        [0.9, 0.64],
        [0.5, 0.64],
      ],
    ],
  },
};

/** Convert a polygon (array of [x,y] normalised coords) to an SVG path string,
 *  applying offset and cell size, with optional coordinate swap for vertical ships. */
function polyToPath(
  poly: [number, number][],
  ox: number, oy: number,
  cellSize: number,
  vertical: boolean,
): string {
  const pts = poly.map(([nx, ny]) =>
    vertical
      ? `${ox + ny * cellSize},${oy + nx * cellSize}`
      : `${ox + nx * cellSize},${oy + ny * cellSize}`
  );
  return `M${pts.join('L')}Z`;
}

/** Build SVG path strings for a ship silhouette (hull + superstructure details).
 *  Determines orientation from cell layout and applies the correct shapes. */
function buildShipSilhouettePath(
  shipId: string,
  cells: [number, number][],
  cellSize: number,
): { hullPath: string; detailPaths: string[] } {
  const shape = SHIP_SILHOUETTES[shipId];
  if (!shape) return { hullPath: '', detailPaths: [] };

  // Sort cells to determine orientation and origin
  const sorted = [...cells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const [minR, minC] = sorted[0];
  const isHorizontal = sorted.length > 1 && sorted[1][1] !== sorted[0][1];
  const vertical = !isHorizontal;

  const ox = minC * cellSize;
  const oy = minR * cellSize;

  const hullPath = polyToPath(shape.hull, ox, oy, cellSize, vertical);
  const detailPaths = shape.details.map(d => polyToPath(d, ox, oy, cellSize, vertical));

  return { hullPath, detailPaths };
}

/** Build SVG data for arcade-style ship silhouettes on a 10×10 board.
 *  Returns a ship-shaped silhouette path and a perimeter outline path per ship. */
export function buildShipOutlinePaths(
  board: Board,
  cellSize: number,
  placedShips: PlacedShip[],
  defaultColor: string,
  isPlayerBoard = false,
): { hullPath: string; detailPaths: string[]; outlinePath: string; color: string; fillColor: string; detailColor: string }[] {
  // Group cells by shipId
  const shipCells = new Map<string, [number, number][]>();
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const id = board[r][c].shipId;
      if (id && (board[r][c].state === 'ship' || board[r][c].state === 'hit')) {
        if (!shipCells.has(id)) shipCells.set(id, []);
        shipCells.get(id)!.push([r, c]);
      }
    }
  }

  const results: { hullPath: string; detailPaths: string[]; outlinePath: string; color: string; fillColor: string; detailColor: string }[] = [];
  shipCells.forEach((cells, shipId) => {
    const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
    const sunk = placedShips.find((s) => s.shipId === shipId)?.sunk ?? false;

    // Build ship-shaped silhouette paths (hull + superstructure details)
    const { hullPath, detailPaths } = buildShipSilhouettePath(shipId, cells, cellSize);

    // Outline path: only outer perimeter edges (for grid-aligned border)
    let outline = '';
    for (const [r, c] of cells) {
      const x = c * cellSize;
      const y = r * cellSize;
      if (!cellSet.has(`${r - 1},${c}`)) outline += `M${x},${y}L${x + cellSize},${y}`;
      if (!cellSet.has(`${r},${c + 1}`)) outline += `M${x + cellSize},${y}L${x + cellSize},${y + cellSize}`;
      if (!cellSet.has(`${r + 1},${c}`)) outline += `M${x},${y + cellSize}L${x + cellSize},${y + cellSize}`;
      if (!cellSet.has(`${r},${c - 1}`)) outline += `M${x},${y}L${x},${y + cellSize}`;
    }

    const strokeColor = sunk ? '#ff4444' : defaultColor;
    // Player ships: mostly opaque fill. Enemy sunk ships: translucent red.
    const fillOpacity = sunk ? 'rgba(255,40,0,0.35)' : isPlayerBoard ? `${defaultColor}B0` : `${defaultColor}20`;
    // Superstructure detail color: slightly lighter/brighter than hull fill
    const detailFill = sunk ? 'rgba(255,80,0,0.45)' : isPlayerBoard ? `${defaultColor}D0` : `${defaultColor}30`;
    results.push({ hullPath, detailPaths, outlinePath: outline, color: strokeColor, fillColor: fillOpacity, detailColor: detailFill });
  });
  return results;
}

/** Check if a cell shares an edge with the same ship (used to suppress internal borders) */
export function isInternalShipEdge(
  board: Board,
  row: number,
  col: number,
  direction: 'top' | 'right' | 'bottom' | 'left',
): boolean {
  const cell = board[row][col];
  if (!cell.shipId) return false;
  const [dr, dc] = direction === 'top' ? [-1, 0] : direction === 'bottom' ? [1, 0] : direction === 'right' ? [0, 1] : [0, -1];
  const nr = row + dr;
  const nc = col + dc;
  if (nr < 0 || nr >= 10 || nc < 0 || nc >= 10) return false;
  return board[nr][nc].shipId === cell.shipId;
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

        {/* Grid cells + SVG ship outline overlay */}
        <div style={{ position: 'relative' }}>
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
              const showShip = hasShip && (!isEnemy || isShipSunk(cell.shipId, placedShips));
              const canClick = isEnemy && !isHit && !isMiss && !disabled;
              const sunk = hasShip && isShipSunk(cell.shipId, placedShips);

              // Suppress internal borders between cells of the same ship
              const gridLine = `1px solid ${borderColor}33`;
              const suppressedLine = '1px solid transparent';
              const bTop = showShip && isInternalShipEdge(board, row, col, 'top') ? suppressedLine : gridLine;
              const bRight = showShip && isInternalShipEdge(board, row, col, 'right') ? suppressedLine : gridLine;
              const bBottom = showShip && isInternalShipEdge(board, row, col, 'bottom') ? suppressedLine : gridLine;
              const bLeft = showShip && isInternalShipEdge(board, row, col, 'left') ? suppressedLine : gridLine;

              return (
                <div
                  key={col}
                  style={{
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    borderTop: bTop,
                    borderRight: bRight,
                    borderBottom: bBottom,
                    borderLeft: bLeft,
                    background: isHit
                      ? (sunk ? 'rgba(255, 40, 0, 0.4)' : 'rgba(80, 20, 0, 0.6)')
                      : isMiss
                        ? 'rgba(0, 40, 80, 0.45)'
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
                  {isHit && sunk && <SunkFireAnimation />}
                  {isHit && !sunk && (
                    <div style={{
                      position: 'absolute',
                      inset: '0%',
                      borderRadius: '20%',
                      background: 'radial-gradient(ellipse at center, rgba(255,100,10,0.9) 0%, rgba(200,50,0,0.5) 50%, transparent 90%)',
                    }}>
                      <FireAnimation />
                    </div>
                  )}
                  {isMiss && <SplashAnimation />}
                </div>
              );
            })}
          </div>
        ))}
        {/* SVG overlay for arcade-style ship silhouettes */}
        {(() => {
          // Only show outlines for own ships, or sunk enemy ships
          const outlineBoard: Board = board.map((row) =>
            row.map((cell) => {
              if (!cell.shipId) return cell;
              const show = !isEnemy || (isShipSunk(cell.shipId, placedShips));
              return show ? cell : { ...cell, shipId: undefined };
            })
          );
          const ships = buildShipOutlinePaths(outlineBoard, CELL_SIZE, placedShips, borderColor, !isEnemy);
          if (ships.length === 0) return null;
          return (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: `${LABEL_WIDTH}px`,
                width: `${CELL_SIZE * 10}px`,
                height: `${CELL_SIZE * 10}px`,
                pointerEvents: 'none',
                zIndex: 10,
              }}
              shapeRendering="crispEdges"
            >
              {ships.map((s, i) => (
                <g key={i}>
                  {/* Hull silhouette — main ship body */}
                  <path d={s.hullPath} fill={s.fillColor} stroke="none" />
                  {/* Superstructure details — bridge, turrets, island, conning tower */}
                  {s.detailPaths.map((dp, j) => (
                    <path key={j} d={dp} fill={s.detailColor} stroke="none" />
                  ))}
                  {/* Chunky perimeter outline — retro sprite border */}
                  <path d={s.outlinePath} stroke={s.color} strokeWidth="3" fill="none" strokeLinecap="butt" />
                </g>
              ))}
            </svg>
          );
        })()}
        </div>
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
  playClickSound,
  onExit,
}: Props) {
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cancelledRef = useRef(false);

  const playerGridRef = useRef<HTMLDivElement>(null);
  const aiGridRef = useRef<HTMLDivElement>(null);

  // Grid callout state (NBA Jam-style notifications over grids)
  const [gridCallout, setGridCallout] = useState<{
    bigText: string;
    smallText: string;
    side: 'player' | 'ai';
    key: number;
  } | null>(null);
  const gridCalloutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridCalloutKeyRef = useRef(0);

  // NBA Jam streak tracking
  const salesSunkCountRef = useRef(0);
  const engSunkCountRef = useRef(0);
  const salesSunkStreakRef = useRef(0); // consecutive sinks without miss
  const fireHotHandPickRef = useRef<string | null>(null);

  // Status text displayed beside player photos
  const [statusText, setStatusText] = useState<string>('YOUR TURN');
  const [statusColor, setStatusColor] = useState<string>('#FFD700');
  const [statusSide, setStatusSide] = useState<'player' | 'ai' | 'both'>('player');
  // Photo shake state
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeAI, setShakeAI] = useState(false);

  // Clear all pending timeouts on unmount (e.g. abandon game)
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
      if (gridCalloutTimerRef.current) clearTimeout(gridCalloutTimerRef.current);
    };
  }, []);

  // Show a grid callout over the specified grid
  const showGridCallout = useCallback((bigText: string, smallText: string, side: 'player' | 'ai') => {
    if (gridCalloutTimerRef.current) clearTimeout(gridCalloutTimerRef.current);
    gridCalloutKeyRef.current += 1;
    setGridCallout({ bigText, smallText, side, key: gridCalloutKeyRef.current });
    gridCalloutTimerRef.current = setTimeout(() => {
      setGridCallout(null);
      gridCalloutTimerRef.current = null;
    }, 2500);
  }, []);

  // Get NBA Jam phrase for Sales sinking an Eng ship
  const getSalesSunkBigText = useCallback((totalSunk: number, streak: number): string => {
    // 4th ship overall = "1 SHIP LEFT!"
    if (totalSunk === 4) return '1 SHIP LEFT!';
    // 2nd ship overall = "He\'s heating up!"
    if (totalSunk === 2) return "HE'S HEATING UP!";
    // 3 consecutive sinks without miss = the other fire/hot hand phrase
    if (streak >= 3) {
      if (!fireHotHandPickRef.current) {
        fireHotHandPickRef.current = Math.random() < 0.5 ? "HE'S ON FIRE!" : "HE'S GOT THE HOT HAND!";
      }
      return fireHotHandPickRef.current === "HE'S ON FIRE!" ? "HE'S GOT THE HOT HAND!" : "HE'S ON FIRE!";
    }
    // 2 consecutive sinks without miss = one of fire/hot hand
    if (streak >= 2) {
      const pick = Math.random() < 0.5 ? "HE'S ON FIRE!" : "HE'S GOT THE HOT HAND!";
      fireHotHandPickRef.current = pick;
      return pick;
    }
    // Random celebratory
    return SALES_CELEBRATORY[Math.floor(Math.random() * SALES_CELEBRATORY.length)];
  }, []);

  // Get phrase for Eng sinking a Sales ship
  const getEngSunkBigText = useCallback((totalSunk: number): string => {
    if (totalSunk === 4) return '1 SHIP LEFT!';
    return ENG_WARNING[Math.floor(Math.random() * ENG_WARNING.length)];
  }, []);

  // Handle AI shot — fires immediately (no missile animation)
  const fireAIShot = useCallback(() => {
    if (cancelledRef.current) return;
    // Fire AI shot directly
    onAIPeekTarget();
    const aiResult = onAIFire();
    if (aiResult.result === 'hit') {
      playExplosion();
      setShakePlayer(true);
      timeoutIdsRef.current.push(setTimeout(() => setShakePlayer(false), 500));
    } else if (aiResult.result === 'sunk') {
      playExplosion();
      playShipSunk();
      engSunkCountRef.current += 1;
      const bigText = getEngSunkBigText(engSunkCountRef.current);
      showGridCallout(bigText, `${aiResult.shipName?.toUpperCase() ?? 'SHIP'} DOWN`, 'player');
      setShakePlayer(true);
      timeoutIdsRef.current.push(setTimeout(() => setShakePlayer(false), 500));
    } else if (aiResult.result === 'miss') {
      playSplash();
    } else if (aiResult.result === 'lose') {
      playExplosion();
      playShipSunk();
      engSunkCountRef.current += 1;
      const bigText = getEngSunkBigText(engSunkCountRef.current);
      showGridCallout(bigText, `${aiResult.shipName?.toUpperCase() ?? 'SHIP'} DOWN`, 'player');
      setStatusText('GAME OVER');
      setStatusColor('#ff4444');
      setStatusSide('player');
      setShakePlayer(true);
      timeoutIdsRef.current.push(setTimeout(() => setShakePlayer(false), 500));
      timeoutIdsRef.current.push(setTimeout(() => {
        processingRef.current = false;
        setProcessing(false);
        onLose();
      }, 2500));
      return;
    }

    // Show YOUR TURN quickly and unlock
    timeoutIdsRef.current.push(setTimeout(() => {
      if (cancelledRef.current) return;
      setStatusText('YOUR TURN');
      setStatusColor('#FFD700');
      setStatusSide('player');
      timeoutIdsRef.current.push(setTimeout(() => {
        if (cancelledRef.current) return;
        onStartPlayerTurn();
        processingRef.current = false;
        setProcessing(false);
      }, 300));
    }, 600));
  }, [onAIPeekTarget, onAIFire, onStartPlayerTurn, onLose, playExplosion, playSplash, playShipSunk, showGridCallout, getEngSunkBigText]);


  const handlePlayerShot = useCallback(
    (row: number, col: number) => {
      if (!isPlayerTurn || processingRef.current) return;
      const cell = aiBoard[row][col];
      if (cell.state === 'hit' || cell.state === 'miss') return;

      // Click feedback on grid cell
      playClickSound();

      processingRef.current = true;
      setProcessing(true);

      // Fire immediately — update the board right away
      const fireResult = onPlayerFire(row, col);
      if (fireResult.result === 'already') {
        processingRef.current = false;
        setProcessing(false);
        return;
      }

      if (fireResult.result === 'hit') {
        playExplosion();
        setShakeAI(true);
        timeoutIdsRef.current.push(setTimeout(() => setShakeAI(false), 500));
      } else if (fireResult.result === 'sunk') {
        playExplosion();
        playShipSunk();
        salesSunkCountRef.current += 1;
        salesSunkStreakRef.current += 1;
        const bigText = getSalesSunkBigText(salesSunkCountRef.current, salesSunkStreakRef.current);
        showGridCallout(bigText, `${fireResult.shipName?.toUpperCase() ?? 'SHIP'} DOWN`, 'ai');
        setShakeAI(true);
        timeoutIdsRef.current.push(setTimeout(() => setShakeAI(false), 500));
      } else if (fireResult.result === 'miss') {
        playSplash();
        salesSunkStreakRef.current = 0;
        fireHotHandPickRef.current = null;
      } else if (fireResult.result === 'win') {
        playExplosion();
        playShipSunk();
        salesSunkCountRef.current += 1;
        salesSunkStreakRef.current += 1;
        const bigText = getSalesSunkBigText(salesSunkCountRef.current, salesSunkStreakRef.current);
        showGridCallout(bigText, `${fireResult.shipName?.toUpperCase() ?? 'SHIP'} DOWN`, 'ai');
        setShakeAI(true);
        timeoutIdsRef.current.push(setTimeout(() => setShakeAI(false), 500));
        timeoutIdsRef.current.push(setTimeout(() => {
          processingRef.current = false;
          setProcessing(false);
          onWin();
        }, 2500));
        return;
      }

      // Delay before switching to AI turn:
      // If player sunk a ship, wait for the celebration callout to disappear (2500ms + 300ms buffer)
      // Otherwise, transition quickly (600ms)
      const isSunkResult = fireResult.result === 'sunk';
      const turnTransitionDelay = isSunkResult ? 2800 : 600;

      // Show AI TURN and proceed after celebration finishes
      timeoutIdsRef.current.push(setTimeout(() => {
        if (cancelledRef.current) return;
        setStatusText('AI TURN');
        setStatusColor('#ff4444');
        setStatusSide('ai');
        timeoutIdsRef.current.push(setTimeout(() => {
          if (cancelledRef.current) return;
          onEndPlayerTurn();
          const aiDelay = 1000 + Math.random() * 1000; // 1–2s random
          timeoutIdsRef.current.push(setTimeout(() => {
            if (cancelledRef.current) return;
            fireAIShot();
          }, aiDelay));
        }, 300));
      }, turnTransitionDelay));
    },
    [isPlayerTurn, aiBoard, onPlayerFire, fireAIShot, onEndPlayerTurn, onWin, playExplosion, playSplash, playShipSunk, playClickSound, showGridCallout, getSalesSunkBigText]
  );

  // Auto-unlock processing if stuck
  useEffect(() => {
    if (processing) {
      const timeout = setTimeout(() => {
        processingRef.current = false;
        setProcessing(false);
        onStartPlayerTurn();
      }, 15000);
      return () => clearTimeout(timeout);
    }
  }, [processing, onStartPlayerTurn]);

  const photoSize = 180;

  return (
    <ArcadeCanvas>
      {onExit && <ExitButton onExit={onExit} />}
      <div className="absolute inset-0 overflow-hidden gameplay-container">
      <StarfieldBackground />
      <motion.div
        className="relative z-10 flex flex-col h-full"
        style={{ padding: '8px 12px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* BATTLESHIP Header */}
        <div className="text-center" style={{ paddingTop: '4px', paddingBottom: '4px' }}>
          <h1
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#3969CA',
              fontSize: '28px',
              textShadow: '0 0 30px rgba(57, 105, 202, 0.6), 3px 3px 0 #1a3a7a',
              letterSpacing: '8px',
            }}
          >
            BATTLESHIP
          </h1>
        </div>

        {/* Grids + center ship trackers */}
        <div className="flex-1 flex items-start justify-center" style={{ gap: '16px', paddingTop: '4px' }}>
          {/* Player side (left) — grid + avatar underneath */}
          <div className="flex flex-col" style={{ position: 'relative' }}>
            <GameGrid
              board={playerBoard}
              borderColor="#3969CA"
              isEnemy={false}
              isBeingAttacked={!isPlayerTurn}
              gridRef={playerGridRef}
              placedShips={playerShips}
            />
            {/* Grid callout over player grid (Eng hitting Sales) — NBA Jam style */}
            <AnimatePresence>
              {gridCallout && gridCallout.side === 'player' && (
                <motion.div
                  key={gridCallout.key}
                  className="absolute pointer-events-none flex items-center justify-center"
                  style={{ top: '5%', left: '-10%', right: '-10%', bottom: '10%', zIndex: 55 }}
                  initial={{ scale: 0, opacity: 0, rotate: -8 }}
                  animate={{
                    scale: [0, 1.3, 1.15],
                    opacity: [0, 1, 1],
                    rotate: [-8, -5, -3],
                  }}
                  exit={{ scale: 2, opacity: 0, rotate: 5 }}
                  transition={{ duration: 0.5, times: [0, 0.6, 1], ease: 'easeOut' }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <motion.div
                      animate={{
                        textShadow: [
                          '0 0 30px rgba(255, 68, 68, 1), 4px 4px 0 #500, -2px -2px 0 #a00, 0 0 80px rgba(255,0,0,0.6)',
                          '0 0 50px rgba(255, 68, 68, 1), 4px 4px 0 #500, -2px -2px 0 #a00, 0 0 120px rgba(255,0,0,0.8)',
                          '0 0 30px rgba(255, 68, 68, 1), 4px 4px 0 #500, -2px -2px 0 #a00, 0 0 80px rgba(255,0,0,0.6)',
                        ],
                        scale: [1, 1.08, 1],
                      }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        fontFamily: '"Press Start 2P", cursive',
                        fontSize: '36px',
                        color: '#ff4444',
                        letterSpacing: '3px',
                        WebkitTextStroke: '1px #800',
                        filter: 'drop-shadow(0 0 20px rgba(255,0,0,0.7))',
                      }}
                    >
                      {gridCallout.bigText}
                    </motion.div>
                    {gridCallout.smallText && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        style={{
                          fontFamily: '"Press Start 2P", cursive',
                          fontSize: '16px',
                          color: '#ff6666',
                          textShadow: '0 0 20px rgba(255, 68, 68, 0.8), 2px 2px 0 #500',
                          marginTop: '10px',
                          letterSpacing: '2px',
                        }}
                      >
                        {gridCallout.smallText}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Player avatar + status text directly under grid */}
            <div className="flex items-start" style={{ marginTop: '8px', gap: '10px' }}>
              <motion.div
                animate={shakePlayer ? { x: [0, -4, 4, -3, 3, -1, 1, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  width: `${photoSize}px`,
                  height: `${photoSize}px`,
                  borderRadius: '10px',
                  border: `3px solid ${isPlayerTurn ? '#3969CA' : 'rgba(57,105,202,0.3)'}`,
                  overflow: 'hidden',
                  boxShadow: isPlayerTurn ? '0 0 20px rgba(57,105,202,0.6)' : 'none',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                  flexShrink: 0,
                }}
              >
                {playerCharacter.portrait ? (
                  <img src={playerCharacter.portrait} alt={playerCharacter.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                ) : (
                  <div className="flex items-center justify-center" style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(57,105,202,0.4), rgba(57,105,202,0.15))', fontSize: '48px' }}>
                    {String.fromCodePoint(0x1F3AF)}
                  </div>
                )}
              </motion.div>
              {/* Status text to the right of player avatar */}
              <AnimatePresence mode="wait">
                {statusText && (statusSide === 'player' || statusSide === 'both') && (
                  <motion.div
                    key={statusText + '-player'}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    style={{ pointerEvents: 'none' }}
                  >
                    <span style={{
                      fontFamily: '"Press Start 2P", cursive',
                      fontSize: '12px',
                      color: statusColor,
                      textShadow: `0 0 15px ${statusColor}88, 0 0 30px ${statusColor}44`,
                      background: 'rgba(0,0,0,0.6)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                    }}>
                      {statusText}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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

            {/* Missile stream removed from center — now rendered as full-width overlay */}
          </div>

          {/* AI side (right) — grid + avatar underneath */}
          <div className="flex flex-col" style={{ position: 'relative' }}>
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
            {/* Grid callout over AI grid (Sales hitting Eng) — NBA Jam style */}
            <AnimatePresence>
              {gridCallout && gridCallout.side === 'ai' && (
                <motion.div
                  key={gridCallout.key}
                  className="absolute pointer-events-none flex items-center justify-center"
                  style={{ top: '5%', left: '-10%', right: '-10%', bottom: '10%', zIndex: 55 }}
                  initial={{ scale: 0, opacity: 0, rotate: 6 }}
                  animate={{
                    scale: [0, 1.3, 1.15],
                    opacity: [0, 1, 1],
                    rotate: [6, 4, 3],
                  }}
                  exit={{ scale: 2, opacity: 0, rotate: -5 }}
                  transition={{ duration: 0.5, times: [0, 0.6, 1], ease: 'easeOut' }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <motion.div
                      animate={{
                        textShadow: [
                          '0 0 30px rgba(255, 215, 0, 1), 4px 4px 0 #8B0000, -2px -2px 0 #cc8800, 0 0 80px rgba(255,200,0,0.6)',
                          '0 0 50px rgba(255, 215, 0, 1), 4px 4px 0 #8B0000, -2px -2px 0 #cc8800, 0 0 120px rgba(255,200,0,0.8)',
                          '0 0 30px rgba(255, 215, 0, 1), 4px 4px 0 #8B0000, -2px -2px 0 #cc8800, 0 0 80px rgba(255,200,0,0.6)',
                        ],
                        scale: [1, 1.08, 1],
                      }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        fontFamily: '"Press Start 2P", cursive',
                        fontSize: '36px',
                        color: '#FFD700',
                        letterSpacing: '3px',
                        WebkitTextStroke: '1px #8B6914',
                        filter: 'drop-shadow(0 0 20px rgba(255,200,0,0.7))',
                      }}
                    >
                      {gridCallout.bigText}
                    </motion.div>
                    {gridCallout.smallText && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        style={{
                          fontFamily: '"Press Start 2P", cursive',
                          fontSize: '16px',
                          color: '#FFE44D',
                          textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 2px 2px 0 #8B6914',
                          marginTop: '10px',
                          letterSpacing: '2px',
                        }}
                      >
                        {gridCallout.smallText}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI avatar + status text directly under grid */}
            <div className="flex items-start justify-end" style={{ marginTop: '8px', gap: '10px' }}>
              {/* Status text to the left of AI avatar */}
              <AnimatePresence mode="wait">
                {statusText && (statusSide === 'ai' || statusSide === 'both') && (
                  <motion.div
                    key={statusText + '-ai'}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    style={{ pointerEvents: 'none' }}
                  >
                    <span style={{
                      fontFamily: '"Press Start 2P", cursive',
                      fontSize: '12px',
                      color: statusColor,
                      textShadow: `0 0 15px ${statusColor}88, 0 0 30px ${statusColor}44`,
                      background: 'rgba(0,0,0,0.6)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                    }}>
                      {statusText}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                animate={shakeAI ? { x: [0, -4, 4, -3, 3, -1, 1, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  width: `${photoSize}px`,
                  height: `${photoSize}px`,
                  borderRadius: '10px',
                  border: `3px solid ${!isPlayerTurn ? '#21C19A' : 'rgba(33,193,154,0.3)'}`,
                  overflow: 'hidden',
                  boxShadow: !isPlayerTurn ? '0 0 20px rgba(33,193,154,0.6)' : 'none',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                  flexShrink: 0,
                }}
              >
                {aiCharacter.portrait ? (
                  <img src={aiCharacter.portrait} alt={aiCharacter.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                ) : (
                  <div className="flex items-center justify-center" style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(33,193,154,0.4), rgba(33,193,154,0.15))', fontSize: '48px' }}>
                    {String.fromCodePoint(0x1F4BB)}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

      </motion.div>
      </div>
    </ArcadeCanvas>
  );
}

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Ship, PlacedShip, Board, BoardCell, Orientation } from '../types';
import { ships } from '../data/ships';
import StarfieldBackground from './StarfieldBackground';
import ArcadeCanvas from './ArcadeCanvas';

interface Props {
  onReady: (board: Board, placedShips: PlacedShip[]) => void;
}

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function createEmptyBoard(): Board {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, (): BoardCell => ({ state: 'empty' }))
  );
}

export default function PlaceFleet({ onReady }: Props) {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(ships[0]);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hoverCells, setHoverCells] = useState<[number, number][]>([]);
  const [invalidHoverCells, setInvalidHoverCells] = useState<[number, number][]>([]);

  const [showReadyPopup, setShowReadyPopup] = useState(false);
  const placedShipIds = placedShips.map((s) => s.shipId);
  const allPlaced = placedShipIds.length === ships.length;
  const prevAllPlacedRef = useRef(false);

  const getCells = useCallback(
    (row: number, col: number, ship: Ship, dir: Orientation): [number, number][] | null => {
      const cells: [number, number][] = [];
      for (let i = 0; i < ship.size; i++) {
        const r = dir === 'horizontal' ? row : row + i;
        const c = dir === 'horizontal' ? col + i : col;
        if (r >= 10 || c >= 10) return null;
        if (board[r][c].state === 'ship') return null;
        cells.push([r, c]);
      }
      return cells;
    },
    [board]
  );

  // Get partial cells that fit on the grid (for red invalid highlight)
  const getPartialCells = useCallback(
    (row: number, col: number, ship: Ship, dir: Orientation): [number, number][] => {
      const cells: [number, number][] = [];
      for (let i = 0; i < ship.size; i++) {
        const r = dir === 'horizontal' ? row : row + i;
        const c = dir === 'horizontal' ? col + i : col;
        if (r >= 10 || c >= 10) break;
        cells.push([r, c]);
      }
      return cells;
    },
    []
  );

  const handleCellHover = useCallback(
    (row: number, col: number) => {
      if (!selectedShip) {
        setHoverCells([]);
        setInvalidHoverCells([]);
        return;
      }
      const cells = getCells(row, col, selectedShip, orientation);
      if (cells) {
        // Valid placement — show green
        setHoverCells(cells);
        setInvalidHoverCells([]);
      } else {
        // Invalid placement — show red for partial cells that fit on grid
        setHoverCells([]);
        const partial = getPartialCells(row, col, selectedShip, orientation)
          .filter(([r, c]) => board[r][c].state !== 'ship');
        setInvalidHoverCells(partial);
      }
    },
    [selectedShip, orientation, getCells, getPartialCells, board]
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!selectedShip) return;
      const cells = getCells(row, col, selectedShip, orientation);
      if (!cells) return;

      const newBoard = board.map((r) => r.map((c) => ({ ...c })));
      for (const [r, c] of cells) {
        newBoard[r][c] = { state: 'ship', shipId: selectedShip.id };
      }
      setBoard(newBoard);
      const newPlaced = [...placedShips, { shipId: selectedShip.id, cells, sunk: false }];
      setPlacedShips(newPlaced);
      setHoverCells([]);
      setInvalidHoverCells([]);
      // Auto-advance to next unplaced ship
      const newPlacedIds = newPlaced.map((s) => s.shipId);
      const nextShip = ships.find((s) => !newPlacedIds.includes(s.id)) ?? null;
      setSelectedShip(nextShip);
    },
    [selectedShip, orientation, board, placedShips, getCells]
  );

  // Auto-show READY FOR BATTLE? popup when last ship is placed
  useEffect(() => {
    if (allPlaced && !prevAllPlacedRef.current) {
      setShowReadyPopup(true);
    }
    prevAllPlacedRef.current = allPlaced;
  }, [allPlaced]);

  const handleReset = () => {
    setBoard(createEmptyBoard());
    setPlacedShips([]);
    setSelectedShip(ships[0]);
    setHoverCells([]);
    setInvalidHoverCells([]);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setOrientation((o) => (o === 'horizontal' ? 'vertical' : 'horizontal'));
      }
    },
    []
  );

  const isHovered = (row: number, col: number) =>
    hoverCells.some(([r, c]) => r === row && c === col);
  const isInvalidHover = (row: number, col: number) =>
    invalidHoverCells.some(([r, c]) => r === row && c === col);

  const CELL = 48;
  const LABEL_W = 30;

  return (
    <ArcadeCanvas>
      <div className="absolute inset-0 overflow-hidden" onKeyDown={handleKeyDown} tabIndex={0}>
      <StarfieldBackground />
      <motion.div
        className="relative z-10 flex flex-col h-full"
        style={{ padding: '20px 32px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Title */}
        <h1
          className="tracking-wider text-center"
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#FFD700',
            fontSize: '22px',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 2px 2px 0 #8B6914',
            marginBottom: '20px',
          }}
        >
          PLACE YOUR FLEET
        </h1>

        {/* Side-by-side layout: grid on left, panel on right */}
        <div className="flex-1 flex items-start justify-center" style={{ gap: '40px' }}>

          {/* Left side — Grid (positioned like gameplay) */}
          <div className="flex flex-col items-center">
            <div>
              {/* Column headers */}
              <div className="flex">
                <div style={{ width: `${LABEL_W}px` }} />
                {COLS.map((col) => (
                  <div
                    key={col}
                    className="text-center"
                    style={{
                      width: `${CELL}px`,
                      fontFamily: '"Press Start 2P", cursive',
                      color: '#00e5ff',
                      fontSize: '9px',
                      paddingBottom: '4px',
                    }}
                  >
                    {col}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {Array.from({ length: 10 }, (_, row) => (
                <div key={row} className="flex">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: `${LABEL_W}px`,
                      fontFamily: '"Press Start 2P", cursive',
                      color: '#00e5ff',
                      fontSize: '9px',
                    }}
                  >
                    {row + 1}
                  </div>
                  {Array.from({ length: 10 }, (_, col) => {
                    const cell = board[row][col];
                    const hover = isHovered(row, col);
                    const invalid = isInvalidHover(row, col);
                    const isShip = cell.state === 'ship';

                    return (
                      <div
                        key={col}
                        className="cursor-pointer transition-all flex items-center justify-center"
                        style={{
                          width: `${CELL}px`,
                          height: `${CELL}px`,
                          border: '1px solid rgba(0, 229, 255, 0.3)',
                          background: isShip
                            ? 'rgba(0, 255, 100, 0.4)'
                            : hover
                              ? 'rgba(0, 255, 100, 0.25)'
                              : invalid
                                ? 'rgba(255, 60, 60, 0.3)'
                                : 'rgba(0, 229, 255, 0.05)',
                          boxShadow: isShip
                            ? '0 0 8px rgba(0, 255, 100, 0.5)'
                            : hover
                              ? '0 0 5px rgba(0, 255, 100, 0.3)'
                              : invalid
                                ? '0 0 5px rgba(255, 60, 60, 0.3)'
                                : 'none',
                        }}
                        onMouseEnter={() => handleCellHover(row, col)}
                        onMouseLeave={() => { setHoverCells([]); setInvalidHoverCells([]); }}
                        onClick={() => handleCellClick(row, col)}
                      >
                        {isShip && (
                          <div style={{ width: '60%', height: '60%', background: 'rgba(0, 255, 100, 0.6)', borderRadius: '2px', border: '1px solid rgba(0, 255, 100, 0.8)' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right panel — ship dock, instructions, controls */}
          <div className="flex flex-col" style={{ width: '320px', paddingTop: '20px' }}>
            {/* Ship dock */}
            <div className="flex flex-col" style={{ gap: '6px', marginBottom: '20px' }}>
              {ships.map((ship) => {
                const isPlaced = placedShipIds.includes(ship.id);
                const isSelected = selectedShip?.id === ship.id;
                return (
                  <button
                    key={ship.id}
                    onClick={() => {
                      if (!isPlaced) setSelectedShip(ship);
                    }}
                    disabled={isPlaced}
                    className="cursor-pointer transition-all flex items-center"
                    style={{
                      fontFamily: '"Press Start 2P", cursive',
                      fontSize: '8px',
                      color: isPlaced ? '#555' : isSelected ? '#FFD700' : '#00e5ff',
                      background: isSelected ? 'rgba(255, 215, 0, 0.15)' : 'rgba(0, 229, 255, 0.08)',
                      border: `2px solid ${isPlaced ? '#333' : isSelected ? '#FFD700' : 'rgba(0, 229, 255, 0.4)'}`,
                      opacity: isPlaced ? 0.4 : 1,
                      borderRadius: '4px',
                      padding: '8px 12px',
                      gap: '10px',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {Array.from({ length: ship.size }, (_, i) => (
                        <div key={i} style={{ width: '10px', height: '10px', background: isPlaced ? '#555' : isSelected ? '#FFD700' : '#00e5ff', borderRadius: '2px', opacity: isPlaced ? 0.4 : 0.8 }} />
                      ))}
                    </div>
                    <span>{ship.name}</span>
                    <span style={{ color: '#888', marginLeft: 'auto' }}>({ship.size})</span>
                  </button>
                );
              })}
            </div>

            {/* Orientation toggle */}
            <div className="flex items-center" style={{ gap: '10px', marginBottom: '16px' }}>
              <span
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  color: '#FFD700',
                  fontSize: '10px',
                }}
              >
                {orientation.toUpperCase()}
              </span>
              <button
                onClick={() => setOrientation((o) => (o === 'horizontal' ? 'vertical' : 'horizontal'))}
                className="cursor-pointer hover:scale-105 transition-transform"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '9px',
                  color: '#FFD700',
                  background: 'rgba(255, 215, 0, 0.15)',
                  border: '2px solid #FFD700',
                  borderRadius: '4px',
                  textShadow: '0 0 8px rgba(255, 215, 0, 0.4)',
                  padding: '6px 14px',
                }}
              >
                ROTATE (R)
              </button>
            </div>

            {/* Instructions */}
            <div
              style={{
                fontFamily: '"Press Start 2P", cursive',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '7px',
                lineHeight: '2',
                marginBottom: '24px',
              }}
            >
              Click to place. Press R to rotate.
            </div>

            {/* Buttons */}
            <div className="flex" style={{ gap: '12px' }}>
              <button
                onClick={handleReset}
                className="tracking-wider cursor-pointer hover:scale-105 transition-all"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '11px',
                  color: '#3969CA',
                  backgroundColor: 'rgba(57, 105, 202, 0.1)',
                  border: '3px solid #3969CA',
                  borderRadius: '2px',
                  padding: '12px 20px',
                }}
              >
                RESET
              </button>
              <button
                onClick={() => {
                  if (allPlaced) setShowReadyPopup(true);
                }}
                disabled={!allPlaced}
                className="tracking-wider cursor-pointer transition-all hover:scale-105"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '11px',
                  color: allPlaced ? '#FFD700' : '#555',
                  backgroundColor: allPlaced ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                  border: `3px solid ${allPlaced ? '#FFD700' : '#333'}`,
                  borderRadius: '2px',
                  opacity: allPlaced ? 1 : 0.5,
                  textShadow: allPlaced ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
                  padding: '12px 20px',
                }}
              >
                BATTLE
              </button>
            </div>
          </div>
        </div>

        {/* READY FOR BATTLE? popup */}
        <AnimatePresence>
          {showReadyPopup && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ background: 'rgba(0, 0, 0, 0.75)' }}
            >
              <motion.div
                className="flex flex-col items-center gap-8"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.4 }}
              >
                <motion.h2
                  style={{
                    fontFamily: '"Press Start 2P", cursive',
                    color: '#FFD700',
                    fontSize: '32px',
                    textShadow: '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)',
                    textAlign: 'center',
                  }}
                  animate={{
                    textShadow: [
                      '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)',
                      '0 0 50px rgba(255, 215, 0, 1), 0 0 100px rgba(255, 215, 0, 0.6)',
                      '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  READY FOR BATTLE?
                </motion.h2>
                <div className="flex gap-6">
                  <button
                    onClick={() => onReady(board, placedShips)}
                    className="text-sm tracking-wider cursor-pointer transition-transform duration-200 hover:scale-[1.08] active:scale-95"
                    style={{
                      fontFamily: '"Press Start 2P", cursive',
                      color: '#FFD700',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '3px solid #FFD700',
                      textShadow: '0 0 15px rgba(255, 215, 0, 0.6)',
                      boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                      padding: '12px 24px',
                    }}
                  >
                    YES
                  </button>
                  <button
                    onClick={() => setShowReadyPopup(false)}
                    className="text-sm tracking-wider cursor-pointer transition-transform duration-200 hover:scale-[1.08] active:scale-95"
                    style={{
                      fontFamily: '"Press Start 2P", cursive',
                      color: '#9B8FB8',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '3px solid #9B8FB8',
                      padding: '12px 24px',
                    }}
                  >
                    NO
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </div>
    </ArcadeCanvas>
  );
}

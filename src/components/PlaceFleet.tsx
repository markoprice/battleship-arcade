import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Ship, PlacedShip, Board, BoardCell, Orientation } from '../types';
import { ships } from '../data/ships';
import StarfieldBackground from './StarfieldBackground';

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

  const placedShipIds = placedShips.map((s) => s.shipId);
  const allPlaced = placedShipIds.length === ships.length;

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

  const handleCellHover = useCallback(
    (row: number, col: number) => {
      if (!selectedShip) {
        setHoverCells([]);
        return;
      }
      const cells = getCells(row, col, selectedShip, orientation);
      setHoverCells(cells ?? []);
    },
    [selectedShip, orientation, getCells]
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
      // Auto-advance to next unplaced ship
      const newPlacedIds = newPlaced.map((s) => s.shipId);
      const nextShip = ships.find((s) => !newPlacedIds.includes(s.id)) ?? null;
      setSelectedShip(nextShip);
    },
    [selectedShip, orientation, board, placedShips, getCells]
  );

  const handleReset = () => {
    setBoard(createEmptyBoard());
    setPlacedShips([]);
    setSelectedShip(ships[0]);
    setHoverCells([]);
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

  return (
    <div className="fixed inset-0 overflow-hidden" onKeyDown={handleKeyDown} tabIndex={0}>
      <StarfieldBackground />
      <motion.div
        className="relative z-10 flex flex-col h-full p-4 items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Title */}
        <h1
          className="text-xl md:text-2xl tracking-wider mb-6 pt-4"
          style={{
            fontFamily: '"Press Start 2P", cursive',
            color: '#FFD700',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 2px 2px 0 #8B6914',
          }}
        >
          PLACE YOUR FLEET
        </h1>

        {/* Ship Dock */}
        <div className="flex gap-2 mb-6 flex-wrap justify-center">
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
                className="px-3 py-2 text-center cursor-pointer transition-all"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '7px',
                  color: isPlaced ? '#555' : isSelected ? '#FFD700' : '#00e5ff',
                  background: isSelected ? 'rgba(255, 215, 0, 0.15)' : 'rgba(0, 229, 255, 0.1)',
                  border: `2px solid ${isPlaced ? '#333' : isSelected ? '#FFD700' : '#00e5ff'}`,
                  opacity: isPlaced ? 0.4 : 1,
                  borderRadius: '4px',
                  minWidth: '100px',
                }}
              >
                <div className="text-lg mb-1" style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                  {Array.from({ length: ship.size }, (_, i) => (
                    <div key={i} style={{ width: '8px', height: '8px', background: isPlaced ? '#555' : isSelected ? '#FFD700' : '#00e5ff', borderRadius: '1px', opacity: isPlaced ? 0.4 : 0.8 }} />
                  ))}
                </div>
                <div>{ship.name}</div>
                <div className="mt-1" style={{ color: '#888' }}>
                  ({ship.size} cells)
                </div>
              </button>
            );
          })}
        </div>

        {/* Orientation toggle */}
        <div className="mb-4 flex items-center gap-3">
          <span
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#00e5ff',
              fontSize: '7px',
            }}
          >
            DIRECTION: {orientation.toUpperCase()}
          </span>
          <button
            onClick={() => setOrientation((o) => (o === 'horizontal' ? 'vertical' : 'horizontal'))}
            className="px-3 py-1 cursor-pointer"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              fontSize: '6px',
              color: '#FFD700',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid #FFD700',
              borderRadius: '2px',
            }}
          >
            ROTATE (R)
          </button>
        </div>

        {/* Grid */}
        <div className="flex flex-col items-center justify-center overflow-auto">
          <div>
            {/* Column headers */}
            <div className="flex">
              <div style={{ width: 'clamp(24px, 3.5vw, 40px)' }} />
              {COLS.map((col) => (
                <div
                  key={col}
                  className="text-center"
                  style={{
                    width: 'clamp(32px, 5vw, 56px)',
                    fontFamily: '"Press Start 2P", cursive',
                    color: '#00e5ff',
                    fontSize: 'clamp(7px, 1vw, 11px)',
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
                    width: 'clamp(24px, 3.5vw, 40px)',
                    fontFamily: '"Press Start 2P", cursive',
                    color: '#00e5ff',
                    fontSize: 'clamp(7px, 1vw, 11px)',
                  }}
                >
                  {row + 1}
                </div>
                {Array.from({ length: 10 }, (_, col) => {
                  const cell = board[row][col];
                  const hover = isHovered(row, col);
                  const isShip = cell.state === 'ship';

                  return (
                    <div
                      key={col}
                      className="cursor-pointer transition-all"
                      style={{
                        width: 'clamp(32px, 5vw, 56px)',
                        height: 'clamp(32px, 5vw, 56px)',
                        border: '1px solid rgba(0, 229, 255, 0.3)',
                        background: isShip
                          ? 'rgba(0, 255, 100, 0.4)'
                          : hover
                            ? 'rgba(0, 255, 100, 0.25)'
                            : 'rgba(0, 229, 255, 0.05)',
                        boxShadow: isShip
                          ? '0 0 8px rgba(0, 255, 100, 0.5)'
                          : hover
                            ? '0 0 5px rgba(0, 255, 100, 0.3)'
                            : 'none',
                      }}
                      onMouseEnter={() => handleCellHover(row, col)}
                      onMouseLeave={() => setHoverCells([])}
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

        {/* Buttons */}
        <div className="flex gap-8 mt-8 pb-6">
          <button
            onClick={handleReset}
            className="px-8 py-4 text-sm tracking-wider cursor-pointer hover:scale-105 transition-all"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: '#3969CA',
              backgroundColor: 'rgba(57, 105, 202, 0.1)',
              border: '3px solid #3969CA',
              borderRadius: '2px',
            }}
          >
            RESET
          </button>
          <button
            onClick={() => {
              if (allPlaced) onReady(board, placedShips);
            }}
            disabled={!allPlaced}
            className="px-8 py-4 text-sm tracking-wider cursor-pointer transition-all hover:scale-105"
            style={{
              fontFamily: '"Press Start 2P", cursive',
              color: allPlaced ? '#FFD700' : '#555',
              backgroundColor: allPlaced ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
              border: `3px solid ${allPlaced ? '#FFD700' : '#333'}`,
              borderRadius: '2px',
              opacity: allPlaced ? 1 : 0.5,
              textShadow: allPlaced ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
            }}
          >
            START
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import { useState, useCallback, useRef } from 'react';
import type { GameScreen, Character, PlacedShip, Board, BoardCell, AIState } from '../types';
import { ships } from '../data/ships';

function createEmptyBoard(): Board {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, (): BoardCell => ({ state: 'empty' }))
  );
}

function placeAIShips(): { board: Board; ships: PlacedShip[] } {
  const board = createEmptyBoard();
  const placedShips: PlacedShip[] = [];

  for (const ship of ships) {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() > 0.5;
      const row = Math.floor(Math.random() * 10);
      const col = Math.floor(Math.random() * 10);

      if (horizontal && col + ship.size > 10) continue;
      if (!horizontal && row + ship.size > 10) continue;

      const cells: [number, number][] = [];
      let valid = true;
      for (let i = 0; i < ship.size; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;
        if (board[r][c].state !== 'empty') {
          valid = false;
          break;
        }
        cells.push([r, c]);
      }

      if (valid) {
        for (const [r, c] of cells) {
          board[r][c] = { state: 'ship', shipId: ship.id };
        }
        placedShips.push({ shipId: ship.id, cells, sunk: false });
        placed = true;
      }
    }
  }

  return { board, ships: placedShips };
}

const NBA_JAM_CALLOUTS = [
  'BOOMSHAKALAKA!',
  "HE'S ON FIRE!",
  'FROM DOWNTOWN!',
  'IS IT THE SHOES?',
  "CAN'T BUY A BUCKET!",
  'MONSTER JAM!',
  'THE NAIL IN THE COFFIN!',
];

export function useGameState() {
  const [screen, setScreen] = useState<GameScreen>('home');
  const [playerCharacter, setPlayerCharacter] = useState<Character | null>(null);
  const [aiCharacter, setAICharacter] = useState<Character | null>(null);
  const [playerBoard, setPlayerBoard] = useState<Board>(createEmptyBoard);
  const [aiBoard, setAIBoard] = useState<Board>(createEmptyBoard);
  const [playerShips, setPlayerShips] = useState<PlacedShip[]>([]);
  const [aiShips, setAIShips] = useState<PlacedShip[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [calloutText, setCalloutText] = useState('');
  const [consecutiveHits, setConsecutiveHits] = useState(0);
  const [aiState, setAIState] = useState<AIState>({
    mode: 'hunt',
    hitStack: [],
    triedDirections: new Map(),
  });

  const initGame = useCallback(() => {
    const ai = placeAIShips();
    setAIBoard(ai.board);
    setAIShips(ai.ships);
    setIsPlayerTurn(true);
    setCalloutText('');
    setConsecutiveHits(0);
    setAIState({ mode: 'hunt', hitStack: [], triedDirections: new Map() });
  }, []);

  const calloutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCallout = useCallback((text: string) => {
    if (calloutTimerRef.current !== null) {
      clearTimeout(calloutTimerRef.current);
    }
    setCalloutText(text);
    calloutTimerRef.current = setTimeout(() => {
      setCalloutText('');
      calloutTimerRef.current = null;
    }, 2000);
  }, []);

  const playerFire = useCallback(
    (row: number, col: number): 'hit' | 'miss' | 'already' | 'sunk' | 'win' => {
      const cell = aiBoard[row][col];
      if (cell.state === 'hit' || cell.state === 'miss') return 'already';

      const newBoard = aiBoard.map((r) => r.map((c) => ({ ...c })));

      if (cell.state === 'ship') {
        newBoard[row][col] = { state: 'hit', shipId: cell.shipId };
        setAIBoard(newBoard);

        const newHits = consecutiveHits + 1;
        setConsecutiveHits(newHits);

        // Check if ship sunk
        const shipId = cell.shipId!;
        const ship = aiShips.find((s) => s.shipId === shipId)!;
        const allHit = ship.cells.every(([r, c]) => {
          if (r === row && c === col) return true;
          return newBoard[r][c].state === 'hit';
        });

        if (allHit) {
          const newAIShips = aiShips.map((s) =>
            s.shipId === shipId ? { ...s, sunk: true } : s
          );
          setAIShips(newAIShips);

          // Check win
          if (newAIShips.every((s) => s.sunk)) {
            return 'win';
          }

          showCallout(NBA_JAM_CALLOUTS[Math.floor(Math.random() * NBA_JAM_CALLOUTS.length)]);
          return 'sunk';
        }

        if (newHits >= 3) {
          showCallout(NBA_JAM_CALLOUTS[Math.floor(Math.random() * NBA_JAM_CALLOUTS.length)]);
        }

        return 'hit';
      } else {
        newBoard[row][col] = { state: 'miss' };
        setAIBoard(newBoard);
        setConsecutiveHits(0);
        return 'miss';
      }
    },
    [aiBoard, aiShips, consecutiveHits, showCallout]
  );

  const aiFireOnce = useCallback((): {
    row: number;
    col: number;
    result: 'hit' | 'miss' | 'sunk' | 'lose';
  } => {
    const board = playerBoard;
    let row: number, col: number;
    const currentAIState = { ...aiState, hitStack: [...aiState.hitStack], triedDirections: new Map(Array.from(aiState.triedDirections.entries(), ([k, v]) => [k, new Set(v)])) };

    if (currentAIState.mode === 'target' && currentAIState.hitStack.length > 0) {
      // Target mode: try adjacent cells to hits
      let found = false;
      const directions: [number, number, string][] = [
        [-1, 0, 'up'],
        [1, 0, 'down'],
        [0, -1, 'left'],
        [0, 1, 'right'],
      ];

      while (currentAIState.hitStack.length > 0 && !found) {
        const [hr, hc] = currentAIState.hitStack[currentAIState.hitStack.length - 1];
        const key = `${hr},${hc}`;
        if (!currentAIState.triedDirections.has(key)) {
          currentAIState.triedDirections.set(key, new Set());
        }
        const tried = currentAIState.triedDirections.get(key)!;

        for (const [dr, dc, dir] of directions) {
          if (tried.has(dir)) continue;
          const nr = hr + dr;
          const nc = hc + dc;
          if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) {
            const cell = board[nr][nc];
            if (cell.state !== 'hit' && cell.state !== 'miss') {
              row = nr;
              col = nc;
              tried.add(dir);
              found = true;
              break;
            }
          }
          tried.add(dir);
        }

        if (!found) {
          currentAIState.hitStack.pop();
        }
      }

      if (!found) {
        currentAIState.mode = 'hunt';
      }
    }

    if (currentAIState.mode === 'hunt' || row! === undefined) {
      // Hunt mode: random shot
      const available: [number, number][] = [];
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          if (board[r][c].state !== 'hit' && board[r][c].state !== 'miss') {
            available.push([r, c]);
          }
        }
      }
      const pick = available[Math.floor(Math.random() * available.length)];
      row = pick[0];
      col = pick[1];
    }

    const newBoard = board.map((r) => r.map((c) => ({ ...c })));
    const cell = board[row!][col!];

    if (cell.state === 'ship') {
      newBoard[row!][col!] = { state: 'hit', shipId: cell.shipId };
      setPlayerBoard(newBoard);

      currentAIState.mode = 'target';
      currentAIState.hitStack.push([row!, col!]);

      // Check if ship sunk
      const shipId = cell.shipId!;
      const ship = playerShips.find((s) => s.shipId === shipId)!;
      const allHit = ship.cells.every(([r, c]) => {
        if (r === row! && c === col!) return true;
        return newBoard[r][c].state === 'hit';
      });

      if (allHit) {
        const newPlayerShips = playerShips.map((s) =>
          s.shipId === shipId ? { ...s, sunk: true } : s
        );
        setPlayerShips(newPlayerShips);

        // Remove sunk ship hits from stack
        currentAIState.hitStack = currentAIState.hitStack.filter(
          ([r, c]) => newBoard[r][c].shipId !== shipId
        );
        if (currentAIState.hitStack.length === 0) {
          currentAIState.mode = 'hunt';
        }

        setAIState(currentAIState);

        if (newPlayerShips.every((s) => s.sunk)) {
          return { row: row!, col: col!, result: 'lose' };
        }

        return { row: row!, col: col!, result: 'sunk' };
      }

      setAIState(currentAIState);
      return { row: row!, col: col!, result: 'hit' };
    } else {
      newBoard[row!][col!] = { state: 'miss' };
      setPlayerBoard(newBoard);
      setAIState(currentAIState);
      return { row: row!, col: col!, result: 'miss' };
    }
  }, [playerBoard, playerShips, aiState]);

  const resetGame = useCallback(() => {
    setScreen('home');
    setPlayerCharacter(null);
    setAICharacter(null);
    setPlayerBoard(createEmptyBoard());
    setAIBoard(createEmptyBoard());
    setPlayerShips([]);
    setAIShips([]);
    setIsPlayerTurn(true);
    setCalloutText('');
    setConsecutiveHits(0);
    setAIState({ mode: 'hunt', hitStack: [], triedDirections: new Map() });
  }, []);

  return {
    screen,
    setScreen,
    playerCharacter,
    setPlayerCharacter,
    aiCharacter,
    setAICharacter,
    playerBoard,
    setPlayerBoard,
    aiBoard,
    playerShips,
    setPlayerShips,
    aiShips,
    isPlayerTurn,
    setIsPlayerTurn,
    calloutText,
    initGame,
    playerFire,
    aiFireOnce,
    resetGame,
  };
}

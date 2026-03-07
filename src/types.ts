export type Team = 'sales' | 'product';

export interface CharacterStats {
  label: string;
  value: number; // 0–100
}

export interface Character {
  id: string;
  name: string;
  title: string;
  nickname: string;
  team: Team;
  stats: CharacterStats[];
}

export interface Ship {
  id: string;
  name: string;
  size: number;
}

export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export interface PlacedShip {
  shipId: string;
  cells: [number, number][];
  sunk: boolean;
}

export type BoardCell = {
  state: CellState;
  shipId?: string;
};

export type Board = BoardCell[][];

export type GameScreen =
  | 'home'
  | 'select'
  | 'commander'
  | 'place'
  | 'gameplay'
  | 'win'
  | 'lose';

export type Orientation = 'horizontal' | 'vertical';

export interface AIState {
  mode: 'hunt' | 'target';
  hitStack: [number, number][];
  triedDirections: Map<string, Set<string>>;
}

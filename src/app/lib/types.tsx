export type Player = 'player1' | 'player2';
export type PlayerChar = 'X' | 'O';

export interface Dot {
  row: number;
  col: number;
}

export interface Line {
  id: string;
  row: number;
  col: number;
  orientation: 'horizontal' | 'vertical';
  isDrawn: boolean;
  owner: Player | null;
}

export interface Box {
  id: string;
  row: number;
  col: number;
  owner: Player | null;
}

export interface GameState {
  lines: Line[];
  boxes: Box[];
  playerTurn: Player;
  playerChars: Record<Player, PlayerChar>;
  scores: Record<Player, number>;
  gridSize: { rows: number; cols: number };
}

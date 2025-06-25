// src/lib/gameLogic.ts

import { GameState, Line, Box, Player } from './types';

// Helper to generate a unique ID for a line
const getLineId = (row: number, col: number, orientation: 'horizontal' | 'vertical'): string =>
  `${orientation}-${row}-${col}`;

// Helper to generate a unique ID for a box
const getBoxId = (row: number, col: number): string => `b-${row}-${col}`;

/**
 * Initializes the game state for a given grid size.
 * @param numRows The number of dots vertically (e.g., 6 for 5x5 boxes)
 * @param numCols The number of dots horizontally (e.g., 6 for 5x5 boxes)
 */
export const initializeGame = (numRows: number, numCols: number): GameState => {
  const lines: Line[] = [];
  const boxes: Box[] = [];

  // Initialize horizontal lines
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols - 1; c++) {
      lines.push({
        id: getLineId(r, c, 'horizontal'),
        row: r,
        col: c,
        orientation: 'horizontal',
        isDrawn: false,
        owner: null,
      });
    }
  }

  // Initialize vertical lines
  for (let r = 0; r < numRows - 1; r++) {
    for (let c = 0; c < numCols; c++) {
      lines.push({
        id: getLineId(r, c, 'vertical'),
        row: r,
        col: c,
        orientation: 'vertical',
        isDrawn: false,
        owner: null,
      });
    }
  }

  // Initialize boxes (numBoxes = (numRows-1) x (numCols-1))
  for (let r = 0; r < numRows - 1; r++) {
    for (let c = 0; c < numCols - 1; c++) {
      boxes.push({
        id: getBoxId(r, c),
        row: r,
        col: c,
        owner: null,
      });
    }
  }

  return {
    lines,
    boxes,
    playerTurn: 'player1',
    playerChars: { player1: 'X', player2: 'O' },
    scores: { player1: 0, player2: 0 },
    gridSize: { rows: numRows, cols: numCols },
  };
};

/**
 * Checks if a proposed line move is valid.
 * A move is valid if the line exists and hasn't been drawn yet.
 */
export const isValidMove = (gameState: GameState, lineId: string): boolean => {
  const line = gameState.lines.find((l) => l.id === lineId);
  return line ? !line.isDrawn : false;
};

/**
 * Applies a move and updates the game state.
 * Returns the new game state and the IDs of any newly formed boxes.
 */
export const applyMove = (
  currentGameState: GameState,
  lineId: string,
  player: Player
): { newState: GameState; boxesFormed: string[] } => {
  // Deep clone the state to ensure immutability
  const newState = JSON.parse(JSON.stringify(currentGameState)) as GameState;
  const lineIndex = newState.lines.findIndex((l) => l.id === lineId);

  if (lineIndex === -1 || newState.lines[lineIndex].isDrawn) {
    return { newState: currentGameState, boxesFormed: [] }; // Invalid move, return original state
  }

  newState.lines[lineIndex].isDrawn = true;
  newState.lines[lineIndex].owner = player; // Mark who drew the line

  const newlyFormedBoxIds: string[] = [];

  // Check for newly formed boxes
  for (const box of newState.boxes) {
    if (box.owner === null) {
      // Check if this box is now complete
      const top = newState.lines.find(
        (l) => l.orientation === 'horizontal' && l.row === box.row && l.col === box.col
      );
      const bottom = newState.lines.find(
        (l) => l.orientation === 'horizontal' && l.row === box.row + 1 && l.col === box.col
      );
      const left = newState.lines.find(
        (l) => l.orientation === 'vertical' && l.row === box.row && l.col === box.col
      );
      const right = newState.lines.find(
        (l) => l.orientation === 'vertical' && l.row === box.row && l.col === box.col + 1
      );

      if (top?.isDrawn && bottom?.isDrawn && left?.isDrawn && right?.isDrawn) {
        box.owner = player;
        newState.scores[player]++;
        newlyFormedBoxIds.push(box.id);
      }
    }
  }

  return { newState, boxesFormed: newlyFormedBoxIds };
};

/**
 * Checks if the game has ended (all lines are drawn).
 */
export const checkGameEnd = (gameState: GameState): boolean => {
  return gameState.lines.every((line) => line.isDrawn);
};

/**
 * Determines the winner of the game.
 */
export const getWinner = (gameState: GameState): Player | null => {
  if (!checkGameEnd(gameState)) {
    return null; // Game not over yet
  }

  if (gameState.scores.player1 > gameState.scores.player2) {
    return 'player1';
  } else if (gameState.scores.player2 > gameState.scores.player1) {
    return 'player2';
  } else {
    return null; // It's a draw
  }
};

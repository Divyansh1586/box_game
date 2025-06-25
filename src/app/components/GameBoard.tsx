// src/components/GameBoard.tsx
'use client'; // This is a client component

import React, { useState, useCallback, useMemo } from 'react';
import { GameState, Line, Player } from '../lib/types'; // Make sure Box and Player are imported as they are used for typing
import { initializeGame, applyMove, isValidMove, checkGameEnd, getWinner } from '../lib/gameLogic';

interface GameBoardProps {
  gridRows: number; // Number of dots vertically
  gridCols: number; // Number of dots horizontally
  // Removed dotSpacing, dotRadius, lineStrokeWidth as props here to simplify
  // and manage scaling internally with viewBox.
}

// Define fixed scaling constants for drawing within the SVG's viewBox
const UNIT_SPACING = 100; // Distance between dots in our internal SVG unit system
const UNIT_DOT_RADIUS = 5; // Radius of dots in our internal SVG unit system
const UNIT_LINE_STROKE_WIDTH = 8; // Width of lines in our internal SVG unit system

const GameBoard: React.FC<GameBoardProps> = ({
  gridRows,
  gridCols,
}) => {
  const initialGameState = useMemo(() => initializeGame(gridRows, gridCols), [gridRows, gridCols]);
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const { lines, boxes, playerTurn, playerChars, scores } = gameState;

  const handleLineClick = useCallback(
    (lineId: string) => {
      if (checkGameEnd(gameState)) return;

      const currentGameState = JSON.parse(JSON.stringify(gameState)) as GameState;

      if (isValidMove(currentGameState, lineId)) {
        const { newState, boxesFormed } = applyMove(currentGameState, lineId, playerTurn);

        setGameState(newState);

        if (boxesFormed.length === 0) {
          setGameState((prev) => ({
            ...prev,
            playerTurn: prev.playerTurn === 'player1' ? 'player2' : 'player1',
          }));
        }
      }
    },
    [gameState, playerTurn]
  );

  const isGameOver = checkGameEnd(gameState);
  const winner = isGameOver ? getWinner(gameState) : null;

  // Calculate SVG viewBox dimensions based on internal unit system
  // Add some padding around the grid for better visual spacing
  const viewBoxWidth = (gridCols - 1) * UNIT_SPACING + UNIT_DOT_RADIUS * 2 + UNIT_SPACING * 0.5; // Adjusted for padding
  const viewBoxHeight = (gridRows - 1) * UNIT_SPACING + UNIT_DOT_RADIUS * 2 + UNIT_SPACING * 0.5; // Adjusted for padding

  // Calculate dot positions relative to the internal unit system,
  // adjusted for padding.
  const dots = useMemo(() => {
    const d = [];
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        d.push({ row: r, col: c });
      }
    }
    return d;
  }, [gridRows, gridCols]);


  const getLineColor = (line: Line) => {
    if (line.isDrawn) {
      return line.owner === 'player1' ? 'stroke-red-500' : 'stroke-blue-500';
    }
    // Default color for undrawn lines, can be adjusted for better visibility
    return 'stroke-gray-300';
  }

  const getLineHoverColor = (line: Line) => {
    if (!line.isDrawn) {
      return playerTurn === 'player1' ? 'hover:stroke-red-400' : 'hover:stroke-blue-400';
    }
    return '';
  }


  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen w-full">
      <h1 className="text-4xl font-extrabold mb-6 text-gray-800">Dots and Boxes</h1>

      <div className="flex justify-around w-full max-w-lg mb-6 text-lg font-semibold">
        <div className={`p-3 rounded-lg ${playerTurn === 'player1' ? 'bg-red-200 text-red-800 border-2 border-red-500' : 'bg-gray-200 text-gray-700'}`}>
          Player 1 (X): <span className="font-bold">{scores.player1}</span>
        </div>
        <div className={`p-3 rounded-lg ${playerTurn === 'player2' ? 'bg-blue-200 text-blue-800 border-2 border-blue-500' : 'bg-gray-200 text-gray-700'}`}>
          Player 2 (O): <span className="font-bold">{scores.player2}</span>
        </div>
      </div>

      <div className="text-xl font-medium mb-4 text-gray-700">
        Current Turn: {isGameOver ? 'Game Over!' : playerTurn === 'player1' ? 'Player 1 (X)' : 'Player 2 (O)'}
      </div>

      {isGameOver && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg shadow-md text-center">
          <p className="text-2xl font-bold mb-2">
            {winner ? `${playerChars[winner]} Wins!` : `It's a Draw!`}
          </p>
          <button
            onClick={() => setGameState(initializeGame(gridRows, gridCols))}
            className="mt-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition duration-200"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Responsive SVG Container */}
      <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-2xl aspect-square flex items-center justify-center">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="xMidYMid meet" // Important for scaling
        >
          {/* Apply an offset to all drawn elements to account for padding/dot radius offset */}
          <g transform={`translate(${UNIT_DOT_RADIUS + UNIT_SPACING * 0.25}, ${UNIT_DOT_RADIUS + UNIT_SPACING * 0.25})`}>

            {/* Render Boxes (behind lines and dots) */}
            {boxes.map((box) => box.owner && (
              <text
                key={box.id}
                x={box.col * UNIT_SPACING + UNIT_SPACING / 2}
                y={box.row * UNIT_SPACING + UNIT_SPACING / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={`${UNIT_SPACING * 0.4}px`}
                fontWeight="bold"
                fill={box.owner === 'player1' ? 'rgb(239 68 68)' : 'rgb(59 130 246)'}
                className="select-none pointer-events-none"
              >
                {playerChars[box.owner as Player]} {/* Cast to Player as owner is guaranteed here */}
              </text>
            ))}

            {/* Render Lines */}
            {lines.map((line) => (
              <line
                key={line.id}
                x1={line.col * UNIT_SPACING}
                y1={line.row * UNIT_SPACING}
                x2={line.orientation === 'horizontal' ? (line.col + 1) * UNIT_SPACING : line.col * UNIT_SPACING}
                y2={line.orientation === 'vertical' ? (line.row + 1) * UNIT_SPACING : line.row * UNIT_SPACING}
                strokeWidth={UNIT_LINE_STROKE_WIDTH}
                className={`
                  ${getLineColor(line)}
                  ${getLineHoverColor(line)}
                  ${!line.isDrawn ? 'cursor-pointer' : 'cursor-not-allowed'}
                  transition-colors duration-100
                `}
                onClick={() => handleLineClick(line.id)}
              />
            ))}

            {/* Render Dots (on top) */}
            {dots.map((dot) => (
              <circle
                key={`dot-${dot.row}-${dot.col}`}
                cx={dot.col * UNIT_SPACING}
                cy={dot.row * UNIT_SPACING}
                r={UNIT_DOT_RADIUS}
                fill="black"
                className="select-none pointer-events-none"
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default GameBoard;

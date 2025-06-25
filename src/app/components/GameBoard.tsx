// src/components/GameBoard.tsx
'use client'; // This is a client component

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, Line, Box, Player, PlayerChar } from '../lib/types';
import { initializeGame, applyMove, isValidMove, checkGameEnd, getWinner } from '../lib/gameLogic';

interface GameBoardProps {
  gridRows: number; // Number of dots vertically
  gridCols: number; // Number of dots horizontally
  dotSpacing?: number; // Distance between dots in pixels
  dotRadius?: number; // Radius of the dots
  lineStrokeWidth?: number; // Width of the lines
}

const GameBoard: React.FC<GameBoardProps> = ({
  gridRows,
  gridCols,
  dotSpacing = 80,
  dotRadius = 4,
  lineStrokeWidth = 5,
}) => {
  const initialGameState = useMemo(() => initializeGame(gridRows, gridCols), [gridRows, gridCols]);
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const { lines, boxes, playerTurn, playerChars, scores } = gameState;

  const handleLineClick = useCallback(
    (lineId: string) => {
      if (checkGameEnd(gameState)) return; // No moves after game ends

      const currentGameState = JSON.parse(JSON.stringify(gameState)) as GameState; // Deep clone

      if (isValidMove(currentGameState, lineId)) {
        const { newState, boxesFormed } = applyMove(currentGameState, lineId, playerTurn);

        // Update state
        setGameState(newState);

        // If no boxes were formed, switch turn
        if (boxesFormed.length === 0) {
          setGameState((prev) => ({
            ...prev,
            playerTurn: prev.playerTurn === 'player1' ? 'player2' : 'player1',
          }));
        }
        // If boxesFormed > 0, the player gets another turn (state is already updated to current player's score)
      }
    },
    [gameState, playerTurn]
  ); // Depend on gameState and playerTurn

  const isGameOver = checkGameEnd(gameState);
  const winner = isGameOver ? getWinner(gameState) : null;

  // Calculate SVG dimensions
  const svgWidth = gridCols * dotSpacing;
  const svgHeight = gridRows * dotSpacing;

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
    return 'stroke-gray-300';
  }

  const getLineHoverColor = (line: Line) => {
    if (!line.isDrawn) {
      return playerTurn === 'player1' ? 'hover:stroke-red-400' : 'hover:stroke-blue-400';
    }
    return '';
  }


  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
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

      <div className="bg-white p-4 rounded-lg shadow-xl relative" style={{ width: svgWidth, height: svgHeight }}>
        <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          {/* Render Boxes (behind lines and dots) */}
          {boxes.map((box) => box.owner && (
            <text
              key={box.id}
              x={box.col * dotSpacing + dotSpacing / 2}
              y={box.row * dotSpacing + dotSpacing / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={`${dotSpacing * 0.4}px`} // Scale font size with dotSpacing
              fontWeight="bold"
              fill={box.owner === 'player1' ? 'rgb(239 68 68)' : 'rgb(59 130 246)'} // Tailwind red-500, blue-500
              className="select-none pointer-events-none" // Prevent text selection/interaction
            >
              {playerChars[box.owner]}
            </text>
          ))}

          {/* Render Lines */}
          {lines.map((line) => (
            <line
              key={line.id}
              x1={line.col * dotSpacing + dotRadius} // Adjust to start from dot edge
              y1={line.row * dotSpacing + dotRadius} // Adjust to start from dot edge
              x2={line.orientation === 'horizontal' ? (line.col + 1) * dotSpacing - dotRadius : line.col * dotSpacing + dotRadius}
              y2={line.orientation === 'vertical' ? (line.row + 1) * dotSpacing - dotRadius : line.row * dotSpacing + dotRadius}
              strokeWidth={lineStrokeWidth}
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
              cx={dot.col * dotSpacing + dotRadius}
              cy={dot.row * dotSpacing + dotRadius}
              r={dotRadius}
              fill="black"
              className="select-none pointer-events-none" // Ensure dots don't block clicks on lines
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default GameBoard;

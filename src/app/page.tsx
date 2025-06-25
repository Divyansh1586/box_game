// src/app/page.tsx

import GameBoard from './components/GameBoard';

export default function HomePage() {
  // Define grid dimensions (number of dots).
  // A 6x6 grid of dots will create 5x5 possible boxes.
  const numRowsOfDots = 6;
  const numColsOfDots = 6;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <GameBoard gridRows={numRowsOfDots} gridCols={numColsOfDots} />
    </main>
  );
}

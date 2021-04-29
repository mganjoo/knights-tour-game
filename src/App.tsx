import React, { useState } from "react"
import "./App.css"
import Board from "./Board"
import { Square } from "./ChessLogic"
import { Set as ImmutableSet } from "immutable"

const QUEEN_SQUARE: Square = "d5"
const STARTING_KNIGHT_SQUARE: Square = "h8"

const App: React.FC = () => {
  const [visitedSquares, setVisitedSquares] = useState<ImmutableSet<Square>>(
    ImmutableSet([STARTING_KNIGHT_SQUARE])
  )
  const handleMove = (start: Square, end: Square) => {
    setVisitedSquares(visitedSquares.add(end))
  }
  return (
    <main className="max-w-xl mx-auto py-6 px-4">
      <Board
        initialKnightSquare={STARTING_KNIGHT_SQUARE}
        queenSquare={QUEEN_SQUARE}
        checkedSquares={visitedSquares}
        onKnightMove={handleMove}
      />
    </main>
  )
}

export default App

import React, { useMemo, useState } from "react"
import "./App.css"
import Board from "./Board"
import * as cg from "chessground/types"
import {
  getPuzzleFen,
  getKnightDests,
  Square,
  validateKnightMove,
} from "./ChessLogic"

const QUEEN_SQUARE: Square = "d5"
const STARTING_KNIGHT_SQUARE: Square = "h8"

const App: React.FC = () => {
  const [knightSquare, setKnightSquare] = useState<Square>(
    STARTING_KNIGHT_SQUARE
  )
  const fen = useMemo<string | undefined>(
    () => getPuzzleFen(knightSquare, QUEEN_SQUARE),
    [knightSquare]
  )

  const handleMove: (orig: cg.Key, dest: cg.Key) => void = (orig, dest) => {
    if (validateKnightMove(orig as Square, dest as Square)) {
      setKnightSquare(dest as Square)
    }
  }

  return (
    <main className="max-w-xl mx-auto py-6 px-4">
      <Board
        fen={fen}
        validDests={getKnightDests(knightSquare, [QUEEN_SQUARE])}
        handleMove={handleMove}
      />
    </main>
  )
}

export default App

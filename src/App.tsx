import React from "react"
import "./App.css"
import Board from "./Board"
import { Square } from "./ChessLogic"

const QUEEN_SQUARE: Square = "d5"
const STARTING_KNIGHT_SQUARE: Square = "h8"

const App: React.FC = () => {
  return (
    <main className="max-w-xl mx-auto py-6 px-4">
      <Board
        initialKnightSquare={STARTING_KNIGHT_SQUARE}
        queenSquare={QUEEN_SQUARE}
      />
    </main>
  )
}

export default App

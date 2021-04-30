import React, { useState } from "react"
import "./App.css"
import Board from "./Board"
import {
  Square,
  getKnightDests,
  getSquareIncrement,
  attackedByQueen,
} from "./ChessLogic"
import { Set as ImmutableSet } from "immutable"

const QUEEN_SQUARE: Square = "d5"

function incrementWhileAttacked(
  square: Square,
  direction: "previous" | "next"
): Square {
  let finalSquare = square
  while (attackedByQueen(finalSquare, QUEEN_SQUARE)) {
    finalSquare = getSquareIncrement(finalSquare, direction)
  }
  return finalSquare
}

let STARTING_KNIGHT_SQUARE: Square = incrementWhileAttacked("h8", "previous")
let ENDING_KNIGHT_SQUARE: Square = incrementWhileAttacked("a1", "next")

const App: React.FC = () => {
  const [visitedSquares, setVisitedSquares] = useState<ImmutableSet<Square>>(
    ImmutableSet([STARTING_KNIGHT_SQUARE])
  )
  const [targetSquare, setTargetSquare] = useState<Square>(
    incrementWhileAttacked(
      getSquareIncrement(STARTING_KNIGHT_SQUARE, "previous"),
      "previous"
    )
  )
  const [completed, setCompleted] = useState(false)
  const handleMove = (square: Square) => {
    if (square === targetSquare) {
      setVisitedSquares(visitedSquares.add(square))
      if (targetSquare === ENDING_KNIGHT_SQUARE) {
        setCompleted(true)
      } else {
        setTargetSquare(
          incrementWhileAttacked(
            getSquareIncrement(targetSquare, "previous"),
            "previous"
          )
        )
      }
    }
  }
  return (
    <main>
      <div className="max-w-xl mx-auto py-6 px-4 bg-red-100">
        <Board
          initialKnightSquare={STARTING_KNIGHT_SQUARE}
          generateKnightMoves={(knightSquare) =>
            getKnightDests(knightSquare, { queenSquare: QUEEN_SQUARE })
          }
          queenSquare={QUEEN_SQUARE}
          visitedSquares={visitedSquares}
          targetSquare={targetSquare}
          onKnightMove={handleMove}
          completed={completed}
        />
      </div>
      <div>
        <div>
          <p>Next target: h2</p>
          <p>{0} moves</p>
          <p>00:00</p>
        </div>
      </div>
    </main>
  )
}

export default App

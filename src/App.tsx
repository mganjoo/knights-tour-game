import React, { useState } from "react"
import "./App.css"
import Board, { BoardState } from "./Board"
import { Square, getSquareIncrement, attackedByQueen } from "./ChessLogic"
import { Set as ImmutableSet } from "immutable"
import { useConditionalTimeout } from "beautiful-react-hooks"

const QUEEN_SQUARE: Square = "d5"

function incrementWhileAttacked(
  square: Square,
  direction: "previous" | "next"
): Square {
  let finalSquare = square
  while (
    attackedByQueen(finalSquare, QUEEN_SQUARE) ||
    finalSquare === QUEEN_SQUARE
  ) {
    finalSquare = getSquareIncrement(finalSquare, direction)
  }
  return finalSquare
}

let STARTING_KNIGHT_SQUARE: Square = incrementWhileAttacked("h8", "previous")
let ENDING_KNIGHT_SQUARE: Square = incrementWhileAttacked("a1", "next")

const App: React.FC = () => {
  const [state, setState] = useState<BoardState>("PLAYING")
  const [knightSquare, setKnightSquare] = useState<Square>(
    STARTING_KNIGHT_SQUARE
  )
  const [preAttackKnightSquare, setPreAttackKnightSquare] = useState<Square>()
  const [visitedSquares, setVisitedSquares] = useState<ImmutableSet<Square>>(
    ImmutableSet([STARTING_KNIGHT_SQUARE])
  )
  const [targetSquare, setTargetSquare] = useState<Square | undefined>(
    incrementWhileAttacked(
      getSquareIncrement(STARTING_KNIGHT_SQUARE, "previous"),
      "previous"
    )
  )
  const handleMove = (from: Square, to: Square) => {
    setKnightSquare(to)

    if (attackedByQueen(to, QUEEN_SQUARE)) {
      setState("KNIGHT_ATTACKED")
      setPreAttackKnightSquare(from)
    }

    // If we move to a new target, update visited + target squares
    if (to === targetSquare) {
      setVisitedSquares(visitedSquares.add(to))
      if (targetSquare === ENDING_KNIGHT_SQUARE) {
        setState("FINISHED")
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
  // If knight is attacked, reset to playing state after delay
  useConditionalTimeout(
    () => {
      if (preAttackKnightSquare) {
        setKnightSquare(preAttackKnightSquare)
      }
      setState("PLAYING")
    },
    300,
    state === "KNIGHT_ATTACKED"
  )

  return (
    <main>
      <div className="max-w-xl mx-auto py-6 px-4 bg-red-100">
        <Board
          state={state}
          knightSquare={knightSquare}
          queenSquare={QUEEN_SQUARE}
          visitedSquares={visitedSquares}
          targetSquare={targetSquare}
          onKnightMove={handleMove}
        />
      </div>
      <div>
        <div>
          <p>Next target: {targetSquare || "-"}</p>
          <p>{0} moves</p>
          <p>00:00</p>
        </div>
      </div>
    </main>
  )
}

export default App

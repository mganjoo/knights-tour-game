import React, { useState, useCallback } from "react"
import "./App.css"
import Board, { BoardState } from "./Board"
import { Square, getSquareIncrement, attackedByQueen } from "./ChessLogic"
import { Set as ImmutableSet } from "immutable"
import { useConditionalTimeout, useInterval } from "beautiful-react-hooks"
import Scoreboard from "./Scoreboard"

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

function formatSeconds(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = ("0" + (Math.floor(seconds / 60) % 60)).slice(-2)
  const s = ("0" + Math.floor(seconds % 60)).slice(-2)
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

const App: React.FC = () => {
  const [state, setState] = useState<BoardState>("NOT_STARTED")
  const [knightSquare, setKnightSquare] = useState<Square>(
    STARTING_KNIGHT_SQUARE
  )
  const [preAttackKnightSquare, setPreAttackKnightSquare] = useState<Square>()
  const [visitedSquares, setVisitedSquares] = useState<ImmutableSet<Square>>(
    ImmutableSet()
  )
  const [targetSquare, setTargetSquare] = useState<Square | undefined>(
    incrementWhileAttacked(
      getSquareIncrement(STARTING_KNIGHT_SQUARE, "previous"),
      "previous"
    )
  )
  const [elapsed, setElapsed] = useState(0)
  useInterval(() => {
    if (state === "PLAYING" || state === "KNIGHT_ATTACKED") {
      setElapsed((e) => e + 1)
    }
  }, 1000)
  const startGame = useCallback(() => {
    setState("PLAYING")
    setVisitedSquares(ImmutableSet([STARTING_KNIGHT_SQUARE]))
  }, [])
  const [numMoves, setNumMoves] = useState(0)
  const handleMove = useCallback(
    (from: Square, to: Square) => {
      setKnightSquare(to)
      setNumMoves((n) => n + 1)

      // If the knight is attacked, we will need to reset back to original square
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
    },
    [targetSquare, visitedSquares]
  )

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
    <main className="px-4 py-4 max-w-3xl mx-auto md:flex">
      <div className="md:w-2/3">
        <div>
          <Board
            state={state}
            knightSquare={knightSquare}
            queenSquare={QUEEN_SQUARE}
            visitedSquares={visitedSquares}
            targetSquare={targetSquare}
            onKnightMove={handleMove}
          />
        </div>
      </div>
      <div className="md:w-1/3">
        <div>
          <button onClick={startGame}>Start</button>
          <Scoreboard
            tickers={[
              { label: "Target", value: targetSquare || "-" },
              { label: "Moves", value: numMoves },
              { label: "Time", value: formatSeconds(elapsed) },
            ]}
          />
        </div>
      </div>
    </main>
  )
}

export default App

import React, { useState, useCallback } from "react"
import "./App.css"
import Board, { BoardState } from "./Board"
import { Square, getSquareIncrement, attackedByQueen } from "./ChessLogic"
import { Set as ImmutableSet } from "immutable"
import { useConditionalTimeout, useInterval } from "beautiful-react-hooks"
import Scoreboard from "./Scoreboard"
import { ChevronDoubleUpIcon } from "@heroicons/react/solid"

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
  const [targetSquare, setTargetSquare] = useState<Square>()
  const [elapsed, setElapsed] = useState(0)
  useInterval(() => {
    if (state === "PLAYING" || state === "KNIGHT_ATTACKED") {
      setElapsed((e) => e + 1)
    }
  }, 1000)
  const startGame = useCallback(() => {
    setState("PLAYING")
    setVisitedSquares(ImmutableSet([STARTING_KNIGHT_SQUARE]))
    setTargetSquare(
      incrementWhileAttacked(
        getSquareIncrement(STARTING_KNIGHT_SQUARE, "previous"),
        "previous"
      )
    )
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
          setTargetSquare(undefined)
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
    <main className="px-4 py-4 max-w-4xl mx-auto sm:px-8 sm:py-8 md:flex">
      <div className="md:w-2/3">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-center mt-4 mb-3">
            Knight-Queen Tour
          </h1>
          <p className="text-sm py-2">
            Move the knight from one corner of the board to the other in as few
            moves as possible, avoiding all squares controlled by the queen!
          </p>
        </div>
        <div className="relative mx-1">
          <Board
            state={state}
            knightSquare={knightSquare}
            queenSquare={QUEEN_SQUARE}
            visitedSquares={visitedSquares}
            targetSquare={targetSquare}
            onKnightMove={handleMove}
          />
          {state === "NOT_STARTED" && (
            <div className="absolute inset-0 bg-light-blue-600 backdrop-filter backdrop-blur-lg bg-opacity-50 flex items-center justify-center px-8 py-4">
              <div className="rounded-2xl bg-white p-3 shadow-2xl border border-gray-400">
                <div className="flex justify-center">
                  <button
                    className="rounded-md border border-blue-300 px-8 py-2 text-sm font-medium shadow-sm text-white bg-light-blue-600 hover:bg-light-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={startGame}
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 py-3 md:w-1/3">
        <Scoreboard
          tickers={[
            {
              label: "Target",
              value: targetSquare,
              icon: ChevronDoubleUpIcon,
              iconColorClass: "text-yellow-600",
            },
            { label: "Moves", value: numMoves },
            { label: "Time", value: formatSeconds(elapsed) },
          ]}
        />
      </div>
    </main>
  )
}

export default App

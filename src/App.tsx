import React, { useState, useCallback } from "react"
import "./App.css"
import Board, { BoardState } from "./Board"
import { Square, getSquareIncrement, attackedByQueen } from "./ChessLogic"
import { Set as ImmutableSet } from "immutable"
import {
  useConditionalTimeout,
  useInterval,
  useLocalStorage,
} from "beautiful-react-hooks"
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
  const [numMoves, setNumMoves] = useState(0)
  const [bestNumMoves, setBestNumMoves] = useLocalStorage<number>(
    "best-num-moves",
    0
  )
  const startGame = useCallback(() => {
    setState("PLAYING")
    setKnightSquare(STARTING_KNIGHT_SQUARE)
    setElapsed(0)
    setNumMoves(0)
    setVisitedSquares(ImmutableSet([STARTING_KNIGHT_SQUARE]))
    setTargetSquare(
      incrementWhileAttacked(
        getSquareIncrement(STARTING_KNIGHT_SQUARE, "previous"),
        "previous"
      )
    )
  }, [])
  const handleMove = useCallback(
    (from: Square, to: Square) => {
      const newNumMoves = numMoves + 1
      setKnightSquare(to)
      setNumMoves(newNumMoves)

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
          setBestNumMoves(newNumMoves)
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
    [targetSquare, visitedSquares, setBestNumMoves, numMoves]
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
    <main className="bg-blue-gray-100 text-blue-gray-900 min-h-screen">
      <div className="p-3 max-w-6xl mx-auto sm:px-8 sm:py-8 md:flex md:p-8">
        <div className="relative md:w-2/3">
          <Board
            state={state}
            knightSquare={knightSquare}
            queenSquare={QUEEN_SQUARE}
            visitedSquares={visitedSquares}
            targetSquare={targetSquare}
            onKnightMove={handleMove}
          />
        </div>
        <div className="mt-4 md:w-1/3 md:ml-10 md:my-0">
          <div className="flex items-center justify-between mx-2 md:mx-0 md:block md:border-b-2 md:pb-4 md:border-blue-gray-300">
            <div className="w-3/4 pr-3 md:w-auto md:pr-0">
              <h1 className="text-2xl font-semibold md:text-left lg:text-3xl">
                Knight-Queen Tour
              </h1>
              <p className="text-sm py-2 lg:text-base">
                Move the knight from one corner to another in as few moves as
                possible, visiting each square marked by{" "}
                <ChevronDoubleUpIcon className="w-4 h-4 inline text-yellow-600" />
                . Avoid all squares controlled by the queen!
              </p>
            </div>
            <div className="w-1/4 flex justify-end md:w-auto md:block md:py-3">
              <button
                className="rounded-md border border-blue-300 px-4 py-2 text-sm font-medium shadow-sm text-white bg-light-blue-600 hover:bg-light-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 md:px-6 lg:text-base"
                onClick={startGame}
              >
                {state === "NOT_STARTED" ? "Start" : "Restart"}
              </button>
            </div>
          </div>
          <Scoreboard
            tickers={[
              {
                label: "Target",
                value: state === "FINISHED" ? "Done!" : targetSquare,
              },
              { label: "Time", value: formatSeconds(elapsed) },
              { label: "Moves", value: numMoves },
              { label: "Best", value: bestNumMoves },
            ]}
          />
        </div>
      </div>
    </main>
  )
}

export default App

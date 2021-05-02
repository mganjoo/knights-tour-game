import React, { useState, useCallback } from "react"
import "./App.css"
import Board, { BoardState } from "./Board"
import {
  Square,
  getSquareIncrement,
  attackedByQueen,
  SQUARES,
} from "./ChessLogic"
import { Set as ImmutableSet } from "immutable"
import {
  useConditionalTimeout,
  useInterval,
  useLocalStorage,
} from "beautiful-react-hooks"
import Scoreboard from "./Scoreboard"
import { ChevronDoubleUpIcon } from "@heroicons/react/solid"
import classNames from "classnames"

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
let NUMBER_OF_SQUARES =
  SQUARES.filter((s) => !attackedByQueen(s, QUEEN_SQUARE)).length - 1

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
  const [bestSeconds, setBestSeconds] = useLocalStorage<number>(
    "best-seconds",
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
      setKnightSquare(to)
      setNumMoves((numMoves) => numMoves + 1)

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
          setBestSeconds(elapsed)
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
    [targetSquare, visitedSquares, setBestSeconds, elapsed]
  )

  // If knight is attacked, reset to playing state after delay
  useConditionalTimeout(
    () => {
      if (preAttackKnightSquare) {
        setKnightSquare(preAttackKnightSquare)
      }
      setState("PLAYING")
    },
    800,
    state === "KNIGHT_ATTACKED"
  )

  return (
    <main className="bg-blue-gray-100 text-blue-gray-900 min-h-screen">
      <div className="p-3 max-w-md mx-auto md:flex md:p-8 md:max-w-6xl">
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
        <div className="mt-4 md:w-1/3 md:ml-6 md:my-0">
          <div className="flex items-center justify-between mx-2 md:mx-0 md:block">
            <div className="pr-3 md:pr-0">
              <h1 className="text-2xl font-semibold md:text-left lg:text-3xl">
                Knight-Queen Tour
              </h1>
              <p className="text-sm py-2 lg:text-base">
                The goal of this puzzle is to visit every square on the board
                that is not controlled by the queen. The next target square is
                marked by{" "}
                <ChevronDoubleUpIcon className="w-4 h-4 inline text-yellow-600" />
                .
              </p>
            </div>
            <div className="flex justify-end md:py-3 md:justify-center">
              <button
                className="rounded-md border border-blue-300 px-4 py-2 text-sm font-medium shadow-sm text-white bg-light-blue-700 hover:bg-light-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 md:px-6 lg:text-base"
                onClick={startGame}
              >
                {state === "NOT_STARTED" ? "Start" : "Restart"}
              </button>
            </div>
          </div>
          {state !== "NOT_STARTED" && (
            <div
              className={classNames(
                "my-3 py-2 px-3 border text-base font-medium text-center md:text-lg",
                state === "FINISHED"
                  ? "bg-green-100 border-green-800 text-green-900"
                  : "bg-blue-gray-200 border-blue-gray-800"
              )}
            >
              {state === "FINISHED" ? (
                <>Nicely done!</>
              ) : (
                <>Next square: {targetSquare}</>
              )}
            </div>
          )}
          <Scoreboard
            tickers={[
              {
                label: "Remaining",
                value: NUMBER_OF_SQUARES - visitedSquares.size,
              },
              { label: "Time", value: formatSeconds(elapsed) },
              { label: "Moves", value: numMoves },
              { label: "Best", value: formatSeconds(bestSeconds) },
            ]}
          />
        </div>
      </div>
    </main>
  )
}

export default App

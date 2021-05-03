import React, { useState, useCallback } from "react"
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
import CurrentMoveBox from "./CurrentMoveBox"
import SettingsToggle from "./SettingsToggle"

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
  const [bestSeconds, setBestSeconds] = useLocalStorage<number | null>(
    "v1.best_seconds",
    null
  )
  const [bestNumMoves, setBestNumMoves] = useLocalStorage<number | null>(
    "v1.best_num_moves",
    null
  )
  const [hideVisitedSquares, setHideVisitedSquares] = useLocalStorage<boolean>(
    "v1.hide_visited_squares",
    false
  )
  const [onboardingDone, setOnboardingDone] = useLocalStorage<boolean>(
    "v1.onboarding_done",
    false
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
      const newNumMoves = numMoves + 1
      setNumMoves(newNumMoves)

      // If the knight is attacked, we will need to reset back to original square
      if (attackedByQueen(to, QUEEN_SQUARE)) {
        setState("KNIGHT_ATTACKED")
        setPreAttackKnightSquare(from)
      }

      // If we move to a new target, update visited + target squares
      if (to === targetSquare) {
        setVisitedSquares(visitedSquares.add(to))
        if (visitedSquares.size >= 3) {
          // After two moves, mark user as onboarded
          setOnboardingDone(true)
        }
        if (targetSquare === ENDING_KNIGHT_SQUARE) {
          setState("FINISHED")
          if (bestSeconds === null || elapsed < bestSeconds) {
            setBestSeconds(elapsed)
          }
          if (bestNumMoves === null || newNumMoves < bestNumMoves) {
            setBestNumMoves(newNumMoves)
          }
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
    [
      targetSquare,
      visitedSquares,
      bestSeconds,
      setBestSeconds,
      elapsed,
      bestNumMoves,
      numMoves,
      setBestNumMoves,
      setOnboardingDone,
    ]
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
    <div className="w-full min-h-screen bg-blue-gray-100 text-blue-gray-900">
      <div className="max-w-md mx-auto p-3 md:max-w-5xl md:p-6">
        <main className="grid md:grid-cols-3 gap-y-4 pb-6 md:gap-x-6 md:gap-y-6 md:items-center">
          <div className="relative col-start-1 row-start-2 md:self-start md:row-start-1 md:row-span-4 md:col-span-2">
            <Board
              state={state}
              knightSquare={knightSquare}
              queenSquare={QUEEN_SQUARE}
              visitedSquares={visitedSquares}
              targetSquare={targetSquare}
              onKnightMove={handleMove}
              hideVisitedSquares={hideVisitedSquares}
              // Show target arrow the first time the user plays,
              // for their first move
              showTargetArrow={!onboardingDone && visitedSquares.size < 2}
            />
          </div>
          <div className="row-start-1 col-start-1 flex items-start justify-between space-x-3 md:col-start-3 md:flex-col md:space-x-0">
            <div>
              <h1 className="text-xl font-semibold mb-2 md:text-2xl lg:mb-3 lg:text-3xl">
                Knight-Queen Tour
              </h1>
              <p className="text-sm lg:text-lg">
                Visit every square with the knight, in order, starting at the h8
                corner. Avoid squares that are attacked by the queen!
              </p>
            </div>
            <div className="flex flex-col justify-center items-center mt-1 space-y-3 md:flex-row md:w-full md:justify-around md:mt-4 md:space-y-0 md:space-x-4">
              <button
                className="rounded-md border border-blue-300 px-3 py-2 text-xs font-medium shadow-sm text-white bg-light-blue-700 hover:bg-light-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 md:px-5 md:text-sm lg:text-base"
                onClick={startGame}
              >
                {state === "NOT_STARTED" ? "Start" : "Restart"}
              </button>
              <div className="text-sm font-semibold md:text-lg md:w-16 md:text-left">
                {formatSeconds(elapsed)}
              </div>
            </div>
          </div>
          <div className="md:col-start-3">
            <CurrentMoveBox state={state} targetSquare={targetSquare} />
          </div>
          <div className="md:col-start-3">
            <Scoreboard
              tickers={[
                {
                  label: "More squares",
                  value: NUMBER_OF_SQUARES - visitedSquares.size,
                },
                { label: "Moves", value: numMoves },
                {
                  label: "Best time",
                  value:
                    bestSeconds !== null ? formatSeconds(bestSeconds) : "-",
                },
                {
                  label: "Best moves",
                  value: bestNumMoves,
                },
              ]}
            />
          </div>
          <div className="flex flex-col pt-2 items-center md:col-start-3">
            <h2 className="mb-3 font-medium text-sm sm:text-base md:text-lg lg:text-xl">
              Increase difficulty
            </h2>
            <SettingsToggle
              label="Hide already visited squares"
              enabled={hideVisitedSquares}
              onToggle={setHideVisitedSquares}
            />
          </div>
        </main>
        <footer className="text-xs text-center mx-5 pt-4 pb-10 border-t border-blue-gray-400 text-blue-gray-700 md:text-sm md:mx-0">
          Built by{" "}
          <a href="https://github.com/mganjoo" className="underline">
            @mganjoo
          </a>
          .{" "}
          <a
            href="https://github.com/mganjoo/knights-tour-game"
            className="underline"
          >
            View source code on GitHub
          </a>
          .
        </footer>
      </div>
    </div>
  )
}

export default App

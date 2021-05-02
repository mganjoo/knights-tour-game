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
import { Switch } from "@headlessui/react"

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
    <div className="w-full bg-blue-gray-100 text-blue-gray-900 min-h-screen">
      <div className="max-w-md mx-auto md:max-w-5xl">
        <main>
          <div className="p-3 md:flex md:p-6">
            <div className="relative md:w-2/3">
              <Board
                state={state}
                knightSquare={knightSquare}
                queenSquare={QUEEN_SQUARE}
                visitedSquares={visitedSquares}
                targetSquare={targetSquare}
                onKnightMove={handleMove}
                hideVisitedSquares={hideVisitedSquares}
              />
            </div>
            <div className="px-2 md:px-0 md:w-1/3 md:ml-6">
              <div className="flex items-start justify-between mt-2 md:m-0 md:block">
                <div className="pr-3 md:pr-0">
                  <h1 className="text-xl font-semibold mb-2 md:text-2xl md:mb-3 lg:text-3xl">
                    Knight-Queen Tour
                  </h1>
                  <p className="text-sm lg:text-base">
                    Visit every square on the board with the knight, avoiding
                    squares that are controlled by the queen!
                  </p>
                </div>
                <div className="flex flex-col justify-center items-center mt-1 md:my-6 md:flex-row md:justify-center">
                  <button
                    className="rounded-md border border-blue-300 px-3 py-2 text-xs font-medium shadow-sm text-white bg-light-blue-700 hover:bg-light-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 md:px-5 md:text-sm lg:text-base"
                    onClick={startGame}
                  >
                    {state === "NOT_STARTED" ? "Start" : "Restart"}
                  </button>
                  <div className="text-sm font-semibold mt-3 md:text-lg md:mt-0 md:ml-5 md:w-16 md:text-right">
                    {formatSeconds(elapsed)}
                  </div>
                </div>
              </div>
              {state !== "NOT_STARTED" && (
                <div className="flex justify-center my-3 md:my-8">
                  <div
                    className={classNames(
                      "py-2 px-3 text-base font-medium flex items-center space-x-3 text-white md:text-lg",
                      state === "FINISHED"
                        ? "bg-green-700 justify-center"
                        : "bg-yellow-700 justify-between"
                    )}
                  >
                    {state === "FINISHED" ? (
                      <span className="text-sm md:text-base">
                        Puzzle complete. Nicely done!
                      </span>
                    ) : (
                      <>
                        <ChevronDoubleUpIcon className="w-4 h-4" />
                        <span className="uppercase text-xs lg:text-sm">
                          Next square to visit
                        </span>
                        <span className="text-base lg:text-lg">
                          {targetSquare}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
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
                    value: bestNumMoves !== null ? bestNumMoves : "-",
                  },
                ]}
              />
              <Switch.Group>
                <div className="flex justify-center items-center py-2">
                  <Switch
                    checked={hideVisitedSquares}
                    onChange={setHideVisitedSquares}
                    className={classNames(
                      hideVisitedSquares ? "bg-light-blue-700" : "bg-gray-300",
                      "relative inline-flex items-center flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    )}
                  >
                    <span className="sr-only">Hide visited squares</span>
                    <span
                      aria-hidden="true"
                      className={classNames(
                        hideVisitedSquares ? "translate-x-6" : "translate-x-0",
                        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200"
                      )}
                    />
                  </Switch>
                  <Switch.Label className="ml-2 text-xs md:text-sm lg:text-base md:ml-3">
                    Hide visited squares (harder!)
                  </Switch.Label>
                </div>
              </Switch.Group>
            </div>
          </div>
        </main>
        <footer className="text-xs text-center mx-5 pt-4 pb-10 border-t border-blue-gray-400 text-blue-gray-700 md:text-sm">
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

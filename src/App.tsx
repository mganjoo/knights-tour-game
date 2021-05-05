import React, { useState, useCallback, useMemo, useEffect } from "react"
import Board, { BoardState } from "./Board"
import {
  Square,
  getSquareIncrement,
  attackedByQueen,
  incrementWhileAttacked,
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
import { useBeforeUnload } from "react-use"
import QueenSquareSelector, {
  isQueenSquare,
  QueenSquare,
} from "./QueenSquareSelector"

const DEFAULT_QUEEN_SQUARE = "d5"
const DEFAULT_STARTING_KNIGHT_SQUARE = "h8"
const DEFAULT_ENDING_KNIGHT_SQUARE = "a1"

// "Safe" squares to be used as source and destination squares for knight
const DEFAULT_SAFE_STARTING_KNIGHT_SQUARE: Square = incrementWhileAttacked(
  DEFAULT_STARTING_KNIGHT_SQUARE,
  DEFAULT_QUEEN_SQUARE,
  "previous"
)

function formatSeconds(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = ("0" + (Math.floor(seconds / 60) % 60)).slice(-2)
  const s = ("0" + Math.floor(seconds % 60)).slice(-2)
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

const App: React.FC = () => {
  const [state, setState] = useState<BoardState>("NOT_STARTED")
  const [queenSquare, setQueenSquare] = useState<QueenSquare>(
    DEFAULT_QUEEN_SQUARE
  )
  const [knightSquare, setKnightSquare] = useState<Square>(
    DEFAULT_SAFE_STARTING_KNIGHT_SQUARE
  )
  const [preAttackKnightSquare, setPreAttackKnightSquare] = useState<Square>()
  const [visitedSquares, setVisitedSquares] = useState<ImmutableSet<Square>>(
    ImmutableSet()
  )
  const [targetSquare, setTargetSquare] = useState<Square>()
  const [elapsed, setElapsed] = useState(0)
  const [numMoves, setNumMoves] = useState(0)
  const [loadedQueenSquare, setLoadedQueenSquare] = useLocalStorage<string>(
    "v1.loaded_queen_square",
    DEFAULT_QUEEN_SQUARE
  )
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
  const [attackEndsGame, setAttackEndsGame] = useLocalStorage<boolean>(
    "v1.attack_ends_game",
    false
  )
  const [onboardingDone, setOnboardingDone] = useLocalStorage<boolean>(
    "v1.onboarding_done",
    false
  )
  const numSquares = useMemo(
    () => SQUARES.filter((s) => !attackedByQueen(s, queenSquare)).length - 1,
    [queenSquare]
  )
  const endingKnightSquare = useMemo<Square>(
    () =>
      incrementWhileAttacked(DEFAULT_ENDING_KNIGHT_SQUARE, queenSquare, "next"),
    [queenSquare]
  )
  const resetGame = useCallback((queenSquareToUse: QueenSquare) => {
    setQueenSquare(queenSquareToUse)
    const startingKnightSquare = incrementWhileAttacked(
      DEFAULT_STARTING_KNIGHT_SQUARE,
      queenSquareToUse,
      "previous"
    )
    const nextSquare = incrementWhileAttacked(
      getSquareIncrement(startingKnightSquare, "previous"),
      queenSquareToUse,
      "previous"
    )
    setKnightSquare(startingKnightSquare)
    setElapsed(0)
    setNumMoves(0)
    setVisitedSquares(ImmutableSet([startingKnightSquare]))
    setTargetSquare(nextSquare)
  }, [])
  const restartGame = useCallback(() => {
    setState("RESTARTING")
  }, [])
  const handleMove = useCallback(
    (from: Square, to: Square) => {
      setKnightSquare(to)
      const newNumMoves = numMoves + 1
      setNumMoves(newNumMoves)

      // If the knight is attacked, we may need to reset back to original square
      if (attackedByQueen(to, queenSquare)) {
        setState("KNIGHT_ATTACKED")
        setPreAttackKnightSquare(from)
      }

      // If we move to a new target, update visited + target squares
      if (to === targetSquare) {
        setVisitedSquares(visitedSquares.add(to))
        if (visitedSquares.size >= 2) {
          // After three successful square visits, mark user
          // as onboarded (stop showing arrows)
          setOnboardingDone(true)
        }
        if (targetSquare === endingKnightSquare) {
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
              queenSquare,
              "previous"
            )
          )
        }
      }
    },
    [
      numMoves,
      targetSquare,
      visitedSquares,
      endingKnightSquare,
      setOnboardingDone,
      bestSeconds,
      elapsed,
      bestNumMoves,
      setBestSeconds,
      setBestNumMoves,
      queenSquare,
    ]
  )
  const updateQueenSquare = useCallback(
    (square: QueenSquare) => {
      resetGame(square)
      if (state === "PLAYING") {
        // If game is in progress, restart it
        restartGame()
      }
    },
    [resetGame, restartGame, state]
  )
  const saveAndUpdateQueenSquare = useCallback(
    (square: QueenSquare) => {
      setLoadedQueenSquare(square)
      updateQueenSquare(square)
    },
    [setLoadedQueenSquare, updateQueenSquare]
  )

  useEffect(() => {
    if (queenSquare !== loadedQueenSquare) {
      if (isQueenSquare(loadedQueenSquare)) {
        updateQueenSquare(loadedQueenSquare)
      } else {
        saveAndUpdateQueenSquare(DEFAULT_QUEEN_SQUARE)
      }
    }
  }, [
    queenSquare,
    loadedQueenSquare,
    updateQueenSquare,
    saveAndUpdateQueenSquare,
  ])

  useInterval(() => {
    if (state === "PLAYING" || state === "KNIGHT_ATTACKED") {
      setElapsed((e) => e + 1)
    }
  }, 1000)

  // If knight is attacked, either reset to original state, or capture
  useConditionalTimeout(
    () => {
      if (attackEndsGame) {
        setState("CAPTURED")
      } else {
        if (preAttackKnightSquare) {
          setKnightSquare(preAttackKnightSquare)
          setPreAttackKnightSquare(undefined)
        }
      }
    },
    800,
    state === "KNIGHT_ATTACKED"
  )

  useConditionalTimeout(
    () => {
      resetGame(queenSquare)
      setState("PLAYING")
    },
    50,
    state === "RESTARTING"
  )

  useBeforeUnload(
    // Prompt user before closing if at least two squares have been visited
    (state === "PLAYING" || state === "KNIGHT_ATTACKED") &&
      visitedSquares.size >= 2,
    "Closing the window will lose puzzle progress, are you sure?"
  )

  return (
    <div className="min-h-screen bg-blue-gray-100 text-blue-gray-900 dark:bg-blue-gray-800 dark:text-white">
      <div className="max-w-lg mx-auto px-4 md:px-6 md:max-w-screen-lg">
        <main className="grid pt-4 pb-6 md:grid-cols-3 gap-y-4 md:pt-6 md:gap-x-6 md:gap-y-6 md:items-center">
          <div className="col-start-1 row-start-2 md:row-start-1 md:row-span-4 md:col-span-2">
            <Board
              state={state}
              knightSquare={knightSquare}
              queenSquare={state === "CAPTURED" ? knightSquare : queenSquare}
              visitedSquares={visitedSquares}
              targetSquare={targetSquare}
              onKnightMove={handleMove}
              hideVisitedSquares={hideVisitedSquares}
              // Show target arrow the first time the user plays,
              // for their first move
              showTargetArrow={!onboardingDone && visitedSquares.size < 2}
              showInitialGuideArrows={!onboardingDone}
            />
          </div>
          <div className="row-start-1 col-start-1 grid justify-items-center gap-x-3 md:col-start-3 md:grid-cols-2 md:gap-x-0 md:gap-y-4 md:items-center lg:gap-y-5">
            <div className="row-start-1 col-start-1 row-span-2 md:row-span-1 md:col-span-2">
              <h1 className="text-xl font-semibold mb-2 md:text-2xl lg:text-3xl">
                Knight-Queen Tour
              </h1>
              <p className="text-sm lg:text-base">
                Visit every square on the board with the knight, in order,
                starting at the {DEFAULT_STARTING_KNIGHT_SQUARE} corner. Avoid
                squares that are attacked by the queen!
              </p>
            </div>
            <div className="row-start-1 col-start-2 md:row-start-2 md:col-start-1">
              <button
                className="rounded-md px-3 py-2 text-sm font-medium shadow-md text-white bg-light-blue-700 hover:bg-light-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-blue-500 lg:px-4 lg:text-base"
                onClick={restartGame}
              >
                New game
              </button>
            </div>
            <div className="row-start-2 col-start-2 text-base font-semibold md:text-lg lg:text-xl">
              {formatSeconds(elapsed)}
            </div>
          </div>
          <div className="md:col-start-3">
            <CurrentMoveBox
              state={state}
              targetSquare={targetSquare}
              attackEndsGame={attackEndsGame}
            />
          </div>
          <div className="md:col-start-3">
            <Scoreboard
              tickers={[
                {
                  label: "More squares",
                  value: numSquares - visitedSquares.size,
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
          <div className="mt-2 md:col-start-3">
            <h2 className="mb-2 font-medium text-base text-center md:text-lg md:mb">
              Increase difficulty
            </h2>
            <SettingsToggle
              label="Hide already visited squares"
              enabled={hideVisitedSquares}
              onToggle={setHideVisitedSquares}
            />
            <SettingsToggle
              label="End game if knight moves to an attacked square"
              enabled={attackEndsGame}
              onToggle={setAttackEndsGame}
            />
            <QueenSquareSelector
              label="Change queen starting square"
              selected={queenSquare}
              setSelected={saveAndUpdateQueenSquare}
            />
          </div>
        </main>
        <footer className="text-xs text-center mx-5 pt-4 pb-12 border-t border-blue-gray-400 text-blue-gray-700 md:text-sm md:mx-0 dark:border-blue-gray-300 dark:text-blue-gray-200">
          Built by{" "}
          <a href="https://github.com/mganjoo" className="link-default">
            @mganjoo
          </a>
          .{" "}
          <a
            href="https://github.com/mganjoo/knights-tour-game"
            className="link-default"
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

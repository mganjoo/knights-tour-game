import React, { useEffect, useState, useCallback } from "react"
import { useHarmonicIntervalFn } from "react-use"
import { DEFAULT_QUEEN_SQUARE, Square } from "./game/ChessLogic"
import useGameState, { getElapsedMs } from "./game/GameState"
import useBestScores from "./ui/BestScores"
import Board from "./ui/Board"
import CurrentMoveBox from "./ui/CurrentMoveBox"
import QueenSquareSelector from "./ui/QueenSquareSelector"
import Scoreboard from "./ui/Scoreboard"
import SettingsToggle from "./ui/SettingsToggle"
import { useFlag, useQueenSquareChoice } from "./util/SettingsHelpers"

/**
 * Format a millisecond timestamp as a string.
 */
function formatMillis(ms?: number): string | undefined {
  if (ms === undefined || ms < 0) {
    return undefined
  }
  const seconds = Math.round(ms / 1000)
  const h = Math.floor(seconds / 3600)
  const m = ("0" + (Math.floor(seconds / 60) % 60)).slice(-2)
  const s = ("0" + Math.floor(seconds % 60)).slice(-2)
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

interface LinkArgs {
  href: string
}
const Link: React.FC<LinkArgs> = ({ href, children }) => (
  <a
    href={href}
    className="underline focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-blue-400 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-gray-900"
  >
    {children}
  </a>
)

function App() {
  const [queenSquare, setQueenSquare] = useQueenSquareChoice(
    "v1.loaded_queen_square",
    DEFAULT_QUEEN_SQUARE
  )
  const [hideVisited, setHideVisited] = useFlag("v1.hide_visited_squares")
  const [attackEndsGame, setAttackEndsGame] = useFlag("v1.attack_ends_game")
  const [onboardingDone, setOnboardingDone] = useFlag("v1.onboarding_done")
  const [useGChessBoard, setUseGChessBoard] = useState(false)
  const { state, send } = useGameState({
    attackEndsGame,
    queenSquare,
  })
  const { bestScoresMap, updateBestScores } = useBestScores()
  const bestScores = bestScoresMap[state.context.queenSquare]
  const [elapsedMillis, setElapsedMillis] = useState<number>(0)
  const handleKnightMove = useCallback(
    (square: Square) => send({ type: "MOVE_KNIGHT", square }),
    [send]
  )
  const start = useCallback(() => send({ type: "START" }), [send])

  useEffect(() => {
    const handleVisibilityChange = () =>
      send(document.visibilityState === "hidden" ? "PAUSE" : "UNPAUSE")
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [send])

  useEffect(() => {
    // After three successful square visits, mark user
    // as onboarded (stop showing arrows)
    if (state.context.visitedSquares.size >= 3) {
      setOnboardingDone(true)
    }
  }, [state.context.visitedSquares.size, setOnboardingDone])

  useEffect(() => {
    if (state.matches("finished")) {
      updateBestScores({
        queenSquare: state.context.queenSquare,
        numMoves: state.context.numMoves,
        elapsedMs: getElapsedMs(state.context),
      })
    }
  }, [state, updateBestScores])

  useHarmonicIntervalFn(() => {
    setElapsedMillis(getElapsedMs(state.context))
  }, 1000)

  return (
    <div className="grid min-h-screen text-gray-900 bg-gray-100 place-items-center dark:bg-gray-900 dark:text-white">
      <div className="grid max-w-lg gap-6 p-4 md:max-w-5xl md:p-6">
        <main className="grid gap-6 place-items-center md:grid-cols-3">
          <div className="grid grid-flow-col place-items-center gap-x-3 md:grid-flow-row md:gap-x-0 md:gap-y-4">
            <div className="row-span-2 md:col-span-2">
              <h1 className="mb-2 text-xl font-semibold md:text-2xl lg:text-3xl">
                Knight-Queen Tour
              </h1>
              <p className="text-sm lg:text-base">
                Visit every square on the board with the knight, in order,
                starting at the h8 corner. Avoid squares that are attacked by
                the queen!
              </p>
            </div>
            <button
              className="px-3 py-2 text-sm font-medium text-white bg-blue-700 rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 focus:ring-offset-gray-100 dark:bg-blue-600 dark:shadow-gray-500/25 dark:hover:bg-blue-500 dark:focus:ring-offset-gray-900 lg:px-4 lg:text-base"
              onClick={start}
            >
              New game
            </button>
            <p className="text-base font-semibold tabular-nums md:text-lg lg:text-xl">
              {formatMillis(elapsedMillis)}
            </p>
          </div>
          <div className="justify-self-stretch md:row-start-1 md:row-span-5 md:col-span-2">
            <Board
              stateMatches={state.matches}
              knightSquare={state.context.knightSquare}
              queenSquare={
                state.matches("captured")
                  ? state.context.knightSquare
                  : state.context.queenSquare
              }
              visitedSquares={state.context.visitedSquares}
              targetSquare={state.context.targetSquare}
              onKnightMove={handleKnightMove}
              hideVisitedSquares={hideVisited}
              // Show target arrow the first time the user plays,
              // for their first move
              showTargetArrow={
                !onboardingDone && state.context.visitedSquares.size < 2
              }
              showInitialGuideArrows={!onboardingDone}
              useGChessBoard={useGChessBoard}
            />
          </div>
          <CurrentMoveBox
            stateMatches={state.matches}
            targetSquare={state.context.targetSquare}
          />
          <Scoreboard
            tickers={[
              {
                label: "Squares left",
                value:
                  state.context.numTotalSquares -
                  state.context.visitedSquares.size,
              },
              {
                label: "Moves",
                value: state.context.numMoves,
              },
              {
                label: "Best time",
                value: formatMillis(bestScores?.bestElapsedMs),
              },
              {
                label: "Best moves",
                value: bestScores?.bestNumMoves,
              },
            ]}
          />
          <QueenSquareSelector
            selected={queenSquare}
            setSelected={setQueenSquare}
          />
          <div className="grid gap-y-2">
            <h2 className="text-base font-medium text-center md:text-lg">
              Increase difficulty
            </h2>
            <SettingsToggle
              label="Hide already visited squares"
              enabled={!!hideVisited}
              onToggle={setHideVisited}
            />
            <SettingsToggle
              label="End game if knight moves to an attacked square"
              enabled={!!attackEndsGame}
              onToggle={setAttackEndsGame}
            />
            <SettingsToggle
              label="Use gchessboard"
              enabled={useGChessBoard}
              onToggle={setUseGChessBoard}
            />
          </div>
        </main>
        <footer className="flex justify-center py-4 mx-5 text-xs text-center text-gray-700 border-t border-gray-400 gap-x-1 md:mx-0 md:text-sm dark:border-gray-300 dark:text-gray-200">
          <span>
            By <Link href="https://github.com/mganjoo">@mganjoo</Link>
          </span>
          <span>&middot;</span>
          <Link href="https://github.com/mganjoo/knights-tour-game">
            View on GitHub
          </Link>
        </footer>
      </div>
    </div>
  )
}

export default App

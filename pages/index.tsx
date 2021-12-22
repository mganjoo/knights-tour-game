import type { NextPage } from "next"
import Head from "next/head"
import React, { useEffect, useState, useCallback } from "react"
import { useHarmonicIntervalFn } from "react-use"
import { DEFAULT_QUEEN_SQUARE, Square } from "../components/game/ChessLogic"
import useGameState, { getElapsedMs } from "../components/game/GameState"
import useBestScores from "../components/ui/BestScores"
import Board from "../components/ui/Board"
import CurrentMoveBox from "../components/ui/CurrentMoveBox"
import QueenSquareSelector from "../components/ui/QueenSquareSelector"
import Scoreboard from "../components/ui/Scoreboard"
import SettingsToggle from "../components/ui/SettingsToggle"
import {
  useFlag,
  useQueenSquareChoice,
} from "../components/util/SettingsHelpers"
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

const Home: NextPage = () => {
  const [queenSquare, setQueenSquare] = useQueenSquareChoice(
    "v1.loaded_queen_square",
    DEFAULT_QUEEN_SQUARE
  )
  const [hideVisited, setHideVisited] = useFlag("v1.hide_visited_squares")
  const [attackEndsGame, setAttackEndsGame] = useFlag("v1.attack_ends_game")
  const [onboardingDone, setOnboardingDone] = useFlag("v1.onboarding_done")
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
    <div className="min-h-screen grid place-items-center bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Visit every square on the board with the knight, avoiding squares that are controlled by the queen!"
        />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />
        <title>Knight-Queen Tour</title>
      </Head>
      <div className="max-w-lg p-4 grid gap-6 md:max-w-5xl md:p-6">
        <main className="grid place-items-center gap-6 md:grid-cols-3">
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
              className="px-3 py-2 rounded-md text-sm font-medium shadow-md bg-blue-700 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 focus:ring-offset-gray-100 dark:bg-blue-600 dark:shadow-gray-500/25 dark:hover:bg-blue-500 dark:focus:ring-offset-gray-900 lg:px-4 lg:text-base"
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
            <h2 className="font-medium text-base text-center md:text-lg">
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
          </div>
        </main>
        <footer className="mx-5 py-4 flex justify-center gap-x-1 border-t border-gray-400 text-gray-700 text-xs text-center md:mx-0 md:text-sm dark:border-gray-300 dark:text-gray-200">
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

export default Home

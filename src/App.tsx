import React, { useMemo, useEffect } from "react"
import Board from "./Board"
import { attackedByQueen, SQUARES } from "./ChessLogic"
import Scoreboard from "./Scoreboard"
import CurrentMoveBox from "./CurrentMoveBox"
import SettingsToggle from "./SettingsToggle"
import QueenSquareSelector from "./QueenSquareSelector"
import useGameState, { DEFAULT_QUEEN_SQUARE } from "./GameState"
import { useBestScores, useFlag, useQueenSquareChoice } from "./Settings"

function formatSeconds(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = ("0" + (Math.floor(seconds / 60) % 60)).slice(-2)
  const s = ("0" + Math.floor(seconds % 60)).slice(-2)
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

const App: React.FC = () => {
  const [loadedQueenSquare, setLoadedQueenSquare] = useQueenSquareChoice(
    "v1.loaded_queen_square",
    DEFAULT_QUEEN_SQUARE
  )
  const [hideVisitedSquares, setHideVisitedSquares] = useFlag(
    "v1.hide_visited_squares"
  )
  const [attackEndsGame, setAttackEndsGame] = useFlag("v1.attack_ends_game")
  const [onboardingDone, setOnboardingDone] = useFlag("v1.onboarding_done")
  const { gameState, doAction } = useGameState({
    attackEndsGame: attackEndsGame,
    queenSquare: loadedQueenSquare,
  })
  const numSquares = useMemo(
    // Minus 1 because queen also counts aas a square
    () =>
      SQUARES.filter((s) => !attackedByQueen(s, gameState.queenSquare)).length -
      1,
    [gameState.queenSquare]
  )
  const { bestScoresMap, updateBestScores } = useBestScores("v1.best_scores")
  const bestScores = bestScoresMap[gameState.queenSquare]

  useEffect(() => {
    if (gameState.visitedSquares.size >= 3) {
      // After three successful square visits, mark user
      // as onboarded (stop showing arrows)
      setOnboardingDone(true)
    }
  }, [gameState.visitedSquares, setOnboardingDone])

  useEffect(() => {
    if (gameState.boardState.id === "FINISHED") {
      updateBestScores({
        queenSquare: gameState.queenSquare,
        numMoves: gameState.numMoves,
        elapsed: gameState.elapsed,
      })
    }
  }, [
    gameState.boardState,
    gameState.elapsed,
    gameState.numMoves,
    gameState.queenSquare,
    updateBestScores,
  ])

  return (
    <div className="min-h-screen bg-blue-gray-100 text-blue-gray-900 dark:bg-blue-gray-800 dark:text-white">
      <div className="max-w-lg mx-auto px-4 md:px-6 md:max-w-screen-lg">
        <main className="grid pt-4 pb-6 md:grid-cols-3 gap-y-4 md:pt-6 md:gap-x-6 md:gap-y-6 md:items-center">
          <div className="col-start-1 row-start-2 md:row-start-1 md:row-span-5 md:col-span-2">
            <Board
              state={gameState.boardState}
              knightSquare={gameState.knightSquare}
              queenSquare={
                gameState.boardState.id === "CAPTURED"
                  ? gameState.knightSquare
                  : gameState.queenSquare
              }
              visitedSquares={gameState.visitedSquares}
              targetSquare={gameState.targetSquare}
              onKnightMove={(from, to) => doAction({ type: "move", from, to })}
              hideVisitedSquares={hideVisitedSquares}
              // Show target arrow the first time the user plays,
              // for their first move
              showTargetArrow={
                !onboardingDone && gameState.visitedSquares.size < 2
              }
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
                starting at the h8 corner. Avoid squares that are attacked by
                the queen!
              </p>
            </div>
            <div className="row-start-1 col-start-2 md:row-start-2 md:col-start-1">
              <button
                className="rounded-md px-3 py-2 text-sm font-medium shadow-md text-white bg-light-blue-700 hover:bg-light-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-blue-500 lg:px-4 lg:text-base"
                onClick={() => {
                  doAction({ type: "beginRestarting" })
                }}
              >
                New game
              </button>
            </div>
            <div className="row-start-2 col-start-2 text-base font-semibold tabular-nums md:text-lg lg:text-xl">
              {formatSeconds(gameState.elapsed)}
            </div>
          </div>
          <div className="md:col-start-3">
            <CurrentMoveBox
              state={gameState.boardState}
              targetSquare={gameState.targetSquare}
              attackEndsGame={attackEndsGame}
            />
          </div>
          <div className="md:col-start-3">
            <Scoreboard
              tickers={[
                {
                  label: "Squares left",
                  value: numSquares - gameState.visitedSquares.size,
                },
                {
                  label: "Moves",
                  value: gameState.numMoves,
                },
                {
                  label: "Best time",
                  value:
                    bestScores?.bestSeconds && bestScores?.bestSeconds > 0
                      ? formatSeconds(bestScores?.bestSeconds)
                      : "-",
                },
                {
                  label: "Best moves",
                  value:
                    bestScores?.bestMoves && bestScores?.bestSeconds > 0
                      ? bestScores?.bestMoves
                      : undefined,
                },
              ]}
            />
          </div>
          <div className="pt-1 pb-2 md:col-start-3">
            <QueenSquareSelector
              selected={gameState.queenSquare}
              setSelected={(square) => {
                doAction({ type: "setQueenSquare", square })
                setLoadedQueenSquare(square)
              }}
            />
          </div>
          <div className="md:col-start-3">
            <h2 className="mb-2 font-medium text-base text-center md:text-lg md:mb">
              Increase difficulty
            </h2>
            <SettingsToggle
              label="Hide already visited squares"
              enabled={!!hideVisitedSquares}
              onToggle={setHideVisitedSquares}
            />
            <SettingsToggle
              label="End game if knight moves to an attacked square"
              enabled={!!attackEndsGame}
              onToggle={setAttackEndsGame}
            />
          </div>
        </main>
        <footer className="text-xs mx-5 pt-4 pb-12 flex items-center justify-center space-x-1 border-t border-blue-gray-400 text-blue-gray-700 md:text-sm md:mx-0 dark:border-blue-gray-300 dark:text-blue-gray-200">
          <span>
            By{" "}
            <a href="https://github.com/mganjoo" className="link-default">
              @mganjoo
            </a>
          </span>
          <span>&middot;</span>
          <a
            href="https://github.com/mganjoo/knights-tour-game"
            className="link-default"
          >
            View on GitHub
          </a>
        </footer>
      </div>
    </div>
  )
}

export default App

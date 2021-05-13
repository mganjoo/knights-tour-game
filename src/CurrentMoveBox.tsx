import { ChevronDoubleUpIcon } from "@heroicons/react/solid"
import classNames from "classnames"
import { motion, useReducedMotion } from "framer-motion"
import React from "react"
import { Square } from "./ChessLogic"
import { GameStateWrapper } from "./GameState"

interface CurrentMoveBoxProps {
  state: GameStateWrapper
  targetSquare?: Square
  attackEndsGame?: boolean
}

function getReactKey(
  state: GameStateWrapper,
  targetSquare: Square | undefined
) {
  // Key determines which state changes get animated

  if (state.matches("paused") || state.matches({ playing: "moving" })) {
    return targetSquare ? `next_${targetSquare}` : "other"
  }

  if (
    state.matches("captured") ||
    state.matches({ playing: "knightAttacked" })
  ) {
    return "attacked"
  }

  if (state.matches("finished")) {
    return "finished"
  }

  return "other"
}

const CurrentMoveBox: React.FC<CurrentMoveBoxProps> = ({
  state,
  targetSquare,
  attackEndsGame,
}) => {
  // Reduce animation of box transition if user has enabled reduce motion
  const shouldReduceMotion = useReducedMotion()
  const key = getReactKey(state, targetSquare)
  const targetStyle = { opacity: 1, y: 0, scale: 1 }
  return (
    <div className="flex justify-center">
      <motion.div
        key={key}
        initial={
          state.matches("notStarted") || shouldReduceMotion
            ? { opacity: 0, y: 0, scale: 0.9 }
            : {
                opacity: 0,
                y: 50,
                scale: 0.4,
              }
        }
        animate={targetStyle}
        className={classNames(
          "py-2 px-4 text-sm font-medium flex items-center lg:text-base",
          state.matches("finished")
            ? "bg-green-700 text-white"
            : state.matches("captured") ||
              state.matches({ playing: "knightAttacked" })
            ? "bg-red-600 text-white"
            : state.matches("notStarted") || !targetSquare
            ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-100"
            : "bg-yellow-700 text-white"
        )}
      >
        {state.matches("finished") ? (
          <>
            <span className="mr-2" aria-hidden>
              🎉
            </span>
            <span>Puzzle complete. Nicely done!</span>
          </>
        ) : state.matches("captured") ||
          (state.matches({ playing: { knightAttacked: "toBeCaptured" } }) &&
            attackEndsGame) ? (
          <>Oops, game over! Try again.</>
        ) : state.matches({ playing: { knightAttacked: "toReturn" } }) ? (
          <>Oops, can't go there!</>
        ) : (
          <>
            <ChevronDoubleUpIcon className="w-4 h-4 mr-2" aria-hidden />
            <span>Next square to visit</span>
            <span className="ml-4">
              {state.matches("notStarted") || !targetSquare
                ? "-"
                : targetSquare}
            </span>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default CurrentMoveBox

import { ChevronDoubleUpIcon } from "@heroicons/react/solid"
import classNames from "classnames"
import { motion, useReducedMotion } from "framer-motion"
import React from "react"
import { Square } from "./ChessLogic"
import { GameStateWrapper } from "./GameState"

interface CurrentMoveBoxProps {
  state: GameStateWrapper
}

/**
 * The key determines which state changes get animated. Changes in the
 * key represent a change in the box and thus is animated.
 */
function getReactKey(state: GameStateWrapper, targetSquare: Square) {
  if (state.matches("paused") || state.matches({ playing: "moving" })) {
    return `next_${targetSquare}`
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

const CurrentMoveBox: React.FC<CurrentMoveBoxProps> = ({ state }) => {
  const shouldReduceMotion = useReducedMotion()
  const targetSquare = state.context.targetSquare
  return (
    <div className="flex justify-center">
      <motion.div
        key={getReactKey(state, targetSquare)}
        initial={
          // Reduce animation of box transition if user has enabled reduce motion
          state.matches("notStarted") || shouldReduceMotion
            ? { opacity: 0, y: 0, scale: 0.9 }
            : {
                opacity: 0,
                y: 50,
                scale: 0.4,
              }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={classNames(
          "py-2 px-4 text-sm font-medium flex items-center lg:text-base",
          state.matches("finished")
            ? "bg-green-700 text-white"
            : state.matches("captured") ||
              state.matches({ playing: "knightAttacked" })
            ? "bg-red-600 text-white"
            : state.matches("notStarted")
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
          state.matches({ playing: { knightAttacked: "toBeCaptured" } }) ? (
          <>Oops, game over! Try again.</>
        ) : state.matches({ playing: { knightAttacked: "toReturn" } }) ? (
          <>Oops, can't go there!</>
        ) : (
          <>
            <ChevronDoubleUpIcon className="w-4 h-4 mr-2" aria-hidden />
            <span>Next square to visit</span>
            <span className="ml-4">
              {state.matches("notStarted") ? "-" : targetSquare}
            </span>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default CurrentMoveBox

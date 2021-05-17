import { ChevronDoubleUpIcon } from "@heroicons/react/solid"
import classNames from "classnames"
import { motion, useReducedMotion } from "framer-motion"
import React from "react"
import { Square } from "./ChessLogic"
import { GameStateType } from "./GameState"

interface CurrentMoveBoxProps {
  stateMatches: (state: GameStateType) => boolean
  targetSquare: Square
}

/**
 * The key determines which state changes get animated. Changes in the
 * key represent a change in the box and thus is animated.
 */
function getReactKey(
  stateMatches: (state: GameStateType) => boolean,
  targetSquare: Square
) {
  if (
    stateMatches({ playing: "paused" }) ||
    stateMatches({ playing: "moving" })
  ) {
    return `next_${targetSquare}`
  }

  if (stateMatches("captured") || stateMatches({ playing: "knightAttacked" })) {
    return "attacked"
  }

  if (stateMatches("finished")) {
    return "finished"
  }

  return "other"
}

const CurrentMoveBox: React.FC<CurrentMoveBoxProps> = ({
  stateMatches,
  targetSquare,
}) => {
  const shouldReduceMotion = useReducedMotion()
  return (
    <div className="flex justify-center">
      <motion.div
        key={getReactKey(stateMatches, targetSquare)}
        initial={
          // Reduce animation of box transition if user has enabled reduce motion
          stateMatches("notStarted") || shouldReduceMotion
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
          stateMatches("finished")
            ? "bg-green-700 text-white"
            : stateMatches("captured") ||
              stateMatches({ playing: "knightAttacked" })
            ? "bg-red-600 text-white"
            : stateMatches("notStarted")
            ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-100"
            : "bg-yellow-700 text-white"
        )}
      >
        {stateMatches("finished") ? (
          <>
            <span className="mr-2" aria-hidden>
              🎉
            </span>
            <span>Puzzle complete. Nicely done!</span>
          </>
        ) : stateMatches("captured") ||
          stateMatches({ playing: { knightAttacked: "toBeCaptured" } }) ? (
          <>Oops, game over! Try again.</>
        ) : stateMatches({ playing: { knightAttacked: "toReturn" } }) ? (
          <>Oops, can't go there!</>
        ) : (
          <>
            <ChevronDoubleUpIcon className="w-4 h-4 mr-2" aria-hidden />
            <span>Next square to visit</span>
            <span className="ml-4">
              {stateMatches("notStarted") ? "-" : targetSquare}
            </span>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default CurrentMoveBox

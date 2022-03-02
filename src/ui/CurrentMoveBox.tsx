import { ChevronDoubleUpIcon } from "@heroicons/react/solid"
import classNames from "classnames"
import { motion, useReducedMotion } from "framer-motion"
import React, { useEffect, useState } from "react"
import { Square } from "../game/ChessLogic"
import { GameStateType } from "../game/GameState"

interface CurrentMoveBoxProps {
  stateMatches: (state: GameStateType) => boolean
  targetSquare: Square
}

type CurrentMoveBoxStatus =
  | "notStarted"
  | "active"
  | "attacked"
  | "captured"
  | "finished"

/**
 * The key determines which state changes get animated. Changes in the
 * key represent a change in the box and thus is animated.
 */
function getReactKey(boxStatus: CurrentMoveBoxStatus, targetSquare: Square) {
  if (boxStatus === "active") {
    return `next_${targetSquare}`
  }

  if (boxStatus === "attacked" || boxStatus === "captured") {
    return "attacked"
  }

  if (boxStatus === "finished") {
    return "finished"
  }

  return "other"
}

const CurrentMoveBox: React.FC<CurrentMoveBoxProps> = ({
  stateMatches,
  targetSquare,
}) => {
  const shouldReduceMotion = useReducedMotion()
  const [boxStatus, setBoxStatus] = useState<CurrentMoveBoxStatus>("notStarted")
  useEffect(() => {
    if (
      stateMatches({ playing: "paused" }) ||
      stateMatches({ playing: "moving" })
    ) {
      setBoxStatus("active")
    } else if (
      stateMatches("captured") ||
      stateMatches({ playing: { knightAttacked: "toBeCaptured" } })
    ) {
      setBoxStatus("captured")
    } else if (stateMatches({ playing: { knightAttacked: "toReturn" } })) {
      setBoxStatus("attacked")
    } else if (stateMatches("finished")) {
      setBoxStatus("finished")
    } else {
      setBoxStatus("notStarted")
    }
  }, [stateMatches])
  return (
    <motion.div
      key={getReactKey(boxStatus, targetSquare)}
      initial={
        // Reduce animation of box transition if user has enabled reduce motion
        boxStatus === "notStarted" || shouldReduceMotion
          ? { opacity: 0, y: 0, scale: 0.9 }
          : {
              opacity: 0,
              y: 50,
              scale: 0.4,
            }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={classNames(
        "px-4 py-2 flex text-sm font-medium items-center text-center lg:text-base",
        boxStatus === "finished"
          ? "bg-emerald-800 text-white dark:bg-emerald-700"
          : boxStatus === "attacked" || boxStatus === "captured"
          ? "bg-red-600 text-white"
          : boxStatus === "active"
          ? "bg-amber-400 text-amber-900 dark:bg-amber-700 dark:text-white"
          : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-100"
      )}
    >
      {boxStatus === "finished" ? (
        <>
          <span className="mr-2" aria-hidden>
            🎉
          </span>
          <span>Puzzle complete. Nicely done!</span>
        </>
      ) : boxStatus === "captured" ? (
        <>Oops, game over! Try again.</>
      ) : boxStatus === "attacked" ? (
        <>Oops, can&lsquo;t go there!</>
      ) : (
        <>
          <ChevronDoubleUpIcon className="w-4 h-4 mr-2" aria-hidden />
          <span>Next square to visit</span>
          <span className="ml-4">
            {boxStatus === "notStarted" ? "-" : targetSquare}
          </span>
        </>
      )}
    </motion.div>
  )
}

export default CurrentMoveBox

import React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { BoardState } from "./GameState"
import { Square } from "./ChessLogic"
import classNames from "classnames"
import { ChevronDoubleUpIcon } from "@heroicons/react/solid"

interface CurrentMoveBoxProps {
  state: BoardState
  targetSquare?: Square
  attackEndsGame?: boolean
}

function getReactKey(state: BoardState, targetSquare: Square | undefined) {
  // Key determines which state changes get animated
  switch (state.id) {
    case "PAUSED":
    case "PLAYING":
      return targetSquare ? `next_${targetSquare}` : "other"
    case "CAPTURED":
    case "KNIGHT_ATTACKED":
      return "attacked"
    case "FINISHED":
      return "finished"
    default:
      return "other"
  }
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
          state.id === "NOT_STARTED" || shouldReduceMotion
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
          state.id === "FINISHED"
            ? "bg-green-700 text-white"
            : state.id === "CAPTURED" || state.id === "KNIGHT_ATTACKED"
            ? "bg-red-600 text-white"
            : state.id === "NOT_STARTED" || !targetSquare
            ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-100"
            : "bg-yellow-700 text-white"
        )}
      >
        {state.id === "FINISHED" ? (
          <>Puzzle complete. Nicely done!</>
        ) : state.id === "CAPTURED" ||
          (state.id === "KNIGHT_ATTACKED" && attackEndsGame) ? (
          <>Oops, game over! Try again.</>
        ) : state.id === "KNIGHT_ATTACKED" ? (
          <>Oops, can't go there!</>
        ) : (
          <>
            <ChevronDoubleUpIcon className="w-4 h-4 mr-2" aria-hidden={true} />
            <span>Next square to visit</span>
            <span className="ml-4">
              {state.id === "NOT_STARTED" || !targetSquare ? "-" : targetSquare}
            </span>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default CurrentMoveBox

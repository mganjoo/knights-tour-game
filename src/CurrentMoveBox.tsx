import React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { BoardState } from "./Board"
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
  switch (state) {
    case "PLAYING":
      return `next_${targetSquare}`
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
          state === "NOT_STARTED" || shouldReduceMotion
            ? { opacity: 0, y: 0, scale: 0.9 }
            : {
                opacity: 0,
                y: 50,
                scale: 0.4,
              }
        }
        animate={targetStyle}
        className={classNames(
          "py-2 px-4 text-sm font-medium flex items-center space-x-2 text-white lg:text-base",
          state === "FINISHED"
            ? "bg-green-700"
            : state === "CAPTURED" || state === "KNIGHT_ATTACKED"
            ? "bg-red-600 text-white"
            : state === "NOT_STARTED"
            ? "bg-blue-gray-200 text-blue-gray-600 dark:bg-blue-gray-700 dark:text-blue-gray-100"
            : "bg-yellow-700"
        )}
      >
        {state === "FINISHED" ? (
          <>Puzzle complete. Nicely done!</>
        ) : state === "CAPTURED" ||
          (state === "KNIGHT_ATTACKED" && attackEndsGame) ? (
          <>Oops, game over! Try again.</>
        ) : state === "KNIGHT_ATTACKED" ? (
          <>Oops, can't go there!</>
        ) : (
          <>
            <ChevronDoubleUpIcon className="w-4 h-4" />
            <span>Next square to visit</span>
            <span className="text-base lg:text-lg">{targetSquare || "-"}</span>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default CurrentMoveBox

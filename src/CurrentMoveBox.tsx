import React from "react"
import { motion } from "framer-motion"
import { BoardState } from "./Board"
import { Square } from "./ChessLogic"
import classNames from "classnames"
import { ChevronDoubleUpIcon } from "@heroicons/react/solid"

interface CurrentMoveBoxProps {
  state: BoardState
  targetSquare?: Square
}

const CurrentMoveBox: React.FC<CurrentMoveBoxProps> = ({
  state,
  targetSquare,
}) => {
  const key = state === "FINISHED" ? "finished" : `next_${targetSquare}`
  const targetStyle = { opacity: 1, y: 0, scale: 1 }
  return (
    <div className="flex justify-center">
      <motion.div
        key={key}
        initial={
          state === "NOT_STARTED"
            ? targetStyle
            : { opacity: 0, y: 50, scale: 0.4 }
        }
        animate={targetStyle}
        className={classNames(
          "py-2 px-4 text-sm font-medium flex items-center space-x-2 text-white lg:text-base",
          state === "FINISHED"
            ? "bg-green-700 justify-center"
            : state === "NOT_STARTED"
            ? "bg-blue-gray-200 text-blue-gray-600"
            : "bg-yellow-700 justify-between"
        )}
      >
        {state === "FINISHED" ? (
          <span>Puzzle complete. Nicely done!</span>
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

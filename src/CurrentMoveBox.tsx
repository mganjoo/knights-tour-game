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
  return (
    <div className="flex justify-center my-3 md:my-8">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 100, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={classNames(
          "py-2 px-3 text-base font-medium flex items-center space-x-3 text-white md:text-lg",
          state === "FINISHED"
            ? "bg-green-700 justify-center"
            : "bg-yellow-700 justify-between"
        )}
      >
        {state === "FINISHED" ? (
          <span className="text-sm md:text-base">
            Puzzle complete. Nicely done!
          </span>
        ) : (
          <>
            <ChevronDoubleUpIcon className="w-4 h-4" />
            <span className="uppercase text-xs lg:text-sm">
              Next square to visit
            </span>
            <span className="text-base lg:text-lg">{targetSquare}</span>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default CurrentMoveBox

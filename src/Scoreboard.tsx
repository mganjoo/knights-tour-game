import React from "react"
import { motion, useReducedMotion } from "framer-motion"

interface ScoreboardProps {
  tickers: {
    label: string
    value: string | number | undefined
  }[]
}

const Scoreboard: React.FC<ScoreboardProps> = ({ tickers }) => {
  const printValue = (s: string | number | undefined) =>
    s !== undefined ? s : "-"
  // Reduce animation of box transition if user has enabled reduce motion
  const shouldReduceMotion = useReducedMotion()
  return (
    <div className="grid grid-cols-4 items-start md:grid-cols-2 md:gap-y-4">
      {tickers.map(({ label, value }) => (
        <div key={label} className="flex flex-col-reverse items-center">
          <span className="uppercase text-xs text-center md:text-sm">
            {label}
          </span>
          <motion.span
            key={printValue(value)}
            className="text-lg mb-1 md:text-2xl"
            animate={{ opacity: 1, scale: 1 }}
            initial={
              shouldReduceMotion
                ? { opacity: 0.4, scale: 0.9 }
                : { opacity: 0.4, scale: 0.5 }
            }
          >
            {printValue(value)}
          </motion.span>
        </div>
      ))}
    </div>
  )
}

export default Scoreboard

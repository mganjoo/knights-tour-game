import { motion, useReducedMotion } from "framer-motion"
import React from "react"

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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(4rem,1fr)_minmax(4rem,1fr))] items-start gap-x-1 md:grid-cols-2 md:gap-y-3">
      {tickers.map(({ label, value }) => (
        <div key={label} className="flex flex-col-reverse gap-y-1 items-center">
          <span className="uppercase text-xs text-center md:text-sm">
            {label}
          </span>
          <motion.span
            key={printValue(value)}
            className="text-lg md:text-2xl"
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

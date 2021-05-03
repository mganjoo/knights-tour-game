import React from "react"
import { motion } from "framer-motion"

interface ScoreboardProps {
  tickers: {
    label: string
    value?: string | number | null
  }[]
}

const Scoreboard: React.FC<ScoreboardProps> = ({ tickers }) => {
  const printValue = (s: string | number | null | undefined) =>
    s !== undefined && s !== null ? s : "-"
  return (
    <div className="grid grid-cols-4 items-start md:grid-cols-2 md:gap-y-4">
      {tickers.map(({ label, value }) => (
        <div key={label} className="flex flex-col-reverse items-center">
          <span className="uppercase text-xs text-center md:text-sm">
            {label}
          </span>
          <motion.span
            key={printValue(value)}
            className="text-lg mb-1 sm:text-xl md:text-2xl"
            animate={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0.4, scale: 0.5 }}
          >
            {printValue(value)}
          </motion.span>
        </div>
      ))}
    </div>
  )
}

export default Scoreboard

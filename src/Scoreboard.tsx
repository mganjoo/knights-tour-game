import React from "react"
import { motion } from "framer-motion"

interface ScoreboardProps {
  tickers: {
    label: string
    value?: string | number
  }[]
}

const Scoreboard: React.FC<ScoreboardProps> = ({ tickers }) => {
  return (
    <div className="grid grid-cols-4 my-4 items-start md:my-5 md:grid-cols-2 md:gap-y-4">
      {tickers.map(({ label, value }) => (
        <div key={label} className="flex flex-col-reverse items-center">
          <span className="uppercase text-xs text-center md:text-sm">
            {label}
          </span>
          <motion.span
            key={value !== undefined ? value : "-"}
            className="text-lg mb-1 sm:text-xl md:text-2xl"
            animate={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.3 }}
          >
            {value !== undefined ? value : "-"}
          </motion.span>
        </div>
      ))}
    </div>
  )
}

export default Scoreboard

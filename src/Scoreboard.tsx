import React from "react"

interface ScoreboardProps {
  tickers: {
    label: string
    value: string | number
  }[]
}

const Scoreboard: React.FC<ScoreboardProps> = ({ tickers }) => {
  return (
    <div className="flex justify-evenly">
      {tickers.map(({ label, value }) => (
        <div key={label} className="flex flex-col-reverse items-center">
          <span className="uppercase text-xs">{label}</span>
          <span className="text-3xl">{value}</span>
        </div>
      ))}
    </div>
  )
}

export default Scoreboard

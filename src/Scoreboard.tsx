import React from "react"

interface ScoreboardProps {
  tickers: {
    label: string
    value?: string | number
  }[]
}

const Scoreboard: React.FC<ScoreboardProps> = ({ tickers }) => {
  return (
    <div className="flex flex-wrap justify-evenly my-3 md:justify-start md:space-x-5">
      {tickers.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col-reverse items-center py-1 px-1"
        >
          <span className="uppercase text-xs flex items-center">{label}</span>
          <span className="text-2xl my-1 md:text-3xl">
            {value !== undefined ? value : "-"}
          </span>
        </div>
      ))}
    </div>
  )
}

export default Scoreboard

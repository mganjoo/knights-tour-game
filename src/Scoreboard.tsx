import classNames from "classnames"
import React from "react"

interface ScoreboardProps {
  tickers: {
    label: string
    value?: string | number
    textClass?: string
  }[]
}

const Scoreboard: React.FC<ScoreboardProps> = ({ tickers }) => {
  return (
    <div className="grid grid-cols-2 my-2 md:mb-3 md:mt-6">
      {tickers.map(({ label, value, textClass }) => (
        <div
          key={label}
          className="flex flex-col-reverse items-center py-1 px-1"
        >
          <span className="uppercase text-xs flex items-center lg:text-sm">
            {label}
          </span>
          <span
            className={classNames(
              "text-2xl my-1 md:text-3xl lg:text-3xl",
              textClass
            )}
          >
            {value !== undefined ? value : "-"}
          </span>
        </div>
      ))}
    </div>
  )
}

export default Scoreboard

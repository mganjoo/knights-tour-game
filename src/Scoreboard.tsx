import classNames from "classnames"
import React from "react"

interface ScoreboardProps {
  tickers: {
    label: string
    value?: string | number
    icon?: React.ComponentType<React.ComponentProps<"svg">>
    iconColorClass?: string
  }[]
}

const Scoreboard: React.FC<ScoreboardProps> = ({ tickers }) => {
  return (
    <div className="flex flex-wrap justify-evenly">
      {tickers.map(({ label, value, iconColorClass, ...other }) => (
        <div
          key={label}
          className="flex flex-col-reverse items-center py-1 px-1"
        >
          <span className="uppercase text-xs flex items-center">
            {label}
            {other.icon && (
              <other.icon
                className={classNames("h-4 w-4 ml-1", iconColorClass)}
              />
            )}
          </span>
          <span className="text-2xl my-1">
            {value !== undefined ? value : "-"}
          </span>
        </div>
      ))}
    </div>
  )
}

export default Scoreboard

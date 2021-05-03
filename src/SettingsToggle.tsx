import { Switch } from "@headlessui/react"
import classNames from "classnames"
import React from "react"

interface SettingsToggleProps {
  label: string
  enabled: boolean
  onToggle: (value: boolean) => void
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({
  label,
  enabled,
  onToggle,
}) => {
  return (
    <Switch.Group>
      <div className="flex w-full justify-start items-center mb-2">
        <Switch
          checked={enabled}
          onChange={onToggle}
          className={classNames(
            enabled ? "bg-light-blue-700" : "bg-gray-300",
            "relative inline-flex items-center flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          )}
        >
          <span
            aria-hidden="true"
            className={classNames(
              enabled ? "translate-x-6" : "translate-x-0",
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200"
            )}
          />
        </Switch>
        <Switch.Label className="ml-2 text-xs md:text-sm lg:text-base md:ml-3">
          {label}
        </Switch.Label>
      </div>
    </Switch.Group>
  )
}

export default SettingsToggle

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
      <div className="flex items-center gap-x-2 md:gap-x-3">
        <Switch
          checked={enabled}
          onChange={onToggle}
          className={classNames(
            enabled
              ? "bg-blue-700 dark:bg-blue-600"
              : "bg-gray-300 dark:bg-gray-400",
            "relative inline-flex items-center shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-gray-900"
          )}
        >
          <span
            aria-hidden="true"
            className={classNames(
              enabled ? "translate-x-5" : "translate-x-0",
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition ease-in-out duration-200"
            )}
          />
        </Switch>
        <Switch.Label className="text-sm md:text-base">{label}</Switch.Label>
      </div>
    </Switch.Group>
  )
}

export default SettingsToggle

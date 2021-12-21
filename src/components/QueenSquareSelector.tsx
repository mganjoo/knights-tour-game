import { Listbox, Transition } from "@headlessui/react"
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid"
import classNames from "classnames"
import React, { Fragment } from "react"
import { CANDIDATE_QUEEN_SQUARES, QueenSquare } from "../game/ChessLogic"
interface QueenSquareSelectorProps {
  selected: QueenSquare
  setSelected: (s: QueenSquare) => void
}

const QueenSquareSelector: React.FC<QueenSquareSelectorProps> = ({
  selected,
  setSelected,
}) => {
  return (
    <Listbox value={selected} onChange={setSelected}>
      {({ open }) => (
        <div className="flex justify-center items-center gap-x-2 md:gap-x-3">
          <div className="relative">
            <Listbox.Button className="flex justify-around items-center gap-x-4 w-full pl-3 pr-2 py-3 text-gray-900 text-sm bg-white rounded-lg text-left shadow-md cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:bg-gray-600 dark:text-white dark:shadow-none dark:focus-visible:ring-offset-gray-900 md:gap-x-5 md:text-base">
              <span>{selected}</span>
              <SelectorIcon
                className="w-5 h-5 pointer-events-none text-gray-400 dark:text-gray-300"
                aria-hidden="true"
              />
            </Listbox.Button>
            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                static
                className="absolute w-full py-2 mb-1 bottom-full overflow-auto z-10 bg-white rounded-md shadow-lg text-sm max-h-96 ring-1 ring-gray-900 ring-opacity-5 focus:outline-none dark:ring-gray-500 dark:bg-gray-600 md:text-base"
              >
                {CANDIDATE_QUEEN_SQUARES.map((square) => (
                  <Listbox.Option
                    key={square}
                    className={({ active }) =>
                      classNames(
                        active
                          ? "text-blue-900 bg-blue-200 dark:text-white dark:bg-blue-500"
                          : "text-gray-900 dark:text-white",
                        "cursor-default select-none relative text-right pr-3 py-3"
                      )
                    }
                    value={square}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={classNames(
                            selected ? "font-medium" : "font-normal",
                            "block"
                          )}
                        >
                          {square}
                        </span>
                        {selected ? (
                          <span
                            className={classNames(
                              "absolute inset-y-0 left-2 flex items-center text-blue-600",
                              active ? "dark:text-white" : "dark:text-blue-400"
                            )}
                          >
                            <CheckIcon className="w-4 h-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
          <Listbox.Label className="text-sm md:text-base">
            Change queen square
          </Listbox.Label>
        </div>
      )}
    </Listbox>
  )
}

export default QueenSquareSelector

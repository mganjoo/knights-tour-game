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
        <div className="flex justify-center items-center gap-x-2 py-2 md:gap-x-3">
          <div className="w-16 md:w-20">
            <div className="relative">
              <Listbox.Button className="relative w-full pl-3 pr-10 py-2 text-gray-900 text-sm bg-white rounded-lg text-left shadow-md cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:bg-gray-600 dark:text-white dark:shadow-none dark:focus-visible:ring-offset-gray-900 md:text-base">
                <span>{selected}</span>
                <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  <SelectorIcon
                    className="w-5 h-5 text-gray-400 dark:text-gray-300"
                    aria-hidden="true"
                  />
                </span>
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
                  className="absolute w-full py-1 mb-1 bottom-full overflow-auto z-10 bg-white rounded-md shadow-lg text-sm max-h-72 ring-1 ring-gray-900 ring-opacity-5 focus:outline-none dark:ring-gray-500 dark:bg-gray-600 md:text-base"
                >
                  {CANDIDATE_QUEEN_SQUARES.map((square) => (
                    <Listbox.Option
                      key={square}
                      className={({ active }) =>
                        classNames(
                          active
                            ? "text-blue-900 bg-blue-200 dark:text-white dark:bg-blue-500"
                            : "text-gray-900 dark:text-white",
                          "cursor-default select-none relative text-right py-2 pl-10 pr-4"
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
                                "absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600",
                                active
                                  ? "dark:text-white"
                                  : "dark:text-blue-400"
                              )}
                            >
                              <CheckIcon
                                className="w-5 h-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
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

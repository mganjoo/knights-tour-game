import { Listbox, Transition } from "@headlessui/react"
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid"
import classNames from "classnames"
import React, { Fragment } from "react"

const CANDIDATE_QUEEN_SQUARES = ["d5", "d4", "d2", "e5", "e4", "e2"] as const

export type QueenSquare = typeof CANDIDATE_QUEEN_SQUARES[number]

export function isQueenSquare(s: string): s is QueenSquare {
  return CANDIDATE_QUEEN_SQUARES.includes(s as QueenSquare)
}

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
        <div className="flex justify-start items-center mb-2">
          <div className="w-16 md:w-20">
            <div className="relative">
              <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-blue-gray-900 text-sm bg-white rounded-lg text-left shadow-md cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-light-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-gray-100 md:text-base">
                <span className="block">{selected}</span>
                <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  <SelectorIcon
                    className="w-5 h-5 text-blue-gray-400"
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
                  className="absolute w-full py-1 mb-1 bottom-full overflow-auto bg-white rounded-md shadow-lg text-sm max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none md:text-base"
                >
                  {CANDIDATE_QUEEN_SQUARES.map((square) => (
                    <Listbox.Option
                      key={square}
                      className={({ active }) =>
                        classNames(
                          active
                            ? "text-light-blue-900 bg-light-blue-200"
                            : "text-blue-gray-900",
                          "cursor-default select-none relative text-right py-2 pl-10 pr-4"
                        )
                      }
                      value={square}
                    >
                      {({ selected }) => (
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
                            <span className="text-light-blue-600 absolute inset-y-0 left-0 flex items-center pl-3">
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
          <Listbox.Label className="ml-2 text-sm md:text-base md:ml-3">
            Change queen square
          </Listbox.Label>
        </div>
      )}
    </Listbox>
  )
}

export default QueenSquareSelector

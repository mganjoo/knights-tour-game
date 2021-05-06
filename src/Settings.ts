import { useLocalStorage } from "react-use"
import { Boolean, Number, String } from "runtypes"
import { isQueenSquare, QueenSquare } from "./ChessLogic"

export function useFlag(key: string): [boolean, (b: boolean) => void] {
  const [flag, setFlag] = useLocalStorage(key, false)
  return [Boolean.guard(flag) ? flag : false, setFlag]
}

const NonNegative = Number.withConstraint((n) => n >= 0)

export function useNonNegative(
  key: string
): [number | undefined, (n: number) => void] {
  const [number, setNumber] = useLocalStorage(key)
  return [NonNegative.guard(number) ? number : undefined, setNumber]
}

const QueenSquareType = String.withGuard(isQueenSquare)

export function useQueenSquareChoice(
  key: string,
  defaultValue: QueenSquare
): [QueenSquare, (s: QueenSquare) => void] {
  const [square, setSquare] = useLocalStorage<QueenSquare>(key, defaultValue)
  return [QueenSquareType.guard(square) ? square : defaultValue, setSquare]
}

import { useLocalStorage } from "react-use"
import { Boolean, String } from "runtypes"
import { isQueenSquare, QueenSquare } from "./ChessLogic"

export const QueenSquareType = String.withGuard(isQueenSquare)

export function useFlag(key: string): [boolean, (b: boolean) => void] {
  const [flag, setFlag] = useLocalStorage(key, false)
  return [Boolean.guard(flag) ? flag : false, setFlag]
}

export function useQueenSquareChoice(
  key: string,
  defaultValue: QueenSquare
): [QueenSquare, (s: QueenSquare) => void] {
  const [square, setSquare] = useLocalStorage<QueenSquare>(key, defaultValue)
  return [QueenSquareType.guard(square) ? square : defaultValue, setSquare]
}

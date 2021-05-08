import { useEffect } from "react"
import { useLocalStorage } from "react-use"
import {
  Boolean,
  Number,
  String,
  Dictionary,
  Record,
  Static,
  Optional,
} from "runtypes"
import { isQueenSquare, QueenSquare, DEFAULT_QUEEN_SQUARE } from "./ChessLogic"

export function useFlag(key: string): [boolean, (b: boolean) => void] {
  const [flag, setFlag] = useLocalStorage(key, false)
  return [Boolean.guard(flag) ? flag : false, setFlag]
}

const NonNegative = Number.withConstraint((n) => n >= 0)

export function useNonNegative(
  key: string
): [number | undefined, (n: number) => void, () => void] {
  const [number, setNumber, deleteNumber] = useLocalStorage(key)
  return [
    NonNegative.guard(number) ? number : undefined,
    setNumber,
    deleteNumber,
  ]
}

const QueenSquareType = String.withGuard(isQueenSquare)

export function useQueenSquareChoice(
  key: string,
  defaultValue: QueenSquare
): [QueenSquare, (s: QueenSquare) => void] {
  const [square, setSquare] = useLocalStorage<QueenSquare>(key, defaultValue)
  return [QueenSquareType.guard(square) ? square : defaultValue, setSquare]
}

const BestScoresType = Record({
  bestMoves: NonNegative,
  bestSeconds: NonNegative,
})
const BestScoresMapType = Dictionary(Optional(BestScoresType), QueenSquareType)
export type BestScoresMap = Static<typeof BestScoresMapType>
const DEFAULT_BEST_SCORES_MAP = {} as BestScoresMap

interface UseBestScoresArgs {
  queenSquare: QueenSquare
  numMoves: number
  elapsedMs: number
}

export function useBestScores(key: string) {
  const [bestScoresMap, setBestScoresMap] = useLocalStorage<BestScoresMap>(
    key,
    DEFAULT_BEST_SCORES_MAP
  )
  const [v1BestSeconds, , deleteV1BestSeconds] = useNonNegative(
    "v1.best_seconds"
  )
  const [v1BestMoves, , deleteV1BestMoves] = useNonNegative("v1.best_num_moves")

  // One-time upgrade from v1 format
  useEffect(() => {
    if (
      v1BestMoves &&
      v1BestSeconds &&
      BestScoresMapType.guard(bestScoresMap)
    ) {
      setBestScoresMap({
        ...bestScoresMap,
        [DEFAULT_QUEEN_SQUARE]: {
          bestMoves: v1BestMoves,
          bestSeconds: v1BestSeconds,
        },
      })
      deleteV1BestMoves()
      deleteV1BestSeconds()
    }
  }, [
    bestScoresMap,
    deleteV1BestMoves,
    deleteV1BestSeconds,
    setBestScoresMap,
    v1BestMoves,
    v1BestSeconds,
  ])

  return {
    bestScoresMap: bestScoresMap || DEFAULT_BEST_SCORES_MAP,
    updateBestScores: (args: UseBestScoresArgs) => {
      const { queenSquare, numMoves, elapsedMs } = args
      const elapsedSeconds = Math.round(elapsedMs / 1000)
      if (BestScoresMapType.guard(bestScoresMap)) {
        const bestScores = bestScoresMap[queenSquare]
        const newBestMoves =
          !BestScoresType.guard(bestScores) || numMoves < bestScores.bestMoves
            ? numMoves
            : bestScores.bestMoves
        const newBestSeconds =
          !BestScoresType.guard(bestScores) ||
          elapsedSeconds < bestScores.bestSeconds
            ? elapsedSeconds
            : bestScores.bestSeconds
        if (
          newBestMoves !== bestScores?.bestMoves ||
          newBestSeconds !== bestScores?.bestSeconds
        ) {
          setBestScoresMap({
            ...bestScoresMap,
            [queenSquare]: {
              bestMoves: newBestMoves,
              bestSeconds: elapsedSeconds,
            },
          })
        }
      } else {
        setBestScoresMap({
          ...DEFAULT_BEST_SCORES_MAP,
          [queenSquare]: {
            bestMoves: numMoves,
            bestSeconds: elapsedSeconds,
          },
        })
      }
    },
  }
}

import { useEffect } from "react"
import { useLocalStorage } from "react-use"
import { Number, Dictionary, Record, Static, Optional } from "runtypes"
import { QueenSquare, DEFAULT_QUEEN_SQUARE } from "./ChessLogic"
import { QueenSquareType } from "./Settings"

const Positive = Number.withConstraint((n) => n > 0)

function usePositive(
  key: string
): [number | undefined, (n: number) => void, () => void] {
  const [number, setNumber, deleteNumber] = useLocalStorage(key)
  return [Positive.guard(number) ? number : undefined, setNumber, deleteNumber]
}
const BestScoresV1Type = Record({
  bestMoves: Positive,
  bestSeconds: Positive,
})
const BestScoresMapV1Type = Dictionary(
  Optional(BestScoresV1Type),
  QueenSquareType
)
const BestScoresType = Record({
  bestNumMoves: Positive,
  bestElapsedMs: Positive,
})
const BestScoresMapType = Dictionary(Optional(BestScoresType), QueenSquareType)

export type BestScoresMap = Static<typeof BestScoresMapType>

const DEFAULT_BEST_SCORES_MAP = {} as BestScoresMap

interface UseBestScoresArgs {
  queenSquare: QueenSquare
  numMoves: number
  elapsedMs: number
}

export function useBestScores() {
  const [bestScoresMap, setBestScoresMap] = useLocalStorage<BestScoresMap>(
    "v2.best_scores",
    DEFAULT_BEST_SCORES_MAP
  )
  const [v1BestScoresMap, , deleteV1BestScoresMap] = useLocalStorage(
    "v1.best_scores"
  )
  const [v1BestSeconds, , deleteV1BestSeconds] = usePositive("v1.best_seconds")
  const [v1BestMoves, , deleteV1BestMoves] = usePositive("v1.best_num_moves")

  // One-time upgrade from v1 format of single scores
  useEffect(() => {
    if (
      v1BestMoves &&
      v1BestSeconds &&
      BestScoresMapType.guard(bestScoresMap)
    ) {
      setBestScoresMap({
        ...bestScoresMap,
        [DEFAULT_QUEEN_SQUARE]: {
          bestNumMoves: v1BestMoves,
          bestElapsedMs: v1BestSeconds * 1000,
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

  // One-time upgrade from v1 format of combined scores map
  useEffect(() => {
    if (v1BestScoresMap && BestScoresMapV1Type.guard(v1BestScoresMap)) {
      const newBestScoresMap = Object.entries(v1BestScoresMap).reduce(
        (acc, [square, scores]) =>
          scores === undefined
            ? acc
            : {
                ...acc,
                [square]: {
                  bestNumMoves: scores.bestMoves,
                  bestElapsedMs: scores.bestSeconds * 1000,
                },
              },
        {} as BestScoresMap
      )
      setBestScoresMap(newBestScoresMap)
      deleteV1BestScoresMap()
    }
  }, [
    bestScoresMap,
    deleteV1BestMoves,
    deleteV1BestScoresMap,
    deleteV1BestSeconds,
    setBestScoresMap,
    v1BestMoves,
    v1BestScoresMap,
    v1BestSeconds,
  ])
  const bestScoresMapResolved = BestScoresMapType.guard(bestScoresMap)
    ? bestScoresMap
    : DEFAULT_BEST_SCORES_MAP

  return {
    bestScoresMap: bestScoresMapResolved,
    updateBestScores: (args: UseBestScoresArgs) => {
      const { queenSquare, numMoves, elapsedMs } = args
      const bestScores = bestScoresMapResolved[queenSquare]
      const newBestNumMoves =
        !BestScoresType.guard(bestScores) || numMoves < bestScores.bestNumMoves
          ? numMoves
          : bestScores.bestNumMoves
      const newBestElapsedMs =
        !BestScoresType.guard(bestScores) ||
        elapsedMs < bestScores.bestElapsedMs
          ? elapsedMs
          : bestScores.bestElapsedMs
      if (
        newBestNumMoves !== bestScores?.bestNumMoves ||
        newBestElapsedMs !== bestScores?.bestElapsedMs
      ) {
        setBestScoresMap({
          ...bestScoresMapResolved,
          [queenSquare]: {
            bestNumMoves: newBestNumMoves,
            bestElapsedMs: newBestElapsedMs,
          },
        })
      }
    },
  }
}

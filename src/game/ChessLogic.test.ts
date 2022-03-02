import * as fc from "fast-check"
import {
  attackedByQueen,
  getKnightDests,
  getPuzzleKnightPath,
  getShortestKnightPath,
  getSquareIncrement,
  incrementWhileAttacked,
  isSquare,
  Square,
  SQUARES,
} from "./ChessLogic"

function toRankFile(square: Square): [number, number] {
  return [
    parseInt(square.charAt(1), 10),
    square.charCodeAt(0) - "a".charCodeAt(0) + 1,
  ]
}

function toSquare(rank: number, file: number): Square | undefined {
  if (1 <= rank && rank <= 8 && 1 <= file && file <= 8) {
    const maybeSquare =
      String.fromCharCode("a".charCodeAt(0) + file - 1) + rank.toString()
    if (maybeSquare && isSquare(maybeSquare)) {
      return maybeSquare
    } else {
      return undefined
    }
  } else {
    return undefined
  }
}

test("attackedByQueen() works for squares vert, diagonally, or horizontally away", () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...SQUARES),
      fc.constantFrom(...SQUARES),
      (square, queenSquare) => {
        const [rank, file] = toRankFile(square)
        const [queenRank, queenFile] = toRankFile(queenSquare)
        const expected =
          // horizontally separated
          (rank === queenRank && file !== queenFile) ||
          // vertically separated
          (rank !== queenRank && file === queenFile) ||
          // diagonally separated (but not the same square)
          (square !== queenSquare &&
            Math.abs(rank - queenRank) === Math.abs(file - queenFile))

        expect(attackedByQueen(square, queenSquare)).toEqual(expected)
      }
    )
  )
})

test("getKnightDests() returns a correct set of knight moves", () => {
  fc.assert(
    fc.property(
      fc
        .tuple(
          fc.constantFrom(...SQUARES),
          fc.option(fc.constantFrom(...SQUARES), { nil: undefined })
        )
        .filter((t) => t[0] !== t[1]),
      fc.option(fc.boolean(), { nil: undefined }),
      ([square, queenSquare], excludeAttackedSquares) => {
        const [rank, file] = toRankFile(square)
        const offsets = [
          [-2, -1],
          [-2, 1],
          [-1, 2],
          [1, 2],
          [2, 1],
          [2, -1],
          [1, -2],
          [-1, -2],
        ]
        const expected = offsets
          .map(([rankOff, fileOff]) => {
            const newRank = rank + rankOff
            const newFile = file + fileOff
            return toSquare(newRank, newFile)
          })
          .filter(
            (s) =>
              s !== undefined &&
              s !== queenSquare &&
              (!queenSquare ||
                !excludeAttackedSquares ||
                !attackedByQueen(s, queenSquare))
          )

        expect(
          getKnightDests(square, { queenSquare, excludeAttackedSquares }).sort()
        ).toEqual(expected.sort())
      }
    )
  )
})

describe("getSquareIncrement()", () => {
  test("returns the correct previous square", () => {
    fc.assert(
      fc.property(fc.constantFrom(...SQUARES), (square) => {
        const [rank, file] = toRankFile(square)
        let newFile = file - 1
        let newRank = rank
        if (newFile === 0) {
          newFile = 8
          newRank = rank - 1
          if (newRank === 0) {
            newFile = 8
            newRank = 8
          }
        }
        expect(getSquareIncrement(square, "previousFile")).toEqual(
          toSquare(newRank, newFile)
        )
      })
    )
  })

  test("returns the correct next square", () => {
    fc.assert(
      fc.property(fc.constantFrom(...SQUARES), (square) => {
        const [rank, file] = toRankFile(square)
        let newFile = file + 1
        let newRank = rank
        if (newFile > 8) {
          newFile = 1
          newRank = rank + 1
          if (newRank > 8) {
            newFile = 1
            newRank = 1
          }
        }
        expect(getSquareIncrement(square, "nextFile")).toEqual(
          toSquare(newRank, newFile)
        )
      })
    )
  })
})

test("incrementWhileAttacked() works correctly in both directions", () => {
  expect(incrementWhileAttacked("f7", "c4", "previousFile")).toEqual("e7")
  expect(incrementWhileAttacked("e6", "d5", "previousFile")).toEqual("b6")
  expect(incrementWhileAttacked("c7", "e4", "previousFile")).toEqual("c7")

  expect(incrementWhileAttacked("b4", "d2", "nextFile")).toEqual("c4")
  expect(incrementWhileAttacked("d5", "e4", "nextFile")).toEqual("g5")
  expect(incrementWhileAttacked("e8", "d4", "nextFile")).toEqual("e8")
})

test("getShortestKnightPath() works correctly", () => {
  expect(getShortestKnightPath("c8", "d5", "d4")).toBeUndefined()
  expect(getShortestKnightPath("c8", "g5", "d4")?.length).toEqual(6)
  expect(getShortestKnightPath("h6", "b3", "e5")?.length).toEqual(6)
  expect(getShortestKnightPath("h6", "g4", "e5")?.length).toEqual(2)
})

test("getPuzzleKnightPath() works correctly", () => {
  // prettier-ignore
  expect(getPuzzleKnightPath("f8", "g7", "d5")).toEqual([
    "f8", "h7", "f6", "e8", "f6", "h7", "f8", "g6", "e7",
    "c8", "e7", "g6", "f8", "h7", "f6", "e8", "c7", "a6",
    "b8", "a6", "c7", "e8", "f6", "h7", "f6", "e8", "g7",
  ])
  expect(getPuzzleKnightPath("h8", "a1", "a5")).toBeUndefined()
})

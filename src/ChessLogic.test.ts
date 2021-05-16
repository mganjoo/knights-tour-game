import { Chessground } from "chessground"
import * as fc from "fast-check"
import {
  attackedByQueen,
  getKnightDests,
  getPuzzleFen,
  getSquareIncrement,
  isSquare,
  Square,
  SQUARES,
} from "./ChessLogic"

describe("getPuzzleFen()", () => {
  test("generates correct puzzle FEN with knight and queen", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SQUARES),
        fc.option(fc.constantFrom(...SQUARES), { nil: undefined }),
        (knightSquare, queenSquare) => {
          // dummy element for Chessground to use
          const wrapper = document.createElement("div")
          const chessground = Chessground(wrapper, {
            fen: getPuzzleFen(knightSquare, queenSquare),
          })
          // verify placement of pieces using Chessground internal state
          expect(chessground.state.pieces.get(knightSquare)).toStrictEqual(
            // If knight square and queen square are the same, queen square wins
            knightSquare === queenSquare
              ? { role: "queen", color: "black" }
              : {
                  role: "knight",
                  color: "white",
                }
          )
          expect(
            queenSquare && chessground.state.pieces.get(queenSquare)
          ).toStrictEqual(
            queenSquare
              ? {
                  role: "queen",
                  color: "black",
                }
              : undefined
          )
          chessground.destroy()
          wrapper.remove()
        }
      )
    )
  })
})

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

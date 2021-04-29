import {
  attackedByQueen,
  getKnightDests,
  getPuzzleFen,
  isSquare,
  Square,
  SQUARES,
} from "./ChessLogic"
import * as fc from "fast-check"
import { Chessground } from "chessground"

describe("getPuzzleFen()", () => {
  test("generates correct puzzle FEN with knight and queen", () => {
    fc.assert(
      fc.property(
        fc
          .tuple(fc.constantFrom(...SQUARES), fc.constantFrom(...SQUARES))
          .filter((t) => t[0] !== t[1]),
        ([knightSquare, queenSquare]) => {
          // dummy element for Chessground to use
          const wrapper = document.createElement("div")
          const chessground = Chessground(wrapper, {
            fen: getPuzzleFen(knightSquare, queenSquare),
          })
          // verify placement of pieces using Chessground internal state
          expect(chessground.state.pieces.get(knightSquare)).toStrictEqual({
            role: "knight",
            color: "white",
          })
          expect(chessground.state.pieces.get(queenSquare)).toStrictEqual({
            role: "queen",
            color: "black",
          })
          chessground.destroy()
          wrapper.remove()
        }
      )
    )
  })

  test("does not generate FEN if both knight and queen have same square", () => {
    fc.assert(
      fc.property(fc.constantFrom(...SQUARES), (square) => {
        expect(getPuzzleFen(square, square)).toBeUndefined()
      })
    )
  })
})

function toRankFile(square: Square): [number, number] {
  return [
    square.charCodeAt(0) - "a".charCodeAt(0) + 1,
    parseInt(square.charAt(1), 10),
  ]
}

function toSquare(rank: number, file: number): Square | undefined {
  if (1 <= rank && rank <= 8 && 1 <= file && file <= 8) {
    const maybeSquare =
      String.fromCharCode("a".charCodeAt(0) + rank - 1) + file.toString()
    if (maybeSquare && isSquare(maybeSquare)) {
      return maybeSquare
    } else {
      return undefined
    }
  } else {
    return undefined
  }
}

test("getKnightDests() returns a correct set of knight moves", () => {
  fc.assert(
    fc.property(fc.constantFrom(...SQUARES), (square) => {
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
        .filter((s) => s !== undefined)
        .sort()

      expect(getKnightDests(square).sort()).toEqual(expected)
    })
  )
})

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

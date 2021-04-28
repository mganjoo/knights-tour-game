import { getPuzzleFen, SQUARES } from "./ChessLogic"
import * as ChessJS from "chess.js"
import * as fc from "fast-check"

const Chess = typeof ChessJS === "function" ? ChessJS : ChessJS.Chess

test("generated puzzle FEN correctly places knight and queen squares", () => {
  fc.assert(
    fc.property(
      fc
        .tuple(fc.constantFrom(...SQUARES), fc.constantFrom(...SQUARES))
        .filter((t) => t[0] !== t[1]),
      ([knightSquare, queenSquare]) => {
        const chess = new Chess(getPuzzleFen(knightSquare, queenSquare))
        expect(chess.get(knightSquare)).toStrictEqual({
          type: "n",
          color: "w",
        })
        expect(chess.get(queenSquare)).toStrictEqual({
          type: "q",
          color: "b",
        })
      }
    )
  )
})

test("no FEN is generated if both knight and queen have same square", () => {
  fc.assert(
    fc.property(fc.constantFrom(...SQUARES), (square) => {
      expect(getPuzzleFen(square, square)).toBeUndefined()
    })
  )
})

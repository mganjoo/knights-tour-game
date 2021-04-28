import { getPuzzleFen, SQUARES } from "./ChessLogic"
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

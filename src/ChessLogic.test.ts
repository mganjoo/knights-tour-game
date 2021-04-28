import { getPuzzleFen, Square } from "./ChessLogic"
import * as ChessJS from "chess.js"

const Chess = typeof ChessJS === "function" ? ChessJS : ChessJS.Chess

test("generates puzzle FEN correctly", () => {
  const tests: { knightSquare: Square; queenSquare: Square }[] = [
    { knightSquare: "g7", queenSquare: "b5" },
    { knightSquare: "a3", queenSquare: "h8" },
    { knightSquare: "a1", queenSquare: "f6" },
    { knightSquare: "c4", queenSquare: "d3" },
    { knightSquare: "e4", queenSquare: "e2" },
  ]

  tests.forEach(({ knightSquare, queenSquare }) => {
    const chess = new Chess(getPuzzleFen(knightSquare, queenSquare))
    expect(chess.get(knightSquare)).toStrictEqual({ type: "n", color: "w" })
    expect(chess.get(queenSquare)).toStrictEqual({ type: "q", color: "b" })
  })
})

import React, { useState } from "react"
import "./App.css"
import Board from "./Board"
import * as cg from "chessground/types"
import { ChessInstance, Square } from "chess.js"

const ChessReq = require("chess.js")

// White knight on h8, Black queen on d5
const baseFen = "7N/8/8/3q4/8/8/8/8 w - - 0 1"

function toDests(chess: ChessInstance): Map<cg.Key, cg.Key[]> {
  const dests = new Map()
  if (!chess.game_over()) {
    chess.SQUARES.forEach((square) => {
      const moves = chess.moves({ square: square, verbose: true })
      if (moves.length) {
        dests.set(
          square,
          moves.map((move) => move.to)
        )
      }
    })
  }
  return dests
}

const App: React.FC = () => {
  const [chess, setChess] = useState<ChessInstance>(new ChessReq(baseFen))

  const handleMove: (orig: cg.Key, dest: cg.Key) => void = (orig, dest) => {
    chess.move({ from: orig as Square, to: dest as Square })
    setChess(new ChessReq(chess.fen()))
  }

  return (
    <main className="max-w-xl mx-auto py-6 px-4">
      <Board
        fen={chess.fen()}
        validDests={toDests(chess)}
        handleMove={handleMove}
      />
    </main>
  )
}

export default App

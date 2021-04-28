import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Chessground } from "chessground"
import "./Board.css"
import { Api as ChessgroundApi } from "chessground/api"
import * as cg from "chessground/types"
import { Config } from "chessground/config"
import {
  getPuzzleFen,
  getKnightDests,
  Square,
  validateKnightMove,
} from "./ChessLogic"

type BoardProps = {
  initialKnightSquare: Square
  queenSquare: Square
}

const Board: React.FC<BoardProps> = ({
  initialKnightSquare,
  queenSquare,
  children,
}) => {
  const el = useRef<HTMLDivElement>(null)
  const [knightSquare, setKnightSquare] = useState<Square>(initialKnightSquare)
  const [ground, setGround] = useState<ChessgroundApi>()
  const fen = useMemo<string | undefined>(
    () => getPuzzleFen(knightSquare, queenSquare),
    [knightSquare, queenSquare]
  )
  const dests = useMemo<Map<cg.Key, cg.Key[]>>(
    () => getKnightDests(knightSquare, [queenSquare]),
    [knightSquare, queenSquare]
  )
  const handleMove = useCallback((orig: cg.Key, dest: cg.Key) => {
    if (validateKnightMove(orig as Square, dest as Square)) {
      setKnightSquare(dest as Square)
    }
  }, [])
  const config: Config = useMemo(
    () => ({
      fen: fen,
      orientation: "white",
      turnColor: "white",
      highlight: {
        lastMove: false,
      },
      animation: {
        enabled: false,
      },
      movable: {
        free: false,
        color: "white",
        dests: dests,
        events: { after: handleMove },
      },
      premovable: {
        enabled: false,
      },
      predroppable: {
        enabled: false,
      },
      drawable: {
        enabled: false,
      },
    }),
    [fen, dests, handleMove]
  )

  useEffect(() => {
    if (el.current && !ground) {
      setGround(Chessground(el.current, {}))
    }
    return () => {
      if (ground) {
        ground.destroy()
      }
    }
  }, [ground])

  useEffect(() => {
    if (ground) {
      ground.set(config)
    }
  }, [ground, config])

  return <div ref={el}>{children}</div>
}

export default Board

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Chessground } from "chessground"
import "./Board.css"
import { Api as ChessgroundApi } from "chessground/api"
import * as cg from "chessground/types"
import { Config } from "chessground/config"
import { getPuzzleFen, getKnightDests, Square } from "./ChessLogic"

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
    () =>
      new Map([[knightSquare, getKnightDests(knightSquare, [queenSquare])]]),
    [knightSquare, queenSquare]
  )
  const handleMove = useCallback(
    (orig: cg.Key, dest: cg.Key) => {
      const validDests = dests.get(orig)
      if (validDests && validDests.includes(dest) && dest !== "a0") {
        setKnightSquare(dest)
      }
    },
    [dests]
  )
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
        autoShapes: [
          {
            orig: "e4",
            customSvg:
              // "check" from https://heroicons.com/
              '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#D97706"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4L19 7"/></svg><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#D97706"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4L19 7"/></svg>',
          },
        ],
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

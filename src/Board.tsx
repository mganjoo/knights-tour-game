import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Chessground } from "chessground"
import "./Board.css"
import { Api as ChessgroundApi } from "chessground/api"
import * as cg from "chessground/types"
import { Config } from "chessground/config"
import { getPuzzleFen, getKnightDests, Square } from "./ChessLogic"
import { Set as ImmutableSet } from "immutable"

type BoardProps = {
  initialKnightSquare: Square
  queenSquare: Square
  onKnightMove?: (from: Square, to: Square) => void
  checkedSquares?: ImmutableSet<Square>
}

// "check" from https://heroicons.com/
const CHECK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clip-rule="evenodd"/></svg>'

const Board: React.FC<BoardProps> = ({
  initialKnightSquare,
  queenSquare,
  onKnightMove,
  checkedSquares,
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
      new Map([[knightSquare, getKnightDests(knightSquare, { queenSquare })]]),
    [knightSquare, queenSquare]
  )
  const handleMove = useCallback(
    (orig: cg.Key, dest: cg.Key) => {
      const validDests = dests.get(orig)
      if (
        validDests &&
        validDests.includes(dest) &&
        orig !== "a0" &&
        dest !== "a0"
      ) {
        setKnightSquare(dest)
        if (onKnightMove) {
          onKnightMove(orig, dest)
        }
      }
    },
    [dests, onKnightMove]
  )
  const config: Config = useMemo(
    () => ({
      fen: fen,
      orientation: "white",
      turnColor: "white",
      selected: knightSquare,
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
        autoShapes: checkedSquares
          ? Array.from(checkedSquares).map((s) => ({
              orig: s,
              customSvg: CHECK_SVG,
            }))
          : [],
      },
    }),
    [fen, dests, handleMove, knightSquare, checkedSquares]
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

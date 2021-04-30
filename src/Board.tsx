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
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z" clip-rule="evenodd"/></svg>'

const BASE_CHESSGROUND_CONFIG: Config = {
  orientation: "white",
  coordinates: false,
  highlight: {
    lastMove: false,
  },
  animation: {
    enabled: false,
  },
  movable: {
    free: false,
  },
  premovable: {
    enabled: false,
  },
  predroppable: {
    enabled: false,
  },
  draggable: {
    enabled: true,
    showGhost: false,
  },
  drawable: {
    enabled: false,
  },
}

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
      turnColor: "white",
      // After first square, select current square by default
      selected: knightSquare === initialKnightSquare ? undefined : knightSquare,
      movable: {
        dests: dests,
        color: "white",
        events: { after: handleMove },
      },
      drawable: {
        autoShapes: checkedSquares
          ? checkedSquares
              .filter((s) => s !== knightSquare)
              .map((s) => ({
                orig: s,
                customSvg: CHECK_SVG,
              }))
              .toArray()
          : [],
      },
    }),
    [fen, dests, handleMove, initialKnightSquare, knightSquare, checkedSquares]
  )

  useEffect(() => {
    if (el.current && !ground) {
      setGround(Chessground(el.current, BASE_CHESSGROUND_CONFIG))
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

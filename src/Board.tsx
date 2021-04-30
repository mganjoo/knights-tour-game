import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Chessground } from "chessground"
import "./Board.css"
import { Api as ChessgroundApi } from "chessground/api"
import * as cg from "chessground/types"
import { Config } from "chessground/config"
import { attackedByQueen, getPuzzleFen, Square } from "./ChessLogic"
import { Set as ImmutableSet } from "immutable"

type BoardProps = {
  /**
   * Starting square for the knight.
   */
  initialKnightSquare: Square
  /**
   * Function to generate set of valid knight moves.
   */
  generateKnightMoves: (square: Square) => Square[]
  /**
   * Square on which queen is placed (optional).
   */
  queenSquare?: Square
  /**
   * Callback once a knight move is made.
   */
  onKnightMove?: (to: Square) => void
  /**
   * Callback if a knight tries to move to a square attacked by the queen.
   */
  onAttackedMove?: (to: Square) => void
  /**
   * Squares to be marked as checked (already visited).
   */
  visitedSquares: ImmutableSet<Square>
  /**
   * Square to visit next (marked with chevron).
   */
  targetSquare: Square
  /**
   * Whether the board is completed.
   */
  completed?: boolean
}

// "check" from https://heroicons.com/
const CHECK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#047857"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z" clip-rule="evenodd"/></svg>'

// "chevron-double-up" from https://heroicons.com/
const TARGET_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#d97706"><path fill-rule="evenodd" d="M4.293 15.707a1 1 0 0 1 0-1.414l5-5a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414 0zm0-6a1 1 0 0 1 0-1.414l5-5a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1-1.414 1.414L10 5.414 5.707 9.707a1 1 0 0 1-1.414 0z" clip-rule="evenodd"/></svg>'

const BASE_CHESSGROUND_CONFIG: Config = {
  orientation: "white",
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
  generateKnightMoves,
  onKnightMove,
  onAttackedMove,
  targetSquare,
  visitedSquares,
  completed,
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
    () => new Map([[knightSquare, generateKnightMoves(knightSquare)]]),
    [knightSquare, generateKnightMoves]
  )
  const [knightOnAttackedSquare, setKnightOnAttackedSquare] = useState(false)
  const handleMove = useCallback(
    (orig: cg.Key, dest: cg.Key) => {
      const validDests = dests.get(orig)
      if (
        validDests &&
        validDests.includes(dest) &&
        orig !== "a0" &&
        dest !== "a0"
      ) {
        if (queenSquare && attackedByQueen(dest, queenSquare)) {
          setKnightOnAttackedSquare(true)
          if (onAttackedMove) {
            onAttackedMove(dest)
          }
        } else {
          setKnightSquare(dest)
          if (onKnightMove) {
            onKnightMove(dest)
          }
        }
      }
    },
    [dests, onKnightMove, queenSquare, onAttackedMove]
  )
  const config: Config = useMemo(
    () => ({
      fen: fen,
      viewOnly: !!completed,
      turnColor: "white",
      // After first square, select current square by default
      selected: knightSquare === initialKnightSquare ? undefined : knightSquare,
      movable: {
        dests: dests,
        color: "white",
        events: { after: handleMove },
      },
      drawable: {
        autoShapes: [{ orig: targetSquare, customSvg: TARGET_SVG }].concat(
          visitedSquares
            .map((s) => ({
              orig: s,
              customSvg: CHECK_SVG,
            }))
            .toArray()
        ),
      },
    }),
    [
      fen,
      dests,
      handleMove,
      initialKnightSquare,
      knightSquare,
      targetSquare,
      visitedSquares,
      completed,
    ]
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
      if (knightOnAttackedSquare) {
        setKnightOnAttackedSquare(false)
      }
    }
  }, [ground, config, knightOnAttackedSquare])

  return <div ref={el}>{children}</div>
}

export default Board

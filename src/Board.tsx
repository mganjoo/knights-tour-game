import React, { useCallback, useEffect, useMemo } from "react"
import "./Board.css"
import * as cg from "chessground/types"
import { Config } from "chessground/config"
import { getPuzzleFen, getKnightDests, Square } from "./ChessLogic"
import { Set as ImmutableSet } from "immutable"
import { useChessground } from "./Chessground"
import { DrawShape } from "chessground/draw"
import { useReducedMotion } from "framer-motion"

export type BoardState =
  | "NOT_STARTED"
  | "PLAYING"
  | "KNIGHT_ATTACKED"
  | "FINISHED"
  | "CAPTURED"

type BoardProps = {
  /**
   * Current state of the board
   */
  state: BoardState
  /**
   * Square on which knight is placed.
   */
  knightSquare: Square
  /**
   * Square on which queen is placed.
   */
  queenSquare: Square
  /**
   * Callback when a valid knight move is attempted.
   */
  onKnightMove: (from: Square, to: Square) => void
  /**
   * Squares already visited (marked with check).
   */
  visitedSquares: ImmutableSet<Square>
  /**
   * Square to visit next (marked with chevron).
   */
  targetSquare?: Square
  /**
   * Whether to hide visited squares (makes the puzzle more challenging).
   */
  hideVisitedSquares?: boolean
  /**
   * Whether to draw an arrow to the next target square.
   */
  showTargetArrow?: boolean
}

// "check" from https://heroicons.com/
const CHECK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#047857"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z" clip-rule="evenodd"/></svg>'

// "chevron-double-up" from https://heroicons.com/
const TARGET_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#b45309"><path fill-rule="evenodd" d="M4.293 15.707a1 1 0 0 1 0-1.414l5-5a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414 0zm0-6a1 1 0 0 1 0-1.414l5-5a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1-1.414 1.414L10 5.414 5.707 9.707a1 1 0 0 1-1.414 0z" clip-rule="evenodd"/></svg>'

const EMPTY_BOARD_FEN = "8/8/8/8/8/8/8/8 w - - 0 1"

/**
 * One-time configuration is set initially. Some of this
 * configuration never needs to change.
 */
function makeInitialConfig(shouldReduceMotion: boolean | null): Config {
  return {
    // Empty board
    fen: EMPTY_BOARD_FEN,
    orientation: "white",
    highlight: {
      lastMove: false,
    },
    animation: {
      enabled: !!!shouldReduceMotion,
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
}

const Board: React.FC<BoardProps> = ({
  state,
  knightSquare,
  queenSquare,
  onKnightMove,
  targetSquare,
  visitedSquares,
  hideVisitedSquares,
  showTargetArrow,
  children,
}) => {
  const shouldReduceMotion = useReducedMotion()
  const makeConfig = useCallback(() => makeInitialConfig(shouldReduceMotion), [
    shouldReduceMotion,
  ])
  const { el, set } = useChessground(makeConfig)
  const fen = useMemo<string | undefined>(
    () =>
      state !== "NOT_STARTED"
        ? getPuzzleFen(knightSquare, queenSquare)
        : EMPTY_BOARD_FEN,
    [knightSquare, queenSquare, state]
  )
  const dests = useMemo<Map<cg.Key, cg.Key[]>>(
    () =>
      new Map([
        [
          knightSquare,
          getKnightDests(knightSquare, { queenSquare: queenSquare }),
        ],
      ]),
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
        onKnightMove(orig, dest)
      }
    },
    [dests, onKnightMove]
  )
  const shapes = useMemo<DrawShape[]>(() => {
    const targetShapes: DrawShape[] =
      targetSquare && (state === "PLAYING" || state === "KNIGHT_ATTACKED")
        ? [{ orig: targetSquare, customSvg: TARGET_SVG }]
        : []
    const targetArrowShapes: DrawShape[] =
      targetSquare && showTargetArrow && state === "PLAYING"
        ? [
            {
              orig: knightSquare,
              dest: targetSquare,
              customSvg: undefined,
              brush: "blue",
            },
          ]
        : []
    const queenShapes: DrawShape[] =
      state === "KNIGHT_ATTACKED"
        ? [
            { orig: queenSquare, customSvg: undefined, brush: "yellow" },
            {
              orig: queenSquare,
              dest: knightSquare,
              customSvg: undefined,
              brush: "yellow",
            },
          ]
        : []
    const visitedShapes: DrawShape[] = hideVisitedSquares
      ? []
      : visitedSquares
          .map((s) => ({
            orig: s,
            customSvg: CHECK_SVG,
          }))
          .toArray()
    return targetShapes
      .concat(targetArrowShapes)
      .concat(queenShapes)
      .concat(visitedShapes)
  }, [
    targetSquare,
    state,
    showTargetArrow,
    knightSquare,
    queenSquare,
    hideVisitedSquares,
    visitedSquares,
  ])

  useEffect(() => {
    const config: Config = {
      fen: fen,
      // Allow moves only in playing state
      viewOnly: state !== "PLAYING",
      // Always white to move
      turnColor: "white",
      // If the puzzle is ongoing, select current knight square by default
      selected: state === "PLAYING" ? knightSquare : undefined,
      animation: {
        enabled: !!!shouldReduceMotion,
      },
      movable: {
        dests: dests,
        color: "white",
        events: { after: handleMove },
      },
    }
    set(config, shapes)
  }, [
    set,
    fen,
    state,
    knightSquare,
    shouldReduceMotion,
    dests,
    handleMove,
    shapes,
  ])

  return <div ref={el}>{children}</div>
}

export default Board

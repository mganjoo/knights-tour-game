import "./Board.css"
import { Config } from "chessground/config"
import { DrawShape } from "chessground/draw"
import * as cg from "chessground/types"
import { useReducedMotion } from "framer-motion"
import { List as ImmutableList } from "immutable"
import React, { useCallback, useEffect, useMemo } from "react"
import { getPuzzleFen, getKnightDests, Square } from "../game/ChessLogic"
import { GameStateType } from "../game/GameState"
import useChessground from "../util/Chessground"
import { colors } from "../util/TailwindUtil"

type BoardProps = {
  /**
   * Matcher to determine current state of game. Returns true if game is in `state`.
   */
  stateMatches: (state: GameStateType) => boolean
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
  onKnightMove: (square: Square) => void
  /**
   * Squares already visited (marked with check).
   */
  visitedSquares: ImmutableList<Square>
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
  /**
   * Whether to show the initial arrows that demonstrate the knight's path.
   */
  showInitialGuideArrows?: boolean
}

// "check" from https://heroicons.com/
const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="${colors.green["700"]}"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z" clip-rule="evenodd"/></svg>`

// "chevron-double-up" from https://heroicons.com/
const TARGET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="${colors.yellow["700"]}"><path fill-rule="evenodd" d="M4.293 15.707a1 1 0 0 1 0-1.414l5-5a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414 0zm0-6a1 1 0 0 1 0-1.414l5-5a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1-1.414 1.414L10 5.414 5.707 9.707a1 1 0 0 1-1.414 0z" clip-rule="evenodd"/></svg>`

const EMPTY_BOARD_FEN = "8/8/8/8/8/8/8/8 w - - 0 1"

/**
 * One-time configuration is set initially. Some of this
 * configuration never needs to change.
 */
function makeInitialConfig(shouldReduceMotion: boolean | null): Config {
  return {
    fen: EMPTY_BOARD_FEN,
    orientation: "white",
    highlight: {
      lastMove: false,
    },
    animation: {
      enabled: !shouldReduceMotion,
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
      enabled: false,
      showGhost: false,
    },
    drawable: {
      enabled: false,
    },
  }
}

const Board: React.FC<BoardProps> = ({
  stateMatches,
  knightSquare,
  queenSquare,
  onKnightMove,
  targetSquare,
  visitedSquares,
  hideVisitedSquares,
  showTargetArrow,
  showInitialGuideArrows,
}) => {
  const shouldReduceMotion = useReducedMotion()
  const makeConfig = useCallback(() => makeInitialConfig(shouldReduceMotion), [
    shouldReduceMotion,
  ])
  const { el, set } = useChessground(makeConfig)
  const fen = useMemo<string | undefined>(
    () => getPuzzleFen(knightSquare, queenSquare),
    [knightSquare, queenSquare]
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
        onKnightMove(dest)
      }
    },
    [dests, onKnightMove]
  )
  const shapes = useMemo<DrawShape[]>(() => {
    const onboardingShapes: DrawShape[] =
      stateMatches("notStarted") && showInitialGuideArrows
        ? [
            { orig: knightSquare, dest: "a8", brush: "blue" },
            { orig: "h7", dest: "a7", brush: "blue" },
          ]
        : []
    const targetShapes: DrawShape[] =
      targetSquare && stateMatches("playing")
        ? [{ orig: targetSquare, customSvg: TARGET_SVG }]
        : []

    const targetArrowShapes: DrawShape[] =
      targetSquare && showTargetArrow && stateMatches({ playing: "moving" })
        ? [
            {
              orig: knightSquare,
              dest: targetSquare,
              customSvg: undefined,
              brush: "blue",
            },
          ]
        : []
    const queenShapes: DrawShape[] = stateMatches({
      playing: "knightAttacked",
    })
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
    const visitedShapes: DrawShape[] =
      hideVisitedSquares || stateMatches("notStarted")
        ? []
        : visitedSquares
            .map((s) => ({
              orig: s,
              customSvg: CHECK_SVG,
            }))
            .toArray()
    return targetShapes
      .concat(onboardingShapes)
      .concat(targetArrowShapes)
      .concat(queenShapes)
      .concat(visitedShapes)
  }, [
    targetSquare,
    stateMatches,
    showTargetArrow,
    showInitialGuideArrows,
    knightSquare,
    queenSquare,
    hideVisitedSquares,
    visitedSquares,
  ])

  useEffect(() => {
    // If the puzzle is ongoing, select current knight square by default
    const selected = stateMatches({ playing: "moving" })
      ? knightSquare
      : undefined
    const config: Config = {
      fen: fen,
      // Allow moves only in playing state
      viewOnly: !stateMatches({ playing: "moving" }),
      // Always white to move
      turnColor: "white",
      selected,
      animation: {
        enabled: !shouldReduceMotion,
      },
      movable: {
        dests: dests,
        color: "white",
        events: { after: handleMove },
      },
      events: {
        select: (key) => {
          // If user clicks outside one of the allowed squares, reset selected
          if (!dests.get(knightSquare)?.includes(key)) {
            set({ selected })
          }
        },
      },
    }
    set(config, shapes)
  }, [
    set,
    fen,
    stateMatches,
    knightSquare,
    shouldReduceMotion,
    dests,
    handleMove,
    shapes,
  ])

  return <div ref={el}></div>
}

export default Board
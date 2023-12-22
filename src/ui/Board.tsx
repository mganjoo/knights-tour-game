import { useReducedMotion } from "framer-motion"
import { BoardArrow, GChessBoardElement, MoveFinishedEvent } from "gchessboard"
import { List as ImmutableList } from "immutable"
import React, { useEffect, useMemo, useRef } from "react"
import { getKnightDests, Square } from "../game/ChessLogic"
import { GameStateType } from "../game/GameState"
import { GChessBoard } from "../util/GChessBoard"

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
  const ref = useRef<any>(null)
  const position = useMemo(
    () => ({
      [knightSquare]: { pieceType: "knight", color: "white" },
      [queenSquare]: { pieceType: "queen", color: "black" },
    }),
    [knightSquare, queenSquare]
  )
  const knightDests = useMemo(
    () => getKnightDests(knightSquare, { queenSquare }),
    [knightSquare, queenSquare]
  )
  const handleMove = (e: Event) => {
    selectedSquare.current = undefined
    onKnightMove((e as CustomEvent<MoveFinishedEvent>).detail.to)
  }
  const onboardingArrows: BoardArrow[] = useMemo(
    () =>
      stateMatches("notStarted") && showInitialGuideArrows
        ? [
            { from: knightSquare, to: "a8", brush: "blue" },
            { from: "h7", to: "a7", brush: "blue" },
          ]
        : [],
    [knightSquare, showInitialGuideArrows, stateMatches]
  )
  const targetArrows: BoardArrow[] = useMemo(
    () =>
      targetSquare && showTargetArrow && stateMatches({ playing: "moving" })
        ? [
            {
              from: knightSquare,
              to: targetSquare,
              brush: "blue",
            },
          ]
        : [],
    [targetSquare, knightSquare, showTargetArrow, stateMatches]
  )
  const queenArrows: BoardArrow[] = useMemo(
    () =>
      stateMatches({
        playing: "knightAttacked",
      })
        ? [
            {
              from: queenSquare,
              to: knightSquare,
              brush: "yellow",
            },
          ]
        : [],
    [stateMatches, knightSquare, queenSquare]
  )
  const arrows = useMemo(
    () => onboardingArrows.concat(targetArrows).concat(queenArrows),
    [onboardingArrows, targetArrows, queenArrows]
  )
  const selectedSquare = useRef<Square>()

  useEffect(() => {
    if (
      stateMatches({ playing: "moving" }) &&
      selectedSquare.current !== knightSquare &&
      ref.current
    ) {
      const board = ref.current as GChessBoardElement
      board.startMove(knightSquare, knightDests)
      selectedSquare.current = knightSquare
    } else if (!stateMatches({ playing: "moving" })) {
      selectedSquare.current = undefined
    }
  })

  return (
    <GChessBoard
      ref={ref}
      animation-duration={shouldReduceMotion ? 10 : 50}
      position={position}
      interactive={stateMatches({ playing: "moving" })}
      onMoveFinished={handleMove}
      onMoveCancel={(e) => e.preventDefault()}
      arrows={arrows}
    >
      {stateMatches("playing") && (
        <div slot={targetSquare}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="#B45309"
          >
            <path
              fillRule="evenodd"
              d="M4.293 15.707a1 1 0 0 1 0-1.414l5-5a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414 0zm0-6a1 1 0 0 1 0-1.414l5-5a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1-1.414 1.414L10 5.414 5.707 9.707a1 1 0 0 1-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
      {!hideVisitedSquares &&
        !stateMatches("notStarted") &&
        visitedSquares.map((s) => (
          <span slot={s} key={s}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="#047857"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        ))}
    </GChessBoard>
  )
}

export default Board

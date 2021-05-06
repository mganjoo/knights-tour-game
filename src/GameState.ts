import { String, Number, Record, Static } from "runtypes"
import { Set as ImmutableSet } from "immutable"
import {
  attackedByQueen,
  getSquareIncrement,
  incrementWhileAttacked,
  isQueenSquare,
  isSquare,
  QueenSquare,
  Square,
} from "./ChessLogic"
import { BoardState } from "./Board"
import { useEffect, useReducer } from "react"
import { useInterval } from "react-use"

const SquareType = String.withGuard(isSquare)
const QueenSquareType = String.withGuard(isQueenSquare)
const NonNegative = Number.withConstraint((n) => n >= 0)

const SerializedGameStateSchema = Record({
  queenSquare: QueenSquareType,
  knightSquare: SquareType,
  lastVisitedSquare: SquareType,
  targetSquare: SquareType,
  numMoves: NonNegative,
})

export type SerializedGameState = Static<typeof SerializedGameStateSchema>

interface GameState {
  boardState: BoardState
  queenSquare: QueenSquare
  knightSquare: Square
  visitedSquares: ImmutableSet<Square>
  targetSquare?: Square
  finalTargetSquare: Square
  numMoves: number
  elapsed: number
}

type SetQueenSquareAction = {
  type: "setQueenSquare"
  square: QueenSquare
}

type TickAction = {
  type: "tick"
}

type BeginRestartingAction = {
  type: "beginRestarting"
}

type FinishRestartingAction = {
  type: "finishRestarting"
}

type MoveAction = {
  type: "move"
  from: Square
  to: Square
}

type HandleKnightAttackAction = {
  type: "handleKnightAttack"
  endGame: boolean
}

type GameAction =
  | SetQueenSquareAction
  | TickAction
  | BeginRestartingAction
  | FinishRestartingAction
  | MoveAction
  | HandleKnightAttackAction

function assertNever(x: never): never {
  throw new Error(`unexpected action: ${x}`)
}

function resetGameState(state: GameState): GameState {
  const startingSquare = incrementWhileAttacked(
    STARTING_KNIGHT_SQUARE,
    state.queenSquare,
    "previous"
  )
  return {
    ...state,
    knightSquare: startingSquare,
    targetSquare: incrementWhileAttacked(
      getSquareIncrement(startingSquare, "previous"),
      state.queenSquare,
      "previous"
    ),
    visitedSquares: ImmutableSet([startingSquare]),
    numMoves: 0,
    elapsed: 0,
  }
}

function handleAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "setQueenSquare":
      const stateWithNewQueen = resetGameState({
        ...state,
        queenSquare: action.square,
      })
      return {
        ...stateWithNewQueen,
        boardState:
          state.boardState.id === "PLAYING"
            ? { id: "RESTARTING" }
            : state.boardState,
      }
    case "beginRestarting":
      return { ...state, boardState: { id: "RESTARTING" } }
    case "finishRestarting":
      return {
        ...resetGameState(state),
        boardState: { id: "PLAYING" },
      }
    case "tick":
      if (
        state.boardState.id === "PLAYING" ||
        state.boardState.id === "KNIGHT_ATTACKED"
      ) {
        return { ...state, elapsed: state.elapsed + 1 }
      } else {
        return state
      }
    case "move":
      const newBaseState = {
        ...state,
        knightSquare: action.to,
        numMoves: state.numMoves + 1,
      }

      if (attackedByQueen(action.to, state.queenSquare)) {
        // If the knight is attacked, we may need to reset back to original square
        return {
          ...newBaseState,
          boardState: { id: "KNIGHT_ATTACKED", previousSquare: action.from },
        }
      } else if (action.to === state.targetSquare) {
        // If we move to a new target, update visited + target squares
        return {
          ...newBaseState,
          visitedSquares: state.visitedSquares.add(action.to),
          targetSquare:
            state.targetSquare === state.finalTargetSquare
              ? undefined
              : incrementWhileAttacked(
                  getSquareIncrement(state.targetSquare, "previous"),
                  state.queenSquare,
                  "previous"
                ),
          boardState:
            state.targetSquare === state.finalTargetSquare
              ? { id: "FINISHED" }
              : state.boardState,
        }
      } else {
        return newBaseState
      }
    case "handleKnightAttack":
      if (state.boardState.id === "KNIGHT_ATTACKED") {
        if (action.endGame) {
          return { ...state, boardState: { id: "CAPTURED" } }
        } else {
          return {
            ...state,
            knightSquare: state.boardState.previousSquare,
            boardState: { id: "PLAYING" },
          }
        }
      } else {
        return state
      }
    default:
      assertNever(action)
  }
}

export const DEFAULT_QUEEN_SQUARE = "d5"

const STARTING_KNIGHT_SQUARE = "h8"
const ENDING_KNIGHT_SQUARE = "a1"

// "Safe" square to be used as source square for knight
const DEFAULT_SAFE_STARTING_KNIGHT_SQUARE: Square = incrementWhileAttacked(
  STARTING_KNIGHT_SQUARE,
  DEFAULT_QUEEN_SQUARE,
  "previous"
)
const DEFAULT_SAFE_ENDING_KNIGHT_SQUARE: Square = incrementWhileAttacked(
  ENDING_KNIGHT_SQUARE,
  DEFAULT_QUEEN_SQUARE,
  "next"
)

const INITIAL_STATE: GameState = {
  boardState: { id: "NOT_STARTED" },
  queenSquare: DEFAULT_QUEEN_SQUARE,
  knightSquare: DEFAULT_SAFE_STARTING_KNIGHT_SQUARE,
  visitedSquares: ImmutableSet([DEFAULT_SAFE_STARTING_KNIGHT_SQUARE]),
  finalTargetSquare: DEFAULT_SAFE_ENDING_KNIGHT_SQUARE,
  numMoves: 0,
  elapsed: 0,
}

interface UseGameStateArgs {
  attackEndsGame: boolean
  queenSquare: QueenSquare
}

export default function useGameState(args: UseGameStateArgs) {
  const [gameState, doAction] = useReducer(handleAction, INITIAL_STATE)

  useInterval(() => {
    doAction({ type: "tick" })
  }, 1000)

  useEffect(() => {
    if (gameState.boardState.id === "RESTARTING") {
      const timeout = setTimeout(() => {
        doAction({ type: "finishRestarting" })
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [gameState])

  useEffect(() => {
    // Automatically transition out of attacked state
    if (gameState.boardState.id === "KNIGHT_ATTACKED") {
      const timeout = setTimeout(() => {
        doAction({ type: "handleKnightAttack", endGame: args.attackEndsGame })
      }, 800)
      return () => clearTimeout(timeout)
    }
  }, [gameState, args.attackEndsGame])

  useEffect(() => {
    if (gameState.queenSquare !== args.queenSquare) {
      doAction({ type: "setQueenSquare", square: args.queenSquare })
    }
  }, [gameState.queenSquare, args.queenSquare])

  return { gameState, doAction }
}

import { String, Number, Record, Static, Optional } from "runtypes"
import { List as ImmutableList } from "immutable"
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
import { useEffect, useReducer, useState } from "react"
import { useHarmonicIntervalFn, useInterval, useLocalStorage } from "react-use"
import { useNonNegative } from "./Settings"

const SquareType = String.withGuard(isSquare)
const QueenSquareType = String.withGuard(isQueenSquare)
const NonNegative = Number.withConstraint((n) => n >= 0)

const SerializedGameStateSchema = Record({
  queenSquare: QueenSquareType,
  knightSquare: SquareType,
  lastVisitedSquare: SquareType,
  targetSquare: Optional(SquareType),
  numMoves: NonNegative,
})

export type SerializedGameState = Static<typeof SerializedGameStateSchema>

export interface GameState {
  boardState: BoardState
  queenSquare: QueenSquare
  knightSquare: Square
  visitedSquares: ImmutableList<Square>
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
    visitedSquares: ImmutableList([startingSquare]),
    numMoves: 0,
    elapsed: 0,
  }
}

function handleAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "setQueenSquare":
      if (state.queenSquare === action.square) {
        return state
      } else {
        const stateWithNewQueen = resetGameState({
          ...state,
          queenSquare: action.square,
          finalTargetSquare: incrementWhileAttacked(
            ENDING_KNIGHT_SQUARE,
            action.square,
            "next"
          ),
        })
        return {
          ...stateWithNewQueen,
          boardState:
            state.boardState.id === "PLAYING"
              ? { id: "RESTARTING" }
              : state.boardState,
        }
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
          visitedSquares: state.visitedSquares.push(action.to),
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

const STARTING_KNIGHT_SQUARE: Square = "h8"
const ENDING_KNIGHT_SQUARE: Square = "a1"

// "Safe" square to be used as source square for knight
const DEFAULT_SAFE_STARTING_KNIGHT_SQUARE: Square = incrementWhileAttacked(
  STARTING_KNIGHT_SQUARE,
  DEFAULT_QUEEN_SQUARE,
  "previous"
)

interface MakeInitialStateArgs {
  loadedElapsed: number
  serializedGameState: unknown
}

function makeInitialState(args: MakeInitialStateArgs): GameState {
  const serializedGameState = SerializedGameStateSchema.guard(
    args.serializedGameState
  )
    ? args.serializedGameState
    : undefined

  let visitedSquares: ImmutableList<Square> = ImmutableList()

  if (serializedGameState) {
    for (
      let visitedSquare = STARTING_KNIGHT_SQUARE;
      visitedSquare !== serializedGameState.lastVisitedSquare;
      visitedSquare = incrementWhileAttacked(
        getSquareIncrement(visitedSquare, "previous"),
        serializedGameState.queenSquare,
        "previous"
      )
    ) {
      visitedSquares = visitedSquares.push(visitedSquare)
    }
    visitedSquares = visitedSquares.push(serializedGameState.lastVisitedSquare)
  }
  const queenSquare = serializedGameState?.queenSquare || DEFAULT_QUEEN_SQUARE

  return {
    boardState: { id: serializedGameState ? "PLAYING" : "NOT_STARTED" },
    queenSquare: queenSquare,
    knightSquare:
      serializedGameState?.knightSquare || DEFAULT_SAFE_STARTING_KNIGHT_SQUARE,
    visitedSquares: visitedSquares,
    targetSquare: serializedGameState?.targetSquare,
    finalTargetSquare: incrementWhileAttacked(
      ENDING_KNIGHT_SQUARE,
      queenSquare,
      "next"
    ),
    numMoves: serializedGameState?.numMoves || 0,
    elapsed: serializedGameState !== undefined ? args.loadedElapsed : 0,
  }
}

interface UseGameStateArgs {
  attackEndsGame: boolean
  queenSquare: QueenSquare
}

export default function useGameState(args: UseGameStateArgs) {
  const [elapsed, setElapsed] = useNonNegative("v1.elapsed")
  const [
    serializedGameState,
    setSerializedGameState,
    removeSerializedGameState,
  ] = useLocalStorage("v1.game_state")
  const [gameState, doAction] = useReducer(
    handleAction,
    { loadedElapsed: elapsed || 0, serializedGameState },
    makeInitialState
  )
  const [appVisible, setAppVisible] = useState(true)

  useHarmonicIntervalFn(() => {
    if (appVisible) {
      doAction({ type: "tick" })
    }
  }, 1000)

  useInterval(() => {
    if (gameState.boardState.id === "PLAYING") {
      setElapsed(gameState.elapsed)
    }
  }, 1000)

  useEffect(() => {
    document.addEventListener("visibilitychange", () => {
      setAppVisible(document.visibilityState === "visible")
    })
  })

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

  useEffect(() => {
    if (
      ["NOT_STARTED", "RESTARTING", "CAPTURED", "FINISHED"].includes(
        gameState.boardState.id
      ) ||
      (gameState.boardState.id === "KNIGHT_ATTACKED" && args.attackEndsGame) ||
      (gameState.boardState.id === "PLAYING" && gameState.numMoves === 0)
    ) {
      // Delete saved state if we're on move 0, or game is in non-playing state
      removeSerializedGameState()
    } else if (gameState.boardState.id === "PLAYING") {
      setSerializedGameState({
        queenSquare: gameState.queenSquare,
        knightSquare: gameState.knightSquare,
        lastVisitedSquare: gameState.visitedSquares.last(
          gameState.knightSquare
        ),
        targetSquare: gameState.targetSquare,
        numMoves: gameState.numMoves,
      })
    }
  }, [
    gameState.boardState,
    gameState.knightSquare,
    gameState.numMoves,
    gameState.queenSquare,
    gameState.targetSquare,
    gameState.visitedSquares,
    removeSerializedGameState,
    setSerializedGameState,
    args.attackEndsGame,
  ])

  return { gameState, doAction }
}

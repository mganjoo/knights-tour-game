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
import { useCallback, useEffect, useReducer } from "react"
import { useLocalStorage } from "react-use"

const SquareType = String.withGuard(isSquare)
const QueenSquareType = String.withGuard(isQueenSquare)
const NonNegative = Number.withConstraint((n) => n >= 0)

const SerializedGameStateSchema = Record({
  queenSquare: QueenSquareType,
  knightSquare: SquareType,
  lastVisitedSquare: SquareType,
  targetSquare: Optional(SquareType),
  numMoves: NonNegative,
  previouslyElapsedMs: NonNegative,
})

export type SerializedGameState = Static<typeof SerializedGameStateSchema>

export interface GameState {
  boardState: BoardState
  queenSquare: QueenSquare
  knightSquare: Square
  visitedSquares: ImmutableList<Square>
  targetSquare: Square | undefined
  finalTargetSquare: Square
  numMoves: number
  startTimeMs: number | undefined
  endTimeMs: number | undefined
}

type SetQueenSquareAction = {
  type: "setQueenSquare"
  square: QueenSquare
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

type PauseAction = {
  type: "pause"
  queenAttackEndsGame: boolean
}

type UnpauseAction = {
  type: "unpause"
}

type GameAction =
  | SetQueenSquareAction
  | BeginRestartingAction
  | FinishRestartingAction
  | MoveAction
  | HandleKnightAttackAction
  | PauseAction
  | UnpauseAction

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
    startTimeMs: undefined,
    endTimeMs: undefined,
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
            // Restart in-progress game, or just set to not started state
            state.boardState.id === "PLAYING" ||
            state.boardState.id === "KNIGHT_ATTACKED"
              ? { id: "RESTARTING" }
              : { id: "NOT_STARTED" },
        }
      }
    case "beginRestarting":
      return { ...state, boardState: { id: "RESTARTING" } }
    case "finishRestarting":
      return {
        ...resetGameState(state),
        boardState: { id: "PLAYING", moved: false },
        startTimeMs: Date.now(),
      }
    case "move":
      const newBaseState: GameState = {
        ...state,
        knightSquare: action.to,
        numMoves: state.numMoves + 1,
        boardState: { id: "PLAYING", moved: true },
      }

      if (attackedByQueen(action.to, state.queenSquare)) {
        // If the knight is attacked, we may need to reset back to original square
        return {
          ...newBaseState,
          boardState: { id: "KNIGHT_ATTACKED", previousSquare: action.from },
        }
      } else if (action.to === state.targetSquare) {
        // If we move to a new target, update visited + target squares
        const finished = state.targetSquare === state.finalTargetSquare
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
          boardState: finished ? { id: "FINISHED" } : newBaseState.boardState,
          endTimeMs: finished ? Date.now() : undefined,
        }
      } else {
        return newBaseState
      }
    case "handleKnightAttack":
      if (state.boardState.id === "KNIGHT_ATTACKED") {
        if (action.endGame) {
          return {
            ...state,
            boardState: { id: "CAPTURED" },
            endTimeMs: Date.now(),
          }
        } else {
          return {
            ...state,
            knightSquare: state.boardState.previousSquare,
            boardState: { id: "PLAYING", moved: true },
          }
        }
      } else {
        return state
      }
    case "pause":
      if (
        _isSaveable(state.boardState, action.queenAttackEndsGame) &&
        state.startTimeMs !== undefined
      ) {
        return {
          ...state,
          boardState: {
            id: "PAUSED",
            previouslyElapsedMs: Date.now() - state.startTimeMs,
          },
        }
      } else {
        return state
      }
    case "unpause":
      if (state.boardState.id === "PAUSED") {
        return {
          ...state,
          boardState: {
            id: "PLAYING",
            moved: true,
          },
          startTimeMs: Date.now() - state.boardState.previouslyElapsedMs,
          endTimeMs: undefined,
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
  serializedGameState: unknown
}

function makeInitialState(args: MakeInitialStateArgs): GameState {
  const serializedGameState = SerializedGameStateSchema.guard(
    args.serializedGameState
  )
    ? args.serializedGameState
    : undefined

  const queenSquare = serializedGameState?.queenSquare || DEFAULT_QUEEN_SQUARE

  let visitedSquares: ImmutableList<Square> = ImmutableList()
  if (serializedGameState) {
    const startingSquare = incrementWhileAttacked(
      STARTING_KNIGHT_SQUARE,
      serializedGameState.queenSquare,
      "previous"
    )
    for (
      let visitedSquare = startingSquare;
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

  return {
    boardState:
      serializedGameState === undefined
        ? { id: "NOT_STARTED" }
        : { id: "PLAYING", moved: false },
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
    startTimeMs:
      serializedGameState !== undefined
        ? Date.now() - serializedGameState.previouslyElapsedMs
        : undefined,
    endTimeMs: undefined,
  }
}

function _getElapsedMs(
  startTimeMs: number | undefined,
  endTimeMs: number | undefined
) {
  if (startTimeMs === undefined) {
    return 0
  } else if (endTimeMs === undefined) {
    return Date.now() - startTimeMs
  } else {
    return endTimeMs - startTimeMs
  }
}

/**
 * Whether the game should be saved when browsing away etc. A game
 * will saved if it's in PLAYING state and the user has moved, or
 * if the knight is attacked but eh game is not configured to end
 * immediately.
 */
function _isSaveable(boardState: BoardState, attackEndsGame: boolean) {
  return !(
    ["NOT_STARTED", "RESTARTING", "CAPTURED", "FINISHED"].includes(
      boardState.id
    ) ||
    // This will lead to game over on next transition
    (boardState.id === "KNIGHT_ATTACKED" && attackEndsGame) ||
    (boardState.id === "PLAYING" && !boardState.moved)
  )
}

interface UseGameStateArgs {
  attackEndsGame: boolean
  queenSquare: QueenSquare
}

interface UseGameStateResponse {
  gameState: GameState
  doAction: (action: GameAction) => void
  getElapsedMs: () => number
}

export default function useGameState(
  args: UseGameStateArgs
): UseGameStateResponse {
  const [
    serializedGameState,
    setSerializedGameState,
    removeSerializedGameState,
  ] = useLocalStorage("v1.game_state")
  const [gameState, doAction] = useReducer(
    handleAction,
    { serializedGameState },
    makeInitialState
  )

  const getElapsedMs = useCallback(() => {
    return _getElapsedMs(gameState.startTimeMs, gameState.endTimeMs)
  }, [gameState.startTimeMs, gameState.endTimeMs])

  const saveGameState = useCallback(() => {
    const serialized: SerializedGameState = {
      queenSquare: gameState.queenSquare,
      knightSquare: gameState.knightSquare,
      lastVisitedSquare: gameState.visitedSquares.last(gameState.knightSquare),
      targetSquare: gameState.targetSquare,
      numMoves: gameState.numMoves,
      previouslyElapsedMs:
        gameState.boardState.id === "PAUSED"
          ? gameState.boardState.previouslyElapsedMs
          : _getElapsedMs(gameState.startTimeMs, gameState.endTimeMs),
    }
    setSerializedGameState(serialized)
  }, [
    gameState.boardState,
    gameState.endTimeMs,
    gameState.knightSquare,
    gameState.numMoves,
    gameState.queenSquare,
    gameState.startTimeMs,
    gameState.targetSquare,
    gameState.visitedSquares,
    setSerializedGameState,
  ])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        doAction({ type: "pause", queenAttackEndsGame: args.attackEndsGame })
        if (_isSaveable(gameState.boardState, args.attackEndsGame)) {
          saveGameState()
        }
      } else {
        doAction({ type: "unpause" })
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [args.attackEndsGame, gameState.boardState, saveGameState])

  useEffect(() => {
    if (gameState.boardState.id === "RESTARTING") {
      const timeout = setTimeout(() => {
        doAction({ type: "finishRestarting" })
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [gameState.boardState.id])

  useEffect(() => {
    // Automatically transition out of attacked state
    if (gameState.boardState.id === "KNIGHT_ATTACKED") {
      const timeout = setTimeout(() => {
        doAction({ type: "handleKnightAttack", endGame: args.attackEndsGame })
      }, 800)
      return () => clearTimeout(timeout)
    }
  }, [gameState.boardState.id, args.attackEndsGame])

  useEffect(() => {
    if (gameState.queenSquare !== args.queenSquare) {
      doAction({ type: "setQueenSquare", square: args.queenSquare })
    }
  }, [gameState.queenSquare, args.queenSquare])

  // Save game state on various state changes
  useEffect(() => {
    if (!_isSaveable(gameState.boardState, args.attackEndsGame)) {
      // Delete saved state if are on move 0, or game is in non-playing state
      // (ended, transitioning, not started)
      removeSerializedGameState()
    } else if (gameState.boardState.id === "PLAYING") {
      saveGameState()
    }
  }, [
    gameState.boardState,
    args.attackEndsGame,
    removeSerializedGameState,
    saveGameState,
  ])

  return { gameState, doAction, getElapsedMs }
}

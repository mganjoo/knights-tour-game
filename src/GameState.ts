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
  DEFAULT_QUEEN_SQUARE,
  STARTING_KNIGHT_SQUARE,
  ENDING_KNIGHT_SQUARE,
} from "./ChessLogic"
import { BoardState } from "./Board"
import { useCallback, useEffect, useReducer } from "react"
import { useLocalStorage } from "react-use"

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
  attackEndsGame: boolean
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
}

type PauseAction = {
  type: "pause"
}

type UnpauseAction = {
  type: "unpause"
}

type SetAttackEndsGame = {
  type: "setAttackEndsGame"
  value: boolean
}

type GameAction =
  | SetQueenSquareAction
  | BeginRestartingAction
  | FinishRestartingAction
  | MoveAction
  | HandleKnightAttackAction
  | PauseAction
  | UnpauseAction
  | SetAttackEndsGame

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

function _assertNever(x: never): never {
  throw new Error(`unexpected action: ${x}`)
}

function _resetGameState(state: GameState): GameState {
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
 * Whether the game should be saved when browsing away etc.
 */
function _isSaveable(gameState: GameState) {
  return (
    // If knight is under attack with the end game setting on, no point saving
    (gameState.boardState.id === "KNIGHT_ATTACKED" &&
      !gameState.attackEndsGame) ||
    gameState.boardState.id === "PLAYING" ||
    // Save paused games so they are later restored as paused
    gameState.boardState.id === "PAUSED"
  )
}

function handleAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "setQueenSquare":
      if (state.queenSquare === action.square) {
        return state
      } else {
        const stateWithNewQueen = _resetGameState({
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
        ..._resetGameState(state),
        boardState: { id: "PLAYING" },
        startTimeMs: Date.now(),
      }
    case "move":
      const newBaseState: GameState = {
        ...state,
        knightSquare: action.to,
        numMoves: state.numMoves + 1,
        boardState: { id: "PLAYING" },
      }

      if (attackedByQueen(action.to, state.queenSquare)) {
        // If the knight is attacked, we may need to reset back to original square
        return {
          ...newBaseState,
          boardState: { id: "KNIGHT_ATTACKED", previousSquare: action.from },
        }
      } else if (action.to === state.targetSquare) {
        const stateWithMove = {
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
        }
        if (state.targetSquare === state.finalTargetSquare) {
          return {
            ...stateWithMove,
            boardState: { id: "FINISHED" },
            endTimeMs: Date.now(),
          }
        } else {
          return stateWithMove
        }
      } else {
        return newBaseState
      }
    case "handleKnightAttack":
      if (state.boardState.id === "KNIGHT_ATTACKED") {
        if (state.attackEndsGame) {
          return {
            ...state,
            boardState: { id: "CAPTURED" },
            endTimeMs: Date.now(),
          }
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
    case "pause":
      if (_isSaveable(state)) {
        return {
          ...state,
          endTimeMs: Date.now(),
          boardState: { id: "PAUSED" },
        }
      } else {
        return state
      }
    case "unpause":
      if (state.boardState.id === "PAUSED") {
        const previouslyElapsedMs = _getElapsedMs(
          state.startTimeMs,
          state.endTimeMs
        )
        return {
          ...state,
          boardState: { id: "PLAYING" },
          startTimeMs: Date.now() - previouslyElapsedMs,
          endTimeMs: undefined,
        }
      } else {
        return state
      }
    case "setAttackEndsGame":
      return {
        ...state,
        attackEndsGame: action.value,
      }
    default:
      _assertNever(action)
  }
}

interface MakeInitialStateArgs {
  attackEndsGame: boolean
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
        : { id: "PLAYING" },
    queenSquare: queenSquare,
    knightSquare:
      serializedGameState?.knightSquare ||
      incrementWhileAttacked(STARTING_KNIGHT_SQUARE, queenSquare, "previous"),
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
    attackEndsGame: args.attackEndsGame,
  }
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
    { attackEndsGame: args.attackEndsGame, serializedGameState },
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
      previouslyElapsedMs: _getElapsedMs(
        gameState.startTimeMs,
        gameState.endTimeMs
      ),
    }
    setSerializedGameState(serialized)
  }, [
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
    const handleVisibilityChange = () =>
      doAction({
        type: document.visibilityState === "hidden" ? "pause" : "unpause",
      })
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (gameState.boardState.id === "RESTARTING") {
      const timeout = setTimeout(() => {
        doAction({ type: "finishRestarting" })
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [gameState.boardState.id])

  useEffect(() => {
    if (gameState.boardState.id === "KNIGHT_ATTACKED") {
      const timeout = setTimeout(() => {
        doAction({ type: "handleKnightAttack" })
      }, 800)
      return () => clearTimeout(timeout)
    }
  }, [gameState.boardState.id])

  useEffect(() => {
    doAction({ type: "setAttackEndsGame", value: args.attackEndsGame })
  }, [args.attackEndsGame])

  useEffect(() => {
    doAction({ type: "setQueenSquare", square: args.queenSquare })
  }, [gameState.queenSquare, args.queenSquare])

  // Save game state whenever we can (game state changes)
  useEffect(() => {
    // Game must be in a saveable state, but have non-zero moves
    if (_isSaveable(gameState) && gameState.numMoves > 0) {
      saveGameState()
    } else {
      removeSerializedGameState()
    }
  }, [gameState, removeSerializedGameState, saveGameState])

  return { gameState, doAction, getElapsedMs }
}

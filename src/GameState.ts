import { useMachine } from "@xstate/react"
import { List as ImmutableList } from "immutable"
import { useCallback, useEffect } from "react"
import { useLocalStorage } from "react-use"
import { String, Number, Record, Static } from "runtypes"
import { assign, createMachine, State, StateMachine } from "xstate"
import {
  attackedByQueen,
  getSquareIncrement,
  incrementWhileAttacked,
  isQueenSquare,
  isSquare,
  QueenSquare,
  Square,
  STARTING_KNIGHT_SQUARE,
  ENDING_KNIGHT_SQUARE,
  getKnightDests,
} from "./ChessLogic"

interface GameContext {
  /**
   * Current square for queen.
   */
  queenSquare: QueenSquare
  /**
   * Current square for knight.
   */
  knightSquare: Square
  /**
   * Current target square for knight.
   */
  targetSquare: Square
  /**
   * Final target square for knight to finish the puzzle.
   * Depends on queen location.
   */
  finalTargetSquare: Square
  /**
   * List of already visited squares.
   */
  visitedSquares: ImmutableList<Square>
  /**
   * Number of moves made by knight so far.
   */
  numMoves: number
  /**
   * Starting time for the game. May be adjusted for previously saved
   * elapsed game time e.g. if previously T milliseconds had been played,
   * then T would be subtraced from the actual startTimeMs value.
   */
  startTimeMs?: number
  /**
   * Ending time (when game is over).
   */
  endTimeMs?: number
  /**
   * Elapsed time that was previously saved (e.g. when game was paused).
   */
  previouslyElapsedMs?: number
  /**
   * Previous square the knight was on. Usually only set when game is in
   * progress - way to track previous square and deal with knight attacks.
   */
  previousKnightSquare?: Square
  /**
   * Whether an attack by the queen should end the gamewith a capture, or
   * whether the game should continue.
   */
  attackEndsGame: boolean
}

type GameEvent =
  | { type: "START" }
  | { type: "MOVE_KNIGHT"; square: Square }
  | { type: "HANDLE_KNIGHT_ATTACK" }
  | { type: "MOVE_QUEEN"; square: QueenSquare }
  | { type: "PAUSE" }
  | { type: "SET.ATTACK_ENDS_GAME"; value: boolean }
  | { type: "PAUSE" }
  | { type: "UNPAUSE" }

type GameState =
  | {
      value: "notStarted"
      context: GameContext & {
        startTimeMs: undefined
        endTimeMs: undefined
        previousKnightSquare: undefined
      }
    }
  | {
      value: "restarting"
      context: GameContext & {
        previousKnightSquare: undefined
      }
    }
  | {
      value: "playing" | { playing: "moving" }
      context: GameContext & {
        startTimeMs: number
        endTimeMs: undefined
        previousKnightSquare: undefined
      }
    }
  | {
      value:
        | { playing: "knightAttacked" }
        | {
            playing:
              | { knightAttacked: "toBeCaptured" }
              | { knightAttacked: "toReturn" }
          }
      context: GameContext & {
        startTimeMs: number
        endTimeMs: undefined
        previousKnightSquare: Square
      }
    }
  | {
      value: "captured" | "finished"
      context: GameContext & {
        startTimeMs: number
        endTimeMs: number
      }
    }
  | {
      value: "paused"
      context: GameContext & {
        previouslyElapsedMs: number
        startTimeMs: undefined
        endTimeMs: undefined
      }
    }

export type GameStateWrapper = State<GameContext, GameEvent, any, GameState>

const SquareType = String.withGuard(isSquare)
const QueenSquareType = String.withGuard(isQueenSquare)
const NonNegative = Number.withConstraint((n) => n >= 0)

const SerializedGameStateSchema = Record({
  queenSquare: QueenSquareType,
  knightSquare: SquareType,
  lastVisitedSquare: SquareType,
  targetSquare: SquareType,
  numMoves: NonNegative,
  previouslyElapsedMs: NonNegative,
})

export type SerializedGameState = Static<typeof SerializedGameStateSchema>

function makeSerializedGameState(context: GameContext): SerializedGameState {
  return {
    queenSquare: context.queenSquare,
    knightSquare: context.knightSquare,
    lastVisitedSquare: context.visitedSquares.last(context.knightSquare),
    targetSquare: context.targetSquare,
    numMoves: context.numMoves,
    previouslyElapsedMs: _getElapsedMs(context.startTimeMs, context.endTimeMs),
  }
}

function setQueenSquare(
  queenSquare: QueenSquare
): Pick<GameContext, "queenSquare" | "finalTargetSquare"> {
  return {
    queenSquare: queenSquare,
    finalTargetSquare: incrementWhileAttacked(
      ENDING_KNIGHT_SQUARE,
      queenSquare,
      "next"
    ),
  }
}

function resetKnight(
  queenSquare: QueenSquare
): Pick<
  GameContext,
  | "knightSquare"
  | "previousKnightSquare"
  | "targetSquare"
  | "visitedSquares"
  | "numMoves"
  | "startTimeMs"
  | "endTimeMs"
> {
  const startingSquare = incrementWhileAttacked(
    STARTING_KNIGHT_SQUARE,
    queenSquare,
    "previous"
  )
  return {
    knightSquare: startingSquare,
    previousKnightSquare: undefined,
    targetSquare: incrementWhileAttacked(
      getSquareIncrement(startingSquare, "previous"),
      queenSquare,
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

interface MakeInitialStateArgs {
  attackEndsGame: boolean
  queenSquare: QueenSquare
  serializedGameState: unknown
}

function createGameMachine(
  args: MakeInitialStateArgs
): StateMachine<GameContext, any, GameEvent, GameState> {
  const serializedGameState = SerializedGameStateSchema.guard(
    args.serializedGameState
  )
    ? args.serializedGameState
    : undefined

  let initialContext: GameContext
  if (serializedGameState !== undefined) {
    const queenSquare = serializedGameState.queenSquare
    const knightSquare = serializedGameState.knightSquare
    let visitedSquares: ImmutableList<Square> = ImmutableList()
    const startingSquare = incrementWhileAttacked(
      STARTING_KNIGHT_SQUARE,
      queenSquare,
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

    initialContext = {
      ...setQueenSquare(queenSquare),
      knightSquare,
      visitedSquares,
      targetSquare: serializedGameState.targetSquare,
      numMoves: serializedGameState.numMoves,
      previouslyElapsedMs: serializedGameState.previouslyElapsedMs,
      attackEndsGame: args.attackEndsGame,
    }
  } else {
    initialContext = {
      ...setQueenSquare(args.queenSquare),
      ...resetKnight(args.queenSquare),
      attackEndsGame: args.attackEndsGame,
    }
  }

  return createMachine<GameContext, GameEvent, GameState>(
    {
      id: "game",
      context: initialContext,
      initial: serializedGameState ? "playing" : "notStarted",
      states: {
        notStarted: {
          on: {
            START: {
              target: "playing",
            },
            MOVE_QUEEN: {
              target: "notStarted",
              actions: "moveQueen",
            },
          },
        },
        restarting: {
          after: {
            RESTART_DELAY: {
              target: "playing",
              actions: assign((context) => ({
                ...context,
                ...resetKnight(context.queenSquare),
              })),
            },
          },
        },
        playing: {
          entry: assign((context) => ({
            ...context,
            startTimeMs: Date.now() - (context.previouslyElapsedMs || 0),
            endTimeMs: undefined,
            previouslyElapsedMs: undefined,
          })),
          on: {
            PAUSE: {
              target: "paused",
              actions: assign((context) => ({
                ...context,
                startTimeMs: undefined,
                endTimeMs: undefined,
                previouslyElapsedMs: Date.now() - (context.startTimeMs || 0),
              })),
            },
            MOVE_QUEEN: {
              target: "restarting",
              cond: "queenSquareChanged",
              actions: "moveQueen",
            },
          },
          initial: "moving",
          states: {
            moving: {
              on: {
                MOVE_KNIGHT: {
                  target: "moving",
                  cond: "validKnightMove",
                  actions: assign({
                    knightSquare: (_, event) => event.square,
                    previousKnightSquare: (context) => context.knightSquare,
                    numMoves: (context) => context.numMoves + 1,
                  }),
                },
              },
              always: [
                {
                  target: "moving",
                  cond: "knightReachedTarget",
                  actions: assign({
                    visitedSquares: (context) =>
                      context.visitedSquares.push(context.targetSquare),
                    targetSquare: (context) =>
                      incrementWhileAttacked(
                        getSquareIncrement(context.targetSquare, "previous"),
                        context.queenSquare,
                        "previous"
                      ),
                  }),
                },
                {
                  target: "knightAttacked.toReturn",
                  cond: "queenAttacksKnight",
                },
                {
                  target: "knightAttacked.toBeCaptured",
                  cond: "queenAttacksAndCapturesKnight",
                },
                {
                  target: "#game.finished",
                  cond: "knightReachedFinalTarget",
                },
              ],
            },
            knightAttacked: {
              states: {
                toBeCaptured: {
                  on: {
                    // Cannot pause/resume game in this imminent capture state
                    PAUSE: undefined,
                  },
                  after: {
                    KNIGHT_ATTACK_DELAY: { target: "#game.captured" },
                  },
                },
                toReturn: {
                  after: {
                    KNIGHT_ATTACK_DELAY: {
                      target: "#game.playing.moving",
                      actions: assign({
                        knightSquare: (context) =>
                          context.previousKnightSquare || context.knightSquare,
                        previousKnightSquare: (_) => undefined,
                      }),
                    },
                  },
                },
              },
            },
          },
        },
        paused: {
          on: {
            UNPAUSE: "playing.moving",
          },
        },
        captured: {
          entry: "stopClock",
          on: {
            MOVE_QUEEN: {
              target: "notStarted",
              cond: "queenSquareChanged",
              actions: "moveQueen",
            },
          },
        },
        finished: {
          entry: "stopClock",
          on: {
            MOVE_QUEEN: {
              target: "notStarted",
              cond: "queenSquareChanged",
              actions: "moveQueen",
            },
          },
        },
      },
      on: {
        "SET.ATTACK_ENDS_GAME": {
          actions: assign({
            attackEndsGame: (_, event) => event.value,
          }),
        },
        START: "restarting",
      },
    },
    {
      actions: {
        moveQueen: assign((context, event) =>
          event.type === "MOVE_QUEEN" && isQueenSquare(event.square)
            ? {
                ...context,
                queenSquare: event.square,
                finalTargetSquare: incrementWhileAttacked(
                  ENDING_KNIGHT_SQUARE,
                  event.square,
                  "next"
                ),
                ...resetKnight(event.square),
              }
            : context
        ),
        stopClock: assign({ endTimeMs: (_) => Date.now() }),
      },
      guards: {
        queenSquareChanged: (context, event) =>
          event.type === "MOVE_QUEEN" &&
          isQueenSquare(event.square) &&
          context.queenSquare !== event.square,
        validKnightMove: (context, event) =>
          event.type === "MOVE_KNIGHT" &&
          getKnightDests(context.knightSquare, {
            queenSquare: context.queenSquare,
          }).includes(event.square),
        queenAttacksKnight: (context) =>
          attackedByQueen(context.knightSquare, context.queenSquare) &&
          !context.attackEndsGame,
        queenAttacksAndCapturesKnight: (context) =>
          attackedByQueen(context.knightSquare, context.queenSquare) &&
          !!context.attackEndsGame,
        knightReachedTarget: (context) =>
          context.targetSquare === context.knightSquare,
        knightReachedFinalTarget: (context) =>
          context.finalTargetSquare === context.knightSquare,
      },
      delays: {
        KNIGHT_ATTACK_DELAY: 800,
        RESTART_DELAY: 50,
      },
    }
  )
}

interface UseGameStateArgs {
  attackEndsGame: boolean
  queenSquare: QueenSquare
}

export default function useGameState(args: UseGameStateArgs) {
  const { attackEndsGame, queenSquare } = args
  const [
    serializedGameState,
    setSerializedGameState,
    removeSerializedGameState,
  ] = useLocalStorage("v1.game_state")

  const [state, send] = useMachine(
    () =>
      createGameMachine({ queenSquare, attackEndsGame, serializedGameState }),
    {
      devTools: process.env.NODE_ENV === "development",
    }
  )
  const getElapsedMs = useCallback(
    () => _getElapsedMs(state.context.startTimeMs, state.context.endTimeMs),
    [state.context.startTimeMs, state.context.endTimeMs]
  )

  useEffect(() => {
    send({ type: "SET.ATTACK_ENDS_GAME", value: args.attackEndsGame })
  }, [args.attackEndsGame, send])

  useEffect(() => {
    send({ type: "MOVE_QUEEN", square: args.queenSquare })
  }, [args.queenSquare, send])

  useEffect(() => {
    const handleVisibilityChange = () =>
      send({
        type: document.visibilityState === "hidden" ? "PAUSE" : "UNPAUSE",
      })
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [send])

  // Save game state whenever we can (game state changes)
  useEffect(() => {
    // Game must be in a saveable state, but have non-zero moves
    if (
      (state.matches({ playing: "moving" }) || state.matches("paused")) &&
      state.context.numMoves > 0
    ) {
      setSerializedGameState(makeSerializedGameState(state.context))
    } else {
      removeSerializedGameState()
    }
  }, [state, setSerializedGameState, removeSerializedGameState])

  return {
    state,
    send,
    getElapsedMs,
  }
}

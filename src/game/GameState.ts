import { useMachine } from "@xstate/react"
import { List as ImmutableList } from "immutable"
import { useEffect } from "react"
import { useDeepCompareEffect, useLocalStorage } from "react-use"
import { String, Number, Record, Static } from "runtypes"
import { assign, createMachine, StateMachine } from "xstate"
import { choose } from "xstate/lib/actions"
import {
  attackedByQueen,
  getSquareIncrement,
  incrementWhile,
  incrementWhileAttacked,
  isQueenSquare,
  isSquare,
  QueenSquare,
  QueenSquareType,
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
   * Total number of squares that the knight must visit.
   */
  numTotalSquares: number
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
  /**
   * A potential serialized representation of the current game state. Only
   * set in certain states, on certain transitions.
   */
  serializableState?: SerializedGameState
}

type GameEvent =
  | { type: "START" }
  | { type: "MOVE_KNIGHT"; square: Square }
  | { type: "PAUSE" }
  | { type: "UNPAUSE" }
  | { type: "SET.QUEEN_SQUARE"; square: QueenSquare }
  | { type: "SET.ATTACK_ENDS_GAME"; value: boolean }

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
      value: { playing: "paused" }
      context: GameContext & {
        startTimeMs: number
        endTimeMs: number
      }
    }
  | {
      value: "captured" | "finished"
      context: GameContext & {
        startTimeMs: number
        endTimeMs: number
        previousKnightSquare: undefined
      }
    }

export type GameStateType = GameState["value"]

const SquareType = String.withGuard(isSquare)
const NonNegative = Number.withConstraint((n) => n >= 0)

const SerializedGameStateSchema = Record({
  queenSquare: QueenSquareType,
  knightSquare: SquareType,
  targetSquare: SquareType,
  numMoves: NonNegative,
  previouslyElapsedMs: NonNegative,
})

export type SerializedGameState = Static<typeof SerializedGameStateSchema>

function makeSerializedGameState(context: GameContext): SerializedGameState {
  return {
    queenSquare: context.queenSquare,
    knightSquare: context.knightSquare,
    targetSquare: context.targetSquare,
    numMoves: context.numMoves,
    previouslyElapsedMs: getElapsedMs(context),
  }
}

function setQueenSquare(
  queenSquare: QueenSquare,
  startingKnightSquareUnsafe?: Square,
  endingKnightSquareUnsafe?: Square
): Pick<GameContext, "queenSquare" | "finalTargetSquare" | "numTotalSquares"> {
  const startingSquare = incrementWhileAttacked(
    startingKnightSquareUnsafe || STARTING_KNIGHT_SQUARE,
    queenSquare,
    "previousFile"
  )
  const finalTargetSquare = incrementWhile(
    endingKnightSquareUnsafe || ENDING_KNIGHT_SQUARE,
    (s) =>
      attackedByQueen(s, queenSquare) ||
      s === queenSquare ||
      s === startingSquare,
    "nextFile"
  )
  // Additional square to include starting square
  let numTotalSquares = 1
  for (
    let s = startingSquare;
    s !== finalTargetSquare;
    s = incrementWhileAttacked(
      getSquareIncrement(s, "previousFile"),
      queenSquare,
      "previousFile"
    )
  ) {
    numTotalSquares += 1
  }
  return {
    queenSquare,
    finalTargetSquare,
    numTotalSquares,
  }
}

function resetKnight(
  queenSquare: QueenSquare,
  startingKnightSquareUnsafe?: Square
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
    startingKnightSquareUnsafe || STARTING_KNIGHT_SQUARE,
    queenSquare,
    "previousFile"
  )
  return {
    knightSquare: startingSquare,
    previousKnightSquare: undefined,
    targetSquare: incrementWhileAttacked(
      getSquareIncrement(startingSquare, "previousFile"),
      queenSquare,
      "previousFile"
    ),
    visitedSquares: ImmutableList([startingSquare]),
    numMoves: 0,
    startTimeMs: undefined,
    endTimeMs: undefined,
  }
}

export function getElapsedMs(context: GameContext) {
  if (context.startTimeMs === undefined) {
    return 0
  } else if (context.endTimeMs === undefined) {
    return Date.now() - context.startTimeMs
  } else {
    return context.endTimeMs - context.startTimeMs
  }
}

export interface CreateGameMachineArgs {
  attackEndsGame: boolean
  queenSquare: QueenSquare
  serializedGameState?: SerializedGameState | undefined
  startingKnightSquareUnsafe?: Square
  endingKnightSquareUnsafe?: Square
}

export function createGameMachine(
  args: CreateGameMachineArgs
): StateMachine<GameContext, any, GameEvent, GameState> {
  let initialContext: GameContext
  if (
    args.serializedGameState !== undefined &&
    // If saved queen square is different from configured queen square,
    // ignore saved game information and treat as new game
    args.queenSquare === args.serializedGameState.queenSquare &&
    args.queenSquare !== args.serializedGameState.knightSquare &&
    args.queenSquare !== args.serializedGameState.targetSquare &&
    !attackedByQueen(args.serializedGameState.knightSquare, args.queenSquare) &&
    !attackedByQueen(args.serializedGameState.targetSquare, args.queenSquare)
  ) {
    const queenSquare = args.serializedGameState.queenSquare
    const knightSquare = args.serializedGameState.knightSquare
    let visitedSquares: ImmutableList<Square> = ImmutableList()
    const startingSquare = incrementWhileAttacked(
      args.startingKnightSquareUnsafe || STARTING_KNIGHT_SQUARE,
      queenSquare,
      "previousFile"
    )
    for (
      let visitedSquare = startingSquare;
      visitedSquare !== args.serializedGameState.targetSquare;
      visitedSquare = incrementWhileAttacked(
        getSquareIncrement(visitedSquare, "previousFile"),
        args.serializedGameState.queenSquare,
        "previousFile"
      )
    ) {
      visitedSquares = visitedSquares.push(visitedSquare)
    }

    initialContext = {
      ...setQueenSquare(
        queenSquare,
        args.startingKnightSquareUnsafe,
        args.endingKnightSquareUnsafe
      ),
      knightSquare,
      visitedSquares,
      targetSquare: args.serializedGameState.targetSquare,
      numMoves: args.serializedGameState.numMoves,
      previouslyElapsedMs: args.serializedGameState.previouslyElapsedMs,
      attackEndsGame: args.attackEndsGame,
    }
  } else {
    initialContext = {
      ...setQueenSquare(
        args.queenSquare,
        args.startingKnightSquareUnsafe,
        args.endingKnightSquareUnsafe
      ),
      ...resetKnight(args.queenSquare, args.startingKnightSquareUnsafe),
      attackEndsGame: args.attackEndsGame,
    }
  }

  return createMachine<GameContext, GameEvent, GameState>(
    {
      id: "game",
      context: initialContext,
      initial: args.serializedGameState ? "playing" : "notStarted",
      states: {
        notStarted: {
          on: {
            START: {
              target: "playing",
            },
            "SET.QUEEN_SQUARE": {
              target: "notStarted",
              cond: "queenSquareChanged",
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
                ...resetKnight(
                  context.queenSquare,
                  args.startingKnightSquareUnsafe
                ),
              })),
            },
          },
        },
        playing: {
          entry: assign({
            startTimeMs: (context) =>
              Date.now() - (context.previouslyElapsedMs || 0),
            endTimeMs: (_) => undefined,
            previouslyElapsedMs: (_) => undefined,
          }),
          exit: [
            assign({
              previousKnightSquare: (_) => undefined,
            }),
            "clearState",
          ],
          on: {
            PAUSE: {
              target: ".paused",
              internal: true,
              actions: [
                assign({
                  endTimeMs: (_) => Date.now(),
                }),
                choose([
                  {
                    cond: "atLeastOneMoveMade",
                    actions: "serializeState",
                  },
                ]),
              ],
            },
            "SET.QUEEN_SQUARE": {
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
                  actions: [
                    assign({
                      knightSquare: (_, event) => event.square,
                      previousKnightSquare: (context) => context.knightSquare,
                      numMoves: (context) => context.numMoves + 1,
                    }),
                    choose([
                      {
                        cond: "moveIsQueenSafe",
                        actions: "serializeState",
                      },
                    ]),
                  ],
                },
              },
              always: [
                {
                  target: "moving",
                  cond: "knightReachedNonFinalTarget",
                  actions: assign({
                    visitedSquares: (context) =>
                      context.visitedSquares.push(context.targetSquare),
                    targetSquare: (context) =>
                      incrementWhileAttacked(
                        getSquareIncrement(
                          context.targetSquare,
                          "previousFile"
                        ),
                        context.queenSquare,
                        "previousFile"
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
                  actions: assign({
                    visitedSquares: (context) =>
                      context.visitedSquares.push(context.targetSquare),
                  }),
                },
              ],
            },
            knightAttacked: {
              states: {
                toBeCaptured: {
                  on: {
                    // Cannot pause/resume game in this imminent capture state
                    PAUSE: undefined,
                    "SET.QUEEN_SQUARE": {
                      target: "#game.notStarted",
                      cond: "queenSquareChanged",
                      actions: "moveQueen",
                    },
                  },
                  after: {
                    KNIGHT_ATTACK_DELAY: { target: "#game.captured" },
                  },
                },
                toReturn: {
                  after: {
                    KNIGHT_ATTACK_DELAY: {
                      target: "#game.playing.moving",
                      actions: [
                        assign({
                          knightSquare: (context) =>
                            context.previousKnightSquare ||
                            context.knightSquare,
                          previousKnightSquare: (_) => undefined,
                        }),
                        "serializeState",
                      ],
                    },
                  },
                },
              },
            },
            paused: {
              on: {
                PAUSE: undefined,
                UNPAUSE: {
                  target: "#game.playing.moving",
                  actions: assign({
                    startTimeMs: (context) =>
                      Date.now() - getElapsedMs(context),
                    endTimeMs: (_) => undefined,
                  }),
                },
              },
            },
          },
        },
        captured: {
          entry: "stopClock",
          on: {
            "SET.QUEEN_SQUARE": {
              target: "notStarted",
              cond: "queenSquareChanged",
              actions: "moveQueen",
            },
          },
        },
        finished: {
          entry: "stopClock",
          on: {
            "SET.QUEEN_SQUARE": {
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
          event.type === "SET.QUEEN_SQUARE" &&
          isQueenSquare(event.square) &&
          context.queenSquare !== event.square
            ? {
                ...context,
                ...setQueenSquare(
                  event.square,
                  args.startingKnightSquareUnsafe,
                  args.endingKnightSquareUnsafe
                ),
                ...resetKnight(event.square, args.startingKnightSquareUnsafe),
              }
            : context
        ),
        stopClock: assign({ endTimeMs: (_) => Date.now() }),
        serializeState: assign({
          serializableState: (context) => makeSerializedGameState(context),
        }),
        clearState: assign({ serializableState: (_) => undefined }),
      },
      guards: {
        queenSquareChanged: (context, event) =>
          event.type === "SET.QUEEN_SQUARE" &&
          isQueenSquare(event.square) &&
          context.queenSquare !== event.square,
        validKnightMove: (context, event) =>
          event.type === "MOVE_KNIGHT" &&
          getKnightDests(context.knightSquare, {
            queenSquare: context.queenSquare,
          }).includes(event.square),
        moveIsQueenSafe: (context, event) =>
          event.type === "MOVE_KNIGHT" &&
          !attackedByQueen(event.square, context.queenSquare),
        queenAttacksKnight: (context) =>
          attackedByQueen(context.knightSquare, context.queenSquare) &&
          !context.attackEndsGame,
        queenAttacksAndCapturesKnight: (context) =>
          attackedByQueen(context.knightSquare, context.queenSquare) &&
          !!context.attackEndsGame,
        knightReachedNonFinalTarget: (context) =>
          context.targetSquare === context.knightSquare &&
          context.targetSquare !== context.finalTargetSquare,
        knightReachedFinalTarget: (context) =>
          context.targetSquare === context.knightSquare &&
          context.targetSquare === context.finalTargetSquare,
        atLeastOneMoveMade: (context) => context.numMoves >= 1,
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
      createGameMachine({
        queenSquare,
        attackEndsGame,
        serializedGameState: SerializedGameStateSchema.guard(
          serializedGameState
        )
          ? serializedGameState
          : undefined,
      }),
    { devTools: process.env.REACT_APP_INSPECT_XSTATE === "1" }
  )

  // Ensure that further changes to input args are handled appopriately
  useEffect(() => {
    send({ type: "SET.ATTACK_ENDS_GAME", value: attackEndsGame })
  }, [attackEndsGame, send])
  useEffect(() => {
    send({ type: "SET.QUEEN_SQUARE", square: queenSquare })
  }, [queenSquare, send])

  // Save game state whenever window closes
  useEffect(() => {
    const handleSave = () => {
      // Currently moving, with move count > 0
      if (state.matches({ playing: "moving" }) && state.context.numMoves > 0) {
        setSerializedGameState(makeSerializedGameState(state.context))
      }
    }
    window.addEventListener("beforeunload", handleSave)
    return () => window.removeEventListener("beforeunload", handleSave)
  }, [state, setSerializedGameState])

  // Save game state whenever internal serialized copy changes
  useDeepCompareEffect(() => {
    if (state.context.serializableState) {
      setSerializedGameState(state.context.serializableState)
    } else {
      removeSerializedGameState()
    }
  }, [
    state.context.serializableState,
    setSerializedGameState,
    removeSerializedGameState,
  ])

  return { state, send }
}

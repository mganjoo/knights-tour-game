import { List as ImmutableList } from "immutable"
import MockDate from "mockdate"
import waitForExpect from "wait-for-expect"
import { interpret } from "xstate"
import {
  createGameMachine,
  CreateGameMachineArgs,
  getElapsedMs,
} from "./GameState"

function makeService(args?: Partial<CreateGameMachineArgs>) {
  const service = interpret(
    createGameMachine({
      queenSquare: args?.queenSquare || "d5",
      attackEndsGame: !!args?.attackEndsGame,
      serializedGameState: args?.serializedGameState,
      startingKnightSquareUnsafe: args?.startingKnightSquareUnsafe,
      endingKnightSquareUnsafe: args?.endingKnightSquareUnsafe,
    }).withConfig({ delays: { RESTART_DELAY: 0, KNIGHT_ATTACK_DELAY: 0 } })
  )
  service.start()
  return service
}

describe("Game squares initialization", () => {
  test("sets up initial context correctly", () => {
    expect(
      createGameMachine({ queenSquare: "d2", attackEndsGame: false }).context
    ).toEqual({
      queenSquare: "d2",
      knightSquare: "h8",
      targetSquare: "g8",
      finalTargetSquare: "a1",
      visitedSquares: ImmutableList(["h8"]),
      numTotalSquares: 40,
      numMoves: 0,
      startTimeMs: undefined,
      endTimeMs: undefined,
      previouslyElapsedMs: undefined,
      previousKnightSquare: undefined,
      attackEndsGame: false,
    })
  })
  test("works correctly when starting square is attacked", () => {
    expect(
      createGameMachine({ queenSquare: "e5", attackEndsGame: false }).context
    ).toEqual({
      queenSquare: "e5",
      knightSquare: "g8",
      targetSquare: "f8",
      finalTargetSquare: "b1",
      visitedSquares: ImmutableList(["g8"]),
      numTotalSquares: 36,
      numMoves: 0,
      startTimeMs: undefined,
      endTimeMs: undefined,
      previouslyElapsedMs: undefined,
      previousKnightSquare: undefined,
      attackEndsGame: false,
    })
  })
  test("works correctly when final square is closer than a1", () => {
    expect(
      createGameMachine({
        queenSquare: "e5",
        attackEndsGame: false,
        endingKnightSquareUnsafe: "e3",
      }).context
    ).toEqual({
      queenSquare: "e5",
      knightSquare: "g8",
      targetSquare: "f8",
      finalTargetSquare: "f3",
      visitedSquares: ImmutableList(["g8"]),
      numTotalSquares: 22,
      numMoves: 0,
      startTimeMs: undefined,
      endTimeMs: undefined,
      previouslyElapsedMs: undefined,
      previousKnightSquare: undefined,
      attackEndsGame: false,
    })
  })
  test("works correctly when starting square is closer than h8", () => {
    expect(
      createGameMachine({
        queenSquare: "e5",
        attackEndsGame: false,
        startingKnightSquareUnsafe: "b7",
      }).context
    ).toEqual({
      queenSquare: "e5",
      knightSquare: "b7",
      targetSquare: "a7",
      finalTargetSquare: "b1",
      visitedSquares: ImmutableList(["b7"]),
      numTotalSquares: 28,
      numMoves: 0,
      startTimeMs: undefined,
      endTimeMs: undefined,
      previouslyElapsedMs: undefined,
      previousKnightSquare: undefined,
      attackEndsGame: false,
    })
  })
  test("wraps around when final square is equal to starting square", () => {
    expect(
      createGameMachine({
        queenSquare: "e5",
        attackEndsGame: false,
        endingKnightSquareUnsafe: "g8",
      }).context
    ).toEqual({
      queenSquare: "e5",
      knightSquare: "g8",
      targetSquare: "f8",
      finalTargetSquare: "b1",
      visitedSquares: ImmutableList(["g8"]),
      numTotalSquares: 36,
      numMoves: 0,
      startTimeMs: undefined,
      endTimeMs: undefined,
      previouslyElapsedMs: undefined,
      previousKnightSquare: undefined,
      attackEndsGame: false,
    })
  })
  test("wraps around when final square is greater than starting square", () => {
    expect(
      createGameMachine({
        queenSquare: "e5",
        attackEndsGame: false,
        startingKnightSquareUnsafe: "d7",
        endingKnightSquareUnsafe: "f8",
      }).context
    ).toEqual({
      queenSquare: "e5",
      knightSquare: "d7",
      targetSquare: "b7",
      finalTargetSquare: "f8",
      visitedSquares: ImmutableList(["d7"]),
      numTotalSquares: 31,
      numMoves: 0,
      startTimeMs: undefined,
      endTimeMs: undefined,
      previouslyElapsedMs: undefined,
      previousKnightSquare: undefined,
      attackEndsGame: false,
    })
  })

  test("treats attackEndsGame parameter correctly", () => {
    expect(
      createGameMachine({ queenSquare: "d2", attackEndsGame: true }).context
    ).toEqual({
      queenSquare: "d2",
      knightSquare: "h8",
      targetSquare: "g8",
      finalTargetSquare: "a1",
      visitedSquares: ImmutableList(["h8"]),
      numTotalSquares: 40,
      numMoves: 0,
      startTimeMs: undefined,
      endTimeMs: undefined,
      previouslyElapsedMs: undefined,
      previousKnightSquare: undefined,
      attackEndsGame: true,
    })
  })
})

describe("MOVE_KNIGHT transition", () => {
  test("correctly increments counters and updates square", async () => {
    const service = makeService()
    service.send(["START", { type: "MOVE_KNIGHT", square: "g6" }])
    await waitForExpect(() => {
      expect(service.state.matches({ playing: "moving" })).toBeTruthy()
      expect(service.state.context.numMoves).toEqual(1)
      expect(service.state.context.knightSquare).toEqual("g6")
      expect(service.state.context.previousKnightSquare).toEqual("h8")
      expect(service.state.context.visitedSquares).toEqual(
        ImmutableList(["h8"])
      )
    })
  })

  test("returns to previous square automatically after queen attack", async () => {
    const service = makeService()
    service.send([
      "START",
      { type: "MOVE_KNIGHT", square: "g6" },
      { type: "MOVE_KNIGHT", square: "e5" },
    ])
    await waitForExpect(() => {
      expect(service.state.matches({ playing: "moving" })).toBeTruthy()
      expect(service.state.context.numMoves).toEqual(2)
      expect(service.state.context.knightSquare).toEqual("g6")
      expect(service.state.context.previousKnightSquare).toBeUndefined()
    })
  })

  test("causes game to end after queen attack if attackEndsGame is true", async () => {
    const service = makeService({ attackEndsGame: true })
    service.send([
      "START",
      { type: "MOVE_KNIGHT", square: "g6" },
      { type: "MOVE_KNIGHT", square: "e5" },
    ])
    await waitForExpect(() => {
      expect(service.state.matches("captured")).toBeTruthy()
      expect(service.state.context.numMoves).toEqual(2)
      expect(service.state.context.knightSquare).toEqual("e5")
      expect(service.state.context.previousKnightSquare).toBeUndefined()
    })
  })

  test("updates target square and visited squares after reaching target square", async () => {
    const service = makeService()
    service.send([
      "START",
      { type: "MOVE_KNIGHT", square: "g6" },
      { type: "MOVE_KNIGHT", square: "f8" },
    ])
    await waitForExpect(() => {
      expect(service.state.matches({ playing: "moving" })).toBeTruthy()
      expect(service.state.context.numMoves).toEqual(2)
      expect(service.state.context.targetSquare).toEqual("e8")
      expect(service.state.context.visitedSquares).toEqual(
        ImmutableList(["h8", "f8"])
      )
    })
  })

  test("ends game if knight reaches final target square", async () => {
    const service = makeService({ endingKnightSquareUnsafe: "e8" })
    service.send([
      "START",
      { type: "MOVE_KNIGHT", square: "g6" },
      { type: "MOVE_KNIGHT", square: "f8" },
      { type: "MOVE_KNIGHT", square: "h7" },
      { type: "MOVE_KNIGHT", square: "f6" },
      { type: "MOVE_KNIGHT", square: "e8" },
    ])
    await waitForExpect(() => {
      expect(service.state.matches("finished")).toBeTruthy()
      expect(service.state.context.numMoves).toEqual(5)
      expect(service.state.context.visitedSquares).toEqual(
        ImmutableList(["h8", "f8", "e8"])
      )
    })
  })

  test("does not end game if knight reaches final target square prematurely", async () => {
    // Update final square to c8 to simplify test
    const service = makeService({ endingKnightSquareUnsafe: "c8" })
    service.send([
      "START",
      // Simulate path to final target square without hitting immediate target
      { type: "MOVE_KNIGHT", square: "g6" },
      { type: "MOVE_KNIGHT", square: "e7" },
      { type: "MOVE_KNIGHT", square: "c8" },
    ])
    await waitForExpect(() => {
      expect(service.state.matches({ playing: "moving" })).toBeTruthy()
      expect(service.state.context.numMoves).toEqual(3)
    })
  })
})

describe("SET.QUEEN_SQUARE transition", () => {
  test("correctly updates queen square", async () => {
    const service = makeService({ queenSquare: "d2" })
    expect(service.state.context.queenSquare).toEqual("d2")
    expect(service.state.context.numTotalSquares).toEqual(40)
    service.send({ type: "SET.QUEEN_SQUARE", square: "e5" })
    await waitForExpect(() => {
      expect(service.state.matches("notStarted")).toBeTruthy()
      expect(service.state.context.queenSquare).toEqual("e5")
      expect(service.state.context.knightSquare).toEqual("g8")
      expect(service.state.context.visitedSquares).toEqual(
        ImmutableList(["g8"])
      )
      expect(service.state.context.targetSquare).toEqual("f8")
      expect(service.state.context.finalTargetSquare).toEqual("b1")
      expect(service.state.context.numTotalSquares).toEqual(36)
    })
  })

  test("restarts game when game is in playing mode", async () => {
    const service = makeService({ queenSquare: "d5" })
    service.send([
      "START",
      { type: "MOVE_KNIGHT", square: "g6" },
      { type: "MOVE_KNIGHT", square: "f8" },
      { type: "SET.QUEEN_SQUARE", square: "e5" },
    ])
    await waitForExpect(() => {
      expect(service.state.matches({ playing: "moving" })).toBeTruthy()
      expect(service.state.context.queenSquare).toEqual("e5")
      expect(service.state.context.knightSquare).toEqual("g8")
      expect(service.state.context.visitedSquares).toEqual(
        ImmutableList(["g8"])
      )
      expect(service.state.context.targetSquare).toEqual("f8")
      expect(service.state.context.finalTargetSquare).toEqual("b1")
      expect(service.state.context.numTotalSquares).toEqual(36)
      expect(service.state.context.numMoves).toEqual(0)
    })
  })

  test("does not restart game when queen square does not change", async () => {
    const service = makeService({ queenSquare: "d5" })
    service.send([
      "START",
      { type: "MOVE_KNIGHT", square: "g6" },
      { type: "MOVE_KNIGHT", square: "f8" },
      { type: "SET.QUEEN_SQUARE", square: "d5" },
    ])
    await waitForExpect(() => {
      expect(service.state.matches({ playing: "moving" })).toBeTruthy()
      expect(service.state.context.queenSquare).toEqual("d5")
      expect(service.state.context.knightSquare).toEqual("f8")
      expect(service.state.context.visitedSquares).toEqual(
        ImmutableList(["h8", "f8"])
      )
      expect(service.state.context.numMoves).toEqual(2)
    })
  })

  test("transitions to notStarted state from finished state", async () => {
    // Cause game to end at f8
    const service = makeService({
      queenSquare: "d5",
      endingKnightSquareUnsafe: "f8",
    })
    service.send([
      "START",
      { type: "MOVE_KNIGHT", square: "g6" },
      { type: "MOVE_KNIGHT", square: "f8" },
      { type: "SET.QUEEN_SQUARE", square: "e5" },
    ])
    await waitForExpect(() => {
      expect(service.state.context.queenSquare).toEqual("e5")
      expect(service.state.matches("notStarted")).toBeTruthy()
    })
  })

  test("transitions to notStarted state if knight is about to be captured", async () => {
    // Cause game to end with capture
    const service = makeService({
      queenSquare: "d5",
      attackEndsGame: true,
    })
    service.send([
      "START",
      { type: "MOVE_KNIGHT", square: "f7" },
      { type: "SET.QUEEN_SQUARE", square: "e5" },
    ])
    await waitForExpect(() => {
      expect(service.state.context.queenSquare).toEqual("e5")
      expect(service.state.matches("notStarted")).toBeTruthy()
    })
  })

  test("transitions to notStarted state from captured state", async () => {
    const machine = createGameMachine({
      queenSquare: "d5",
      attackEndsGame: false,
    })
    expect(
      machine
        .transition("captured", { type: "SET.QUEEN_SQUARE", square: "e5" })
        .matches("notStarted")
    ).toBeTruthy()
  })
})

describe("SET.ATTACK_ENDS_GAME transition", () => {
  test("works correctly", async () => {
    const service = makeService()
    expect(service.state.context.attackEndsGame).toEqual(false)
    service.send([{ type: "SET.ATTACK_ENDS_GAME", value: true }])
    await waitForExpect(() => {
      expect(service.state.context.attackEndsGame).toEqual(true)
    })
  })
})

describe("getElapsedMs()", () => {
  const START_DATE = new Date(2021, 5, 15, 10, 10, 0)
  const addMs = (date: Date, ms: number) => new Date(date.valueOf() + ms)

  beforeEach(() => {
    MockDate.set(START_DATE)
  })

  afterEach(() => {
    MockDate.reset()
  })

  test("tracks start time correctly on game start", async () => {
    const service = makeService()
    expect(getElapsedMs(service.state.context)).toEqual(0)
    service.send("START")
    await waitForExpect(() => {
      expect(service.state.matches({ playing: "moving" })).toBeTruthy()
      // Add 50s to current time
      MockDate.set(addMs(START_DATE, 50000))
      expect(getElapsedMs(service.state.context)).toEqual(50000)
    })
  })

  test("returns frozen elapsed time after game is paused", async () => {
    const service = makeService()
    service.onTransition((state) => {
      // Force 30s time jump after entering moving state
      if (state.matches({ playing: "moving" })) {
        MockDate.set(addMs(START_DATE, 30000))
      }
    })
    expect(getElapsedMs(service.state.context)).toEqual(0)
    service.send("START")
    service.send("PAUSE")
    await waitForExpect(() => {
      expect(service.state.matches({ playing: "paused" })).toBeTruthy()
      // Add 50s to current time
      MockDate.set(addMs(START_DATE, 50000))
      // Expect timer to still only show 30s after pause
      expect(getElapsedMs(service.state.context)).toEqual(30000)
    })
  })

  test("resumes counting time correctly after game is unpaused", async () => {
    const service = makeService()
    service.onTransition((state) => {
      // Force 30s time jump after entering moving state
      if (state.matches({ playing: "moving" })) {
        MockDate.set(addMs(START_DATE, 30000))
      }
      // Another 40s time jump after entering paused state
      if (state.matches({ playing: "paused" })) {
        MockDate.set(addMs(START_DATE, 70000))
      }
    })
    expect(getElapsedMs(service.state.context)).toEqual(0)
    service.send("START")
    service.send("PAUSE")
    service.send("UNPAUSE")
    await waitForExpect(() => {
      expect(service.state.matches({ playing: "moving" })).toBeTruthy()
      // Add 120s to start time
      MockDate.set(addMs(START_DATE, 120000))
      // Expect timer to show 30s (pre-pause) + 50s (after resume)
      expect(getElapsedMs(service.state.context)).toEqual(80000)
    })
  })

  test("returns frozen elapsed time after game ends in capture", async () => {
    const service = makeService({ attackEndsGame: true })
    service.onTransition((state) => {
      // Force 30s time jump after entering moving state
      if (state.matches({ playing: "moving" })) {
        MockDate.set(addMs(START_DATE, 30000))
      }
    })
    expect(getElapsedMs(service.state.context)).toEqual(0)
    service.send("START")
    service.send([
      { type: "MOVE_KNIGHT", square: "g6" },
      { type: "MOVE_KNIGHT", square: "e5" },
    ])
    await waitForExpect(() => {
      expect(service.state.matches("captured")).toBeTruthy()
      // Add 100s to current time
      MockDate.set(addMs(START_DATE, 100000))
      // Expect timer to still only show 30s after capture
      expect(getElapsedMs(service.state.context)).toEqual(30000)
    })
  })

  test("returns frozen elapsed time after game finishes", async () => {
    const service = makeService({ endingKnightSquareUnsafe: "f8" })
    service.onTransition((state) => {
      // Force 20s time jump after entering moving state
      if (state.matches({ playing: "moving" })) {
        MockDate.set(addMs(START_DATE, 20000))
      }
    })
    expect(getElapsedMs(service.state.context)).toEqual(0)
    service.send("START")
    service.send([
      { type: "MOVE_KNIGHT", square: "g6" },
      { type: "MOVE_KNIGHT", square: "f8" },
    ])
    await waitForExpect(() => {
      expect(service.state.matches("finished")).toBeTruthy()
      // Add 100s to current time
      MockDate.set(addMs(START_DATE, 100000))
      // Expect timer to still only show 20s after capture
      expect(getElapsedMs(service.state.context)).toEqual(20000)
    })
  })

  test("carries over previously elapsed time when game is initialized", async () => {
    const service = makeService({
      serializedGameState: {
        queenSquare: "d5",
        knightSquare: "h8",
        targetSquare: "f8",
        numMoves: 2,
        previouslyElapsedMs: 45000,
      },
    })
    service.onTransition((state) => {
      // Force 20s time jump after entering moving state
      if (state.matches({ playing: "moving" })) {
        MockDate.set(addMs(START_DATE, 20000))
      }
    })
    await waitForExpect(() => {
      expect(service.state.matches({ playing: "moving" })).toBeTruthy()
      // Expect timer to include previously elapsed time
      expect(getElapsedMs(service.state.context)).toEqual(65000)
    })
  })
})

// TODO: Starting from existing serialized state

import { List as ImmutableList } from "immutable"
import { createGameMachine } from "./GameState"

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
})

test("Game intialization treats attackEndsGame parameter correctly", () => {
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

describe("MOVE_KNIGHT transition", () => {
  test("correctly increments counters and updates square", () => {})
  test("returns to previous square automatically after queen attack", () => {})
  test("causes game to end if attackEndsGame is true", () => {})
  test("updates target square and visited squares after reaching target square", () => {})
  test("does not end game if knight reaches final target square prematurely", () => {})
})

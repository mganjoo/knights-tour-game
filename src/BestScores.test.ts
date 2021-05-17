import { renderHook, act } from "@testing-library/react-hooks"
import { useBestScores } from "./BestScores"

describe("useBestScores()", () => {
  beforeEach(() => {
    global.localStorage.clear()
  })

  test("saves scores correctly for the first time", () => {
    const { result } = renderHook(() => useBestScores())
    act(() => {
      result.current.updateBestScores({
        queenSquare: "d5",
        elapsedMs: 500000,
        numMoves: 150,
      })
    })
    expect(
      JSON.parse(global.localStorage.getItem("v2.best_scores") || "{}")
    ).toEqual({
      d5: {
        bestElapsedMs: 500000,
        bestNumMoves: 150,
      },
    })
  })

  test("loads empty map correctly", () => {
    const { result } = renderHook(() => useBestScores())
    expect(result.current.bestScoresMap).toEqual({})
  })

  test("loads scores correctly", () => {
    global.localStorage.setItem(
      "v2.best_scores",
      JSON.stringify({
        e5: {
          bestElapsedMs: 320000,
          bestNumMoves: 170,
        },
      })
    )
    const { result } = renderHook(() => useBestScores())
    expect(result.current.bestScoresMap).toEqual({
      e5: {
        bestElapsedMs: 320000,
        bestNumMoves: 170,
      },
    })
  })

  test("works with default empty map if stored map is invalid", () => {
    global.localStorage.setItem(
      "v2.best_scores",
      JSON.stringify({
        e5: {
          bestElapsedMs: -500,
          bestNumMoves: "abc",
        },
      })
    )
    const { result } = renderHook(() => useBestScores())
    expect(result.current.bestScoresMap).toEqual({})
  })

  test("updates scores correctly if elapsed time is lower", () => {
    const { result } = renderHook(() => useBestScores())
    act(() => {
      result.current.updateBestScores({
        queenSquare: "d5",
        elapsedMs: 500000,
        numMoves: 150,
      })
    })
    act(() => {
      result.current.updateBestScores({
        queenSquare: "d5",
        elapsedMs: 300000,
        numMoves: 200,
      })
    })
    expect(
      JSON.parse(global.localStorage.getItem("v2.best_scores") || "{}")
    ).toEqual({
      d5: {
        bestElapsedMs: 300000,
        bestNumMoves: 150,
      },
    })
  })

  test("updates scores correctly if number of moves is lower", () => {
    const { result } = renderHook(() => useBestScores())
    act(() => {
      result.current.updateBestScores({
        queenSquare: "d5",
        elapsedMs: 500000,
        numMoves: 150,
      })
    })
    act(() => {
      result.current.updateBestScores({
        queenSquare: "d5",
        elapsedMs: 600000,
        numMoves: 100,
      })
    })
    expect(
      JSON.parse(global.localStorage.getItem("v2.best_scores") || "{}")
    ).toEqual({
      d5: {
        bestElapsedMs: 500000,
        bestNumMoves: 100,
      },
    })
  })

  test("updates scores correctly if both elapsed time and number of moves is lower", () => {
    const { result } = renderHook(() => useBestScores())
    act(() => {
      result.current.updateBestScores({
        queenSquare: "d5",
        elapsedMs: 500000,
        numMoves: 150,
      })
    })
    act(() => {
      result.current.updateBestScores({
        queenSquare: "d5",
        elapsedMs: 400000,
        numMoves: 100,
      })
    })
    expect(
      JSON.parse(global.localStorage.getItem("v2.best_scores") || "{}")
    ).toEqual({
      d5: {
        bestElapsedMs: 400000,
        bestNumMoves: 100,
      },
    })
  })

  test("does not update scores if neither elapsed time nor number of moves is lower", () => {
    const { result } = renderHook(() => useBestScores())
    act(() => {
      result.current.updateBestScores({
        queenSquare: "d5",
        elapsedMs: 500000,
        numMoves: 150,
      })
    })
    act(() => {
      result.current.updateBestScores({
        queenSquare: "d5",
        elapsedMs: 600000,
        numMoves: 500,
      })
    })
    expect(
      JSON.parse(global.localStorage.getItem("v2.best_scores") || "{}")
    ).toEqual({
      d5: {
        bestElapsedMs: 500000,
        bestNumMoves: 150,
      },
    })
  })

  test("saves scores correctly for a new square", () => {
    const { result } = renderHook(() => useBestScores())
    act(() => {
      result.current.updateBestScores({
        queenSquare: "d5",
        elapsedMs: 500000,
        numMoves: 150,
      })
    })
    act(() => {
      result.current.updateBestScores({
        queenSquare: "e5",
        elapsedMs: 600000,
        numMoves: 550,
      })
    })
    expect(
      JSON.parse(global.localStorage.getItem("v2.best_scores") || "{}")
    ).toEqual({
      d5: {
        bestElapsedMs: 500000,
        bestNumMoves: 150,
      },
      e5: {
        bestElapsedMs: 600000,
        bestNumMoves: 550,
      },
    })
  })

  test("upgrades correctly from v1 scores-only format", () => {
    global.localStorage.setItem("v1.best_num_moves", JSON.stringify(25))
    global.localStorage.setItem("v1.best_seconds", JSON.stringify(300))
    const { result, rerender } = renderHook(() => useBestScores())
    rerender()
    expect(result.current.bestScoresMap).toEqual({
      d5: {
        bestElapsedMs: 300000,
        bestNumMoves: 25,
      },
    })
    // Old values get deleted
    expect(global.localStorage.getItem("v1.best_num_moves")).toBeNull()
    expect(global.localStorage.getItem("v1.best_seconds")).toBeNull()
  })

  test("upgrades correctly from v1 map format with seconds", () => {
    global.localStorage.setItem(
      "v1.best_scores",
      JSON.stringify({ e5: { bestSeconds: 530, bestMoves: 300 } })
    )
    const { result, rerender } = renderHook(() => useBestScores())
    rerender()
    expect(result.current.bestScoresMap).toEqual({
      e5: {
        bestElapsedMs: 530000,
        bestNumMoves: 300,
      },
    })
    // Old values get deleted
    expect(global.localStorage.getItem("v1.best_scores")).toBeNull()
  })
})

/**
 * The 0x88 representation of the board.
 *
 * See https://www.chessprogramming.org/0x88 for details.
 */
// prettier-ignore
const SQUARES_MAP = {
  a8:   0, b8:   1, c8:   2, d8:   3, e8:   4, f8:   5, g8:   6, h8:   7,
  a7:  16, b7:  17, c7:  18, d7:  19, e7:  20, f7:  21, g7:  22, h7:  23,
  a6:  32, b6:  33, c6:  34, d6:  35, e6:  36, f6:  37, g6:  38, h6:  39,
  a5:  48, b5:  49, c5:  50, d5:  51, e5:  52, f5:  53, g5:  54, h5:  55,
  a4:  64, b4:  65, c4:  66, d4:  67, e4:  68, f4:  69, g4:  70, h4:  71,
  a3:  80, b3:  81, c3:  82, d3:  83, e3:  84, f3:  85, g3:  86, h3:  87,
  a2:  96, b2:  97, c2:  98, d2:  99, e2: 100, f2: 101, g2: 102, h2: 103,
  a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119
}

/**
 * Inverser representation of the board (0x88Idx -> square name).
 */
const INVERSE_SQUARES_MAP: {
  [k: number]: keyof typeof SQUARES_MAP
} = Object.keys(SQUARES_MAP)
  .filter(isSquare)
  .reduce((acc, k) => Object.assign(acc, { [SQUARES_MAP[k]]: k }), {})

/**
 * Type alias for all chess squares.
 */
export type Square = keyof typeof SQUARES_MAP

/**
 * List of all squares.
 */
export const SQUARES = Object.keys(SQUARES_MAP) as Square[]

/**
 * Type guard to check that a string corresponds to a fixed chess square.
 *
 * @param square A string that might be a square
 * @returns a type predicate confirming that the string is of type Square.
 */
export function isSquare(square: string): square is Square {
  return Object.keys(SQUARES_MAP).includes(square)
}

/**
 * 0x88Diff offsets that knight can move to.
 */
const KNIGHT_OFFSETS = [-31, -14, 18, 33, 31, 14, -18, -33]

/**
 * Pre-computed array 238-length array of 0x88Diff offsets that would be
 * attacked by the queen.
 *
 * See https://www.chessprogramming.org/0x88#Square_Relations for more details
 * about 0x88Diff.
 *
 * QUEEN_OFFSETS = [-17, -16, -15, 1, 17, 16, 15, -1]
 *
 * This table can be generated by using QUEEN_OFFSETS above to compute points
 * in the range [-119, 119] (since 119 is the maximum value of 0x88Diff,
 * corresponding to the distance between opposite corners a8 and h1.
 */
// prettier-ignore
const QUEEN_ATTACKS: (0 | 1)[] = [
  1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0,
  0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
  0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0,
  0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0,
  0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0,
  0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0,
  0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0,
  0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
  1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0,
]

/**
 * Returns potential target squares for a knight from the current square.
 *
 * Note that the Queen square is not available for the knight to move to.
 *
 * @param startingSquare square where knight starts
 * @param options additional options
 * @returns an array of potential squares the knight can move to
 */
export function getKnightDests(
  startingSquare: Square,
  options?: {
    // Square that queen is on (knight will skip this square)
    queenSquare?: Square
    // Whether to skip squares attacked by queen
    excludeAttackedSquares?: boolean
  }
): Square[] {
  const dests = KNIGHT_OFFSETS.map(
    (offset) => SQUARES_MAP[startingSquare] + offset
  )
    .map((x88Idx) => INVERSE_SQUARES_MAP[x88Idx])
    .filter((s: Square | undefined): s is Square => !!s)
    .filter(
      (v) =>
        v !== options?.queenSquare &&
        (!options?.excludeAttackedSquares ||
          !options?.queenSquare ||
          !attackedByQueen(v, options?.queenSquare))
    )
  return dests
}

/**
 * Get FEN for knight + queen tour puzzle.
 *
 * @param knightSquare square knight is currently on
 * @param queenSquare square that queen is currently on
 * @returns FEN representation of board, or null if position is invalid
 */
export function getPuzzleFen(
  knightSquare: Square,
  queenSquare?: Square
): string | undefined {
  // Knight and queen can't be on same square
  if (knightSquare === queenSquare) {
    return undefined
  }

  const lookup: { [idx: number]: "N" | "q" } = {}
  lookup[SQUARES_MAP[knightSquare]] = "N" // White knight
  if (queenSquare) {
    lookup[SQUARES_MAP[queenSquare]] = "q" // Black queen
  }

  let empty = 0
  let piecesRep = ""
  for (let i = SQUARES_MAP.a8; i <= SQUARES_MAP.h1; i++) {
    if (!(i in lookup)) {
      empty++
    } else {
      let piece = lookup[i]
      if (empty) {
        piecesRep += empty
        empty = 0
      }
      piecesRep += piece
    }

    if ((i + 1) & 0x88) {
      if (empty > 0) {
        piecesRep += empty
      }
      if (i !== SQUARES_MAP.h1) {
        piecesRep += "/"
      }
      empty = 0
      i += 8
    }
  }

  return `${piecesRep} w - - 0 1`
}

/**
 * Returns true if square is attacked by queen.
 *
 * @param square Square that piece is on
 * @param queenSquare Square that queen is on
 * @returns true if queen attacks knight
 */
export function attackedByQueen(square: Square, queenSquare: Square): boolean {
  const x88DiffNormalized =
    SQUARES_MAP[square] - SQUARES_MAP[queenSquare] + 0x77
  return QUEEN_ATTACKS[x88DiffNormalized] === 1
}

/**
 * Generate a sequence of moves that completes a *unique* Knights' tour of
 * the board by visiting each square exactly once.
 *
 * @param square Starting square
 * @returns an Array of moves that correspond to a unique Knights' tour.
 */
export function generateKnightsTour(square: Square) {
  function generateKnightsTourHelper(
    square: Square,
    moves: Array<Square>,
    numSquaresVisited: number
  ): boolean {
    if (numSquaresVisited === 64) {
      return true
    }

    // Sort next candidates by Warnsdorff’s heuristic
    const nextSquares = getKnightDests(square).sort(
      (a, b) => getKnightDests(a).length - getKnightDests(b).length
    )

    for (const next of nextSquares) {
      if (!moves.includes(next)) {
        moves.push(next)
        const finished = generateKnightsTourHelper(
          next,
          moves,
          numSquaresVisited + 1
        )
        if (finished) {
          return true
        }
        moves.pop()
      }
    }

    return false
  }

  // Modify 'moves' in place
  const moves = [square]
  const finished = generateKnightsTourHelper(square, moves, 1)

  return finished ? moves : undefined
}

/**
 * Get square to left or right of current square. If at the left edge of the
 * rank, get last square from previous rank (or if at right edge, get first
 * square from next rank). Cycles back after getting to bottom left or top
 * right of square.
 * @param square Current square.
 * @param direction previous (decreasing rank/file) or next (increasing)
 * @returns Square to left.
 */
export function getSquareIncrement(
  square: Square,
  direction: "previous" | "next"
): Square {
  const x88Idx = SQUARES_MAP[square]
  const increment = direction === "previous" ? -1 : 1
  let nextX88Idx = x88Idx + increment
  if (nextX88Idx & 0x88) {
    // End of previous rank
    nextX88Idx = nextX88Idx + (direction === "previous" ? 1 : -1) * 24
    if (nextX88Idx & 0x88) {
      return direction === "previous" ? "h8" : "a1"
    }
  }
  return INVERSE_SQUARES_MAP[nextX88Idx]
}

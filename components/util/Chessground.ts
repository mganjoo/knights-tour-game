import { Chessground } from "chessground"
import { Api as ChessgroundApi } from "chessground/api"
import { Config } from "chessground/config"
import { DrawShape } from "chessground/draw"
import { RefObject, useCallback, useEffect, useRef, useState } from "react"

interface ChessgroundFunctions {
  el: RefObject<HTMLDivElement>
  set: (config: Config, shapes?: DrawShape[]) => void
}

/**
 * Hook that returns wrapper functions around the Chessground library.
 */
export default function useChessground(
  initialConfig: () => Config
): ChessgroundFunctions {
  const el = useRef<HTMLDivElement>(null)
  const [ground, setGround] = useState<ChessgroundApi>()
  const set = useCallback(
    (config: Config, shapes?: DrawShape[]) => {
      if (ground) {
        if (shapes) {
          ground.setAutoShapes(shapes)
        }
        ground.set(config)
      }
    },
    [ground]
  )

  useEffect(() => {
    if (el.current && !ground) {
      setGround(Chessground(el.current, initialConfig()))
    }
    return () => {
      if (ground) {
        ground.destroy()
      }
    }
  }, [ground, initialConfig])

  return {
    el,
    set,
  }
}

import { RefObject, useCallback, useEffect, useRef, useState } from "react"
import { Chessground } from "chessground"
import "./Board.css"
import { Api as ChessgroundApi } from "chessground/api"
import { Config } from "chessground/config"

interface ChessgroundFunctions {
  el: RefObject<HTMLDivElement>
  set: (config: Config) => void
}

export function useChessground(initialConfig: Config): ChessgroundFunctions {
  const el = useRef<HTMLDivElement>(null)
  const [ground, setGround] = useState<ChessgroundApi>()
  const set = useCallback(
    (config: Config) => {
      if (ground) {
        ground.set(config)
      }
    },
    [ground]
  )

  useEffect(() => {
    if (el.current && !ground) {
      setGround(Chessground(el.current, initialConfig))
    }
    return () => {
      if (ground) {
        ground.destroy()
      }
    }
  }, [ground, initialConfig])

  return {
    el: el,
    set: set,
  }
}

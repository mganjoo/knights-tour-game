import { RefObject, useEffect, useRef, useState } from "react"
import { Chessground } from "chessground"
import "./Board.css"
import { Api as ChessgroundApi } from "chessground/api"
import { Config } from "chessground/config"

interface ChessgroundFunctions {
  el: RefObject<HTMLDivElement>
  set: (config: Config) => void
  forceUpdate: () => void
}

export function useChessground(initialConfig: Config): ChessgroundFunctions {
  const el = useRef<HTMLDivElement>(null)
  const [ground, setGround] = useState<ChessgroundApi>()
  const [updateConfig, setUpdateConfig] = useState<Config>()
  const [forceBoardUpdate, setForceBoardUpdate] = useState(false)

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

  useEffect(() => {
    if (ground && updateConfig) {
      ground.set(updateConfig)
      if (forceBoardUpdate) {
        setForceBoardUpdate(false)
      }
    }
  }, [ground, updateConfig, forceBoardUpdate])

  return {
    el: el,
    set: setUpdateConfig,
    forceUpdate: () => {
      setForceBoardUpdate(true)
    },
  }
}

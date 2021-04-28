import React, { useEffect, useMemo, useRef, useState } from "react"
import { Chessground } from "chessground"
import "./Board.css"
import { Api as ChessgroundApi } from "chessground/api"
import * as cg from "chessground/types"
import { Config } from "chessground/config"

type BoardProps = {
  fen?: cg.FEN
  validDests?: Map<cg.Key, cg.Key[]>
  handleMove: (orig: cg.Key, dest: cg.Key) => void
}

const Board: React.FC<BoardProps> = ({
  fen,
  validDests,
  handleMove,
  children,
}) => {
  const el = useRef<HTMLDivElement>(null)
  const [ground, setGround] = useState<ChessgroundApi>()
  const config: Config = useMemo(
    () => ({
      fen: fen,
      orientation: "white",
      turnColor: "white",
      highlight: {
        lastMove: false,
      },
      animation: {
        enabled: false,
      },
      movable: {
        free: false,
        color: "white",
        dests: validDests,
        events: { after: handleMove },
      },
      premovable: {
        enabled: false,
      },
      predroppable: {
        enabled: false,
      },
      drawable: {
        enabled: false,
      },
    }),
    [fen, validDests, handleMove]
  )

  useEffect(() => {
    if (el.current && !ground) {
      setGround(Chessground(el.current, {}))
    }
    return () => {
      if (ground) {
        ground.destroy()
      }
    }
  }, [ground])

  useEffect(() => {
    if (ground) {
      ground.set(config)
    }
  }, [ground, config])

  return <div ref={el}>{children}</div>
}

export default Board

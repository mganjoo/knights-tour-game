import { provideReactWrapper } from "@microsoft/fast-react-wrapper"
import { GChessBoardElement } from "gchessboard"
import * as React from "react"

const { wrap } = provideReactWrapper(React)

export const GChessBoard = wrap(GChessBoardElement, {
  name: "g-chess-board",
  properties: ["position", "arrows"],
  events: {
    onMoveStart: "movestart",
    onMoveEnd: "moveend",
    onMoveCancel: "movecancel",
    onMoveFinished: "movefinished",
  },
})

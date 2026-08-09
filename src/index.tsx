import { inspect } from "@xstate/inspect"
import React from "react"
import ReactDOM from "react-dom"
import "./styles/globals.css"
import "./styles/Board.css"
import App from "./App"
import "focus-visible"

if (
  import.meta.env.VITE_INSPECT_XSTATE === "1" &&
  typeof window !== "undefined"
) {
  inspect({
    iframe: false,
  })
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
)

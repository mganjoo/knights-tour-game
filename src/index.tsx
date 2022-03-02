import { inspect } from "@xstate/inspect"
import React from "react"
import ReactDOM from "react-dom"
import "./styles/globals.css"
import "./styles/Board.css"
import App from "./App"
import reportWebVitals from "./reportWebVitals"
import "focus-visible"

if (
  process.env.REACT_APP_INSPECT_XSTATE === "1" &&
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()

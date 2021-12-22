import "../styles/globals.css"
import "../styles/Board.css"
import { inspect } from "@xstate/inspect"
import type { AppProps } from "next/app"

if (
  process.env.NEXT_PUBLIC_INSPECT_XSTATE === "1" &&
  typeof window !== "undefined"
) {
  inspect({
    iframe: false,
  })
}

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp

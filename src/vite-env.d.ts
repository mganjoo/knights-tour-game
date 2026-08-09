/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INSPECT_XSTATE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

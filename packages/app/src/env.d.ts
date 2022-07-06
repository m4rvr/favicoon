/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

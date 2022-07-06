declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly APP_BASE_URL: string
      readonly PORT: number
    }
  }
}

export {}

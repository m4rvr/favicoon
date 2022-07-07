import * as trpc from '@trpc/server'

export const appRouter = trpc.router().query('foo', {
  async resolve() {
    return 'It works'
  }
})

export type AppRouter = typeof appRouter

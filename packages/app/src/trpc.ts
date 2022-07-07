import { createTRPCClient } from '@trpc/client'
import type { AppRouter } from '../../api/src/router'

export const client = createTRPCClient<AppRouter>({
  url: `${import.meta.env.VITE_API_BASE_URL}/trpc`
})

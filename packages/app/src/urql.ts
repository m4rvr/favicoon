import {
  type Exchange,
  cacheExchange,
  createClient,
  dedupExchange
} from '@urql/core'
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch'

const exchanges: Exchange[] = [
  dedupExchange,
  cacheExchange,
  multipartFetchExchange
]

export const client = createClient({
  url: `${import.meta.env.PUBLIC_API_BASE_URL}/graphql`,
  exchanges
})

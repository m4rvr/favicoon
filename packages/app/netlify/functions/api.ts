import type { Handler } from '@netlify/functions'

export const handler: Handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello World' })
  }
}

/* import fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'

const app = fastify({
  logger: true
})

app.register(fastifyCors, {
  origin: 'http://localhost:3000',
  credentials: true
})

app.register(fastifyHelmet, {
  contentSecurityPolicy: false
})

export default async (request: any, reply: any) => {
  await app.ready()
  app.server.emit('request', request, reply)
} */

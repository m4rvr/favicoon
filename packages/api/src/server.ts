import fastify from 'fastify'
import type { FastifyReply, FastifyRequest } from 'fastify'
import mercurius from 'mercurius'
import fastifyHelmet from '@fastify/helmet'
import fastifyCors from '@fastify/cors'
import altairFastify from 'altair-fastify-plugin'
import fastifyMultipart from '@fastify/multipart'
import sharp from 'sharp'
import type { Context } from './context.js'
import { schema } from './schema/index.js'

const isDevelopment = process.env.NODE_ENV !== 'production'

function createServer() {
  const server = fastify({
    logger: isDevelopment
  })

  server.register(fastifyCors, {
    origin: process.env.APP_BASE_URL,
    credentials: true
  })

  server.register(fastifyHelmet, {
    contentSecurityPolicy: false
  })

  server.register(fastifyMultipart)

  server.register(mercurius, {
    schema,
    path: '/graphql',
    graphiql: false,
    ide: false,
    context: (request: FastifyRequest, reply: FastifyReply): Context => ({
      request,
      reply
    })
  })

  if (isDevelopment) {
    server.register(altairFastify, {
      path: '/altair',
      baseURL: '/altair/',
      endpointURL: '/graphql'
    })
  }

  server.get('/health', async (_request, reply) => {
    reply.send('ok')
  })

  server.post('/foo', async (request, reply) => {
    const data = await request.file()
    const buffer = await data.toBuffer()

    const newFile = await sharp(buffer)
      .resize({
        width: 20
      })
      .toFormat('jpg')
      .toBuffer()

    const base64 = newFile.toString('base64')

    const blobData = `data:image/jpeg;base64,${base64}`

    console.log(blobData)

    reply.type('application/json').send({ foo: 'bar' })
  })

  return server
}

export async function startServer() {
  const server = createServer()
  const port = process.env.PORT ?? 8080
  server.listen(
    {
      port
    },
    (error) => {
      if (error) throw error
      console.log(`🚀 App server running on port ${port}.`)
    }
  )
}

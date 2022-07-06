import fastify from 'fastify'
import fastifyHelmet from '@fastify/helmet'
import fastifyCors from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import sharp from 'sharp'

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

import fastify from 'fastify'
import fastifyHelmet from '@fastify/helmet'
import fastifyCors from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import sharp from 'sharp'
import AdmZip from 'adm-zip'
import pngToIco from 'png-to-ico'
// import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
// import { createContext } from './context'
// import { appRouter } from './router'

const manifestCode = `{
  "icons": [
    { "src": "/favicon-192x192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "/favicon-512x512.png", "type": "image/png", "sizes": "512x512" }
  ]
}`

const readmeContent = (isSvg: boolean) => {
  return `Paste into <head>:
  
<link rel="icon" href="/favicon.ico" sizes="any">${
    isSvg ? '\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">' : ''
  }
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
  `
}

const isDevelopment = process.env.NODE_ENV !== 'production'

function createServer() {
  const server = fastify({
    logger: isDevelopment,
    maxParamLength: 5000
  })

  server.register(fastifyCors, {
    origin: process.env.APP_BASE_URL,
    credentials: true
  })

  server.register(fastifyHelmet, {
    contentSecurityPolicy: false
  })

  server.register(fastifyMultipart)

  /* server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: { router: appRouter, createContext }
  }) */

  server.get('/health', async (_request, reply) => {
    reply.send('ok')
  })

  server.post('/generate-icons', async (request, reply) => {
    const data = await request.file()
    const fileBuffer = await data.toBuffer()
    const iconsMap: {
      name: string
      format: 'png' | 'ico' | 'svg'
      size: number
    }[] = [
      {
        name: 'favicon',
        format: 'ico',
        size: 32
      },
      {
        name: 'apple-touch-icon',
        format: 'png',
        size: 180
      },
      {
        name: 'favicon-192x192',
        format: 'png',
        size: 192
      },
      {
        name: 'favicon-512x512',
        format: 'png',
        size: 512
      }
    ]

    // const { format, width, height } = await sharp(fileBuffer).metadata()
    // const isSvg = format === 'svg'

    const zip = new AdmZip()
    // add icons folder
    // zip.addFile('icons/', Buffer.alloc(0))

    const filePromises = iconsMap.map(({ name, format, size }) => {
      return new Promise((resolve) => {
        sharp(fileBuffer, { density: 72 })
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toFormat(format === 'ico' ? 'png' : format)
          .toBuffer()
          .then(async (scaledPng) => {
            let file = scaledPng

            if (format === 'ico') {
              file = await pngToIco(scaledPng)
            }

            zip.addFile(`/${name}.${format}`, file)
            resolve(true)
          })
      })
    })

    await Promise.all(filePromises)

    zip.addFile(
      '/manifest.webmanifest',
      Buffer.alloc(manifestCode.length, manifestCode)
    )

    const readme = readmeContent(false)

    zip.addFile('/README.txt', Buffer.alloc(readme.length, readme))

    reply.type('application/zip').send(zip.toBuffer())
  })

  return server
}

export async function startServer() {
  const server = createServer()
  const port = process.env.PORT ?? 8080
  server.listen(
    {
      port,
      host: '0.0.0.0'
    },
    (error) => {
      if (error) throw error
      console.log(`🚀 App server running on port ${port}.`)
    }
  )
}

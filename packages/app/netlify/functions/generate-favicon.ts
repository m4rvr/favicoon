import type { Handler } from '@netlify/functions'
import multipartParser from 'lambda-multipart-parser'
import sharp from 'sharp'
import AdmZip from 'adm-zip'
import pngToIco from 'png-to-ico'

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

const manifestCode = `{
  "icons": [
    { "src": "/favicon-192x192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "/favicon-512x512.png", "type": "image/png", "sizes": "512x512" }
  ]
}`

const readmeContent = (isSvg: boolean) => {
  return `Paste into <head>:
  
<link rel="icon" href="/favicon.ico" sizes="any" />${
    isSvg
      ? '\n<link rel="icon" href="/favicon.svg" type="image/svg+xml" />'
      : ''
  }
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
  `
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 500,
      body: 'Not available.'
    }
  }

  console.time('parse-files')
  const fields = await multipartParser.parse(event)

  // Missing image
  if (!fields.files.length) {
    return {
      statusCode: 422,
      body: 'Missing image.'
    }
  }

  console.timeEnd('parse-files')

  const image = fields.files[0]

  if (!ALLOWED_MIME_TYPES.includes(image.contentType)) {
    return {
      statusCode: 422,
      body: 'Invalid image type.'
    }
  }

  console.time('create-zip')
  const zip = new AdmZip()

  const { format, width } = await sharp(image.content).metadata()
  const isSvg = format === 'svg'

  const filePromises = iconsMap.map(({ name, format, size }) => {
    return new Promise((resolve) => {
      sharp(image.content, {
        density: isSvg && width ? (72 * size) / width : 72
      })
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFormat(format === 'ico' ? 'png' : format, {
          adaptiveFiltering: true,
          quality: 60,
          palette: true,
          compressionLevel: 9,
          progressive: true
        })
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

  if (isSvg) {
    zip.addFile('/favicon.svg', image.content)
  }

  zip.addFile(
    '/manifest.webmanifest',
    Buffer.alloc(manifestCode.length, manifestCode)
  )

  const readme = readmeContent(false)
  zip.addFile('/README.txt', Buffer.alloc(readme.length, readme))

  console.timeEnd('create-zip')

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/zip'
    },
    body: zip.toBuffer().toString('base64'),
    isBase64Encoded: true
  }
}

export { handler }

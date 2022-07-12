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

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 500,
      body: 'Not available.'
    }
  }

  console.time('parse-files')
  const fields = await multipartParser.parse(event)

  if (!fields.files.length) {
    return {
      statusCode: 422,
      body: 'Missing image.'
    }
  }

  console.timeEnd('parse-files')

  const image = fields.files[0]

  console.time('create-zip')
  const zip = new AdmZip()

  const filePromises = iconsMap.map(({ name, format, size }) => {
    return new Promise((resolve) => {
      sharp(image.content, { density: 72 })
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

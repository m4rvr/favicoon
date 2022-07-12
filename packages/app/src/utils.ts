import JSZip from 'jszip'
import { filetypemime } from 'magic-bytes.js'

async function getMimeTypes(blob: Blob): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()

    fileReader.onload = () => {
      const bytes = new Uint8Array(fileReader.result as ArrayBuffer)
      resolve(filetypemime(bytes as unknown as any[]))
    }

    fileReader.onerror = reject
    fileReader.readAsArrayBuffer(blob)
  })
}

async function getImageBase64(base64: string, mimeType: string) {
  return `data:${mimeType};base64,${base64}`
}

export async function getFilesFromZip(zipBlob: Blob) {
  const jszip = new JSZip()
  const zip = await jszip.loadAsync(zipBlob)
  const files = await Promise.all(
    Object.keys(zip.files).map(async (filePath) => {
      const file = zip.files[filePath]
      if (file.dir) return

      const blob = await zip.file(file.name)?.async('blob')
      if (!blob) return

      const mimeTypes = await getMimeTypes(blob)
      const rawBase64 = await zip.file(file.name)?.async('base64')
      if (!rawBase64) return
      const base64 = await getImageBase64(rawBase64, mimeTypes[0])

      return {
        name: file.name,
        base64
      }
    })
  )

  return files.filter(Boolean)
}

export async function getGeneratedFiles(zipBlob: Blob) {
  const jszip = new JSZip()
  const zip = await jszip.loadAsync(zipBlob)
  const hasSvg = !!zip.file('/favicon.svg')
  const appleTouchIcon = zip.file('/apple-touch-icon.png')
  const iconBlob = await appleTouchIcon?.async('blob')
  if (!iconBlob) return null

  const mimeTypes = await getMimeTypes(iconBlob)
  const rawBase64 = await appleTouchIcon?.async('base64')
  if (!rawBase64) return null

  const base64 = await getImageBase64(rawBase64, mimeTypes[0])

  return {
    hasSvg,
    appleTouchIcon: base64
  }
}

export const readFile = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

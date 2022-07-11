import { type JSX, createSignal } from 'solid-js'
import { toast } from 'solid-toast'
import { View, useImageFavicon } from '../../../context/ImageFaviconContext.jsx'
import { readFile } from '../../../utils.js'

const bytesToMegaBytes = (bytes: number) => bytes / 1024 ** 2
const allowedFileTypes = ['image/png', 'image/jpeg', 'image/svg+xml']
const maxMb = 1

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve(image)
    }
    image.onerror = reject
    image.src = src
  })
}

export default function (): JSX.Element {
  const [, { setState }] = useImageFavicon()
  const [isOverDropzone, setIsOverDropzone] = createSignal(false)

  const processFile = async (file: File) => {
    if (!allowedFileTypes.includes(file.type)) {
      toast.error('Only PNG or SVG files are allowed.')
      return
    }

    if (bytesToMegaBytes(file.size) > 2) {
      toast.error('The uploaded file is too large.')
      return
    }

    const dataUrl = await readFile(file)
    const image = await loadImage(dataUrl)
    setState('uploadedImage', {
      name: file.name,
      type: file.type,
      size: file.size,
      width: image.width,
      height: image.height,
      base64: dataUrl,
      file
    })

    setState('view', View.ImageInfo)
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()

    const files = event.dataTransfer?.files
    if (!files) return

    const file = files[0]
    processFile(file)
  }

  const onDragOver = (event: DragEvent) => {
    event.preventDefault()
  }

  const onDragEnter = () => {
    setIsOverDropzone(true)
  }

  const onDragLeave = () => {
    setIsOverDropzone(false)
  }

  const onChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) {
      throw new Error('No file selected.')
    }

    processFile(file)
  }

  return (
    <div class="w-full max-w-md mx-auto">
      <label
        for="file-upload"
        class="transition-all group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 bg-white shadow-lg shadow-neutral-200 hover:border-neutral-900 hover:text-neutral-900 hover:scale-103"
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        classList={{
          'border-neutral-900 text-neutral-900 scale-103': isOverDropzone(),
          'border-neutral-400 text-neutral-400': !isOverDropzone()
        }}
      >
        <div class="pointer-events-none flex flex-col items-center justify-center">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 transition-transform"
            classList={{
              '-translate-y-1': isOverDropzone()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p class="mt-2 font-medium">Drag and drop file or browse</p>
          <p class="text-sm">
            Allowed are PNG, JPG and SVG with max. {maxMb} MB
          </p>
        </div>
      </label>
      <input
        id="file-upload"
        name="file"
        type="file"
        class="hidden"
        accept={allowedFileTypes.join(',')}
        onChange={onChange}
      />
    </div>
  )
}

import { type JSX, Show, createSignal } from 'solid-js'
import type { UploadedImage } from '../types'

const bytesToMegaBytes = (bytes: number) => bytes / 1024 ** 2
const allowedFileTypes = ['image/png', 'image/jpeg', 'image/svg+xml']
const maxMb = 2
const units = ['bytes', 'KB', 'MB']

function niceBytes(x: number) {
  let l = 0
  let n = x || 0

  while (n >= 1024 && ++l) {
    n = n / 1024
  }

  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`
}

const formatName = (name: string) => {
  const parts = name.split('.')
  const extension = parts.pop() || ''
  const fileName = parts.join('.')
  const formattedName =
    fileName.length > 20 ? `${fileName.slice(0, 24)}...` : fileName
  return `${formattedName}.${extension.toLowerCase()}`
}

const XIcon = () => (
  <div class="text-red-500">
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
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  </div>
)

const CheckIcon = () => (
  <div class="text-green-500">
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
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  </div>
)

export default function (): JSX.Element {
  const [image, setImage] = createSignal<UploadedImage | null>(null)
  const [isOverDropzone, setIsOverDropzone] = createSignal(false)
  const isSquare = () => image()?.width === image()?.height
  const isPngOrSvg = () =>
    !!(image()?.type && ['image/png', 'image/svg+xml'].includes(image()!.type))
  const is512pxOrHigher = () => !!(image()?.width && image()!.width >= 512)

  const processFile = (file: File) => {
    if (!allowedFileTypes.includes(file.type)) {
      // toast('File type not allowed.')
      throw new Error('File type not allowed.')
    }

    if (bytesToMegaBytes(file.size) > 2) {
      // toast('File is too large.')
      throw new Error('File is too large.')
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      const image = new Image()
      image.addEventListener('load', () => {
        setImage({
          name: file.name,
          type: file.type,
          size: file.size,
          width: image.width,
          height: image.height,
          base64: reader.result as string
        })
      })

      image.src = reader.result as string
    })

    reader.readAsDataURL(file)
  }

  const onChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) {
      throw new Error('No file selected.')
    }

    processFile(file)
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

  return (
    <Show
      when={image()}
      fallback={
        <>
          <div class="mx-auto max-w-lg">
            <label
              for="file-upload"
              class="dropzone group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-400 bg-slate-50 px-6 py-10 text-slate-400 transition-[border-color,background-color] hover:border-blue-500 hover:bg-blue-50 hover:text-blue-500"
              onDrop={onDrop}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              classList={{
                'border-blue-500 bg-blue-50 text-blue-500': isOverDropzone()
              }}
            >
              <div class="pointer-events-none flex flex-col items-center justify-center">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-full bg-black/5 transition-[background-color,transform] group-hover:bg-blue-100"
                  classList={{
                    'bg-blue-100 -translate-y-1': isOverDropzone()
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
                <p class="mt-2 font-medium">Drag and drop files or browse</p>
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
          <div class="mx-auto mt-4 flex max-w-lg flex-col items-center justify-center text-sm  font-medium text-slate-500">
            <p class="flex justify-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              For the best result use a square SVG or PNG image with at least
              512px
            </p>
          </div>
        </>
      }
    >
      <div class="mx-auto max-w-md">
        <h3 class="mb-5 text-center font-semibold">Your uploaded image</h3>
        <div class="flex items-center gap-2 rounded-xl border border-slate-200 p-3 shadow-lg shadow-slate-200">
          <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-slate-200">
            <img
              src={image()!.base64}
              alt={image()!.name}
              class="aspect-square h-full w-full object-contain"
            />
          </div>
          <div class="w-full">
            <p class="font-medium">You're good to go!</p>
            <p class="flex gap-1 text-sm text-slate-400">
              <span>{formatName(image()!.name)}</span>
              <span class="flex-shrink-0">
                ({image()!.width}x{image()!.height}px,{' '}
                {niceBytes(image()!.size)})
              </span>
            </p>
          </div>
        </div>
        <div class="my-5 flex items-center justify-center gap-5 text-sm font-medium text-slate-500">
          <div class="flex items-center gap-1">
            <Show when={isSquare()} fallback={<XIcon />}>
              <CheckIcon />
            </Show>
            Square
          </div>
          <div class="flex items-center gap-1">
            <Show when={isPngOrSvg()} fallback={<XIcon />}>
              <CheckIcon />
            </Show>
            PNG or SVG
          </div>
          <div class="flex items-center gap-1">
            <Show when={is512pxOrHigher()} fallback={<XIcon />}>
              <CheckIcon />
            </Show>
            512px or higher
          </div>
        </div>
      </div>
    </Show>
  )
}

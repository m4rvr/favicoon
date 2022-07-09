import { type JSX, Show } from 'solid-js'
import { View, useImageFavicon } from '../../../context/ImageFaviconContext.js'
import { getPreviewIconUrl } from '../../../utils.js'

const units = ['bytes', 'KB', 'MB']
const niceBytes = (x: number) => {
  let l = 0
  let n = x || 0

  while (n >= 1024 && ++l) {
    n = n / 1024
  }

  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`
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
  const [state, { setState }] = useImageFavicon()
  const isSquare = () =>
    state.uploadedImage?.width === state.uploadedImage?.height
  const isPngOrSvg = () =>
    !!(
      state.uploadedImage?.type &&
      ['image/png', 'image/svg+xml'].includes(state.uploadedImage!.type)
    )
  const is512pxOrHigher = () =>
    !!(state.uploadedImage?.width && state.uploadedImage?.width >= 512)

  const infoMessage = () => {
    if (!isSquare()) {
      return 'Your image should be square.'
    }

    if (!isPngOrSvg()) {
      return 'Your image should be a PNG or SVG.'
    }

    if (!is512pxOrHigher()) {
      return 'Your image should be 512px or higher.'
    }

    return "You're good to go!"
  }

  const reuploadImage = () => {
    setState('uploadedImage', null)
    setState('view', View.Upload)
  }

  const formattedName = () => {
    if (!state.uploadedImage) return
    const parts = state.uploadedImage.name.split('.')
    const extension = parts.pop() || ''
    const fileName = parts.join('.')
    const name = fileName.length > 20 ? `${fileName.slice(0, 24)}...` : fileName
    return `${name}.${extension.toLowerCase()}`
  }

  const formattedBytes = () => niceBytes(state.uploadedImage?.size || 0)

  const generateFavicon = async () => {
    if (!state.uploadedImage) return
    const formData = new FormData()
    formData.append('file', state.uploadedImage.file)

    try {
      const data = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/generate-icons`,
        {
          method: 'POST',
          body: formData
        }
      )

      const zipBlob = await data.blob()
      const previewIconUrl = await getPreviewIconUrl(zipBlob)

      setState('zipBlob', zipBlob)
      setState('previewIconUrl', previewIconUrl)
      setState('view', View.Generated)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div class="mx-auto max-w-md">
      <h3 class="mb-8 text-center font-semibold text-lg">
        Your uploaded image
      </h3>
      <div class="flex items-center gap-2 rounded-xl border border-slate-200 p-3 shadow-lg shadow-slate-200">
        <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-slate-200">
          <img
            src={state.uploadedImage?.base64}
            alt={state.uploadedImage?.name}
            class="aspect-square h-full w-full object-contain"
          />
        </div>
        <div class="w-full">
          <p class="font-medium">{infoMessage()}</p>
          <p class="flex gap-2 text-sm text-slate-400">
            <span>{formattedName()}</span>
            <span class="flex-shrink-0">
              ({state.uploadedImage?.width}x{state.uploadedImage?.height}px,{' '}
              {formattedBytes()})
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
      <div class="flex items-center justify-center mt-14">
        <button
          class="px-6 py-3 transition-colors hover:text-blue-500"
          onClick={reuploadImage}
        >
          Re-upload Image
        </button>
        <button
          class="rounded-xl bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
          onClick={generateFavicon}
        >
          Generate Favicon
        </button>
      </div>
    </div>
  )
}

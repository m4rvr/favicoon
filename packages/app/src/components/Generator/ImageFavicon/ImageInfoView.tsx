import { type JSX, Show, createSignal } from 'solid-js'
import toast from 'solid-toast'
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
  const [isGenerating, setIsGenerating] = createSignal(false)
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
    setIsGenerating(true)
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
      toast.error('Error while generating favicon')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div class="mx-auto w-full max-w-md flex flex-col justify-center items-center gap-4">
      <Show
        when={!isGenerating()}
        fallback={
          <p class="text-xl font-medium">Generating your favicon 🤖...</p>
        }
      >
        <p class="font-medium text-lg mt-10 mb-4">{infoMessage()}</p>
        <div class="w-full max-w-90 flex gap-4 items-center p-4 rounded-xl bg-white shadow-lg shadow-neutral-200">
          <div class="rounded-xl w-16 aspect-square bg-white border border-neutral-200 overflow-hidden">
            <img
              src={state.uploadedImage?.base64}
              class="w-full h-full object-contain"
            />
          </div>
          <p class="flex flex-col">
            <span class="block font-medium">{formattedName()}</span>
            <span class="block text-neutral-400">
              {state.uploadedImage?.width}x{state.uploadedImage?.height}px |{' '}
              {formattedBytes()}
            </span>
          </p>
        </div>
        <div class="grid grid-cols-3 gap-10 mt-5">
          <div class="flex flex-col items-center">
            <Show when={isSquare()} fallback={<XIcon />}>
              <CheckIcon />
            </Show>
            <span class="block font-medium mt-1">Square image</span>
          </div>
          <div class="flex flex-col items-center">
            <Show when={isPngOrSvg()} fallback={<XIcon />}>
              <CheckIcon />
            </Show>
            <span class="block font-medium mt-1">PNG or SVG</span>
          </div>
          <div class="flex flex-col items-center">
            <Show when={is512pxOrHigher()} fallback={<XIcon />}>
              <CheckIcon />
            </Show>
            <span class="block font-medium mt-1">512px or higher</span>
          </div>
        </div>
        <div class="flex items-center mt-10">
          <button
            class="rounded-lg px-4 py-2 transition-transform hover:scale-103"
            onClick={reuploadImage}
          >
            Re-upload image
          </button>
          <button
            class="rounded-lg bg-neutral-900 text-white px-4 py-2 transition-[background-color,box-shadow,transform] transition-200 ease-in-out hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-200 hover:scale-103"
            onClick={generateFavicon}
          >
            Generate Favicon
          </button>
        </div>
      </Show>
    </div>
  )
}

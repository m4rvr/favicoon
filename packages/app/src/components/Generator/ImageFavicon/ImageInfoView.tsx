import { type JSX, Show, createSignal } from 'solid-js'
import toast from 'solid-toast'
import { View, useImageFavicon } from '../../../context/ImageFaviconContext.js'
import { getGeneratedFiles } from '../../../utils.js'
import chromeDark from '../../../assets/previews/chrome-dark.png'
import chromeLight from '../../../assets/previews/chrome-light.png'

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
        d="M6 18L18 6M6 6l12 12"
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
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
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
    if (isGenerating()) return
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
    if (isGenerating()) return
    setIsGenerating(true)
    const formData = new FormData()
    formData.append('file', state.uploadedImage.file)

    try {
      const data = await fetch('/api/generate-favicon', {
        method: 'POST',
        body: formData
      })

      const zipBlob = await data.blob()
      const generatedFiles = await getGeneratedFiles(zipBlob)

      setState('zipBlob', zipBlob)
      setState('generatedFiles', generatedFiles)
      setState('view', View.Generated)
    } catch (error) {
      console.error(error)
      toast.error('Error while generating favicon')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div class="relative w-full max-w-4xl">
      <div
        class="flex flex-col items-center gap-4 w-full"
        classList={{
          'opacity-50': isGenerating()
        }}
      >
        <div class="flex gap-14 w-full">
          <div class="flex flex-col w-1/2">
            <h2 class="font-medium text-center mb-4">Uploaded Image</h2>
            <div class="flex flex-col items-center gap-4 justify-center h-full">
              <div class="flex items-center gap-4">
                <div class="rounded-xl w-16 aspect-square border shadow-lg shadow-neutral-200 bg-white border-neutral-200 overflow-hidden">
                  <img
                    src={state.uploadedImage?.base64}
                    class="w-full h-full object-contain"
                  />
                </div>
                <p class="flex flex-col">
                  <span class="block font-medium">{formattedName()}</span>
                  <span class="block text-neutral-400">
                    {state.uploadedImage?.width}x{state.uploadedImage?.height}px
                    | {formattedBytes()}
                  </span>
                </p>
              </div>
              <div class="flex gap-4 text-sm font-medium">
                <div class="flex gap-1 items-center">
                  <Show when={isSquare()} fallback={<XIcon />}>
                    <CheckIcon />
                  </Show>
                  <span class="block">Square image</span>
                </div>
                <div class="flex gap-1 items-center">
                  <Show when={isPngOrSvg()} fallback={<XIcon />}>
                    <CheckIcon />
                  </Show>
                  <span class="block">PNG or SVG</span>
                </div>
                <div class="flex gap-1 items-center">
                  <Show when={is512pxOrHigher()} fallback={<XIcon />}>
                    <CheckIcon />
                  </Show>
                  <span class="block">512px or higher</span>
                </div>
              </div>
              <p class="font-medium flex gap-1 text-sm items-center">
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
                {infoMessage()}
              </p>
            </div>
          </div>
          <div class="w-1/2">
            <h2 class="mb-4 font-medium text-center">Preview</h2>
            <div class="flex flex-col items-center gap-4">
              <div class="w-[310px] relative flex-shrink-0">
                <img src={chromeDark} />
              </div>
              <div class="w-[310px] relative flex-shrink-0">
                <img src={chromeLight} />
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center mt-10">
          <button
            class="rounded-lg px-4 py-2 transition-transform"
            classList={{
              'hover:scale-103': !isGenerating()
            }}
            onClick={reuploadImage}
            disabled={isGenerating()}
          >
            Re-upload image
          </button>
          <button
            class="rounded-lg bg-neutral-900 text-white px-4 py-2 transition-[background-color,box-shadow,transform] transition-200 ease-in-out"
            classList={{
              'hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-200 hover:scale-103':
                !isGenerating(),
              'animate-pulse': isGenerating()
            }}
            onClick={generateFavicon}
            disabled={isGenerating()}
          >
            <Show when={isGenerating()} fallback={<>Generate Favicon</>}>
              Generating 🤖...
            </Show>
          </button>
        </div>
      </div>
    </div>
  )
}

/*
<img
              src={state.generatedFiles!.appleTouchIcon!}
              class="absolute top-[17px] left-[88px] z-5"
              width="16"
              height="16"
            />
*/

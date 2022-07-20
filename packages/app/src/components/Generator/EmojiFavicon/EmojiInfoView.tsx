import { type JSX, Show, createSignal } from 'solid-js'
import { View, useEmojiFavicon } from '../../../context/EmojiFaviconContext.js'
import chromeDark from '../../../assets/previews/chrome-dark.png'
import chromeLight from '../../../assets/previews/chrome-light.png'
import { getGeneratedFiles } from '../../../utils.js'

export default function (): JSX.Element {
  const [isGenerating, setIsGenerating] = createSignal(false)
  const [state, { setState }] = useEmojiFavicon()

  const generateFavicon = async () => {
    if (!state.emoji.blob || isGenerating()) return
    setIsGenerating(true)

    const formData = new FormData()
    formData.append('file', state.emoji.blob!)

    const data = await fetch('/api/generate-favicon', {
      method: 'POST',
      body: formData
    })

    const zipBlob = await data.blob()
    const generatedFiles = await getGeneratedFiles(zipBlob)
    setState('zipBlob', zipBlob)
    setState('view', View.Generated)
    setState('generatedFiles', generatedFiles)
  }

  const modifyEmoji = () => {
    setState('view', View.Selection)
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
          <div class="flex flex-col w-1/2 items-center">
            <h2 class="font-medium text-center mb-4">Selected Emoji</h2>
            <div class="border border-neutral-200 rounded-lg shadow-lg shadow-neutral-200 bg-white w-20 h-20 mb-4">
              <img src={state.emoji.base64!} />
            </div>
            <p class="mb-1">
              <strong>Scale:</strong> {state.emoji.scale * 100}%
            </p>
            <p>
              <strong>Rotation:</strong> {state.emoji.rotation}°
            </p>
          </div>
          <div class="flex flex-col w-1/2">
            <h2 class="font-medium text-center mb-4">Preview</h2>
            <div class="flex flex-col items-center gap-4">
              <div class="w-[310px] relative flex-shrink-0">
                <img src={chromeDark} />
                <div class="absolute w-4 h-4 top-[17px] left-[88px] z-5 overflow-hidden aspect-square">
                  <img
                    src={state.emoji.base64!}
                    class="w-full h-full object-contain block"
                  />
                </div>
              </div>
              <div class="w-[310px] relative flex-shrink-0">
                <img src={chromeLight} />
                <div class="absolute w-4 h-4 top-[17px] left-[88px] z-5 overflow-hidden aspect-square">
                  <img
                    src={state.emoji.base64!}
                    class="w-full h-full object-contain block"
                  />
                </div>
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
            onClick={modifyEmoji}
            disabled={isGenerating()}
          >
            Modify Emoji
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

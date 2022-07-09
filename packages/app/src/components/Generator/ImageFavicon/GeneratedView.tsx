import { type JSX, createResource, onMount } from 'solid-js'
import confetti from 'canvas-confetti'
import { toast } from 'solid-toast'
import { useImageFavicon } from '../../../context/ImageFaviconContext.js'
import chromeDark from '../../../assets/previews/chrome-dark.png'
import chromeLight from '../../../assets/previews/chrome-light.png'
import { readFile } from '../../../utils.js'

export default function (): JSX.Element {
  let canvasRef: HTMLCanvasElement | undefined
  const [state] = useImageFavicon()
  const [zipUrl] = createResource(async () => {
    if (!state.zipBlob) return
    const url = await readFile(state.zipBlob)
    return url
  })

  onMount(() => {
    if (canvasRef) {
      const showConfetti = confetti.create(canvasRef, {
        resize: true,
        disableForReducedMotion: true
      })

      showConfetti({
        particleCount: 200,
        spread: 180
      })
    }
  })

  const codeToCopy = `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">`

  const copyCode = async () => {
    await navigator.clipboard.writeText(codeToCopy)
    toast.success('Copied code to clipboard.')
  }

  return (
    <>
      <h3 class="mb-8 text-center font-semibold text-lg">
        Your favicon is ready!
      </h3>
      <div class="max-w-2xl mx-auto">
        <div class="flex gap-4 items-center justify-center mb-4">
          <div class="w-[310px] relative flex-shrink-0">
            <img
              src={state.previewIconUrl!}
              class="absolute top-[17px] left-[88px] z-5"
              width="16"
              height="16"
            />
            <img src={chromeDark} />
          </div>
          <div class="w-[310px] relative flex-shrink-0">
            <img
              src={state.previewIconUrl!}
              class="absolute top-[17px] left-[88px] z-5"
              width="16"
              height="16"
            />
            <img src={chromeLight} />
          </div>
        </div>
        <div
          class="max-w-xl mx-auto mb-4 bg-slate-800 text-white p-4 rounded-xl overflow-auto relative group"
          onClick={copyCode}
        >
          <pre class="text-sm font-mono">{codeToCopy}</pre>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 absolute z-5 top-0 right-0 m-2.5 opacity-0 transition-opacity group-hover:opacity-70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <a
          href={zipUrl()}
          class="rounded-xl bg-blue-500 inline-block px-6 py-3 text-white transition-colors hover:bg-blue-600"
          download={'favicon.zip'}
        >
          Download Favicon
        </a>
      </div>
      <canvas
        ref={canvasRef}
        class="pointer-events-none fixed top-0 left-0 w-full h-full z-100"
      />
    </>
  )
}

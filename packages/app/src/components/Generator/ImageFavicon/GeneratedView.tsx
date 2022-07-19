import { type JSX, Show, createResource, onMount } from 'solid-js'
import confetti from 'canvas-confetti'
import { toast } from 'solid-toast'
import hjs from 'highlight.js'
import { useImageFavicon } from '../../../context/ImageFaviconContext.js'
import { readFile } from '../../../utils.js'
import '../../../assets/code-theme.css'

export default function (): JSX.Element {
  let canvasRef: HTMLCanvasElement | undefined
  let codeRef: HTMLPreElement | undefined
  const [state] = useImageFavicon()
  const [zipUrl] = createResource(async () => {
    if (!state.zipBlob) return
    const url = await readFile(state.zipBlob)
    return url
  })

  const codeToCopy = `<link rel="icon" href="/favicon.ico" sizes="any" />${
    state.generatedFiles?.hasSvg
      ? '\n<link rel="icon" href="/favicon.svg" type="image/svg+xml" />'
      : ''
  }
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />`

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

    if (codeRef) {
      const code = hjs.highlight(codeToCopy, {
        language: 'html'
      }).value

      codeRef.innerHTML = code
    }
  })

  const copyCode = async () => {
    await navigator.clipboard.writeText(codeToCopy)
    toast.success('Copied code to clipboard.')
  }

  return (
    <Show when={zipUrl()}>
      <div>
        <h3 class="mb-8 text-center font-semibold text-lg">
          Your favicon is ready!
        </h3>
        <div class="max-w-2xl mx-auto">
          <div
            class="max-w-xl mx-auto mb-4 overflow-auto relative group text-white"
            onClick={copyCode}
          >
            <pre ref={codeRef} class="bg-[#24292F] p-4 rounded-lg text-sm" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 absolute z-5 top-0 right-0 m-2.5 opacity-0 transition-opacity group-hover:opacity-70"
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
            class="rounded-lg bg-neutral-900 inline-block px-6 py-3 text-white transition-colors hover:bg-neutral-800"
            download={'favicons.zip'}
          >
            Download Favicon
          </a>
        </div>
        <canvas
          ref={canvasRef}
          class="pointer-events-none fixed top-0 left-0 w-full h-full z-100"
        />
      </div>
    </Show>
  )
}

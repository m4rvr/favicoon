import { type JSX, Show, createResource } from 'solid-js'
import { useEmojiFavicon } from '../../../context/EmojiFaviconContext.js'
import { readFile } from '../../../utils.js'

export default function (): JSX.Element {
  const [state, { setState }] = useEmojiFavicon()

  const generateFavicon = async () => {
    const formData = new FormData()
    formData.append('file', state.emoji!)

    const data = await fetch('/api/generate-favicon', {
      method: 'POST',
      body: formData
    })

    const zipBlob = await data.blob()
    setState('zipBlob', zipBlob)
  }

  const [zipUrl] = createResource(
    () => state.zipBlob,
    async (zipBlob) => {
      if (!zipBlob) return
      const url = await readFile(zipBlob)
      return url
    }
  )

  return (
    <div class="leading-normal">
      <button
        class="bg-neutral-900 text-white rounded-lg px-4 py-2 transition-transform hover:scale-103"
        onClick={generateFavicon}
      >
        Generate Favicon
      </button>
      <Show when={zipUrl()}>
        <a
          href={zipUrl()!}
          class="mt-5 block bg-neutral-900 text-white rounded-lg px-4 py-2 transition-transform hover:scale-103"
          download={'favicons.zip'}
        >
          Download Favicon
        </a>
      </Show>
    </div>
  )
}

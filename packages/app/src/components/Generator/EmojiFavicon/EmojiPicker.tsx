import { For, type JSX, onMount } from 'solid-js'
import twemoji from 'twemoji'

const emojis = ['🌟', '🥑', '👽', '🍕', '🦊']

interface Props {
  onEmojiSelect: (img: HTMLImageElement) => void
}

export default function (props: Props): JSX.Element {
  let pickerRef: HTMLDivElement | undefined

  onMount(() => {
    if (pickerRef) {
      twemoji.parse(pickerRef, { ext: '.svg', folder: 'svg' })
    }
  })

  const selectEmoji = (event: MouseEvent) => {
    const img = (event.currentTarget as HTMLButtonElement)?.querySelector(
      'img'
    ) as HTMLImageElement
    props.onEmojiSelect(img)
  }

  return (
    <div ref={pickerRef} class="grid grid-cols-5 mx-auto gap-2">
      <For each={emojis}>
        {(emoji) => (
          <button
            class="w-8 h-8 bg-white rounded-lg border border-neutral-200 p-1 shadow-lg shadow-neutral-200 transition-transform hover:scale-105"
            onClick={selectEmoji}
          >
            {emoji}
          </button>
        )}
      </For>
    </div>
  )
}

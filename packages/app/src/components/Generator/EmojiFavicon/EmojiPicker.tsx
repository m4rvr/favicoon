import { For, type JSX, createSignal, onMount } from 'solid-js'
import twemoji from 'twemoji'
import { emojiCategories } from './emoji-data.js'

interface Props {
  onEmojiSelect: (img: HTMLImageElement) => void
}

export default function (props: Props): JSX.Element {
  let pickerRef: HTMLDivElement | undefined
  const [selectedCategory, setSelectedCategory] = createSignal(0)
  const emojis = () => emojiCategories[selectedCategory()].emojis

  const parseEmojis = () => {
    !emojiCategories[selectedCategory()].isParsed &&
      pickerRef &&
      twemoji.parse(pickerRef, { ext: '.svg', folder: 'svg' })

    pickerRef?.querySelectorAll('button').forEach((button) => {
      const img = button.querySelectorAll('img')

      if (img.length > 1) {
        img[1].remove()
      }
    })
  }

  onMount(() => {
    parseEmojis()
  })

  const selectEmoji = (event: MouseEvent) => {
    const img = (event.currentTarget as HTMLButtonElement)?.querySelector(
      'img'
    ) as HTMLImageElement
    props.onEmojiSelect(img)
  }

  const onCategoryChange = (event: Event) => {
    const index = parseInt((event.target as HTMLSelectElement).value)
    setSelectedCategory(index)
    parseEmojis()
  }

  return (
    <>
      <select class="mb-4" onChange={onCategoryChange}>
        <For each={emojiCategories}>
          {(category, i) => <option value={i()}>{category.name}</option>}
        </For>
      </select>
      <div
        ref={pickerRef}
        class="grid grid-cols-7 mx-auto gap-2 overflow-y-auto max-h-50 p-2"
      >
        <For each={emojis()}>
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
    </>
  )
}

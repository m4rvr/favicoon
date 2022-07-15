import { For, type JSX, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { Link, useMatch } from 'solid-app-router'

interface GeneratorType {
  name: string
  page: string
}

const types: GeneratorType[] = [
  { name: 'Image', page: 'image' },
  { name: 'Emoji', page: 'emoji' },
  { name: 'Text', page: 'text' }
]

export default function (): JSX.Element {
  const isActive = (type: GeneratorType) =>
    !!useMatch(() => `/favicon-generator/${type.page}`)()
  const isWIPType = (type: GeneratorType) => type.page === 'text'

  return (
    <div class="absolute z-5 top-0 left-0 right-0 flex flex-col gap-3 max-w-70 mx-auto">
      <h3 class="text-center font-medium">Choose your type</h3>
      <nav class="flex gap-1 items-center justify-center bg-white p-1.5 rounded-lg leading-tight shadow-lg shadow-neutral-200">
        <For each={types}>
          {(type) => (
            <Dynamic
              component={!isWIPType(type) ? Link : 'button'}
              href={
                (!isWIPType(type)
                  ? `/favicon-generator/${type.page}`
                  : undefined) as any
              }
              class="w-1/3 px-2 py-2 rounded-md text-center"
              classList={{
                'bg-neutral-900 text-white cursor-default': isActive(type),
                'cursor-default relative': isWIPType(type)
              }}
            >
              <span
                classList={{
                  'opacity-50': isWIPType(type)
                }}
              >
                {type.name}
              </span>
              <Show when={isWIPType(type)}>
                <span class="bg-neutral-900 text-white px-[5px] pb-[1px] rounded-md absolute top-0 right-0 text-xs -translate-y-[4px] translate-x-[14px]">
                  soon
                </span>
              </Show>
            </Dynamic>
          )}
        </For>
      </nav>
    </div>
  )
}

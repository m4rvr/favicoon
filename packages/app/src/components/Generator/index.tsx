import { For, type JSX, Show, Suspense, createSignal, lazy } from 'solid-js'
import { Dynamic } from 'solid-js/web'

enum View {
  Image,
  Emoji,
  Text
}

const [view, setView] = createSignal(View.Image)

const types = [
  { name: 'Image', view: View.Image },
  { name: 'Emoji', view: View.Emoji },
  { name: 'Text', view: View.Text }
]

const views: Record<View, any> = {
  [View.Image]: lazy(async () => {
    const Provider = (await import('../../context/ImageFaviconContext.js'))
      .default
    const ImageFavicon = (await import('./ImageFavicon/index.js')).default
    return {
      default: () => (
        <Provider>
          <ImageFavicon />
        </Provider>
      )
    }
  }),
  [View.Emoji]: lazy(() => import('./EmojiFavicon/index.js')),
  [View.Text]: lazy(() => import('./TextFavicon/index.js'))
}

export default function (): JSX.Element {
  const isWIPType = (view: View) => view !== View.Image
  // const currentType = () => types.find((type) => type.view === view())!

  return (
    <div class="relative h-full">
      <div class="absolute z-5 top-0 left-0 right-0 flex flex-col gap-3 max-w-70 mx-auto">
        <h3 class="text-center font-medium">Choose your type</h3>
        <nav class="flex gap-1 items-center justify-center bg-white p-1.5 rounded-lg leading-tight shadow-lg shadow-neutral-200">
          <For each={types}>
            {(type) => (
              <button
                class="w-1/3 px-2 py-2 rounded-md"
                classList={{
                  'bg-neutral-900 text-white cursor-default':
                    type.view === view(),
                  'cursor-default relative': isWIPType(type.view)
                }}
                onClick={() => {
                  if (isWIPType(type.view)) return
                  setView(type.view)
                }}
              >
                <span
                  classList={{
                    'opacity-50': isWIPType(type.view)
                  }}
                >
                  {type.name}
                </span>
                <Show when={isWIPType(type.view)}>
                  <span class="bg-neutral-900 text-white px-[5px] pb-[1px] rounded-md absolute top-0 right-0 text-xs -translate-y-[4px] translate-x-[14px]">
                    soon
                  </span>
                </Show>
              </button>
            )}
          </For>
        </nav>
      </div>
      <div class="h-full flex items-center justify-center">
        <Suspense fallback={<p class="text-xl font-medium">Loading...</p>}>
          <Dynamic component={views[view()]} />
        </Suspense>
      </div>
    </div>
  )
}

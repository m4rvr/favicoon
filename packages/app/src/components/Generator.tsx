import { For, type JSX, Show, createSignal, lazy } from 'solid-js'
import { Dynamic } from 'solid-js/web'

enum View {
  Image,
  Emoji,
  Text
}

const [view, setView] = createSignal(View.Image)

const buttons = [
  { name: 'Image', view: View.Image },
  { name: 'Emoji', view: View.Emoji },
  { name: 'Text', view: View.Text }
]

const views: Record<View, any> = {
  [View.Image]: lazy(() => import('./ImageFavicon')),
  [View.Emoji]: lazy(() => import('./EmojiFavicon')),
  [View.Text]: lazy(() => import('./TextFavicon'))
}

export default function (): JSX.Element {
  const isImageView = (view: View) => view === View.Image
  const currentButton = () => buttons.find((button) => button.view === view())!

  return (
    <div>
      <h1 class="mb-1 text-center text-2xl font-semibold">
        {currentButton().name} Favicon Generator
      </h1>
      <h2 class="mb-8 text-center text-lg text-slate-400">
        Quickly generate a favicon from an image
      </h2>
      <div class="mx-auto mb-10 flex max-w-xs items-center justify-center rounded-full p-2 shadow-lg shadow-slate-200">
        <For each={buttons}>
          {(button) => (
            <button
              class="w-1/3 rounded-full px-4 py-2 transition-colors"
              classList={{
                'bg-blue-500 text-white': view() === button.view,
                'hover:text-blue-500':
                  view() !== button.view && isImageView(button.view),
                'cursor-default relative text-slate-400': !isImageView(
                  button.view
                )
              }}
              onClick={() => {
                if (!isImageView(button.view)) return
                setView(button.view)
              }}
            >
              {button.name}
              <Show when={!isImageView(button.view)}>
                <span class="absolute top-0 ml-1 rounded-full bg-blue-100 px-2 pt-[1px] pb-[2px] text-xs leading-snug text-blue-500">
                  soon
                </span>
              </Show>
            </button>
          )}
        </For>
      </div>
      <div>
        <Dynamic component={views[view()]} />
      </div>
    </div>
  )
}

/* @refresh reload */
import { type JSX, type ParentProps, createContext, useContext } from 'solid-js'
import { type SetStoreFunction, createStore } from 'solid-js/store'

export enum View {
  Selection,
  EmojiInfo,
  Generated
}

interface State {
  view: View
  emoji: Blob | null
  zipBlob: Blob | null
}

type EmojiFaviconContextType = [
  State,
  {
    setState: SetStoreFunction<State>
  }
]

const EmojiFaviconContext = createContext<EmojiFaviconContextType>()

export default function (props: ParentProps): JSX.Element {
  const [state, setState] = createStore<State>({
    view: View.Selection,
    emoji: null,
    zipBlob: null
  })

  const context: EmojiFaviconContextType = [state, { setState }]

  return (
    <EmojiFaviconContext.Provider value={context}>
      {props.children}
    </EmojiFaviconContext.Provider>
  )
}

export function useEmojiFavicon() {
  const context = useContext(EmojiFaviconContext)

  if (!context) {
    throw new Error('Emoji Favicon not provided.')
  }

  return context
}

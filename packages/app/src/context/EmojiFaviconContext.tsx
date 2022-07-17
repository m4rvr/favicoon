/* @refresh reload */
import { type JSX, type ParentProps, createContext, useContext } from 'solid-js'
import { type SetStoreFunction, createStore } from 'solid-js/store'

export enum View {
  Selection,
  EmojiInfo,
  Generated
}

interface EmojiState {
  blob: Blob | null
  scale: number
  rotation: number
}

interface State {
  view: View
  emoji: EmojiState
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
    emoji: {
      blob: null,
      scale: 1,
      rotation: 0
    },
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

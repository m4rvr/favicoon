/* @refresh reload */
import {
  type Accessor,
  type JSX,
  type ParentProps,
  createContext,
  createResource,
  useContext
} from 'solid-js'
import { common, createStarryNight } from '@wooorm/starry-night'

type StarryNight = Awaited<ReturnType<typeof createStarryNight>>

type HighlighterContextType = Accessor<StarryNight | undefined>

const HighlighterContext = createContext<HighlighterContextType>()

export default function (props: ParentProps): JSX.Element {
  const [highlighter] = createResource(() => createStarryNight(common))
  const context: HighlighterContextType = () => highlighter()

  return (
    <HighlighterContext.Provider value={context}>
      {props.children}
    </HighlighterContext.Provider>
  )
}

export function useHighlighter() {
  const context = useContext(HighlighterContext)

  if (!context) {
    throw new Error('Highlighter not provided.')
  }

  return context
}

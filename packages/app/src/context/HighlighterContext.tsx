/* @refresh reload */
import {
  type Accessor,
  type JSX,
  type ParentProps,
  createContext,
  createSignal,
  useContext
} from 'solid-js'
import { type Highlighter, getHighlighter, setCDN } from 'shiki'

type HighlighterContextType = Accessor<Highlighter | undefined>

const HighlighterContext = createContext<HighlighterContextType>()

export default function (props: ParentProps): JSX.Element {
  setCDN('https://unpkg.com/shiki/')
  const [highlighter, setHighlighter] = createSignal<Highlighter>()

  getHighlighter({ theme: 'github-dark' }).then((highlighter) => {
    setHighlighter(highlighter)
  })

  const context: HighlighterContextType = highlighter

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

import { type JSX, lazy } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { View, useEmojiFavicon } from '../../../context/EmojiFaviconContext.js'

const views: Record<View, any> = {
  [View.Selection]: lazy(() => import('./SelectionView.js')),
  [View.EmojiInfo]: lazy(() => import('./EmojiInfoView.js')),
  [View.Generated]: lazy(() => import('./GeneratedView.js'))
}

export default function (): JSX.Element {
  const [state] = useEmojiFavicon()
  return <Dynamic component={views[state.view]} />
}

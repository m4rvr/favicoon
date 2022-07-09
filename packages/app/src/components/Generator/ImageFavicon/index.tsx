import { type JSX, lazy } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { View, useImageFavicon } from '../../../context/ImageFaviconContext.js'

const views: Record<View, any> = {
  [View.Upload]: lazy(() => import('./UploadView.js')),
  [View.ImageInfo]: lazy(() => import('./ImageInfoView.js')),
  [View.Generated]: lazy(() => import('./GeneratedView.js'))
}

export default function (): JSX.Element {
  const [state] = useImageFavicon()
  return <Dynamic component={views[state.view]} />
}

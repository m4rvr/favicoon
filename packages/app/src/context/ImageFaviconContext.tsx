/* @refresh reload */
import { type JSX, type ParentProps, createContext, useContext } from 'solid-js'
import { type SetStoreFunction, createStore } from 'solid-js/store'

export enum View {
  Upload,
  ImageInfo,
  Generated
}

interface UploadedImage {
  name: string
  type: string
  size: number
  width: number
  height: number
  base64: string
  file: File
}

interface State {
  view: View
  uploadedImage: UploadedImage | null
  previewIconUrl: string | null
  zipBlob: Blob | null
}

type ImageFaviconContextType = [
  State,
  {
    setState: SetStoreFunction<State>
  }
]

const ImageFaviconContext = createContext<ImageFaviconContextType>()

export default function (props: ParentProps): JSX.Element {
  const [state, setState] = createStore<State>({
    view: View.Upload,
    uploadedImage: null,
    previewIconUrl: null,
    zipBlob: null
  })

  const context: ImageFaviconContextType = [state, { setState }]

  return (
    <ImageFaviconContext.Provider value={context}>
      {props.children}
    </ImageFaviconContext.Provider>
  )
}

export function useImageFavicon() {
  const context = useContext(ImageFaviconContext)

  if (!context) {
    throw new Error('Image Favicon not provided.')
  }

  return context
}

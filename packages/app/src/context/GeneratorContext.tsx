/* @refresh reload */
import { type JSX, type ParentProps, createContext, useContext } from 'solid-js'
import { type SetStoreFunction, createStore } from 'solid-js/store'

export enum View {
  Upload,
  ImageInfo
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
}

type GeneratorContextType = [
  State,
  {
    setState: SetStoreFunction<State>
  }
]

const GeneratorContext = createContext<GeneratorContextType>()

export default function (props: ParentProps): JSX.Element {
  const [state, setState] = createStore<State>({
    view: View.Upload,
    uploadedImage: null
  })

  const context: GeneratorContextType = [state, { setState }]

  return (
    <GeneratorContext.Provider value={context}>
      {props.children}
    </GeneratorContext.Provider>
  )
}

export function useGenerator() {
  const context = useContext(GeneratorContext)

  if (!context) {
    throw new Error('Generator not provided.')
  }

  return context
}

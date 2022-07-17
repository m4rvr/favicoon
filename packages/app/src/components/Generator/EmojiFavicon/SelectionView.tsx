import { type JSX, createSignal, onMount } from 'solid-js'
import { View, useEmojiFavicon } from '../../../context/EmojiFaviconContext.js'
import EmojiPicker from './EmojiPicker.js'

export default function (): JSX.Element {
  let canvasRef: HTMLCanvasElement | undefined
  let previewCanvasRef: HTMLCanvasElement | undefined
  let context: CanvasRenderingContext2D | null
  let previewContext: CanvasRenderingContext2D | null
  let pixelRatio = 1
  const canvasSize = 512
  const previewCanvasSize = 80

  const [selectedEmojiImage, setSelectedEmojiImage] =
    createSignal<HTMLImageElement | null>(null)
  const [state, { setState }] = useEmojiFavicon()

  onMount(() => {
    pixelRatio = window.devicePixelRatio

    if (canvasRef) {
      canvasRef!.width = canvasSize * pixelRatio
      canvasRef!.height = canvasSize * pixelRatio
      context = canvasRef.getContext('2d')
      context!.scale(pixelRatio, pixelRatio)
    }

    if (previewCanvasRef) {
      previewCanvasRef!.width = previewCanvasSize * pixelRatio
      previewCanvasRef!.height = previewCanvasSize * pixelRatio
      previewContext = previewCanvasRef.getContext('2d')
      previewContext!.scale(pixelRatio, pixelRatio)
    }
  })

  const drawEmoji = () => {
    if (!selectedEmojiImage()) return

    const size = (canvasSize / 100) * state.emoji.scale * 100
    const offset = (canvasSize - size) / 2

    context!.save()
    context!.clearRect(0, 0, canvasRef!.width, canvasRef!.height)

    const translate = canvasSize / 2

    context!.translate(translate, translate)
    context!.rotate(state.emoji.rotation)

    context!.drawImage(
      selectedEmojiImage()!,
      -translate + offset,
      -translate + offset,
      size,
      size
    )

    context!.restore()
  }

  const drawPreviewEmoji = () => {
    if (!selectedEmojiImage()) return

    const size = (previewCanvasSize / 100) * state.emoji.scale * 100
    const offset = (previewCanvasSize - size) / 2

    previewContext!.save()
    previewContext!.clearRect(
      0,
      0,
      previewCanvasRef!.width,
      previewCanvasRef!.height
    )

    const translate = previewCanvasSize / 2

    previewContext!.translate(translate, translate)
    previewContext!.rotate(state.emoji.rotation)

    previewContext!.drawImage(
      selectedEmojiImage()!,
      -translate + offset,
      -translate + offset,
      size,
      size
    )

    previewContext!.restore()
  }

  const onEmojiSelect = (img: HTMLImageElement) => {
    if (!context) return

    const ownImage = new Image()
    ownImage.crossOrigin = 'anonymous'
    ownImage.src = img.src
    ownImage.onload = () => {
      setSelectedEmojiImage(ownImage)
      drawEmoji()
      drawPreviewEmoji()
    }
  }

  const onScaleChange = (event: InputEvent) => {
    previewContext!.clearRect(
      0,
      0,
      previewCanvasRef!.width,
      previewCanvasRef!.height
    )

    const scale = (event.target as HTMLInputElement).value
    setState('emoji', (emoji) => ({ ...emoji, scale: parseFloat(scale) }))
    drawEmoji()
    drawPreviewEmoji()
  }

  const onRotationChange = (event: InputEvent) => {
    const value = (event.target as HTMLInputElement).value
    const rotation = (Math.PI / 180) * parseFloat(value)

    setState('emoji', (emoji) => ({ ...emoji, rotation }))

    drawEmoji()
    drawPreviewEmoji()
  }

  const continueWithEmoji = () => {
    canvasRef!.toBlob((blob) => {
      setState('emoji', (emoji) => ({ ...emoji, blob }))
      setState('view', View.EmojiInfo)
    })
  }

  return (
    <div class="w-full max-w-2xl mx-auto px-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col items-center">
          <h2 class="mb-4 text-center font-medium">Preview</h2>
          <div class="border border-neutral-200 rounded-lg bg-white shadow-lg shadow-neutral-200">
            <canvas
              ref={previewCanvasRef}
              style={{
                width: '80px',
                height: '80px'
              }}
            />
          </div>
          <p class="mt-4">Scale</p>
          <input
            type="range"
            min="0.5"
            max="1"
            value="100"
            step="0.01"
            onInput={onScaleChange}
            class="mt-1"
          />
          <p class="mt-4">Rotation</p>
          <input
            type="range"
            min="-180"
            max="180"
            value="0"
            step="1"
            onInput={onRotationChange}
            class="mt-1"
          />
        </div>
        <div class="flex flex-col items-center">
          <h2 class="mb-4 text-center font-medium">Pick your emoji</h2>
          <EmojiPicker onEmojiSelect={onEmojiSelect} />
        </div>
      </div>
      <div class="flex justify-center mt-10">
        <button
          class="bg-neutral-900 text-white px-4 py-2 rounded-lg"
          classList={{
            'transition-transform hover:scale-103': !!selectedEmojiImage(),
            'opacity-50': !selectedEmojiImage()
          }}
          onClick={continueWithEmoji}
          disabled={!selectedEmojiImage()}
        >
          Continue with Emoji
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width: '512px',
          height: '512px'
        }}
        class="hidden"
      />
    </div>
  )
}

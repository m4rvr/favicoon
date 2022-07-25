import { type JSX, Show, onMount } from 'solid-js'
import { Link } from 'solid-app-router'
import { View, useEmojiFavicon } from '../../../context/EmojiFaviconContext.js'
import EmojiPicker from './EmojiPicker.js'

export default function (): JSX.Element {
  let canvasRef: HTMLCanvasElement | undefined
  let previewCanvasRef: HTMLCanvasElement | undefined
  let scaleInputRef: HTMLInputElement | undefined
  let rotationInputRef: HTMLInputElement | undefined
  let context: CanvasRenderingContext2D | null
  let previewContext: CanvasRenderingContext2D | null
  let pixelRatio = 1
  const canvasSize = 512
  const previewCanvasSize = 80
  const [state, { setState }] = useEmojiFavicon()

  const drawEmoji = () => {
    if (!state.emoji.selectedImage) return

    const size = (canvasSize / 100) * state.emoji.scale * 100
    const offset = (canvasSize - size) / 2

    context!.save()
    context!.clearRect(0, 0, canvasRef!.width, canvasRef!.height)

    const translate = canvasSize / 2

    context!.translate(translate, translate)

    const radians = (Math.PI / 180) * state.emoji.rotation
    context!.rotate(radians)

    context!.drawImage(
      state.emoji.selectedImage,
      -translate + offset,
      -translate + offset,
      size,
      size
    )

    context!.restore()
  }

  const drawPreviewEmoji = () => {
    if (!state.emoji.selectedImage) return

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

    const radians = (Math.PI / 180) * state.emoji.rotation
    previewContext!.rotate(radians)

    previewContext!.drawImage(
      state.emoji.selectedImage,
      -translate + offset,
      -translate + offset,
      size,
      size
    )

    previewContext!.restore()
  }

  onMount(() => {
    pixelRatio = window.devicePixelRatio

    if (canvasRef) {
      canvasRef!.width = canvasSize * pixelRatio
      canvasRef!.height = canvasSize * pixelRatio
      context = canvasRef.getContext('2d')
      context!.scale(pixelRatio, pixelRatio)
      drawEmoji()
    }

    if (previewCanvasRef) {
      previewCanvasRef!.width = previewCanvasSize * pixelRatio
      previewCanvasRef!.height = previewCanvasSize * pixelRatio
      previewContext = previewCanvasRef.getContext('2d')
      previewContext!.scale(pixelRatio, pixelRatio)
      drawPreviewEmoji()
    }
  })

  const onEmojiSelect = async (img: HTMLImageElement) => {
    if (!context) return

    const svgCode = await fetch(img.src).then((res) => res.text())
    const parsedSvg = new DOMParser().parseFromString(svgCode, 'image/svg+xml')
    const svg = parsedSvg.documentElement
    svg.setAttribute('width', '512')
    svg.setAttribute('height', '512')

    const serializedSvg = new XMLSerializer().serializeToString(svg)
    const url = `data:image/svg+xml;charset=utf8,${encodeURIComponent(
      serializedSvg
    )}`

    const ownImage = new Image()
    ownImage.src = url
    ownImage.onload = () => {
      setState('emoji', (emoji) => ({ ...emoji, selectedImage: ownImage }))
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
    const rotation = parseFloat(value)

    setState('emoji', (emoji) => ({ ...emoji, rotation }))

    drawEmoji()
    drawPreviewEmoji()
  }

  const reset = () => {
    scaleInputRef!.value = '1'
    rotationInputRef!.value = '0'
    setState('emoji', (emoji) => ({ ...emoji, scale: 1, rotation: 0 }))
    drawEmoji()
    drawPreviewEmoji()
  }

  const continueWithEmoji = () => {
    canvasRef!.toBlob((blob) => {
      if (!blob) return
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        setState('emoji', (emoji) => ({ ...emoji, blob, base64 }))
        setState('view', View.EmojiInfo)
      }
      reader.readAsDataURL(blob)
    })
  }

  return (
    <div class="w-full max-w-2xl mx-auto px-4">
      <p class="text-sm mb-6 flex items-center gap-1 justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        See license for emojis on{' '}
        <Link href="/resources" title="Resources" class="underline">
          Resources
        </Link>{' '}
        before use.
      </p>
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col items-center">
          <h2 class="mb-4 text-center font-medium">Preview</h2>
          <div class="border border-neutral-200 rounded-lg bg-white shadow-lg relative shadow-neutral-200">
            <canvas
              ref={previewCanvasRef}
              style={{
                width: '80px',
                height: '80px'
              }}
            />
            <Show when={!state.emoji.selectedImage}>
              <p class="absolute top-0 left-0 w-full z-10 text-sm font-medium flex items-center justify-center h-full opacity-50 text-center p-4">
                Select your emoji
              </p>
            </Show>
          </div>
          <p class="mt-4">Scale</p>
          <div class="flex items-center gap-2 text-sm mt-1">
            <span>50%</span>
            <input
              ref={scaleInputRef}
              type="range"
              min="0.5"
              max="2"
              value={state.emoji.scale}
              step="0.01"
              onInput={onScaleChange}
              disabled={!state.emoji.selectedImage}
            />
            <span>200%</span>
          </div>
          <p class="mt-4">Rotation</p>
          <div class="flex items-center gap-2 text-sm mt-1">
            <span>-180°</span>
            <input
              ref={rotationInputRef}
              type="range"
              min="-180"
              max="180"
              value={state.emoji.rotation}
              step="1"
              onInput={onRotationChange}
              disabled={!state.emoji.selectedImage}
            />
            <span>180°</span>
          </div>
        </div>
        <div class="flex flex-col items-center">
          <h2 class="mb-1 text-center font-medium">Pick your emoji</h2>
          <EmojiPicker onEmojiSelect={onEmojiSelect} />
        </div>
      </div>
      <div class="flex justify-center mt-10 gap-4">
        <button
          class="px-4 py-2 rounded-lg"
          classList={{
            'transition-transform hover:scale-103': !!state.emoji.selectedImage,
            'opacity-50': !state.emoji.selectedImage
          }}
          onClick={reset}
          disabled={!state.emoji.selectedImage}
        >
          Reset settings
        </button>
        <button
          class="bg-neutral-900 text-white px-4 py-2 rounded-lg"
          classList={{
            'transition-transform hover:scale-103': !!state.emoji.selectedImage,
            'opacity-50': !state.emoji.selectedImage
          }}
          onClick={continueWithEmoji}
          disabled={!state.emoji.selectedImage}
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

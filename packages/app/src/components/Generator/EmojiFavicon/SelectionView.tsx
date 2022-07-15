import { type JSX, onMount } from 'solid-js'
import { View, useEmojiFavicon } from '../../../context/EmojiFaviconContext.js'
import EmojiPicker from './EmojiPicker.js'

export default function (): JSX.Element {
  let canvasRef: HTMLCanvasElement | undefined
  let context: CanvasRenderingContext2D | null

  const [, { setState }] = useEmojiFavicon()

  onMount(() => {
    if (canvasRef) {
      context = canvasRef.getContext('2d')
    }
  })

  const onEmojiSelect = (img: HTMLImageElement) => {
    if (!context) return

    const ownImage = new Image()
    ownImage.crossOrigin = 'anonymous'
    ownImage.src = img.src
    ownImage.onload = () => {
      context!.clearRect(0, 0, canvasRef!.width, canvasRef!.height)
      context!.drawImage(ownImage, 0, 0, 512, 512)

      canvasRef!.toBlob((blob) => {
        setState('view', View.EmojiInfo)
        setState('emoji', blob)
      })
    }
  }

  return (
    <>
      <div>
        <EmojiPicker onEmojiSelect={onEmojiSelect} />
        <canvas ref={canvasRef} width="512" height="512" class="hidden" />
      </div>
    </>
  )
}

import { type JSX } from 'solid-js'
import type { UploadedFile } from '../types'

interface Props {
  file: UploadedFile
  onChangeFile: () => void
}

export default function (props: Props): JSX.Element {
  return (
    <div class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div class="flex items-center gap-4">
        <div class="h-12 w-12 overflow-hidden rounded-full">
          <img
            src={props.file.base64}
            alt={props.file.name}
            width={50}
            class="aspect-square object-cover"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-sm text-slate-400">Current file</span>
          <span class="font-medium">{props.file.name}</span>
        </div>
      </div>
      <button
        class="flex items-center gap-2 text-slate-400 transition-colors hover:text-red-500"
        onClick={() => props.onChangeFile()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </div>
  )
}

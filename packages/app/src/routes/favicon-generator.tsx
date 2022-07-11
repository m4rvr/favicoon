import { type JSX } from 'solid-js'
import { Link } from 'solid-app-router'
import Generator from '../components/Generator/index.js'
import raccoon from '../assets/raccoon.png'

export default function (): JSX.Element {
  return (
    <div
      class="font-base text-neutral-700 h-screen pt-24"
      style={{
        'background-size': '1.5rem 1.5rem',
        'background-image':
          'radial-gradient(circle, #ddd 1px, rgba(0, 0, 0, 0) 1px)'
      }}
    >
      <header class="border-b border-slate-200 z-50 fixed top-0 left-0 w-full backdrop-blur bg-white/50">
        <div class="h-16 p-4 flex items-center justify-between container mx-auto">
          <Link href="/" class="font-medium text-lg flex items-center gap-1">
            <img src={raccoon} class="w-8" /> favicoon
          </Link>
        </div>
      </header>
      <Generator />
    </div>
  )
}

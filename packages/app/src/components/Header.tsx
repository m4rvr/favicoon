import { type JSX } from 'solid-js'
import Nav from './Nav.js'

export default function (): JSX.Element {
  return (
    <header class="fixed top-0 left-0 w-full border-b border-slate-200 bg-white/30 backdrop-blur z-50">
      <div class="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <div class="flex items-center">
          <div class="text-lg font-semibold">favee</div>
        </div>
        <Nav />
      </div>
    </header>
  )
}

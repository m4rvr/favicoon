import { type JSX, type ParentProps } from 'solid-js'
import { Suspense } from 'solid-js/web'
import Nav from './Nav.js'

export default function (props: ParentProps): JSX.Element {
  return (
    <div class="relative h-full">
      <Nav />
      <div class="h-full flex items-center justify-center">
        <Suspense fallback={<p class="font-semibold text-xl">Loading...</p>}>
          {props.children}
        </Suspense>
      </div>
    </div>
  )
}

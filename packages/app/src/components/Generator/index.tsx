import { type JSX, type ParentProps } from 'solid-js'
import Nav from './Nav.js'

export default function (props: ParentProps): JSX.Element {
  return (
    <div class="relative h-full">
      <Nav />
      <div class="h-full flex items-center justify-center">
        {props.children}
      </div>
    </div>
  )
}

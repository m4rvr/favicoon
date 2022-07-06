import { type JSX, type ParentProps } from 'solid-js'
import Header from '../components/Header.js'

type Props = ParentProps

export default function (props: Props): JSX.Element {
  return (
    <div class="font-base text-slate-700">
      <Header />
      <div class="mx-auto max-w-4xl px-4 pt-28">{props.children}</div>
    </div>
  )
}

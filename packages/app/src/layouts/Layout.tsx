import { type JSX, type ParentProps } from 'solid-js'
import Header from '../components/Header.js'

type Props = ParentProps<{
  title?: string
}>

export default function (props: Props): JSX.Element {
  return (
    <div
      class="font-base text-neutral-700 h-screen pt-24"
      style={{
        'background-size': '1.5rem 1.5rem',
        'background-image':
          'radial-gradient(circle, #ddd 1px, rgba(0, 0, 0, 0) 1px)'
      }}
    >
      <Header title={props.title} />
      {props.children}
      <footer class="-translate-y-full">
        <div class="container mx-auto p-4 text-center font-medium text-sm">
          Made with ❤️ by{' '}
          <a href="https://twitter.com/marvr_" target="_blank">
            @marvr_
          </a>
        </div>
      </footer>
    </div>
  )
}

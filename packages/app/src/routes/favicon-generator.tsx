import { type JSX } from 'solid-js'
import { Link } from 'solid-app-router'
import Generator from '../components/Generator/index.js'
import raccoon from '../assets/raccoon.png'

const donationButton = [
  {
    emoji: '🍫',
    text: 'Buy me Chocolate'
  },
  {
    emoji: '🍕',
    text: 'Buy me a Pizza'
  },
  {
    emoji: '🍵',
    text: 'Buy me a Tea'
  },
  {
    emoji: '🍰',
    text: 'Buy me a Cake'
  },
  {
    emoji: '🥑',
    text: 'Buy me an Avocado'
  }
]

export default function (): JSX.Element {
  const randomButton =
    donationButton[Math.floor(Math.random() * donationButton.length)]

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
        <div class="h-16 p-4 flex items-center justify-between container mx-auto z-10">
          <Link href="/" class="font-medium text-lg flex items-center gap-1">
            <img src={raccoon} class="w-8" /> favicoon
          </Link>
          <a
            href="https://www.buymeacoffee.com/m4rvr"
            target="_blank"
            title="Buy me a pizza"
            class="inline-block shadow-lg gap-1 shadow-yellow-100 rounded-lg px-4 py-2 bg-yellow-400 text-neutral-800 font-medium transition-transform hover:scale-103"
          >
            {randomButton.emoji}{' '}
            <span class="text-sm">{randomButton.text}</span>
          </a>
        </div>
        <h1 class="absolute text-lg font-medium top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          Favicon Generator
        </h1>
      </header>
      <Generator />
      <footer>
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

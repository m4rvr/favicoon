import { type JSX, Show, createSignal, onMount } from 'solid-js'
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
  const [randomButton, setRandomButton] = createSignal<any>()
  const twitterText =
    encodeURIComponent(`I've just generated my favicon in seconds with @favicoon!

Check it out here: https://favicoon.netlify.app 🚀`)

  onMount(() => {
    setRandomButton(
      donationButton[Math.floor(Math.random() * donationButton.length)]
    )
  })

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
          <Show when={randomButton()}>
            <div class="flex items-center gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${twitterText}`}
                target="_blank"
                title="Tweet about Favicoon"
                class="inline-flex leading-0 items-center rounded-lg text-white bg-[#1d9bf0] px-4 py-2 font-medium text-sm gap-1 transition-transform hover:scale-103"
              >
                <img
                  class="w-5 h-5"
                  src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2072%2072%22%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M0%200h72v72H0z%22%2F%3E%3Cpath%20class%3D%22icon%22%20fill%3D%22%23fff%22%20d%3D%22M68.812%2015.14c-2.348%201.04-4.87%201.744-7.52%202.06%202.704-1.62%204.78-4.186%205.757-7.243-2.53%201.5-5.33%202.592-8.314%203.176C56.35%2010.59%2052.948%209%2049.182%209c-7.23%200-13.092%205.86-13.092%2013.093%200%201.026.118%202.02.338%202.98C25.543%2024.527%2015.9%2019.318%209.44%2011.396c-1.125%201.936-1.77%204.184-1.77%206.58%200%204.543%202.312%208.552%205.824%2010.9-2.146-.07-4.165-.658-5.93-1.64-.002.056-.002.11-.002.163%200%206.345%204.513%2011.638%2010.504%2012.84-1.1.298-2.256.457-3.45.457-.845%200-1.666-.078-2.464-.23%201.667%205.2%206.5%208.985%2012.23%209.09-4.482%203.51-10.13%205.605-16.26%205.605-1.055%200-2.096-.06-3.122-.184%205.794%203.717%2012.676%205.882%2020.067%205.882%2024.083%200%2037.25-19.95%2037.25-37.25%200-.565-.013-1.133-.038-1.693%202.558-1.847%204.778-4.15%206.532-6.774z%22%2F%3E%3C%2Fsvg%3E"
                />
                Tweet
              </a>
              <a
                href="https://www.buymeacoffee.com/m4rvr"
                target="_blank"
                title={randomButton()!.text}
                class="inline-block leading-0 shadow-lg gap-1 shadow-yellow-100 rounded-lg px-4 py-2 bg-yellow-400 text-neutral-800 font-medium transition-transform hover:scale-103"
              >
                {randomButton()!.emoji}{' '}
                <span class="text-sm">{randomButton()!.text}</span>
              </a>
            </div>
          </Show>
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

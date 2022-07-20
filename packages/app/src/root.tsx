// @refresh reload
import 'uno.css'
import '@unocss/reset/tailwind.css'
import './assets/fonts.css'
import { Links, Meta, Routes, Scripts } from 'solid-start/root'
import { ErrorBoundary } from 'solid-start/error-boundary'
import { Suspense } from 'solid-js'
import { Toaster } from 'solid-toast'

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          defer
          data-domain="favicoon.com"
          src="https://plausible.io/js/plausible.js"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>
        <ErrorBoundary>
          <Suspense>
            <Routes />
          </Suspense>
          <Toaster />
        </ErrorBoundary>
        <Scripts />
      </body>
    </html>
  )
}

/* function loadEmojis() {
  const emojiCategories = []
  let currentCategoryIndex = 0

  const script = document.createElement('script')
  script.onload = () => {
    for (const row of document.querySelectorAll('table[border="1"] tbody tr')) {
      const categoryRow = row.querySelector('.bighead')
      const codeTd = row.querySelector('td.code')

      if (categoryRow) {
        emojiCategories.push({
          name: categoryRow.textContent,
          emojis: [],
          isParsed: true
        })
        currentCategoryIndex = emojiCategories.length - 1
      } else if (codeTd) {
        let parsedEmoji = ''

        codeTd.textContent
          .trim()
          .split(' ')
          .forEach((unicode) => {
            parsedEmoji += twemoji.convert.fromCodePoint(
              unicode.replace('U+', '')
            )
          })

        emojiCategories[currentCategoryIndex].emojis.push(parsedEmoji)
      }
    }

    console.log(emojiCategories)
  }

  document.head.appendChild(script).src =
    'https://twemoji.maxcdn.com/v/latest/twemoji.min.js'
} */

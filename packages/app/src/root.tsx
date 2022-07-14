// @refresh reload
import { Links, Meta, Routes, Scripts } from 'solid-start/root'
import { ErrorBoundary } from 'solid-start/error-boundary'
import { Suspense } from 'solid-js'
import 'uno.css'
import '@unocss/reset/tailwind.css'
import './assets/fonts.css'
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
          data-domain="favicoon.netlify.app"
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

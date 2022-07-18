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
        <meta
          name="google-site-verification"
          content="8fEJuzL1mzNxtK_W0TUedsBGGV7o1vbID2xJaGCDY_Y"
        />
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

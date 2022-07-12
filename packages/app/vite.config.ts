import { defineConfig } from 'vite'
import solid from 'solid-start'
import unocss from 'unocss/vite'
// @ts-expect-error no types
import staticAdapter from 'solid-start-static'

export default defineConfig({
  // @ts-expect-error no types
  ssr: {
    noExternal: ['solid-toast']
  },
  plugins: [
    solid({
      adapter: staticAdapter({
        prerenderRoutes: ['/404']
      })
    }),
    unocss({
      theme: {
        fontFamily: {
          base: 'Inter'
        }
      }
    })
  ]
})

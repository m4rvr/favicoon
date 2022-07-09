import { defineConfig } from 'vite'
import solid from 'solid-start'
import unocss from 'unocss/vite'
// @ts-expect-error no types
import netlify from 'solid-start-netlify'

export default defineConfig({
  // @ts-expect-error no types from Vite?
  ssr: {
    noExternal: ['solid-toast']
  },
  plugins: [
    solid({
      adapter: netlify({
        edge: true
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

import { defineConfig } from 'vite'
import solid from 'solid-start'
import unocss from 'unocss/vite'

export default defineConfig({
  /* ssr: {
    noExternal: ['solid-toast']
  }, */
  plugins: [solid(), unocss({
    theme: {
      fontFamily: {
        base: 'Inter'
      }
    }
  })]
})

import { defineConfig } from 'astro/config'
import solid from '@astrojs/solid-js'
import tailwind from '@astrojs/tailwind'
import netlify from '@astrojs/netlify'

// https://astro.build/config
export default defineConfig({
  integrations: [solid(), tailwind({})],
  adapter: netlify(),
  vite: {
    resolve: {
      conditions: ['solid']
    }
  }
})

import { defineConfig } from 'astro/config'
import solid from '@astrojs/solid-js'
import tailwind from '@astrojs/tailwind'
import node from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
  integrations: [solid(), tailwind({})],
  adapter: node(),
  vite: {
    resolve: {
      conditions: ['solid']
    }
  }
})

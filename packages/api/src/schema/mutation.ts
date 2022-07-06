import sharp from 'sharp'
import { builder } from './builder.js'

builder.mutationType({
  fields: (t) => ({
    generateFavicon: t.field({
      type: 'String',
      nullable: true,
      args: {
        file: t.arg.string({
          required: true
        })
      },
      resolve: async (_root) => {
        return null
      }
    })
  })
})

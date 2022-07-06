import { builder } from './builder.js'

builder.queryType({
  fields: (t) => ({
    foo: t.field({
      type: 'Boolean',
      resolve: () => true
    })
  })
})

import SchemaBuilder from '@pothos/core'
import type { Context } from '../context.js'

export const builder = new SchemaBuilder<{
  Context: Context
}>({})

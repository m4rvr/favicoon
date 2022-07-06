import type { FastifyReply, FastifyRequest } from 'fastify'

export interface Context {
  request: FastifyRequest
  reply: FastifyReply
}

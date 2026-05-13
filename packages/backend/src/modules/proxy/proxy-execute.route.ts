import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { executeProxy } from './proxy-execute.controller.js'

export async function proxyExecuteRoutes(fastify: FastifyInstance) {
  const h = (fn: Function) => fn as RouteHandlerMethod

  fastify.get('/:apiPath',    h(executeProxy))
  fastify.post('/:apiPath',   h(executeProxy))
  fastify.put('/:apiPath',    h(executeProxy))
  fastify.delete('/:apiPath', h(executeProxy))
}

import type { FastifyRequest, FastifyReply } from 'fastify'
import { err } from '../utils/response.js'

export function requirePermission(permissionCode: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.currentUser.permissions.includes(permissionCode)) {
      reply.status(403).send(err('您沒有執行此操作的權限', 'FORBIDDEN'))
    }
  }
}

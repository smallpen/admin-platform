import type { FastifyInstance } from 'fastify'
import { verifyJWT } from '../../middleware/auth.middleware.js'
import { ok } from '../../utils/response.js'

export async function statsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyJWT)

  fastify.get('/', async (_req, reply) => {
    const [userCount, roleCount, permissionCount, activeUserCount] = await fastify.prisma.$transaction([
      fastify.prisma.user.count(),
      fastify.prisma.role.count(),
      fastify.prisma.permission.count(),
      fastify.prisma.user.count({ where: { status: 'ACTIVE' } }),
    ])
    return reply.send(ok({ userCount, roleCount, permissionCount, activeUserCount }))
  })
}

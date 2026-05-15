import type { FastifyInstance } from 'fastify'
import { verifyJWT } from '../../middleware/auth.middleware.js'
import { ok } from '../../utils/response.js'

function getTaiwanDayRange(daysAgo: number): { start: Date; end: Date } {
  const now = new Date()
  const TW_OFFSET = 8 * 60 * 60 * 1000
  const todayTW = new Date(now.getTime() + TW_OFFSET)
  todayTW.setUTCHours(0, 0, 0, 0)

  const start = new Date(todayTW.getTime() - daysAgo * 24 * 60 * 60 * 1000 - TW_OFFSET)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
  return { start, end }
}

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

  fastify.get('/trends', async (_req, reply) => {
    const DAYS = 7
    const labels: string[] = []
    const ranges: Array<{ start: Date; end: Date }> = []

    for (let i = DAYS - 1; i >= 0; i--) {
      const { start, end } = getTaiwanDayRange(i)
      const d = new Date(start.getTime() + 8 * 60 * 60 * 1000)
      labels.push(`${d.getUTCMonth() + 1}/${d.getUTCDate()}`)
      ranges.push({ start, end })
    }

    const counts = await fastify.prisma.$transaction(
      ranges.map(({ start, end }) =>
        fastify.prisma.activityLog.count({
          where: { action: 'LOGIN', createdAt: { gte: start, lte: end } },
        })
      )
    )

    return reply.send(ok({ labels, data: counts }))
  })

  fastify.get('/action-distribution', async (_req, reply) => {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    since.setHours(0, 0, 0, 0)

    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN'] as const
    const counts = await fastify.prisma.$transaction(
      actions.map(action =>
        fastify.prisma.activityLog.count({ where: { action, createdAt: { gte: since } } })
      )
    )

    const distribution = actions.map((name, i) => ({ name, value: counts[i] }))
    return reply.send(ok(distribution))
  })
}

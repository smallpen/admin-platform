import type { FastifyInstance } from 'fastify'
import type { ActivityLogListQuery } from './activity-logs.schema.js'

export async function listActivityLogsService(fastify: FastifyInstance, query: ActivityLogListQuery) {
  const { page, pageSize, dateFrom, dateTo, module, action, username } = query

  const where: any = {}
  if (module)   where.module = module
  if (action)   where.action = action
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom + 'T00:00:00+08:00')
    if (dateTo)   where.createdAt.lte = new Date(dateTo + 'T23:59:59+08:00')
  }
  if (username) {
    where.user = { username: { contains: username } }
  }

  const [total, logs] = await fastify.prisma.$transaction([
    fastify.prisma.activityLog.count({ where }),
    fastify.prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return { logs, total }
}

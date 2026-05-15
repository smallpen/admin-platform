import type { FastifyInstance } from 'fastify'
import { verifyJWT } from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/rbac.middleware.js'
import { listActivityLogs } from './activity-logs.controller.js'

export async function activityLogsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyJWT)
  fastify.get('/', { preHandler: [requirePermission('activity_log:list')] }, listActivityLogs)
}

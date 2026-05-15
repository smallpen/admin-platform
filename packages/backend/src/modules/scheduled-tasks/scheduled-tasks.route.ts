import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { verifyJWT } from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/rbac.middleware.js'
import {
  listScheduledTasksController,
  updateScheduledTaskController,
  triggerScheduledTaskController,
} from './scheduled-tasks.controller.js'

export async function scheduledTasksRoutes(fastify: FastifyInstance) {
  const h = (fn: Function) => fn as RouteHandlerMethod

  fastify.get('/',              { preHandler: [verifyJWT, requirePermission('scheduled_task:list')]   }, h(listScheduledTasksController))
  fastify.patch('/:id',         { preHandler: [verifyJWT, requirePermission('scheduled_task:update')] }, h(updateScheduledTaskController))
  fastify.post('/:id/trigger',  { preHandler: [verifyJWT, requirePermission('scheduled_task:update')] }, h(triggerScheduledTaskController))
}

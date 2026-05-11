import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { verifyJWT } from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/rbac.middleware.js'
import {
  getMaintenanceStatusController,
  updateMaintenanceStatusController,
  listSchedulesController,
  createScheduleController,
  updateScheduleController,
  deleteScheduleController,
} from './settings.controller.js'

export async function settingsRoutes(fastify: FastifyInstance) {
  const h = (fn: Function) => fn as RouteHandlerMethod

  // Public endpoint — no auth required
  fastify.get('/maintenance/status', h(getMaintenanceStatusController))

  // Protected routes
  fastify.get(
    '/maintenance',
    { preHandler: [verifyJWT, requirePermission('settings:view')] },
    h(getMaintenanceStatusController),
  )
  fastify.put(
    '/maintenance',
    { preHandler: [verifyJWT, requirePermission('settings:maintenance')] },
    h(updateMaintenanceStatusController),
  )
  fastify.get(
    '/maintenance/schedules',
    { preHandler: [verifyJWT, requirePermission('settings:view')] },
    h(listSchedulesController),
  )
  fastify.post(
    '/maintenance/schedules',
    { preHandler: [verifyJWT, requirePermission('settings:maintenance')] },
    h(createScheduleController),
  )
  fastify.put(
    '/maintenance/schedules/:id',
    { preHandler: [verifyJWT, requirePermission('settings:maintenance')] },
    h(updateScheduleController),
  )
  fastify.delete(
    '/maintenance/schedules/:id',
    { preHandler: [verifyJWT, requirePermission('settings:maintenance')] },
    h(deleteScheduleController),
  )
}

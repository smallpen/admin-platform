import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { verifyJWT } from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/rbac.middleware.js'
import {
  listAnnouncementsController,
  getActiveController,
  createAnnouncementController,
  updateAnnouncementController,
  deleteAnnouncementController,
  markAsReadController,
  markAllAsReadController,
} from './announcements.controller.js'

export async function announcementsRoutes(fastify: FastifyInstance) {
  const h = (fn: Function) => fn as RouteHandlerMethod

  // Authenticated user endpoints (no special permission needed)
  fastify.get('/active', { preHandler: [verifyJWT] }, h(getActiveController))
  fastify.post('/read-all', { preHandler: [verifyJWT] }, h(markAllAsReadController))
  fastify.post('/:id/read', { preHandler: [verifyJWT] }, h(markAsReadController))

  // Admin management endpoints
  fastify.get('/',     { preHandler: [verifyJWT, requirePermission('announcement:list')]   }, h(listAnnouncementsController))
  fastify.post('/',    { preHandler: [verifyJWT, requirePermission('announcement:create')] }, h(createAnnouncementController))
  fastify.patch('/:id', { preHandler: [verifyJWT, requirePermission('announcement:update')] }, h(updateAnnouncementController))
  fastify.delete('/:id', { preHandler: [verifyJWT, requirePermission('announcement:delete')] }, h(deleteAnnouncementController))
}

import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { verifyJWT } from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/rbac.middleware.js'
import { listAds, getAd, getAdImage, createAd, updateAd, deleteAd } from './ads.controller.js'

export async function adsRoutes(fastify: FastifyInstance) {
  const h = (fn: Function) => fn as RouteHandlerMethod

  // Public: image serving (no JWT required)
  fastify.get('/:id/image', h(getAdImage))

  // Protected routes
  fastify.get('/', { preHandler: [verifyJWT, requirePermission('ad:list')] }, h(listAds))
  fastify.get('/:id', { preHandler: [verifyJWT, requirePermission('ad:list')] }, h(getAd))
  fastify.post('/', { preHandler: [verifyJWT, requirePermission('ad:create')] }, h(createAd))
  fastify.patch('/:id', { preHandler: [verifyJWT, requirePermission('ad:update')] }, h(updateAd))
  fastify.delete('/:id', { preHandler: [verifyJWT, requirePermission('ad:delete')] }, h(deleteAd))
}

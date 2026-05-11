import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { verifyJWT } from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/rbac.middleware.js'
import { listPermissions, createPermission, updatePermission, deletePermission } from './permissions.controller.js'

export async function permissionsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyJWT)

  const h = (fn: Function) => fn as RouteHandlerMethod

  fastify.get('/', { preHandler: [requirePermission('permission:list')] }, h(listPermissions))
  fastify.post('/', { preHandler: [requirePermission('permission:create')] }, h(createPermission))
  fastify.patch('/:id', { preHandler: [requirePermission('permission:update')] }, h(updatePermission))
  fastify.delete('/:id', { preHandler: [requirePermission('permission:delete')] }, h(deletePermission))
}

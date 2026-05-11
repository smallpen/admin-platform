import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { verifyJWT } from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/rbac.middleware.js'
import { listRoles, getRole, createRole, updateRole, deleteRole, assignRolePermissions } from './roles.controller.js'

export async function rolesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyJWT)

  const h = (fn: Function) => fn as RouteHandlerMethod

  fastify.get('/', { preHandler: [requirePermission('role:list')] }, h(listRoles))
  fastify.get('/:id', { preHandler: [requirePermission('role:list')] }, h(getRole))
  fastify.post('/', { preHandler: [requirePermission('role:create')] }, h(createRole))
  fastify.patch('/:id', { preHandler: [requirePermission('role:update')] }, h(updateRole))
  fastify.delete('/:id', { preHandler: [requirePermission('role:delete')] }, h(deleteRole))
  fastify.put('/:id/permissions', { preHandler: [requirePermission('permission:assign')] }, h(assignRolePermissions))
}

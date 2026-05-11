import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { verifyJWT } from '../../middleware/auth.middleware.js'
import { requirePermission } from '../../middleware/rbac.middleware.js'
import {
  listUsers, getUser, createUser, updateUser, deleteUser,
  updateUserStatus, updateUserPassword, assignUserRoles,
} from './users.controller.js'

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyJWT)

  const h = (fn: Function) => fn as RouteHandlerMethod

  fastify.get('/', { preHandler: [requirePermission('user:list')] }, h(listUsers))
  fastify.get('/:id', { preHandler: [requirePermission('user:list')] }, h(getUser))
  fastify.post('/', { preHandler: [requirePermission('user:create')] }, h(createUser))
  fastify.patch('/:id', { preHandler: [requirePermission('user:update')] }, h(updateUser))
  fastify.delete('/:id', { preHandler: [requirePermission('user:delete')] }, h(deleteUser))
  fastify.patch('/:id/status', { preHandler: [requirePermission('user:update')] }, h(updateUserStatus))
  fastify.patch('/:id/password', { preHandler: [requirePermission('user:update')] }, h(updateUserPassword))
  fastify.put('/:id/roles', { preHandler: [requirePermission('user:update')] }, h(assignUserRoles))
}

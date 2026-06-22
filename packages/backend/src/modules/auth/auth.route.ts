import type { FastifyInstance } from 'fastify'
import { loginController, refreshController, logoutController, meController, updateMeController, updateMyPasswordController } from './auth.controller.js'
import { verifyJWT } from '../../middleware/auth.middleware.js'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, loginController)
  fastify.post('/refresh', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, refreshController)
  fastify.post('/logout', { preHandler: [verifyJWT] }, logoutController)
  fastify.get('/me', { preHandler: [verifyJWT] }, meController)
  fastify.patch('/me', { preHandler: [verifyJWT] }, updateMeController)
  fastify.patch('/me/password', { preHandler: [verifyJWT] }, updateMyPasswordController)
}

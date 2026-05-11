import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import prismaPlugin from './plugins/prisma.plugin.js'
import schedulerPlugin from './plugins/scheduler.plugin.js'
import { authRoutes } from './modules/auth/auth.route.js'
import { usersRoutes } from './modules/users/users.route.js'
import { rolesRoutes } from './modules/roles/roles.route.js'
import { permissionsRoutes } from './modules/permissions/permissions.route.js'
import { statsRoutes } from './modules/stats/stats.route.js'
import { settingsRoutes } from './modules/settings/settings.route.js'
import { config } from './config.js'

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  })

  // Security
  await fastify.register(fastifyHelmet, { contentSecurityPolicy: false })

  // Rate limiting — stricter for auth endpoints
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // CORS
  await fastify.register(fastifyCors, {
    origin: config.CORS_ORIGIN.split(','),
    credentials: true,
  })

  // Cookie
  await fastify.register(fastifyCookie)

  // JWT
  await fastify.register(fastifyJwt, {
    secret: config.JWT_ACCESS_SECRET,
  })

  // Prisma
  await fastify.register(prismaPlugin)

  // Scheduler (depends on prisma)
  await fastify.register(schedulerPlugin)

  // Routes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' })
  await fastify.register(usersRoutes, { prefix: '/api/v1/users' })
  await fastify.register(rolesRoutes, { prefix: '/api/v1/roles' })
  await fastify.register(permissionsRoutes, { prefix: '/api/v1/permissions' })
  await fastify.register(statsRoutes, { prefix: '/api/v1/stats' })
  await fastify.register(settingsRoutes, { prefix: '/api/v1/settings' })

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  return fastify
}

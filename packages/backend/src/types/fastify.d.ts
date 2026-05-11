import type { PrismaClient } from '@prisma/client'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    reloadScheduler: () => void
  }

  interface FastifyRequest {
    currentUser: {
      id: string
      permissions: string[]
    }
  }
}

import type { FastifyInstance, FastifyRequest } from 'fastify'

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ASSIGN'

export interface ActivityContext {
  userId: string
  ipAddress?: string
  userAgent?: string
}

export function extractActivityContext(request: FastifyRequest): ActivityContext {
  return {
    userId:    request.currentUser.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  }
}

const SENSITIVE = new Set(['passwordHash', 'password_hash', 'keyHash', 'key_hash', 'imageData'])

function sanitize(obj: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!obj) return null
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !SENSITIVE.has(k)))
}

export async function createActivityLog(
  fastify: FastifyInstance,
  input: {
    ctx: ActivityContext
    action: ActivityAction
    module: string
    targetId?: string
    targetName?: string
    before?: Record<string, unknown> | null
    after?: Record<string, unknown> | null
  },
): Promise<void> {
  try {
    const sanitizedBefore = input.before ? sanitize(input.before) : undefined
    const sanitizedAfter  = input.after  ? sanitize(input.after)  : undefined

    await fastify.prisma.activityLog.create({
      data: {
        userId:     input.ctx.userId,
        action:     input.action,
        module:     input.module,
        targetId:   input.targetId,
        targetName: input.targetName,
        before:     sanitizedBefore as any ?? undefined,
        after:      sanitizedAfter  as any ?? undefined,
        ipAddress:  input.ctx.ipAddress,
        userAgent:  input.ctx.userAgent,
      },
    })
  } catch (e) {
    console.error('[ActivityLog] Failed to create log:', e)
  }
}

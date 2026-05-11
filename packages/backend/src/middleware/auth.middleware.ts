import type { FastifyRequest, FastifyReply } from 'fastify'
import { err } from '../utils/response.js'

export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()

    const payload = request.user as unknown as { sub: string }
    const userId = payload.sub

    const userWithPerms = await request.server.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    })

    if (!userWithPerms || userWithPerms.status !== 'ACTIVE') {
      reply.status(401).send(err('帳號不存在或已停用', 'UNAUTHORIZED'))
      return
    }

    const permissions = new Set<string>()
    for (const ur of userWithPerms.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissions.add(rp.permission.code)
      }
    }

    request.currentUser = {
      id: userId,
      permissions: Array.from(permissions),
    }
  } catch {
    reply.status(401).send(err('認證失敗，請重新登入', 'UNAUTHORIZED'))
  }
}

import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { verifyPassword } from '../../utils/password.js'
import { config } from '../../config.js'

export async function loginService(fastify: FastifyInstance, username: string, password: string) {
  const user = await fastify.prisma.user.findUnique({
    where: { username },
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

  if (!user) return null

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return null

  if (user.status !== 'ACTIVE') {
    throw new Error(user.status === 'LOCKED' ? '帳號已鎖定' : '帳號已停用')
  }

  await fastify.prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const permissions = new Set<string>()
  const roles: string[] = []
  for (const ur of user.userRoles) {
    roles.push(ur.role.name)
    for (const rp of ur.role.rolePermissions) {
      permissions.add(rp.permission.code)
    }
  }

  const accessToken = fastify.jwt.sign(
    { sub: user.id },
    { expiresIn: config.JWT_ACCESS_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}` }
  )

  const refreshTokenValue = fastify.jwt.sign(
    { sub: user.id, type: 'refresh', jti: randomUUID() },
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}` }
  )

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await fastify.prisma.refreshToken.create({
    data: { token: refreshTokenValue, userId: user.id, expiresAt },
  })

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      status: user.status,
      roles,
      permissions: Array.from(permissions),
    },
  }
}

export async function refreshService(fastify: FastifyInstance, refreshTokenValue: string) {
  const stored = await fastify.prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
  })

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    return null
  }

  // Revoke the old token
  await fastify.prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  })

  // Issue new pair
  const accessToken = fastify.jwt.sign(
    { sub: stored.userId },
    { expiresIn: config.JWT_ACCESS_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}` }
  )

  const newRefreshToken = fastify.jwt.sign(
    { sub: stored.userId, type: 'refresh', jti: randomUUID() },
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}` }
  )

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await fastify.prisma.refreshToken.create({
    data: { token: newRefreshToken, userId: stored.userId, expiresAt },
  })

  return { accessToken, refreshToken: newRefreshToken }
}

export async function logoutService(fastify: FastifyInstance, refreshTokenValue: string) {
  await fastify.prisma.refreshToken.updateMany({
    where: { token: refreshTokenValue, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function getMeService(fastify: FastifyInstance, userId: string) {
  const user = await fastify.prisma.user.findUnique({
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

  if (!user) return null

  const permissions = new Set<string>()
  const roles: string[] = []
  for (const ur of user.userRoles) {
    roles.push(ur.role.name)
    for (const rp of ur.role.rolePermissions) {
      permissions.add(rp.permission.code)
    }
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    status: user.status,
    roles,
    permissions: Array.from(permissions),
  }
}

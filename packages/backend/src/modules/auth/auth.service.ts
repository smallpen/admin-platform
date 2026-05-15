import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { verifyPassword, hashPassword } from '../../utils/password.js'
import { config } from '../../config.js'
import { createActivityLog, type ActivityContext } from '../../utils/activity-log.js'
import type { UpdateMeInput } from './auth.schema.js'

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

  const maintenance = await fastify.prisma.maintenanceStatus.findUnique({ where: { id: 1 } })
  if (maintenance?.isActive && !permissions.has('settings:maintenance')) {
    throw new Error('MAINTENANCE_MODE')
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

export async function updateMeService(
  fastify: FastifyInstance,
  userId: string,
  input: UpdateMeInput,
  ctx: ActivityContext,
) {
  const before = await fastify.prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, displayName: true, email: true },
  })
  if (!before) return null

  if (input.email && input.email !== before.email) {
    const existing = await fastify.prisma.user.findFirst({
      where: { email: input.email, NOT: { id: userId } },
    })
    if (existing) throw new Error('EMAIL_CONFLICT')
  }

  const updated = await fastify.prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.email !== undefined && { email: input.email }),
    },
  })

  await createActivityLog(fastify, {
    ctx,
    action: 'UPDATE',
    module: 'auth',
    targetId: userId,
    targetName: before.username,
    before: { displayName: before.displayName, email: before.email },
    after: { displayName: updated.displayName, email: updated.email },
  })

  return getMeService(fastify, userId)
}

export async function updateMyPasswordService(
  fastify: FastifyInstance,
  userId: string,
  currentPassword: string,
  newPassword: string,
  ctx: ActivityContext,
) {
  const user = await fastify.prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, username: true },
  })
  if (!user) return false

  const valid = await verifyPassword(currentPassword, user.passwordHash)
  if (!valid) throw new Error('INVALID_CURRENT_PASSWORD')

  const newHash = await hashPassword(newPassword)
  await fastify.prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  })

  await createActivityLog(fastify, {
    ctx,
    action: 'UPDATE',
    module: 'auth',
    targetId: userId,
    targetName: user.username,
    after: { passwordChanged: true },
  })

  return true
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

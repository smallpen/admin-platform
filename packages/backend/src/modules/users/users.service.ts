import type { FastifyInstance } from 'fastify'
import { hashPassword } from '../../utils/password.js'
import { toSkipTake } from '../../utils/pagination.js'
import type { CreateUserInput, UpdateUserInput, UserListQuery } from './users.schema.js'

const USER_INCLUDE = {
  userRoles: {
    include: { role: { select: { id: true, name: true, displayName: true } } },
  },
}

function formatUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.userRoles.map((ur: any) => ur.role),
  }
}

export async function listUsersService(fastify: FastifyInstance, query: UserListQuery) {
  const { page, pageSize, search, status, sortField, sortOrder } = query

  const where: any = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { username: { contains: search } },
      { email: { contains: search } },
      { displayName: { contains: search } },
    ]
  }

  const [total, users] = await fastify.prisma.$transaction([
    fastify.prisma.user.count({ where }),
    fastify.prisma.user.findMany({
      where,
      include: USER_INCLUDE,
      orderBy: { [sortField]: sortOrder },
      ...toSkipTake({ page, pageSize }),
    }),
  ])

  return { users: users.map(formatUser), total }
}

export async function getUserService(fastify: FastifyInstance, id: string) {
  const user = await fastify.prisma.user.findUnique({ where: { id }, include: USER_INCLUDE })
  return user ? formatUser(user) : null
}

export async function createUserService(fastify: FastifyInstance, input: CreateUserInput) {
  const existing = await fastify.prisma.user.findFirst({
    where: { OR: [{ username: input.username }, { email: input.email }] },
  })
  if (existing) {
    throw new Error(existing.username === input.username ? '帳號已存在' : '電子郵件已存在')
  }

  const passwordHash = await hashPassword(input.password)
  const user = await fastify.prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      userRoles: input.roleIds?.length
        ? { create: input.roleIds.map(roleId => ({ roleId })) }
        : undefined,
    },
    include: USER_INCLUDE,
  })

  return formatUser(user)
}

export async function updateUserService(fastify: FastifyInstance, id: string, input: UpdateUserInput) {
  const { roleIds, ...data } = input

  const user = await fastify.prisma.user.update({
    where: { id },
    data,
    include: USER_INCLUDE,
  })

  if (roleIds !== undefined) {
    await fastify.prisma.userRole.deleteMany({ where: { userId: id } })
    if (roleIds.length > 0) {
      await fastify.prisma.userRole.createMany({
        data: roleIds.map(roleId => ({ userId: id, roleId })),
      })
    }
    return formatUser(await fastify.prisma.user.findUnique({ where: { id }, include: USER_INCLUDE })!)
  }

  return formatUser(user)
}

export async function deleteUserService(fastify: FastifyInstance, id: string) {
  await fastify.prisma.user.delete({ where: { id } })
}

export async function updateUserStatusService(fastify: FastifyInstance, id: string, status: 'ACTIVE' | 'INACTIVE' | 'LOCKED') {
  return fastify.prisma.user.update({ where: { id }, data: { status } })
}

export async function updateUserPasswordService(fastify: FastifyInstance, id: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword)
  await fastify.prisma.user.update({ where: { id }, data: { passwordHash } })
}

export async function assignUserRolesService(fastify: FastifyInstance, userId: string, roleIds: string[]) {
  await fastify.prisma.userRole.deleteMany({ where: { userId } })
  if (roleIds.length > 0) {
    await fastify.prisma.userRole.createMany({
      data: roleIds.map(roleId => ({ userId, roleId })),
    })
  }
}

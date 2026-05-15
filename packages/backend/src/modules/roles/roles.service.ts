import type { FastifyInstance } from 'fastify'
import { createActivityLog, type ActivityContext } from '../../utils/activity-log.js'
import type { CreateRoleInput, UpdateRoleInput } from './roles.schema.js'

const ROLE_INCLUDE = {
  rolePermissions: {
    include: { permission: { select: { id: true, code: true, name: true, group: true } } },
  },
  _count: { select: { userRoles: true } },
}

function formatRole(role: any) {
  return {
    id: role.id,
    name: role.name,
    displayName: role.displayName,
    description: role.description,
    isSystem: role.isSystem,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    permissions: role.rolePermissions.map((rp: any) => rp.permission),
    userCount: role._count?.userRoles ?? 0,
  }
}

export async function listRolesService(fastify: FastifyInstance) {
  const roles = await fastify.prisma.role.findMany({
    include: ROLE_INCLUDE,
    orderBy: { createdAt: 'asc' },
  })
  return roles.map(formatRole)
}

export async function getRoleService(fastify: FastifyInstance, id: string) {
  const role = await fastify.prisma.role.findUnique({ where: { id }, include: ROLE_INCLUDE })
  return role ? formatRole(role) : null
}

export async function createRoleService(fastify: FastifyInstance, input: CreateRoleInput, ctx: ActivityContext) {
  const existing = await fastify.prisma.role.findUnique({ where: { name: input.name } })
  if (existing) throw new Error('角色名稱已存在')

  const role = await fastify.prisma.role.create({
    data: {
      name: input.name,
      displayName: input.displayName,
      description: input.description,
      rolePermissions: input.permissionIds?.length
        ? { create: input.permissionIds.map(permissionId => ({ permissionId })) }
        : undefined,
    },
    include: ROLE_INCLUDE,
  })

  const formatted = formatRole(role)
  await createActivityLog(fastify, {
    ctx,
    action: 'CREATE',
    module: 'roles',
    targetId:   role.id,
    targetName: role.name,
    after: formatted as any,
  })

  return formatted
}

export async function updateRoleService(fastify: FastifyInstance, id: string, input: UpdateRoleInput, ctx: ActivityContext) {
  const before = await fastify.prisma.role.findUnique({ where: { id }, include: ROLE_INCLUDE })

  const role = await fastify.prisma.role.update({
    where: { id },
    data: input,
    include: ROLE_INCLUDE,
  })

  const formatted = formatRole(role)
  await createActivityLog(fastify, {
    ctx,
    action: 'UPDATE',
    module: 'roles',
    targetId:   id,
    targetName: role.name,
    before: before ? formatRole(before) as any : null,
    after: formatted as any,
  })

  return formatted
}

export async function deleteRoleService(fastify: FastifyInstance, id: string, ctx: ActivityContext) {
  const role = await fastify.prisma.role.findUnique({ where: { id } })
  if (!role) throw new Error('角色不存在')
  if (role.isSystem) throw new Error('系統角色無法刪除')

  await fastify.prisma.role.delete({ where: { id } })

  await createActivityLog(fastify, {
    ctx,
    action: 'DELETE',
    module: 'roles',
    targetId:   id,
    targetName: role.name,
    before: { id: role.id, name: role.name, displayName: role.displayName },
  })
}

export async function assignRolePermissionsService(fastify: FastifyInstance, roleId: string, permissionIds: string[], ctx: ActivityContext) {
  const before = await fastify.prisma.rolePermission.findMany({
    where: { roleId },
    select: { permissionId: true },
  })
  const beforeIds = before.map(p => p.permissionId)

  await fastify.prisma.rolePermission.deleteMany({ where: { roleId } })
  if (permissionIds.length > 0) {
    await fastify.prisma.rolePermission.createMany({
      data: permissionIds.map(permissionId => ({ roleId, permissionId })),
    })
  }

  const role = await fastify.prisma.role.findUnique({ where: { id: roleId }, select: { name: true } })
  await createActivityLog(fastify, {
    ctx,
    action: 'ASSIGN',
    module: 'roles',
    targetId:   roleId,
    targetName: role?.name,
    before: { permissionIds: beforeIds },
    after:  { permissionIds },
  })
}

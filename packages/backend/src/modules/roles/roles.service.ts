import type { FastifyInstance } from 'fastify'
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

export async function createRoleService(fastify: FastifyInstance, input: CreateRoleInput) {
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
  return formatRole(role)
}

export async function updateRoleService(fastify: FastifyInstance, id: string, input: UpdateRoleInput) {
  const role = await fastify.prisma.role.update({
    where: { id },
    data: input,
    include: ROLE_INCLUDE,
  })
  return formatRole(role)
}

export async function deleteRoleService(fastify: FastifyInstance, id: string) {
  const role = await fastify.prisma.role.findUnique({ where: { id } })
  if (!role) throw new Error('角色不存在')
  if (role.isSystem) throw new Error('系統角色無法刪除')
  await fastify.prisma.role.delete({ where: { id } })
}

export async function assignRolePermissionsService(fastify: FastifyInstance, roleId: string, permissionIds: string[]) {
  await fastify.prisma.rolePermission.deleteMany({ where: { roleId } })
  if (permissionIds.length > 0) {
    await fastify.prisma.rolePermission.createMany({
      data: permissionIds.map(permissionId => ({ roleId, permissionId })),
    })
  }
}

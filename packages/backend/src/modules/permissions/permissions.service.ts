import type { FastifyInstance } from 'fastify'
import { createActivityLog, type ActivityContext } from '../../utils/activity-log.js'
import type { CreatePermissionInput, UpdatePermissionInput } from './permissions.schema.js'

export async function listPermissionsService(fastify: FastifyInstance) {
  const permissions = await fastify.prisma.permission.findMany({
    orderBy: [{ group: 'asc' }, { code: 'asc' }],
  })

  const grouped = permissions.reduce<Record<string, typeof permissions>>((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = []
    acc[perm.group].push(perm)
    return acc
  }, {})

  return Object.entries(grouped).map(([group, perms]) => ({ group, permissions: perms }))
}

export async function createPermissionService(fastify: FastifyInstance, input: CreatePermissionInput, ctx: ActivityContext) {
  const existing = await fastify.prisma.permission.findUnique({ where: { code: input.code } })
  if (existing) throw new Error('權限碼已存在')

  const permission = await fastify.prisma.permission.create({ data: input })
  await createActivityLog(fastify, {
    ctx,
    action: 'CREATE',
    module: 'permissions',
    targetId:   permission.id,
    targetName: permission.code,
    after: { id: permission.id, code: permission.code, name: permission.name, group: permission.group },
  })
  return permission
}

export async function updatePermissionService(fastify: FastifyInstance, id: string, input: UpdatePermissionInput, ctx: ActivityContext) {
  const existing = await fastify.prisma.permission.findUnique({ where: { id } })
  if (!existing) throw new Error('NOT_FOUND')

  const permission = await fastify.prisma.permission.update({ where: { id }, data: input })
  await createActivityLog(fastify, {
    ctx,
    action: 'UPDATE',
    module: 'permissions',
    targetId:   id,
    targetName: permission.code,
    before: { id: existing.id, code: existing.code, name: existing.name, group: existing.group },
    after:  { id: permission.id, code: permission.code, name: permission.name, group: permission.group },
  })
  return permission
}

export async function deletePermissionService(fastify: FastifyInstance, id: string, ctx: ActivityContext) {
  const existing = await fastify.prisma.permission.findUnique({ where: { id } })
  if (!existing) throw new Error('NOT_FOUND')

  const usedCount = await fastify.prisma.rolePermission.count({ where: { permissionId: id } })
  if (usedCount > 0) throw new Error('此權限已被角色使用，請先從角色中移除後再刪除')

  await fastify.prisma.permission.delete({ where: { id } })
  await createActivityLog(fastify, {
    ctx,
    action: 'DELETE',
    module: 'permissions',
    targetId:   id,
    targetName: existing.code,
    before: { id: existing.id, code: existing.code, name: existing.name, group: existing.group },
  })
}

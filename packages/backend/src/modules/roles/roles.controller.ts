import type { FastifyRequest, FastifyReply } from 'fastify'
import { createRoleSchema, updateRoleSchema, assignPermissionsSchema } from './roles.schema.js'
import {
  listRolesService, getRoleService, createRoleService, updateRoleService,
  deleteRoleService, assignRolePermissionsService,
} from './roles.service.js'
import { ok, err } from '../../utils/response.js'
import { extractActivityContext } from '../../utils/activity-log.js'

export async function listRoles(request: FastifyRequest, reply: FastifyReply) {
  const roles = await listRolesService(request.server)
  return reply.send(ok(roles))
}

export async function getRole(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const role = await getRoleService(request.server, request.params.id)
  if (!role) return reply.status(404).send(err('角色不存在', 'NOT_FOUND'))
  return reply.send(ok(role))
}

export async function createRole(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createRoleSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))

  try {
    const role = await createRoleService(request.server, parsed.data, extractActivityContext(request))
    return reply.status(201).send(ok(role, '角色建立成功'))
  } catch (e: unknown) {
    return reply.status(409).send(err(e instanceof Error ? e.message : '建立失敗', 'CONFLICT'))
  }
}

export async function updateRole(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const parsed = updateRoleSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))

  const role = await updateRoleService(request.server, request.params.id, parsed.data, extractActivityContext(request))
  return reply.send(ok(role, '更新成功'))
}

export async function deleteRole(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await deleteRoleService(request.server, request.params.id, extractActivityContext(request))
    return reply.send(ok(null, '刪除成功'))
  } catch (e: unknown) {
    return reply.status(400).send(err(e instanceof Error ? e.message : '刪除失敗', 'FORBIDDEN'))
  }
}

export async function assignRolePermissions(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const parsed = assignPermissionsSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))

  await assignRolePermissionsService(request.server, request.params.id, parsed.data.permissionIds, extractActivityContext(request))
  return reply.send(ok(null, '權限指派成功'))
}

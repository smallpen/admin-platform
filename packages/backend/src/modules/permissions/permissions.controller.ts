import type { FastifyRequest, FastifyReply } from 'fastify'
import { listPermissionsService, createPermissionService, updatePermissionService, deletePermissionService } from './permissions.service.js'
import { createPermissionSchema, updatePermissionSchema } from './permissions.schema.js'
import { ok, err } from '../../utils/response.js'
import { extractActivityContext } from '../../utils/activity-log.js'

export async function listPermissions(request: FastifyRequest, reply: FastifyReply) {
  const groups = await listPermissionsService(request.server)
  return reply.send(ok(groups))
}

export async function createPermission(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createPermissionSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))

  try {
    const permission = await createPermissionService(request.server, parsed.data, extractActivityContext(request))
    return reply.status(201).send(ok(permission, '權限建立成功'))
  } catch (e: unknown) {
    return reply.status(409).send(err(e instanceof Error ? e.message : '建立失敗', 'CONFLICT'))
  }
}

export async function updatePermission(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const parsed = updatePermissionSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))

  try {
    const permission = await updatePermissionService(request.server, request.params.id, parsed.data, extractActivityContext(request))
    return reply.send(ok(permission, '權限更新成功'))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '更新失敗'
    if (msg === 'NOT_FOUND') return reply.status(404).send(err('權限不存在', 'NOT_FOUND'))
    return reply.status(400).send(err(msg, 'BAD_REQUEST'))
  }
}

export async function deletePermission(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await deletePermissionService(request.server, request.params.id, extractActivityContext(request))
    return reply.send(ok(null, '權限刪除成功'))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '刪除失敗'
    if (msg === 'NOT_FOUND') return reply.status(404).send(err('權限不存在', 'NOT_FOUND'))
    return reply.status(409).send(err(msg, 'CONFLICT'))
  }
}

import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createUserSchema, updateUserSchema, updateStatusSchema,
  updatePasswordSchema, assignRolesSchema, userListQuerySchema,
} from './users.schema.js'
import {
  listUsersService, getUserService, createUserService, updateUserService,
  deleteUserService, updateUserStatusService, updateUserPasswordService,
  assignUserRolesService,
} from './users.service.js'
import { ok, paginated, buildPagination, err } from '../../utils/response.js'
import { extractActivityContext } from '../../utils/activity-log.js'

export async function listUsers(request: FastifyRequest, reply: FastifyReply) {
  const parsed = userListQuerySchema.safeParse(request.query)
  if (!parsed.success) return reply.status(400).send(err('查詢參數錯誤', 'VALIDATION_ERROR'))

  const { users, total } = await listUsersService(request.server, parsed.data)
  const { page, pageSize } = parsed.data
  return reply.send(paginated(users, buildPagination(total, page, pageSize)))
}

export async function getUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const user = await getUserService(request.server, request.params.id)
  if (!user) return reply.status(404).send(err('使用者不存在', 'NOT_FOUND'))
  return reply.send(ok(user))
}

export async function createUser(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createUserSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))

  try {
    const user = await createUserService(request.server, parsed.data, extractActivityContext(request))
    return reply.status(201).send(ok(user, '使用者建立成功'))
  } catch (e: unknown) {
    return reply.status(409).send(err(e instanceof Error ? e.message : '建立失敗', 'CONFLICT'))
  }
}

export async function updateUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const parsed = updateUserSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))

  const user = await updateUserService(request.server, request.params.id, parsed.data, extractActivityContext(request))
  return reply.send(ok(user, '更新成功'))
}

export async function deleteUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  if (request.params.id === request.currentUser.id) {
    return reply.status(400).send(err('不能刪除自己的帳號', 'FORBIDDEN'))
  }
  await deleteUserService(request.server, request.params.id, extractActivityContext(request))
  return reply.send(ok(null, '刪除成功'))
}

export async function updateUserStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const parsed = updateStatusSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))

  await updateUserStatusService(request.server, request.params.id, parsed.data.status, extractActivityContext(request))
  return reply.send(ok(null, '狀態更新成功'))
}

export async function updateUserPassword(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const parsed = updatePasswordSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))

  await updateUserPasswordService(request.server, request.params.id, parsed.data.newPassword, extractActivityContext(request))
  return reply.send(ok(null, '密碼更新成功'))
}

export async function assignUserRoles(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const parsed = assignRolesSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))

  await assignUserRolesService(request.server, request.params.id, parsed.data.roleIds, extractActivityContext(request))
  return reply.send(ok(null, '角色指派成功'))
}

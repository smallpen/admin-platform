import type { FastifyRequest, FastifyReply } from 'fastify'
import { ok, err, paginated, buildPagination } from '../../utils/response.js'
import { extractActivityContext } from '../../utils/activity-log.js'
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  listAnnouncementsSchema,
} from './announcements.schema.js'
import {
  listAnnouncementsService,
  getActiveAnnouncementsService,
  createAnnouncementService,
  updateAnnouncementService,
  deleteAnnouncementService,
  markAsReadService,
  markAllAsReadService,
} from './announcements.service.js'

export async function listAnnouncementsController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listAnnouncementsSchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.status(400).send(err('參數錯誤', 'VALIDATION_ERROR'))
  }
  const result = await listAnnouncementsService(request.server, parsed.data)
  return reply.send({
    success: true,
    data: result.data,
    pagination: result.pagination,
  })
}

export async function getActiveController(request: FastifyRequest, reply: FastifyReply) {
  const list = await getActiveAnnouncementsService(request.server, request.currentUser.id)
  return reply.send(ok(list))
}

export async function createAnnouncementController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createAnnouncementSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))
  }
  const ctx = extractActivityContext(request)
  const announcement = await createAnnouncementService(request.server, parsed.data, request.currentUser.id, ctx)
  return reply.status(201).send(ok(announcement, '公告建立成功'))
}

export async function updateAnnouncementController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const parsed = updateAnnouncementSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))
  }
  const ctx = extractActivityContext(request)
  const result = await updateAnnouncementService(request.server, request.params.id, parsed.data, ctx)
  if (!result) return reply.status(404).send(err('公告不存在', 'NOT_FOUND'))
  return reply.send(ok(result, '公告更新成功'))
}

export async function deleteAnnouncementController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const ctx = extractActivityContext(request)
  const ok_ = await deleteAnnouncementService(request.server, request.params.id, ctx)
  if (!ok_) return reply.status(404).send(err('公告不存在', 'NOT_FOUND'))
  return reply.send(ok(null, '公告已刪除'))
}

export async function markAsReadController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  await markAsReadService(request.server, request.currentUser.id, request.params.id)
  return reply.status(204).send()
}

export async function markAllAsReadController(request: FastifyRequest, reply: FastifyReply) {
  await markAllAsReadService(request.server, request.currentUser.id)
  return reply.send(ok(null, '全部已讀'))
}

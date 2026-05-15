import type { FastifyRequest, FastifyReply } from 'fastify'
import { createAdSchema, updateAdSchema, adListQuerySchema } from './ads.schema.js'
import {
  listAdsService, getAdService, getAdImageService,
  createAdService, updateAdService, deleteAdService,
} from './ads.service.js'
import { ok, paginated, buildPagination, err } from '../../utils/response.js'
import { extractActivityContext } from '../../utils/activity-log.js'

export async function listAds(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adListQuerySchema.safeParse(request.query)
  if (!parsed.success) return reply.status(400).send(err('查詢參數錯誤', 'VALIDATION_ERROR'))

  const { ads, total } = await listAdsService(request.server, parsed.data)
  const { page, pageSize } = parsed.data
  return reply.send(paginated(ads, buildPagination(total, page, pageSize)))
}

export async function getAd(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const ad = await getAdService(request.server, request.params.id)
  if (!ad) return reply.status(404).send(err('廣告不存在', 'NOT_FOUND'))
  return reply.send(ok(ad))
}

export async function getAdImage(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const result = await getAdImageService(request.server, request.params.id)
  if (!result) return reply.status(404).send(err('廣告不存在', 'NOT_FOUND'))

  reply.header('Content-Type', result.mimeType)
  reply.header('Cache-Control', 'public, max-age=86400')
  return reply.send(result.imageData)
}

export async function createAd(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createAdSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))

  const ad = await createAdService(request.server, parsed.data, extractActivityContext(request))
  return reply.status(201).send(ok(ad, '廣告建立成功'))
}

export async function updateAd(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const parsed = updateAdSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))

  try {
    const ad = await updateAdService(request.server, request.params.id, parsed.data, extractActivityContext(request))
    return reply.send(ok(ad, '更新成功'))
  } catch {
    return reply.status(404).send(err('廣告不存在', 'NOT_FOUND'))
  }
}

export async function deleteAd(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await deleteAdService(request.server, request.params.id, extractActivityContext(request))
    return reply.send(ok(null, '刪除成功'))
  } catch {
    return reply.status(404).send(err('廣告不存在', 'NOT_FOUND'))
  }
}

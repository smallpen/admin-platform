import type { FastifyRequest, FastifyReply } from 'fastify'
import { ok, paginated, err } from '../../utils/response.js'
import {
  createProxyApiSchema, updateProxyApiSchema, proxyApiListQuerySchema,
  createApiKeySchema, apiLogListQuerySchema,
} from './proxy-admin.schema.js'
import {
  listProxyApisService, getProxyApiService, createProxyApiService,
  updateProxyApiService, deleteProxyApiService,
  listApiKeysService, createApiKeyService, toggleApiKeyService, deleteApiKeyService,
  listApiLogsService,
  listStoredProceduresService, getSpParamsService,
} from './proxy-admin.service.js'
import { extractActivityContext } from '../../utils/activity-log.js'

// ── SP discovery ──

export async function listStoredProcedures(request: FastifyRequest, reply: FastifyReply) {
  const list = await listStoredProceduresService(request.server)
  return reply.send(ok(list))
}

export async function getSpParams(request: FastifyRequest<{ Params: { spName: string } }>, reply: FastifyReply) {
  const { spName } = request.params
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(spName)) {
    return reply.status(400).send(err('SP 名稱格式不正確', 'VALIDATION_ERROR'))
  }
  const params = await getSpParamsService(request.server, spName)
  return reply.send(ok(params))
}

// ── Proxy APIs ──

export async function listProxyApis(request: FastifyRequest, reply: FastifyReply) {
  const parsed = proxyApiListQuerySchema.safeParse(request.query)
  if (!parsed.success) return reply.status(400).send(err('查詢參數錯誤', 'VALIDATION_ERROR'))
  const { apis, pagination } = await listProxyApisService(request.server, parsed.data)
  return reply.send(paginated(apis, pagination))
}

export async function getProxyApi(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const api = await getProxyApiService(request.server, request.params.id)
    return reply.send(ok(api))
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return reply.status(404).send(err('API 不存在', 'NOT_FOUND'))
    throw e
  }
}

export async function createProxyApi(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createProxyApiSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))
  try {
    const api = await createProxyApiService(request.server, parsed.data as any, extractActivityContext(request))
    return reply.status(201).send(ok(api, 'API 建立成功'))
  } catch (e: any) {
    return reply.status(409).send(err(e.message, 'CONFLICT'))
  }
}

export async function updateProxyApi(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const parsed = updateProxyApiSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))
  try {
    const api = await updateProxyApiService(request.server, request.params.id, parsed.data as any, extractActivityContext(request))
    return reply.send(ok(api, '更新成功'))
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return reply.status(404).send(err('API 不存在', 'NOT_FOUND'))
    return reply.status(409).send(err(e.message, 'CONFLICT'))
  }
}

export async function deleteProxyApi(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await deleteProxyApiService(request.server, request.params.id, extractActivityContext(request))
    return reply.send(ok(null, '刪除成功'))
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return reply.status(404).send(err('API 不存在', 'NOT_FOUND'))
    throw e
  }
}

// ── API Keys ──

export async function listApiKeys(request: FastifyRequest, reply: FastifyReply) {
  const keys = await listApiKeysService(request.server)
  return reply.send(ok(keys))
}

export async function createApiKey(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createApiKeySchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))
  const result = await createApiKeyService(request.server, parsed.data, request.currentUser.id, extractActivityContext(request))
  return reply.status(201).send(ok(result, 'API Key 建立成功'))
}

export async function toggleApiKey(request: FastifyRequest<{ Params: { id: string }; Body: { isActive: boolean } }>, reply: FastifyReply) {
  if (typeof request.body?.isActive !== 'boolean') {
    return reply.status(400).send(err('isActive 必須為布林值', 'VALIDATION_ERROR'))
  }
  try {
    const key = await toggleApiKeyService(request.server, request.params.id, request.body.isActive, extractActivityContext(request))
    return reply.send(ok(key, '更新成功'))
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return reply.status(404).send(err('API Key 不存在', 'NOT_FOUND'))
    throw e
  }
}

export async function deleteApiKey(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await deleteApiKeyService(request.server, request.params.id, extractActivityContext(request))
    return reply.send(ok(null, '刪除成功'))
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return reply.status(404).send(err('API Key 不存在', 'NOT_FOUND'))
    throw e
  }
}

// ── API Logs ──

export async function listApiLogs(request: FastifyRequest, reply: FastifyReply) {
  const parsed = apiLogListQuerySchema.safeParse(request.query)
  if (!parsed.success) return reply.status(400).send(err('查詢參數錯誤', 'VALIDATION_ERROR'))
  const { logs, pagination } = await listApiLogsService(request.server, parsed.data)
  return reply.send(paginated(logs, pagination))
}

import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyJWT } from '../../middleware/auth.middleware.js'
import { err } from '../../utils/response.js'
import { findApiKeyByRaw, executeProxyApiService } from './proxy-execute.service.js'

function getCallerIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for']
  if (forwarded) return String(forwarded).split(',')[0].trim()
  return request.ip ?? 'unknown'
}

function getInputParams(request: FastifyRequest): Record<string, any> {
  const body   = (request.body   && typeof request.body   === 'object') ? request.body   : {}
  const query  = (request.query  && typeof request.query  === 'object') ? request.query  : {}
  return { ...query, ...body }
}

export async function executeProxy(
  request: FastifyRequest<{ Params: { apiPath: string } }>,
  reply: FastifyReply,
) {
  const apiPath = request.params.apiPath
  const method  = request.method.toUpperCase()

  // Load the ProxyApi config to decide auth
  const api = await request.server.prisma.proxyApi.findFirst({
    where: { path: apiPath, method, isActive: true },
  })

  if (!api) {
    return reply.status(404).send(err('API 不存在或已停用', 'NOT_FOUND'))
  }

  let apiKeyId: string | undefined

  if (api.authType === 'JWT') {
    try {
      await verifyJWT(request, reply)
    } catch {
      return reply.status(401).send(err('認證失敗，請提供有效的 JWT Token', 'UNAUTHORIZED'))
    }
  } else if (api.authType === 'API_KEY') {
    const rawKey = (request.headers['x-api-key'] as string) ?? (request.query as any)?.api_key
    if (!rawKey) return reply.status(401).send(err('請提供 API Key', 'UNAUTHORIZED'))
    const apiKey = await findApiKeyByRaw(request.server, rawKey)
    if (!apiKey) return reply.status(401).send(err('API Key 無效或已停用', 'UNAUTHORIZED'))
    const allowed = apiKey.allowedApis as unknown as string[]
    if (!allowed.includes('*') && !allowed.includes(apiPath)) {
      return reply.status(403).send(err('此 API Key 無權存取此端點', 'FORBIDDEN'))
    }
    apiKeyId = apiKey.id
  } else if (api.authType === 'BOTH') {
    const rawKey = (request.headers['x-api-key'] as string) ?? (request.query as any)?.api_key
    if (rawKey) {
      const apiKey = await findApiKeyByRaw(request.server, rawKey)
      if (!apiKey) return reply.status(401).send(err('API Key 無效或已停用', 'UNAUTHORIZED'))
      const allowed = apiKey.allowedApis as unknown as string[]
      if (!allowed.includes('*') && !allowed.includes(apiPath)) {
        return reply.status(403).send(err('此 API Key 無權存取此端點', 'FORBIDDEN'))
      }
      apiKeyId = apiKey.id
    } else {
      try {
        await verifyJWT(request, reply)
      } catch {
        return reply.status(401).send(err('請提供有效的 JWT Token 或 API Key', 'UNAUTHORIZED'))
      }
    }
  }
  // authType === 'NONE': no auth needed

  try {
    const inputParams = getInputParams(request)
    const result = await executeProxyApiService(
      request.server,
      apiPath,
      method,
      inputParams,
      apiKeyId,
      getCallerIp(request),
    )
    return reply.send({ success: true, ...result })
  } catch (e: any) {
    const status = e.statusCode ?? 500
    return reply.status(status).send({ success: false, error: { code: e.code ?? 'ERROR', message: e.message } })
  }
}

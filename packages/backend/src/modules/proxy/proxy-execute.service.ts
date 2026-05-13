import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'

export interface ParamMapping {
  inputName:    string
  spParamName:  string
  type:         'string' | 'int' | 'decimal' | 'boolean' | 'datetime'
  required:     boolean
  defaultValue?: string
  description?: string
}

function castParam(value: any, type: ParamMapping['type']): any {
  if (value === null || value === undefined) return null
  switch (type) {
    case 'int':      return Number.isInteger(value) ? value : parseInt(String(value), 10)
    case 'decimal':  return parseFloat(String(value))
    case 'boolean':  return value === true || value === 'true' || value === '1'
    case 'datetime': return new Date(String(value))
    default:         return String(value)
  }
}

export async function findApiKeyByRaw(fastify: FastifyInstance, rawKey: string) {
  const hash = createHash('sha256').update(rawKey).digest('hex')
  const apiKey = await fastify.prisma.apiKey.findUnique({ where: { keyHash: hash } })
  if (!apiKey || !apiKey.isActive) return null
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null
  return apiKey
}

export async function executeProxyApiService(
  fastify: FastifyInstance,
  apiPath: string,
  method: string,
  inputParams: Record<string, any>,
  apiKeyId?: string,
  callerIp?: string,
) {
  const start = Date.now()

  const api = await fastify.prisma.proxyApi.findFirst({
    where: { path: apiPath, method, isActive: true },
  })

  if (!api) {
    throw { statusCode: 404, code: 'NOT_FOUND', message: 'API 不存在或已停用' }
  }

  const mappings = api.paramMappings as unknown as ParamMapping[]
  const spParams: any[] = []

  for (const m of mappings) {
    const val = inputParams[m.inputName]
    if (m.required && (val === undefined || val === null || val === '')) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: `缺少必填參數: ${m.inputName}` }
    }
    spParams.push(castParam(val ?? m.defaultValue, m.type))
  }

  let result: any = null
  let errorMsg: string | undefined
  let responseCode = 200

  try {
    const placeholders = spParams.map(() => '?').join(', ')
    const rows = await fastify.prisma.$queryRawUnsafe(
      `CALL \`${api.storedProcedure}\`(${placeholders})`,
      ...spParams,
    )
    result = rows
  } catch (e: any) {
    errorMsg = e.message ?? String(e)
    responseCode = 500
    const durationMs = Date.now() - start

    await fastify.prisma.apiCallLog.create({
      data: {
        apiId: api.id,
        apiKeyId: apiKeyId ?? null,
        callerIp: callerIp ?? 'unknown',
        requestBody: inputParams,
        responseCode,
        durationMs,
        errorMsg,
      },
    }).catch(() => {})

    throw { statusCode: 500, code: 'SP_ERROR', message: errorMsg }
  }

  const durationMs = Date.now() - start

  await fastify.prisma.apiCallLog.create({
    data: {
      apiId: api.id,
      apiKeyId: apiKeyId ?? null,
      callerIp: callerIp ?? 'unknown',
      requestBody: inputParams,
      responseCode,
      durationMs,
    },
  }).catch(() => {})

  if (apiKeyId) {
    await fastify.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    }).catch(() => {})
  }

  return { data: result, meta: { api: apiPath, durationMs } }
}

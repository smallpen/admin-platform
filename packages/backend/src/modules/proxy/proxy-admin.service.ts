import type { FastifyInstance } from 'fastify'
import { createHash, randomBytes } from 'crypto'
import { buildPagination } from '../../utils/response.js'
import { createActivityLog, type ActivityContext } from '../../utils/activity-log.js'

export interface ProxyApiListQuery {
  page: number
  pageSize: number
  search?: string
  isActive?: string
}

export interface CreateProxyApiInput {
  name: string
  path: string
  method: string
  description?: string
  storedProcedure: string
  paramMappings: object[]
  requireAuth: boolean
  authType: string
  isActive: boolean
}

export interface CreateApiKeyInput {
  name: string
  allowedApis: string[]
  expiresAt?: string
}

export interface ApiLogListQuery {
  page: number
  pageSize: number
  apiId?: string
  responseCode?: number
  dateFrom?: string
  dateTo?: string
}

function formatProxyApi(api: any) {
  return {
    id:              api.id,
    name:            api.name,
    path:            api.path,
    method:          api.method,
    description:     api.description,
    storedProcedure: api.storedProcedure,
    paramMappings:   api.paramMappings,
    requireAuth:     api.requireAuth,
    authType:        api.authType,
    isActive:        api.isActive,
    createdAt:       api.createdAt,
    updatedAt:       api.updatedAt,
  }
}

function formatApiKey(key: any) {
  return {
    id:          key.id,
    name:        key.name,
    keyPrefix:   key.keyPrefix,
    allowedApis: key.allowedApis,
    isActive:    key.isActive,
    expiresAt:   key.expiresAt,
    lastUsedAt:  key.lastUsedAt,
    createdAt:   key.createdAt,
    updatedAt:   key.updatedAt,
  }
}

// ── MySQL type → our type mapping ──
function mapMysqlType(dataType: string, dtdIdentifier: string): 'string' | 'int' | 'decimal' | 'boolean' | 'datetime' {
  const t = dataType.toLowerCase()
  if (['varchar', 'char', 'text', 'tinytext', 'mediumtext', 'longtext', 'enum', 'set', 'json'].includes(t)) return 'string'
  if (['bigint', 'smallint', 'mediumint'].includes(t)) return 'int'
  if (t === 'int') return 'int'
  if (t === 'tinyint') return dtdIdentifier.toLowerCase().includes('(1)') ? 'boolean' : 'int'
  if (['bool', 'boolean'].includes(t)) return 'boolean'
  if (['decimal', 'float', 'double', 'numeric', 'real'].includes(t)) return 'decimal'
  if (['datetime', 'timestamp', 'date', 'time'].includes(t)) return 'datetime'
  return 'string'
}

// ── SP discovery ──

export async function listStoredProceduresService(fastify: FastifyInstance) {
  const rows = await fastify.prisma.$queryRawUnsafe<{ spName: string }[]>(
    `SELECT ROUTINE_NAME AS spName
     FROM INFORMATION_SCHEMA.ROUTINES
     WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE'
     ORDER BY ROUTINE_NAME`,
  )
  return rows.map(r => r.spName)
}

export async function getSpParamsService(fastify: FastifyInstance, spName: string) {
  const rows = await fastify.prisma.$queryRawUnsafe<{
    paramName:    string
    dataType:     string
    dtdId:        string
    ordinalPos:   number
  }[]>(
    `SELECT
       PARAMETER_NAME   AS paramName,
       DATA_TYPE        AS dataType,
       DTD_IDENTIFIER   AS dtdId,
       ORDINAL_POSITION AS ordinalPos
     FROM INFORMATION_SCHEMA.PARAMETERS
     WHERE SPECIFIC_SCHEMA = DATABASE()
       AND SPECIFIC_NAME   = ?
       AND PARAMETER_MODE  = 'IN'
     ORDER BY ORDINAL_POSITION`,
    spName,
  )

  return rows.map(p => ({
    inputName:    p.paramName,
    spParamName:  '@' + p.paramName,
    type:         mapMysqlType(p.dataType, p.dtdId),
    required:     true,
    defaultValue: '',
    description:  `${p.dtdId}`,
  }))
}

// ── Proxy API CRUD ──

export async function listProxyApisService(fastify: FastifyInstance, query: ProxyApiListQuery) {
  const { page, pageSize, search, isActive } = query
  const where: any = {}
  if (isActive !== undefined) where.isActive = isActive === 'true'
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { path: { contains: search } },
      { storedProcedure: { contains: search } },
    ]
  }

  const [total, apis] = await fastify.prisma.$transaction([
    fastify.prisma.proxyApi.count({ where }),
    fastify.prisma.proxyApi.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return { apis: apis.map(formatProxyApi), pagination: buildPagination(total, page, pageSize) }
}

export async function getProxyApiService(fastify: FastifyInstance, id: string) {
  const api = await fastify.prisma.proxyApi.findUnique({ where: { id } })
  if (!api) throw new Error('NOT_FOUND')
  return formatProxyApi(api)
}

export async function createProxyApiService(fastify: FastifyInstance, input: CreateProxyApiInput, ctx: ActivityContext) {
  const existing = await fastify.prisma.proxyApi.findUnique({ where: { path: input.path } })
  if (existing) throw new Error('此 API 路徑已存在')

  const api = await fastify.prisma.proxyApi.create({ data: input as any })
  const formatted = formatProxyApi(api)

  await createActivityLog(fastify, {
    ctx,
    action: 'CREATE',
    module: 'proxy_api',
    targetId:   api.id,
    targetName: api.name,
    after: formatted as any,
  })

  return formatted
}

export async function updateProxyApiService(fastify: FastifyInstance, id: string, input: Partial<CreateProxyApiInput>, ctx: ActivityContext) {
  const existing = await fastify.prisma.proxyApi.findUnique({ where: { id } })
  if (!existing) throw new Error('NOT_FOUND')

  if (input.path && input.path !== existing.path) {
    const pathConflict = await fastify.prisma.proxyApi.findUnique({ where: { path: input.path } })
    if (pathConflict) throw new Error('此 API 路徑已存在')
  }

  const api = await fastify.prisma.proxyApi.update({ where: { id }, data: input as any })
  const formatted = formatProxyApi(api)

  await createActivityLog(fastify, {
    ctx,
    action: 'UPDATE',
    module: 'proxy_api',
    targetId:   id,
    targetName: api.name,
    before: formatProxyApi(existing) as any,
    after: formatted as any,
  })

  return formatted
}

export async function deleteProxyApiService(fastify: FastifyInstance, id: string, ctx: ActivityContext) {
  const existing = await fastify.prisma.proxyApi.findUnique({ where: { id } })
  if (!existing) throw new Error('NOT_FOUND')

  await fastify.prisma.proxyApi.delete({ where: { id } })

  await createActivityLog(fastify, {
    ctx,
    action: 'DELETE',
    module: 'proxy_api',
    targetId:   id,
    targetName: existing.name,
    before: formatProxyApi(existing) as any,
  })
}

// ── API Key CRUD ──

export function generateApiKey() {
  const raw = 'pk_' + randomBytes(32).toString('hex')
  const hash = createHash('sha256').update(raw).digest('hex')
  const prefix = raw.slice(0, 10)
  return { raw, hash, prefix }
}

export async function listApiKeysService(fastify: FastifyInstance) {
  const keys = await fastify.prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } })
  return keys.map(formatApiKey)
}

export async function createApiKeyService(fastify: FastifyInstance, input: CreateApiKeyInput, userId: string, ctx: ActivityContext) {
  const { raw, hash, prefix } = generateApiKey()

  const key = await fastify.prisma.apiKey.create({
    data: {
      name:        input.name,
      keyHash:     hash,
      keyPrefix:   prefix,
      allowedApis: input.allowedApis,
      expiresAt:   input.expiresAt ? new Date(input.expiresAt) : null,
      createdBy:   userId,
    },
  })

  await createActivityLog(fastify, {
    ctx,
    action: 'CREATE',
    module: 'api_key',
    targetId:   key.id,
    targetName: key.name,
    after: formatApiKey(key) as any,
  })

  return { ...formatApiKey(key), rawKey: raw }
}

export async function toggleApiKeyService(fastify: FastifyInstance, id: string, isActive: boolean, ctx: ActivityContext) {
  const existing = await fastify.prisma.apiKey.findUnique({ where: { id } })
  if (!existing) throw new Error('NOT_FOUND')

  const key = await fastify.prisma.apiKey.update({ where: { id }, data: { isActive } })

  await createActivityLog(fastify, {
    ctx,
    action: 'UPDATE',
    module: 'api_key',
    targetId:   id,
    targetName: key.name,
    before: { isActive: existing.isActive },
    after:  { isActive },
  })

  return formatApiKey(key)
}

export async function deleteApiKeyService(fastify: FastifyInstance, id: string, ctx: ActivityContext) {
  const existing = await fastify.prisma.apiKey.findUnique({ where: { id } })
  if (!existing) throw new Error('NOT_FOUND')

  await fastify.prisma.apiKey.delete({ where: { id } })

  await createActivityLog(fastify, {
    ctx,
    action: 'DELETE',
    module: 'api_key',
    targetId:   id,
    targetName: existing.name,
    before: formatApiKey(existing) as any,
  })
}

// ── API Call Logs ──

export async function listApiLogsService(fastify: FastifyInstance, query: ApiLogListQuery) {
  const { page, pageSize, apiId, responseCode, dateFrom, dateTo } = query
  const where: any = {}
  if (apiId) where.apiId = apiId
  if (responseCode) where.responseCode = responseCode
  if (dateFrom || dateTo) {
    where.calledAt = {}
    if (dateFrom) where.calledAt.gte = new Date(dateFrom)
    if (dateTo) where.calledAt.lte = new Date(dateTo)
  }

  const [total, logs] = await fastify.prisma.$transaction([
    fastify.prisma.apiCallLog.count({ where }),
    fastify.prisma.apiCallLog.findMany({
      where,
      include: {
        proxyApi: { select: { id: true, name: true, path: true } },
        apiKey:   { select: { id: true, name: true, keyPrefix: true } },
      },
      orderBy: { calledAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return { logs, pagination: buildPagination(total, page, pageSize) }
}

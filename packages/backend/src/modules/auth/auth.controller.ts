import type { FastifyRequest, FastifyReply } from 'fastify'
import { loginSchema, refreshSchema } from './auth.schema.js'
import { loginService, refreshService, logoutService, getMeService } from './auth.service.js'
import { ok, err } from '../../utils/response.js'

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = loginSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))
  }

  try {
    const result = await loginService(request.server, parsed.data.username, parsed.data.password)
    if (!result) {
      return reply.status(401).send(err('帳號或密碼錯誤', 'INVALID_CREDENTIALS'))
    }
    return reply.send(ok(result, '登入成功'))
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'MAINTENANCE_MODE') {
      return reply.status(503).send(err('系統目前正在維護中，請稍後再試', 'MAINTENANCE_MODE'))
    }
    const message = e instanceof Error ? e.message : '登入失敗'
    return reply.status(403).send(err(message, 'ACCOUNT_RESTRICTED'))
  }
}

export async function refreshController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = refreshSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(400).send(err('缺少 refreshToken', 'VALIDATION_ERROR'))
  }

  const result = await refreshService(request.server, parsed.data.refreshToken)
  if (!result) {
    return reply.status(401).send(err('refreshToken 無效或已過期', 'INVALID_TOKEN'))
  }

  return reply.send(ok(result))
}

export async function logoutController(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as { refreshToken?: string }
  if (body?.refreshToken) {
    await logoutService(request.server, body.refreshToken)
  }
  return reply.send(ok(null, '已登出'))
}

export async function meController(request: FastifyRequest, reply: FastifyReply) {
  const user = await getMeService(request.server, request.currentUser.id)
  if (!user) {
    return reply.status(404).send(err('使用者不存在', 'NOT_FOUND'))
  }
  return reply.send(ok(user))
}

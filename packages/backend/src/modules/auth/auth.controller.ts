import type { FastifyRequest, FastifyReply } from 'fastify'
import { loginSchema, refreshSchema, updateMeSchema, updateMyPasswordSchema } from './auth.schema.js'
import { loginService, refreshService, logoutService, getMeService, updateMeService, updateMyPasswordService } from './auth.service.js'
import { ok, err } from '../../utils/response.js'
import { createActivityLog, extractActivityContext } from '../../utils/activity-log.js'

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

    await createActivityLog(request.server, {
      ctx: { userId: result.user.id, ipAddress: request.ip, userAgent: request.headers['user-agent'] },
      action: 'LOGIN',
      module: 'auth',
      targetName: result.user.username,
    })

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

  if (request.currentUser?.id) {
    await createActivityLog(request.server, {
      ctx: { userId: request.currentUser.id, ipAddress: request.ip, userAgent: request.headers['user-agent'] },
      action: 'LOGOUT',
      module: 'auth',
    })
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

export async function updateMeController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = updateMeSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))
  }

  try {
    const ctx = extractActivityContext(request)
    const result = await updateMeService(request.server, request.currentUser.id, parsed.data, ctx)
    if (!result) {
      return reply.status(404).send(err('使用者不存在', 'NOT_FOUND'))
    }
    return reply.send(ok(result, '個人資料更新成功'))
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'EMAIL_CONFLICT') {
      return reply.status(409).send(err('電子郵件已被使用', 'CONFLICT'))
    }
    return reply.status(500).send(err('更新失敗', 'INTERNAL_ERROR'))
  }
}

export async function updateMyPasswordController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = updateMyPasswordSchema.safeParse(request.body)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message || '請求資料格式錯誤'
    return reply.status(400).send(err(msg, 'VALIDATION_ERROR'))
  }

  try {
    const ctx = extractActivityContext(request)
    await updateMyPasswordService(
      request.server,
      request.currentUser.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
      ctx,
    )
    return reply.send(ok(null, '密碼更新成功'))
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'INVALID_CURRENT_PASSWORD') {
      return reply.status(400).send(err('目前密碼不正確', 'INVALID_PASSWORD'))
    }
    return reply.status(500).send(err('更新失敗', 'INTERNAL_ERROR'))
  }
}

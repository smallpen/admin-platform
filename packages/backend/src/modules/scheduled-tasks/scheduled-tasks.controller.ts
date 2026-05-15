import type { FastifyRequest, FastifyReply } from 'fastify'
import { ok, err } from '../../utils/response.js'
import { extractActivityContext } from '../../utils/activity-log.js'
import { updateScheduledTaskSchema } from './scheduled-tasks.schema.js'
import {
  listScheduledTasksService,
  updateScheduledTaskService,
  triggerScheduledTaskService,
} from './scheduled-tasks.service.js'

export async function listScheduledTasksController(request: FastifyRequest, reply: FastifyReply) {
  const tasks = await listScheduledTasksService(request.server)
  return reply.send(ok(tasks))
}

export async function updateScheduledTaskController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const parsed = updateScheduledTaskSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(400).send(err('請求資料格式錯誤', 'VALIDATION_ERROR'))
  }

  try {
    const ctx = extractActivityContext(request)
    const result = await updateScheduledTaskService(request.server, request.params.id, parsed.data, ctx)
    if (!result) return reply.status(404).send(err('排程任務不存在', 'NOT_FOUND'))
    return reply.send(ok(result, '排程任務已更新'))
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'INVALID_CRON') {
      return reply.status(400).send(err('Cron 表達式格式錯誤', 'INVALID_CRON'))
    }
    throw e
  }
}

export async function triggerScheduledTaskController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const ctx = extractActivityContext(request)
  try {
    const result = await triggerScheduledTaskService(request.server, request.params.id, ctx)
    if (!result) return reply.status(404).send(err('排程任務不存在', 'NOT_FOUND'))
    return reply.send(ok(result, result.lastMessage ?? '執行完成'))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '執行失敗'
    return reply.status(500).send(err(msg, 'TASK_FAILED'))
  }
}

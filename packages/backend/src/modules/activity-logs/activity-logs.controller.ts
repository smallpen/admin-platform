import type { FastifyRequest, FastifyReply } from 'fastify'
import { activityLogListQuerySchema } from './activity-logs.schema.js'
import { listActivityLogsService } from './activity-logs.service.js'
import { paginated, buildPagination, err } from '../../utils/response.js'

export async function listActivityLogs(request: FastifyRequest, reply: FastifyReply) {
  const parsed = activityLogListQuerySchema.safeParse(request.query)
  if (!parsed.success) return reply.status(400).send(err('查詢參數錯誤', 'VALIDATION_ERROR'))

  const { logs, total } = await listActivityLogsService(request.server, parsed.data)
  const { page, pageSize } = parsed.data
  return reply.send(paginated(logs, buildPagination(total, page, pageSize)))
}

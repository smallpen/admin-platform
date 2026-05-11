import type { FastifyRequest, FastifyReply } from 'fastify'
import { ok, err } from '../../utils/response.js'
import {
  updateMaintenanceSchema,
  createScheduleSchema,
  updateScheduleSchema,
} from './settings.schema.js'
import {
  getMaintenanceStatusService,
  updateMaintenanceStatusService,
  listSchedulesService,
  createScheduleService,
  updateScheduleService,
  deleteScheduleService,
} from './settings.service.js'

export async function getMaintenanceStatusController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const status = await getMaintenanceStatusService(request.server)
  return reply.send(ok({
    isActive: status.isActive,
    message: status.message,
    activatedAt: status.activatedAt,
    activatedBy: status.activatedBy,
  }))
}

export async function updateMaintenanceStatusController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = updateMaintenanceSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('Invalid input', 'VALIDATION_ERROR'))

  const activatedBy = request.currentUser?.id
  const status = await updateMaintenanceStatusService(request.server, parsed.data, activatedBy)
  return reply.send(ok(status))
}

export async function listSchedulesController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const schedules = await listSchedulesService(request.server)
  return reply.send(ok(schedules))
}

export async function createScheduleController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = createScheduleSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('Invalid input', 'VALIDATION_ERROR'))

  const schedule = await createScheduleService(request.server, parsed.data)
  return reply.status(201).send(ok(schedule))
}

export async function updateScheduleController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const parsed = updateScheduleSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send(err('Invalid input', 'VALIDATION_ERROR'))

  try {
    const schedule = await updateScheduleService(request.server, request.params.id, parsed.data)
    return reply.send(ok(schedule))
  } catch {
    return reply.status(404).send(err('Schedule not found', 'NOT_FOUND'))
  }
}

export async function deleteScheduleController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    await deleteScheduleService(request.server, request.params.id)
    return reply.send(ok(null, '排程已刪除'))
  } catch {
    return reply.status(404).send(err('Schedule not found', 'NOT_FOUND'))
  }
}

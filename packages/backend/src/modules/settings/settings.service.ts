import type { FastifyInstance } from 'fastify'
import { createActivityLog, type ActivityContext } from '../../utils/activity-log.js'
import type { UpdateMaintenanceInput, CreateScheduleInput, UpdateScheduleInput } from './settings.schema.js'

export async function getMaintenanceStatusService(fastify: FastifyInstance) {
  const status = await fastify.prisma.maintenanceStatus.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, isActive: false },
  })
  return status
}

export async function updateMaintenanceStatusService(
  fastify: FastifyInstance,
  data: UpdateMaintenanceInput,
  activatedBy?: string,
  ctx?: ActivityContext,
) {
  const before = await fastify.prisma.maintenanceStatus.findUnique({ where: { id: 1 } })

  const status = await fastify.prisma.maintenanceStatus.upsert({
    where: { id: 1 },
    update: {
      isActive: data.isActive,
      message: data.message ?? null,
      activatedAt: data.isActive ? new Date() : null,
      activatedBy: data.isActive ? (activatedBy ?? null) : null,
    },
    create: {
      id: 1,
      isActive: data.isActive,
      message: data.message ?? null,
      activatedAt: data.isActive ? new Date() : null,
      activatedBy: data.isActive ? (activatedBy ?? null) : null,
    },
  })

  if (ctx) {
    await createActivityLog(fastify, {
      ctx,
      action: 'UPDATE',
      module: 'settings',
      targetName: 'maintenance',
      before: before ? { isActive: before.isActive, message: before.message } : null,
      after:  { isActive: status.isActive, message: status.message },
    })
  }

  return status
}

export async function listSchedulesService(fastify: FastifyInstance) {
  return fastify.prisma.maintenanceSchedule.findMany({
    orderBy: { createdAt: 'asc' },
  })
}

export async function createScheduleService(
  fastify: FastifyInstance,
  data: CreateScheduleInput,
  ctx: ActivityContext,
) {
  const schedule = await fastify.prisma.maintenanceSchedule.create({ data })
  fastify.reloadScheduler()

  await createActivityLog(fastify, {
    ctx,
    action: 'CREATE',
    module: 'settings',
    targetId:   schedule.id,
    targetName: schedule.name,
    after: { id: schedule.id, name: schedule.name, cronExpression: schedule.cronExpression, duration: schedule.duration, isEnabled: schedule.isEnabled },
  })

  return schedule
}

export async function updateScheduleService(
  fastify: FastifyInstance,
  id: string,
  data: UpdateScheduleInput,
  ctx: ActivityContext,
) {
  const before = await fastify.prisma.maintenanceSchedule.findUnique({ where: { id } })

  const schedule = await fastify.prisma.maintenanceSchedule.update({
    where: { id },
    data,
  })
  fastify.reloadScheduler()

  await createActivityLog(fastify, {
    ctx,
    action: 'UPDATE',
    module: 'settings',
    targetId:   id,
    targetName: schedule.name,
    before: before ? { name: before.name, cronExpression: before.cronExpression, duration: before.duration, isEnabled: before.isEnabled } : null,
    after:  { name: schedule.name, cronExpression: schedule.cronExpression, duration: schedule.duration, isEnabled: schedule.isEnabled },
  })

  return schedule
}

export async function deleteScheduleService(fastify: FastifyInstance, id: string, ctx: ActivityContext) {
  const before = await fastify.prisma.maintenanceSchedule.findUnique({ where: { id } })

  await fastify.prisma.maintenanceSchedule.delete({ where: { id } })
  fastify.reloadScheduler()

  await createActivityLog(fastify, {
    ctx,
    action: 'DELETE',
    module: 'settings',
    targetId:   id,
    targetName: before?.name,
    before: before ? { name: before.name, cronExpression: before.cronExpression, duration: before.duration, isEnabled: before.isEnabled } : null,
  })
}

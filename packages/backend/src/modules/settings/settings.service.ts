import type { FastifyInstance } from 'fastify'
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
) {
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
) {
  const schedule = await fastify.prisma.maintenanceSchedule.create({ data })
  fastify.reloadScheduler()
  return schedule
}

export async function updateScheduleService(
  fastify: FastifyInstance,
  id: string,
  data: UpdateScheduleInput,
) {
  const schedule = await fastify.prisma.maintenanceSchedule.update({
    where: { id },
    data,
  })
  fastify.reloadScheduler()
  return schedule
}

export async function deleteScheduleService(fastify: FastifyInstance, id: string) {
  await fastify.prisma.maintenanceSchedule.delete({ where: { id } })
  fastify.reloadScheduler()
}

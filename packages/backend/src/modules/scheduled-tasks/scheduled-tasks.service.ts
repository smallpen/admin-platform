import type { FastifyInstance } from 'fastify'
import * as cron from 'node-cron'
import { createActivityLog, type ActivityContext } from '../../utils/activity-log.js'
import { executeTask, type TaskType } from './task-handlers.js'
import type { UpdateScheduledTaskInput } from './scheduled-tasks.schema.js'

export async function listScheduledTasksService(fastify: FastifyInstance) {
  return fastify.prisma.scheduledTask.findMany({ orderBy: { createdAt: 'asc' } })
}

export async function updateScheduledTaskService(
  fastify: FastifyInstance,
  id: string,
  data: UpdateScheduledTaskInput,
  ctx: ActivityContext,
) {
  const before = await fastify.prisma.scheduledTask.findUnique({ where: { id } })
  if (!before) return null

  if (data.cronExpression && !cron.validate(data.cronExpression)) {
    throw new Error('INVALID_CRON')
  }

  const task = await fastify.prisma.scheduledTask.update({
    where: { id },
    data: {
      ...(data.cronExpression !== undefined && { cronExpression: data.cronExpression }),
      ...(data.isEnabled      !== undefined && { isEnabled:      data.isEnabled }),
    },
  })

  fastify.reloadScheduler()

  await createActivityLog(fastify, {
    ctx,
    action:     'UPDATE',
    module:     'scheduled_task',
    targetId:   id,
    targetName: task.name,
    before:     { cronExpression: before.cronExpression, isEnabled: before.isEnabled },
    after:      { cronExpression: task.cronExpression,   isEnabled: task.isEnabled },
  })

  return task
}

export async function triggerScheduledTaskService(
  fastify: FastifyInstance,
  id: string,
  ctx: ActivityContext,
) {
  const task = await fastify.prisma.scheduledTask.findUnique({ where: { id } })
  if (!task) return null

  const message = await executeTask(fastify, id, task.taskType as TaskType)

  await createActivityLog(fastify, {
    ctx,
    action:     'UPDATE',
    module:     'scheduled_task',
    targetId:   id,
    targetName: task.name,
    after:      { triggered: true, message },
  })

  return await fastify.prisma.scheduledTask.findUnique({ where: { id } })
}

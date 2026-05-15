import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import * as cron from 'node-cron'
import type { ScheduledTask } from 'node-cron'
import { executeTask, type TaskType } from '../modules/scheduled-tasks/task-handlers.js'

async function schedulerPlugin(fastify: FastifyInstance) {
  const maintenanceJobs = new Map<string, ScheduledTask>()
  const taskJobs = new Map<string, ScheduledTask>()

  async function loadAndRegister() {
    // Stop all existing jobs
    for (const job of maintenanceJobs.values()) job.stop()
    for (const job of taskJobs.values()) job.stop()
    maintenanceJobs.clear()
    taskJobs.clear()

    // Load maintenance schedules
    const schedules = await fastify.prisma.maintenanceSchedule.findMany({
      where: { isEnabled: true },
    })

    for (const schedule of schedules) {
      if (!cron.validate(schedule.cronExpression)) {
        fastify.log.warn(`Invalid cron expression for schedule "${schedule.name}": ${schedule.cronExpression}`)
        continue
      }

      const job = cron.schedule(schedule.cronExpression, async () => {
        fastify.log.info(`Scheduler: activating maintenance for "${schedule.name}"`)
        await fastify.prisma.maintenanceStatus.upsert({
          where: { id: 1 },
          update: { isActive: true, activatedAt: new Date(), activatedBy: 'scheduler' },
          create: { id: 1, isActive: true, activatedAt: new Date(), activatedBy: 'scheduler' },
        })
        await fastify.prisma.maintenanceSchedule.update({
          where: { id: schedule.id },
          data: { lastRunAt: new Date() },
        })

        setTimeout(async () => {
          fastify.log.info(`Scheduler: deactivating maintenance for "${schedule.name}"`)
          await fastify.prisma.maintenanceStatus.update({
            where: { id: 1 },
            data: { isActive: false, activatedAt: null, activatedBy: null },
          })
        }, schedule.duration * 60 * 1000)
      })

      maintenanceJobs.set(schedule.id, job)
    }

    // Load custom scheduled tasks
    const tasks = await fastify.prisma.scheduledTask.findMany({ where: { isEnabled: true } })

    for (const task of tasks) {
      if (!cron.validate(task.cronExpression)) {
        fastify.log.warn(`Invalid cron expression for task "${task.name}": ${task.cronExpression}`)
        continue
      }

      const job = cron.schedule(task.cronExpression, async () => {
        fastify.log.info(`ScheduledTask: running "${task.name}"`)
        await executeTask(fastify, task.id, task.taskType as TaskType)
      })

      taskJobs.set(task.id, job)
    }

    fastify.log.info(`Scheduler: ${maintenanceJobs.size} maintenance + ${taskJobs.size} task job(s) registered`)
  }

  fastify.decorate('reloadScheduler', () => {
    loadAndRegister().catch(e => fastify.log.error(e, 'Scheduler reload failed'))
  })

  fastify.addHook('onReady', async () => {
    await loadAndRegister()
  })

  fastify.addHook('onClose', () => {
    for (const job of maintenanceJobs.values()) job.stop()
    for (const job of taskJobs.values()) job.stop()
    maintenanceJobs.clear()
    taskJobs.clear()
  })
}

export default fp(schedulerPlugin, { name: 'scheduler' })

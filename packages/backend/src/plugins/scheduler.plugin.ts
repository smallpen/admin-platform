import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import * as cron from 'node-cron'
import type { ScheduledTask } from 'node-cron'

async function schedulerPlugin(fastify: FastifyInstance) {
  const jobs = new Map<string, ScheduledTask>()

  async function loadAndRegister() {
    // Stop and destroy all existing jobs
    for (const job of jobs.values()) {
      job.stop()
    }
    jobs.clear()

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

        // Auto-disable after duration
        setTimeout(async () => {
          fastify.log.info(`Scheduler: deactivating maintenance for "${schedule.name}"`)
          await fastify.prisma.maintenanceStatus.update({
            where: { id: 1 },
            data: { isActive: false, activatedAt: null, activatedBy: null },
          })
        }, schedule.duration * 60 * 1000)
      })

      jobs.set(schedule.id, job)
    }

    fastify.log.info(`Scheduler: ${jobs.size} cron job(s) registered`)
  }

  fastify.decorate('reloadScheduler', () => {
    loadAndRegister().catch(e => fastify.log.error(e, 'Scheduler reload failed'))
  })

  fastify.addHook('onReady', async () => {
    await loadAndRegister()
  })

  fastify.addHook('onClose', () => {
    for (const job of jobs.values()) job.stop()
    jobs.clear()
  })
}

export default fp(schedulerPlugin, { name: 'scheduler' })

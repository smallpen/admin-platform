import type { FastifyInstance } from 'fastify'

export const TASK_TYPES = ['CLEANUP_EXPIRED_TOKENS', 'CLEANUP_ACTIVITY_LOGS'] as const
export type TaskType = typeof TASK_TYPES[number]

export async function executeTask(fastify: FastifyInstance, taskId: string, taskType: TaskType): Promise<string> {
  await fastify.prisma.scheduledTask.update({
    where: { id: taskId },
    data: { lastStatus: 'RUNNING', lastRunAt: new Date() },
  })

  try {
    let message: string

    if (taskType === 'CLEANUP_EXPIRED_TOKENS') {
      const result = await fastify.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { revokedAt: { not: null } },
          ],
        },
      })
      message = `已清除 ${result.count} 筆過期或撤銷的 Token`
    } else if (taskType === 'CLEANUP_ACTIVITY_LOGS') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 90)
      const result = await fastify.prisma.activityLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      })
      message = `已清除 ${result.count} 筆超過 90 天的操作紀錄`
    } else {
      message = `未知任務類型：${taskType}`
    }

    await fastify.prisma.scheduledTask.update({
      where: { id: taskId },
      data: { lastStatus: 'SUCCESS', lastMessage: message, lastRunAt: new Date() },
    })

    fastify.log.info(`ScheduledTask [${taskType}]: ${message}`)
    return message
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e)
    await fastify.prisma.scheduledTask.update({
      where: { id: taskId },
      data: { lastStatus: 'FAILED', lastMessage: errMsg },
    })
    fastify.log.error(`ScheduledTask [${taskType}] failed: ${errMsg}`)
    throw e
  }
}

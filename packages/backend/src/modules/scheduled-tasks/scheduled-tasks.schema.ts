import { z } from 'zod'

export const updateScheduledTaskSchema = z.object({
  cronExpression: z.string().min(1).optional(),
  isEnabled:      z.boolean().optional(),
})

export type UpdateScheduledTaskInput = z.infer<typeof updateScheduledTaskSchema>

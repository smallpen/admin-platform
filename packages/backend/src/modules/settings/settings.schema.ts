import { z } from 'zod'

export const updateMaintenanceSchema = z.object({
  isActive: z.boolean(),
  message: z.string().optional().nullable(),
})

export const createScheduleSchema = z.object({
  name: z.string().min(1),
  cronExpression: z.string().min(1),
  duration: z.number().int().min(1).default(60),
  isEnabled: z.boolean().default(true),
})

export const updateScheduleSchema = z.object({
  name: z.string().min(1).optional(),
  cronExpression: z.string().min(1).optional(),
  duration: z.number().int().min(1).optional(),
  isEnabled: z.boolean().optional(),
})

export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>

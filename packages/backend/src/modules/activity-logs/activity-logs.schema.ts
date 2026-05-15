import { z } from 'zod'

export const activityLogListQuerySchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  dateFrom: z.string().optional(),
  dateTo:   z.string().optional(),
  module:   z.string().optional(),
  action:   z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN']).optional(),
  username: z.string().optional(),
})

export type ActivityLogListQuery = z.infer<typeof activityLogListQuerySchema>

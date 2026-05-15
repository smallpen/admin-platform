import { z } from 'zod'

const ANNOUNCEMENT_TYPES = ['INFO', 'WARNING', 'DANGER', 'SUCCESS'] as const
const ANNOUNCEMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const

export const createAnnouncementSchema = z.object({
  title:   z.string().min(1, '標題不得為空').max(200),
  content: z.string().min(1, '內容不得為空'),
  type:    z.enum(ANNOUNCEMENT_TYPES).default('INFO'),
  status:  z.enum(ANNOUNCEMENT_STATUSES).default('DRAFT'),
  startAt: z.string().datetime().optional().nullable(),
  endAt:   z.string().datetime().optional().nullable(),
})

export const updateAnnouncementSchema = z.object({
  title:   z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  type:    z.enum(ANNOUNCEMENT_TYPES).optional(),
  status:  z.enum(ANNOUNCEMENT_STATUSES).optional(),
  startAt: z.string().datetime().optional().nullable(),
  endAt:   z.string().datetime().optional().nullable(),
})

export const listAnnouncementsSchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status:   z.enum(ANNOUNCEMENT_STATUSES).optional(),
  type:     z.enum(ANNOUNCEMENT_TYPES).optional(),
  keyword:  z.string().optional(),
})

export type CreateAnnouncementInput  = z.infer<typeof createAnnouncementSchema>
export type UpdateAnnouncementInput  = z.infer<typeof updateAnnouncementSchema>
export type ListAnnouncementsInput   = z.infer<typeof listAnnouncementsSchema>

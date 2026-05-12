import { z } from 'zod'

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請使用 YYYY-MM-DD 格式')

export const createAdSchema = z.object({
  title: z.string().min(1, '請輸入廣告名稱').max(100),
  imageBase64: z.string().min(1, '請上傳廣告圖片'),
  mimeType: z.string().min(1, '請提供圖片類型'),
  imageName: z.string().min(1, '請提供圖片檔名'),
  linkUrl: z.string().url('請輸入有效的網址').nullable().optional(),
  duration: z.number().int().min(1, '輪播時間至少 1 秒').default(5),
  isActive: z.boolean().default(true),
  startDate: dateString,
  endDate: dateString,
  sortOrder: z.number().int().min(0).default(0),
}).refine(data => data.endDate >= data.startDate, {
  message: '結束日期不能早於開始日期',
  path: ['endDate'],
})

export const updateAdSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  imageBase64: z.string().optional(),
  mimeType: z.string().optional(),
  imageName: z.string().optional(),
  linkUrl: z.string().url().nullable().optional(),
  duration: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export const adListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})

export type CreateAdInput = z.infer<typeof createAdSchema>
export type UpdateAdInput = z.infer<typeof updateAdSchema>
export type AdListQuery = z.infer<typeof adListQuerySchema>

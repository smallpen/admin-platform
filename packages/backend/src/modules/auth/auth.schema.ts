import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, '請輸入帳號'),
  password: z.string().min(1, '請輸入密碼'),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export const updateMeSchema = z.object({
  displayName: z.string().min(1, '顯示名稱不得為空').max(100).optional(),
  email: z.string().email('請輸入有效的電子郵件').optional(),
})

export const updateMyPasswordSchema = z.object({
  currentPassword: z.string().min(1, '請輸入目前密碼'),
  newPassword: z.string().min(8, '密碼至少 8 個字元'),
  confirmNewPassword: z.string().min(8),
}).refine(d => d.newPassword === d.confirmNewPassword, {
  message: '兩次密碼輸入不一致',
  path: ['confirmNewPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
export type UpdateMeInput = z.infer<typeof updateMeSchema>
export type UpdateMyPasswordInput = z.infer<typeof updateMyPasswordSchema>

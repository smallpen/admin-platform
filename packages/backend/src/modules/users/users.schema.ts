import { z } from 'zod'

export const createUserSchema = z.object({
  username: z.string().min(3, '帳號至少 3 個字元').max(50).regex(/^[a-zA-Z0-9_]+$/, '帳號只能包含英文、數字及底線'),
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string().min(8, '密碼至少 8 個字元'),
  displayName: z.string().min(1, '請輸入顯示名稱').max(100),
  roleIds: z.array(z.string()).optional(),
})

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().min(1).max(100).optional(),
  avatar: z.string().url().nullable().optional(),
  roleIds: z.array(z.string()).optional(),
})

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
})

export const updatePasswordSchema = z.object({
  newPassword: z.string().min(8, '密碼至少 8 個字元'),
})

export const assignRolesSchema = z.object({
  roleIds: z.array(z.string()),
})

export const userListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
  sortField: z.enum(['username', 'email', 'displayName', 'createdAt', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserListQuery = z.infer<typeof userListQuerySchema>

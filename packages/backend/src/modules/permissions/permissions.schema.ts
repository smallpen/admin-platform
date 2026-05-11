import { z } from 'zod'

export const createPermissionSchema = z.object({
  code: z.string()
    .min(3, '權限碼至少 3 個字元')
    .regex(/^[a-z]+:[a-z_]+$/, '格式須為 module:action（小寫英文及底線）'),
  name: z.string().min(1, '請輸入名稱').max(100),
  group: z.string().min(1, '請輸入模組分組').max(50).regex(/^[a-z_]+$/, '分組只能包含小寫英文及底線'),
  description: z.string().max(200).optional(),
})

export const updatePermissionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(200).nullable().optional(),
})

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>

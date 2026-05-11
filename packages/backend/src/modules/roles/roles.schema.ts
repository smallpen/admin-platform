import { z } from 'zod'

export const createRoleSchema = z.object({
  name: z.string().min(2).max(50).regex(/^[a-z_]+$/, '角色名稱只能包含小寫英文及底線'),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string()).optional(),
})

export const updateRoleSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
})

export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>

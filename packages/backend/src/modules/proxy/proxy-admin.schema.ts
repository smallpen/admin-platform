import { z } from 'zod'

export const paramMappingItemSchema = z.object({
  inputName:    z.string().min(1, '請輸入請求參數名').max(100),
  spParamName:  z.string().min(1, '請輸入 SP 參數名').max(100),
  type:         z.enum(['string', 'int', 'decimal', 'boolean', 'datetime']),
  required:     z.boolean(),
  defaultValue: z.string().max(500).optional(),
  description:  z.string().max(200).optional(),
})

export const createProxyApiSchema = z.object({
  name:            z.string().min(1, '請輸入名稱').max(100),
  path:            z.string().min(1).max(100).regex(/^[a-z0-9][a-z0-9-]*$/, 'path 只能含小寫英文、數字與連字號'),
  method:          z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('POST'),
  description:     z.string().max(500).optional(),
  storedProcedure: z.string().min(1, '請輸入 Stored Procedure 名稱').regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'SP 名稱只能含英文、數字與底線'),
  paramMappings:   z.array(paramMappingItemSchema),
  requireAuth:     z.boolean().default(true),
  authType:        z.enum(['JWT', 'API_KEY', 'BOTH', 'NONE']).default('JWT'),
  isActive:        z.boolean().default(true),
})

export const updateProxyApiSchema = createProxyApiSchema.partial()

export const proxyApiListQuerySchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  search:   z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
})

export const createApiKeySchema = z.object({
  name:        z.string().min(1, '請輸入名稱').max(100),
  allowedApis: z.array(z.string()).default(['*']),
  expiresAt:   z.string().datetime().optional(),
})

export const apiLogListQuerySchema = z.object({
  page:         z.coerce.number().min(1).default(1),
  pageSize:     z.coerce.number().min(1).max(100).default(20),
  apiId:        z.string().optional(),
  responseCode: z.coerce.number().optional(),
  dateFrom:     z.string().optional(),
  dateTo:       z.string().optional(),
})

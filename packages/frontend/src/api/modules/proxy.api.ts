import client from '../client'
import type { ApiResponse, PaginatedResponse } from '@admin/shared'

export interface ParamMapping {
  inputName:    string
  spParamName:  string
  type:         'string' | 'int' | 'decimal' | 'boolean' | 'datetime'
  required:     boolean
  defaultValue?: string
  description?: string
}

export interface ProxyApi {
  id:              string
  name:            string
  path:            string
  method:          string
  description?:    string
  storedProcedure: string
  paramMappings:   ParamMapping[]
  requireAuth:     boolean
  authType:        string
  isActive:        boolean
  createdAt:       string
  updatedAt:       string
}

export interface ApiKeyItem {
  id:          string
  name:        string
  keyPrefix:   string
  allowedApis: string[]
  isActive:    boolean
  expiresAt?:  string
  lastUsedAt?: string
  createdAt:   string
  updatedAt:   string
}

export interface ApiKeyCreated extends ApiKeyItem {
  rawKey: string
}

export interface ApiCallLog {
  id:           string
  apiId:        string
  apiKeyId?:    string
  callerIp:     string
  requestBody?: Record<string, any>
  responseCode: number
  durationMs:   number
  errorMsg?:    string
  calledAt:     string
  proxyApi:     { id: string; name: string; path: string }
  apiKey?:      { id: string; name: string; keyPrefix: string }
}

export interface ProxyApiListQuery {
  page?:     number
  pageSize?: number
  search?:   string
  isActive?: string
}

export interface CreateProxyApiDto {
  name:            string
  path:            string
  method:          string
  description?:    string
  storedProcedure: string
  paramMappings:   ParamMapping[]
  requireAuth:     boolean
  authType:        string
  isActive:        boolean
}

export interface CreateApiKeyDto {
  name:        string
  allowedApis: string[]
  expiresAt?:  string
}

export interface ApiLogQuery {
  page?:         number
  pageSize?:     number
  apiId?:        string
  responseCode?: number
  dateFrom?:     string
  dateTo?:       string
}

export const spDiscoveryApi = {
  listAll() {
    return client.get<ApiResponse<string[]>>('/proxy-apis/sp-list')
  },
  getParams(spName: string) {
    return client.get<ApiResponse<ParamMapping[]>>(`/proxy-apis/sp-params/${encodeURIComponent(spName)}`)
  },
}

export const proxyApiApi = {
  list(params?: ProxyApiListQuery) {
    return client.get<PaginatedResponse<ProxyApi>>('/proxy-apis', { params })
  },

  get(id: string) {
    return client.get<ApiResponse<ProxyApi>>(`/proxy-apis/${id}`)
  },

  create(data: CreateProxyApiDto) {
    return client.post<ApiResponse<ProxyApi>>('/proxy-apis', data)
  },

  update(id: string, data: Partial<CreateProxyApiDto>) {
    return client.patch<ApiResponse<ProxyApi>>(`/proxy-apis/${id}`, data)
  },

  delete(id: string) {
    return client.delete<ApiResponse<null>>(`/proxy-apis/${id}`)
  },
}

export const apiKeyApi = {
  list() {
    return client.get<ApiResponse<ApiKeyItem[]>>('/api-keys')
  },

  create(data: CreateApiKeyDto) {
    return client.post<ApiResponse<ApiKeyCreated>>('/api-keys', data)
  },

  toggle(id: string, isActive: boolean) {
    return client.patch<ApiResponse<ApiKeyItem>>(`/api-keys/${id}`, { isActive })
  },

  delete(id: string) {
    return client.delete<ApiResponse<null>>(`/api-keys/${id}`)
  },
}

export const apiLogApi = {
  list(params?: ApiLogQuery) {
    return client.get<PaginatedResponse<ApiCallLog>>('/api-logs', { params })
  },
}

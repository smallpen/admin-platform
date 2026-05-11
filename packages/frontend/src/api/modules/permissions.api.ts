import client from '../client'
import type { ApiResponse, PermissionGroup, Permission, CreatePermissionDto, UpdatePermissionDto } from '@admin/shared'

export const permissionsApi = {
  list() {
    return client.get<ApiResponse<PermissionGroup[]>>('/permissions')
  },

  create(data: CreatePermissionDto) {
    return client.post<ApiResponse<Permission>>('/permissions', data)
  },

  update(id: string, data: UpdatePermissionDto) {
    return client.patch<ApiResponse<Permission>>(`/permissions/${id}`, data)
  },

  delete(id: string) {
    return client.delete<ApiResponse<null>>(`/permissions/${id}`)
  },
}

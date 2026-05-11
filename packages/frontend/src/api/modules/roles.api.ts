import client from '../client'
import type { ApiResponse, Role, CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from '@admin/shared'

export const rolesApi = {
  list() {
    return client.get<ApiResponse<Role[]>>('/roles')
  },

  get(id: string) {
    return client.get<ApiResponse<Role>>(`/roles/${id}`)
  },

  create(data: CreateRoleDto) {
    return client.post<ApiResponse<Role>>('/roles', data)
  },

  update(id: string, data: UpdateRoleDto) {
    return client.patch<ApiResponse<Role>>(`/roles/${id}`, data)
  },

  delete(id: string) {
    return client.delete<ApiResponse<null>>(`/roles/${id}`)
  },

  assignPermissions(id: string, data: AssignPermissionsDto) {
    return client.put<ApiResponse<null>>(`/roles/${id}/permissions`, data)
  },
}

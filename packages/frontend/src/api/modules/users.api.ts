import client from '../client'
import type { ApiResponse, PaginatedResponse, User, CreateUserDto, UpdateUserDto, UserListQuery } from '@admin/shared'

export const usersApi = {
  list(params?: UserListQuery) {
    return client.get<PaginatedResponse<User>>('/users', { params })
  },

  get(id: string) {
    return client.get<ApiResponse<User>>(`/users/${id}`)
  },

  create(data: CreateUserDto) {
    return client.post<ApiResponse<User>>('/users', data)
  },

  update(id: string, data: UpdateUserDto) {
    return client.patch<ApiResponse<User>>(`/users/${id}`, data)
  },

  delete(id: string) {
    return client.delete<ApiResponse<null>>(`/users/${id}`)
  },

  updateStatus(id: string, status: string) {
    return client.patch<ApiResponse<null>>(`/users/${id}/status`, { status })
  },

  updatePassword(id: string, newPassword: string) {
    return client.patch<ApiResponse<null>>(`/users/${id}/password`, { newPassword })
  },

  assignRoles(id: string, roleIds: string[]) {
    return client.put<ApiResponse<null>>(`/users/${id}/roles`, { roleIds })
  },
}

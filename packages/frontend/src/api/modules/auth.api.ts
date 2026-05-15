import client from '../client'
import type { ApiResponse, AuthUser, TokenPair } from '@admin/shared'

export interface UpdateProfileDto {
  displayName?: string
  email?: string
}

export interface UpdateMyPasswordDto {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export const authApi = {
  login(username: string, password: string) {
    return client.post<ApiResponse<{ accessToken: string; refreshToken: string; user: AuthUser }>>(
      '/auth/login',
      { username, password }
    )
  },

  refresh(refreshToken: string) {
    return client.post<ApiResponse<TokenPair>>('/auth/refresh', { refreshToken })
  },

  logout(refreshToken: string) {
    return client.post('/auth/logout', { refreshToken })
  },

  me() {
    return client.get<ApiResponse<AuthUser>>('/auth/me')
  },

  updateMe(data: UpdateProfileDto) {
    return client.patch<ApiResponse<AuthUser>>('/auth/me', data)
  },

  updateMyPassword(data: UpdateMyPasswordDto) {
    return client.patch<ApiResponse<null>>('/auth/me/password', data)
  },
}

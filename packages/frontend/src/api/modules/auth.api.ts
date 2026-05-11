import client from '../client'
import type { ApiResponse, AuthUser, TokenPair } from '@admin/shared'

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
}

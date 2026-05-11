export interface LoginRequest {
  username: string
  password: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface JwtPayload {
  sub: string
  jti: string
  iat: number
  exp: number
}

export interface AuthUser {
  id: string
  username: string
  email: string
  displayName: string
  avatar: string | null
  status: UserStatus
  roles: string[]
  permissions: string[]
}

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED'

import type { UserStatus } from './auth.types'

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatar: string | null
  status: UserStatus
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  roles: UserRole[]
}

export interface UserRole {
  id: string
  name: string
  displayName: string
}

export interface CreateUserDto {
  username: string
  email: string
  password: string
  displayName: string
  roleIds?: string[]
}

export interface UpdateUserDto {
  email?: string
  displayName?: string
  avatar?: string
  roleIds?: string[]
}

export interface UpdateUserStatusDto {
  status: UserStatus
}

export interface UpdateUserPasswordDto {
  newPassword: string
}

export interface UserListQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: UserStatus
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

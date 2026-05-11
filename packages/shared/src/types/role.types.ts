export interface Role {
  id: string
  name: string
  displayName: string
  description: string | null
  isSystem: boolean
  createdAt: string
  updatedAt: string
  permissions: RolePermission[]
  _count?: { userRoles: number }
}

export interface RolePermission {
  id: string
  code: string
  name: string
  group: string
}

export interface CreateRoleDto {
  name: string
  displayName: string
  description?: string
  permissionIds?: string[]
}

export interface UpdateRoleDto {
  displayName?: string
  description?: string
}

export interface AssignPermissionsDto {
  permissionIds: string[]
}

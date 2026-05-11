export interface Permission {
  id: string
  code: string
  name: string
  group: string
  description: string | null
  createdAt: string
}

export interface PermissionGroup {
  group: string
  permissions: Permission[]
}

export interface CreatePermissionDto {
  code: string
  name: string
  group: string
  description?: string
}

export interface UpdatePermissionDto {
  name?: string
  description?: string | null
}

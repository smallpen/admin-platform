export interface ApiResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  message: string
  code: string
  errors?: FieldError[]
}

export interface FieldError {
  field: string
  message: string
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: Pagination
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ListQuery {
  page?: number
  pageSize?: number
  search?: string
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

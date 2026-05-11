import type { ApiResponse, ApiError, PaginatedResponse, Pagination } from '@admin/shared'

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message }
}

export function paginated<T>(data: T[], pagination: Pagination): PaginatedResponse<T> {
  return { success: true, data, pagination }
}

export function buildPagination(total: number, page: number, pageSize: number): Pagination {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}

export function err(message: string, code: string, errors?: ApiError['errors']): ApiError {
  return { success: false, message, code, errors }
}

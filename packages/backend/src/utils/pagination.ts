export interface PaginationParams {
  page: number
  pageSize: number
}

export function parsePagination(query: { page?: unknown; pageSize?: unknown }): PaginationParams {
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
  return { page, pageSize }
}

export function toSkipTake({ page, pageSize }: PaginationParams) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  }
}

import { ref, reactive } from 'vue'
import type { Ref } from 'vue'
import type { PaginatedResponse } from '@admin/shared'
import { ElMessage } from 'element-plus'

export interface TableQueryParams {
  page: number
  pageSize: number
  search?: string
  sortField?: string
  sortOrder?: string
  [key: string]: unknown
}

export interface UseTableOptions<T> {
  fetchFn: (params: TableQueryParams) => Promise<{ data: PaginatedResponse<T> }>
  initialParams?: Partial<TableQueryParams>
}

export function useTable<T>(options: UseTableOptions<T>) {
  const { fetchFn, initialParams = {} } = options

  const loading = ref(false)
  const rows: Ref<T[]> = ref([])
  const pagination = reactive({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const sortState = reactive({ field: '', order: '' })
  const searchText = ref('')
  const extraParams = reactive<Record<string, unknown>>({ ...initialParams })

  async function load(resetPage = false) {
    if (resetPage) pagination.page = 1

    loading.value = true
    try {
      const params: TableQueryParams = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchText.value || undefined,
        sortField: sortState.field || undefined,
        sortOrder: sortState.order || undefined,
        ...extraParams,
      }

      const res = await fetchFn(params)
      rows.value = res.data.data as T[]
      Object.assign(pagination, res.data.pagination)
    } catch (err: any) {
      ElMessage.error(err?.response?.data?.message || '資料載入失敗')
    } finally {
      loading.value = false
    }
  }

  function handleSortChange({ field, order }: { field: string; order: string | null }) {
    sortState.field = field || ''
    sortState.order = order === 'desc' ? 'desc' : order === 'asc' ? 'asc' : ''
    load()
  }

  function handlePageChange(page: number) {
    pagination.page = page
    load()
  }

  function handlePageSizeChange(pageSize: number) {
    pagination.pageSize = pageSize
    pagination.page = 1
    load()
  }

  function handleSearch(text: string) {
    searchText.value = text
    load(true)
  }

  function refresh() {
    load()
  }

  return {
    loading,
    rows,
    pagination,
    sortState,
    searchText,
    extraParams,
    load,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    refresh,
  }
}

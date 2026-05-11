<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, onMounted } from 'vue'
import type { Component } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { useTable, type UseTableOptions } from '@/composables/useTable'
import { ElMessageBox, ElMessage } from 'element-plus'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useI18n } from 'vue-i18n'

export interface TableColumn {
  field: string
  title: string
  width?: number | string
  minWidth?: number
  fixed?: 'left' | 'right'
  sortable?: boolean
  slotName?: string
}

export interface TableAction {
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  permission?: string
  icon?: Component
  handler: (row: T) => void
  confirm?: string
  show?: (row: T) => boolean
}

const props = withDefaults(defineProps<{
  columns: TableColumn[]
  fetchFn: UseTableOptions<T>['fetchFn']
  rowKey?: string
  checkboxSelection?: boolean
  actions?: TableAction[]
  exportFilename?: string
  height?: number | string
  autoLoad?: boolean
}>(), {
  rowKey: 'id',
  height: 'auto',
  autoLoad: true,
})

const emit = defineEmits<{
  (e: 'selectionChange', rows: T[]): void
}>()

const { t } = useI18n()
const vxeRef = ref()
const searchInput = ref('')
const selectedRows = ref<T[]>([])
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const { loading, rows, pagination, load, handleSortChange, handlePageChange, handlePageSizeChange, handleSearch } = useTable<T>({
  fetchFn: props.fetchFn,
})

onMounted(() => {
  if (props.autoLoad) load()
})

function onSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  handleSearch(searchInput.value)
}

function onReset() {
  if (debounceTimer) clearTimeout(debounceTimer)
  searchInput.value = ''
  handleSearch('')
}

function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    handleSearch(searchInput.value)
  }, 400)
}

function onSelectionChange({ records }: { records: T[] }) {
  selectedRows.value = records
  emit('selectionChange', records)
}

async function handleAction(action: TableAction, row: T) {
  if (action.confirm) {
    await ElMessageBox.confirm(action.confirm, t('common.messages.confirmDeleteTitle'), {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  }
  action.handler(row)
}

// Export functions
async function exportExcel() {
  await vxeRef.value?.exportData({ type: 'xlsx', filename: props.exportFilename || 'export' })
}

async function exportCsv() {
  await vxeRef.value?.exportData({ type: 'csv', filename: props.exportFilename || 'export' })
}

function exportPdf() {
  const doc = new jsPDF({ orientation: 'landscape' })
  const head = [props.columns.map(c => c.title)]
  const body = rows.value.map(row =>
    props.columns.map(c => {
      const val = row[c.field]
      return val == null ? '' : String(val)
    })
  )
  autoTable(doc, { head, body, styles: { font: 'helvetica', fontSize: 10 } })
  doc.save(`${props.exportFilename || 'export'}.pdf`)
}

defineExpose({ load, exportExcel, exportCsv, exportPdf, selectedRows })
</script>

<template>
  <div class="base-table">
    <!-- Toolbar -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left" />
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchInput"
          :placeholder="t('common.table.search')"
          clearable
          class="search-input"
          @input="onSearchInput"
          @keyup.enter="onSearch"
          @clear="onReset"
        >
          <template #prefix>
            <el-icon style="color:var(--gray-400)"><Search /></el-icon>
          </template>
        </el-input>

        <el-dropdown v-if="exportFilename" trigger="click">
          <el-button>
            <el-icon><Download /></el-icon>
            {{ t('common.actions.export') }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="exportExcel">{{ t('common.export.excel') }}</el-dropdown-item>
              <el-dropdown-item @click="exportCsv">{{ t('common.export.csv') }}</el-dropdown-item>
              <el-dropdown-item @click="exportPdf">{{ t('common.export.pdf') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-tooltip content="重新整理">
          <el-button :icon="Refresh" circle @click="load()" />
        </el-tooltip>
      </div>
    </div>

    <!-- Skeleton rows -->
    <div v-if="loading" class="skeleton-wrap">
      <div v-for="n in 5" :key="n" class="skeleton-row">
        <div
          v-for="col in columns"
          :key="col.field"
          class="skeleton skeleton-cell"
          :style="{ width: typeof col.width === 'number' ? col.width + 'px' : '100%', flex: col.width ? 'none' : '1' }"
        />
        <div v-if="actions?.length" class="skeleton skeleton-cell" style="width:120px;flex:none" />
      </div>
    </div>

    <!-- Table -->
    <vxe-table
      v-else
      ref="vxeRef"
      :data="rows"
      :row-config="{ keyField: rowKey, isHover: true }"
      :sort-config="{ trigger: 'cell', remote: true }"
      :checkbox-config="checkboxSelection ? { highlight: true } : undefined"
      :height="height === 'auto' ? undefined : height"
      :max-height="height === 'auto' ? 600 : undefined"
      border="inner"
      stripe
      round
      @sort-change="({ field, order }) => handleSortChange({ field, order })"
      @checkbox-change="onSelectionChange"
      @checkbox-all="onSelectionChange"
    >
      <vxe-column v-if="checkboxSelection" type="checkbox" width="50" fixed="left" />

      <template v-for="col in columns" :key="col.field">
        <vxe-column
          :field="col.field"
          :title="col.title"
          :width="col.width"
          :min-width="col.minWidth || 100"
          :fixed="col.fixed"
          :sortable="col.sortable"
        >
          <template v-if="col.slotName" #default="{ row }">
            <slot :name="col.slotName" :row="row" />
          </template>
        </vxe-column>
      </template>

      <!-- Actions column -->
      <vxe-column
        v-if="actions?.length"
        title="操作"
        fixed="right"
        :width="actions.length * 36 + 24"
        :resizable="false"
      >
        <template #default="{ row }">
          <div class="action-cell">
            <template v-for="action in actions" :key="action.label">
              <el-tooltip
                v-if="!action.show || action.show(row)"
                :content="action.label"
                placement="top"
                :show-after="300"
              >
                <el-button
                  v-permission="action.permission || ''"
                  :type="action.type || 'primary'"
                  :icon="action.icon"
                  plain
                  circle
                  size="small"
                  @click="handleAction(action, row)"
                />
              </el-tooltip>
            </template>
          </div>
        </template>
      </vxe-column>
    </vxe-table>

    <!-- Pagination -->
    <div class="table-footer">
      <span class="total-text">{{ t('common.table.total', { total: pagination.total }) }}</span>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="sizes, prev, pager, next"
        background
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.base-table {
  background: #fff;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--gray-200);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  gap: 12px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--gray-100);
  background: #fff;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-input { width: 220px; }
@media (max-width: 768px) { .search-input { width: 160px; } }

/* Skeleton */
.skeleton-wrap {
  padding: 0 16px;
}
.skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 4px;
  border-bottom: 1px solid var(--gray-100);
}
.skeleton-cell {
  height: 16px;
  border-radius: 4px;
  min-width: 60px;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--gray-100);
  flex-wrap: wrap;
  gap: 8px;
  background: var(--gray-50);
}

.total-text {
  font-size: 13px;
  color: #888;
}

.action-cell {
  display: flex;
  gap: 6px;
  align-items: center;
}
</style>

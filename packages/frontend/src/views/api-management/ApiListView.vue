<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Delete } from '@element-plus/icons-vue'
import BaseTable from '@/components/base/BaseTable.vue'
import ProxyApiFormModal from './components/ProxyApiFormModal.vue'
import { proxyApiApi } from '@/api/modules/proxy.api'
import type { ProxyApi } from '@/api/modules/proxy.api'
import type { TableColumn, TableAction } from '@/components/base/BaseTable.vue'
import { usePermission } from '@/composables/usePermission'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { has } = usePermission()
const tableRef = ref()
const showModal = ref(false)
const editingApi = ref<ProxyApi | null>(null)

const METHOD_TAGS: Record<string, { type: 'success' | 'primary' | 'warning' | 'danger'; label: string }> = {
  GET:    { type: 'success', label: 'GET' },
  POST:   { type: 'primary', label: 'POST' },
  PUT:    { type: 'warning', label: 'PUT' },
  DELETE: { type: 'danger',  label: 'DELETE' },
}

const AUTH_TYPE_LABELS: Record<string, string> = {
  JWT:     'JWT Token',
  API_KEY: 'API Key',
  BOTH:    'JWT 或 API Key',
  NONE:    '不需認證',
}

const columns: TableColumn[] = [
  { field: 'name',            title: t('proxy.apiList.columns.name'),            minWidth: 150, sortable: true },
  { field: 'path',            title: t('proxy.apiList.columns.path'),            minWidth: 160, slotName: 'path' },
  { field: 'method',          title: t('proxy.apiList.columns.method'),          width: 100,   slotName: 'method' },
  { field: 'storedProcedure', title: t('proxy.apiList.columns.storedProcedure'), minWidth: 160 },
  { field: 'authType',        title: t('proxy.apiList.columns.authType'),        width: 140,   slotName: 'authType' },
  { field: 'isActive',        title: t('proxy.apiList.columns.isActive'),        width: 90,    slotName: 'isActive' },
  { field: 'createdAt',       title: t('proxy.apiList.columns.createdAt'),       width: 160,   sortable: true, slotName: 'createdAt' },
]

const actions: TableAction[] = [
  {
    label: t('common.actions.edit'),
    type: 'primary',
    icon: EditPen,
    permission: 'proxy_api:update',
    handler: (row: ProxyApi) => {
      editingApi.value = row
      showModal.value = true
    },
  },
  {
    label: t('common.actions.delete'),
    type: 'danger',
    icon: Delete,
    permission: 'proxy_api:delete',
    confirm: '確定要刪除此代理 API 嗎？相關歷程記錄將一併刪除。',
    handler: async (row: ProxyApi) => {
      try {
        await proxyApiApi.delete(row.id)
        ElMessage.success('刪除成功')
        tableRef.value?.load()
      } catch (e: any) {
        ElMessage.error(e?.response?.data?.message || '刪除失敗')
      }
    },
  },
]

function fetchApis(params: any) {
  return proxyApiApi.list(params)
}

function openCreate() {
  editingApi.value = null
  showModal.value = true
}

function onSaved() {
  showModal.value = false
  tableRef.value?.load()
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">{{ t('proxy.apiList.title') }}</h2>
    </div>

    <BaseTable
      ref="tableRef"
      :columns="columns"
      :actions="actions"
      :fetch-fn="fetchApis"
    >
      <template #toolbar-left>
        <el-button v-if="has('proxy_api:create')" type="primary" @click="openCreate">
          {{ t('common.actions.create') }}
        </el-button>
      </template>
      <template #path="{ row }">
        <el-tooltip :content="`POST /api/proxy/${row.path}`" placement="top">
          <span class="path-cell">/api/proxy/{{ row.path }}</span>
        </el-tooltip>
      </template>

      <template #method="{ row }">
        <el-tag
          :type="METHOD_TAGS[row.method]?.type ?? 'info'"
          size="small"
          effect="plain"
        >
          {{ row.method }}
        </el-tag>
      </template>

      <template #authType="{ row }">
        <el-tag type="info" size="small" effect="plain">
          {{ AUTH_TYPE_LABELS[row.authType] ?? row.authType }}
        </el-tag>
      </template>

      <template #isActive="{ row }">
        <el-tag :class="row.isActive ? 'status-active' : 'status-inactive'" size="small">
          {{ row.isActive ? '啟用' : '停用' }}
        </el-tag>
      </template>

      <template #createdAt="{ row }">
        {{ new Date(row.createdAt).toLocaleString('zh-TW') }}
      </template>
    </BaseTable>

    <ProxyApiFormModal
      v-if="showModal"
      :api="editingApi"
      @close="showModal = false"
      @saved="onSaved"
    />
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }
.path-cell {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--primary);
  cursor: default;
}
</style>

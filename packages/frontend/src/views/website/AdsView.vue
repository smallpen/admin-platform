<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Delete } from '@element-plus/icons-vue'
import BaseTable from '@/components/base/BaseTable.vue'
import AdFormModal from './components/AdFormModal.vue'
import { adsApi } from '@/api/modules/ads.api'
import type { Advertisement } from '@admin/shared'
import type { TableColumn, TableAction } from '@/components/base/BaseTable.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const tableRef = ref()
const showModal = ref(false)
const editingAd = ref<Advertisement | null>(null)

type AdStatus = 'active' | 'inactive' | 'expired' | 'pending'

const statusConfig: Record<AdStatus, { label: string; type: 'success' | 'info' | 'warning' | 'primary' }> = {
  active:   { label: '生效',   type: 'success' },
  inactive: { label: '停用',   type: 'info' },
  expired:  { label: '已過期', type: 'warning' },
  pending:  { label: '未開始', type: 'primary' },
}

function getAdStatus(row: Advertisement): AdStatus {
  if (!row.isActive) return 'inactive'
  const now = Date.now()
  const start = new Date(row.startDate).getTime()
  const end = new Date(row.endDate).getTime()
  if (now > end) return 'expired'
  if (now < start) return 'pending'
  return 'active'
}

const columns: TableColumn[] = [
  { field: 'title', title: t('ads.columns.title'), minWidth: 160, sortable: true },
  { field: 'image', title: t('ads.columns.image'), width: 100, slotName: 'image' },
  { field: 'dateRange', title: t('ads.columns.dateRange'), width: 200, slotName: 'dateRange' },
  { field: 'duration', title: t('ads.columns.duration'), width: 120, slotName: 'duration' },
  { field: 'linkUrl', title: t('ads.columns.linkUrl'), minWidth: 180, slotName: 'linkUrl' },
  { field: 'isActive', title: t('ads.columns.isActive'), width: 100, slotName: 'isActive' },
  { field: 'sortOrder', title: t('ads.columns.sortOrder'), width: 80 },
  { field: 'createdAt', title: t('ads.columns.createdAt'), width: 160, sortable: true, slotName: 'createdAt' },
]

const actions: TableAction[] = [
  {
    label: t('common.actions.edit'),
    type: 'primary',
    icon: EditPen,
    permission: 'ad:update',
    handler: (row: Advertisement) => {
      editingAd.value = row
      showModal.value = true
    },
  },
  {
    label: t('common.actions.delete'),
    type: 'danger',
    icon: Delete,
    permission: 'ad:delete',
    confirm: t('ads.messages.deleteConfirm'),
    handler: async (row: Advertisement) => {
      try {
        await adsApi.delete(row.id)
        ElMessage.success(t('ads.messages.deleteSuccess'))
        tableRef.value?.load()
      } catch (err: any) {
        ElMessage.error(err?.response?.data?.message || '刪除失敗')
      }
    },
  },
]

function fetchAds(params: any) {
  return adsApi.list(params)
}

function openCreate() {
  editingAd.value = null
  showModal.value = true
}

function onModalSuccess() {
  tableRef.value?.load()
}

function formatDate(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleString('zh-TW')
}

function formatDateOnly(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">{{ t('ads.title') }}</h2>
    </div>

    <BaseTable
      ref="tableRef"
      :columns="columns"
      :fetch-fn="fetchAds"
      :actions="actions"
      export-filename="ads"
    >
      <template #toolbar-left>
        <el-button v-permission="'ad:create'" type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>
          {{ t('ads.create') }}
        </el-button>
      </template>

      <template #image="{ row }">
        <img
          :src="adsApi.getImageUrl(row.id)"
          :alt="row.title"
          class="ad-thumbnail"
        />
      </template>

      <template #dateRange="{ row }">
        <span class="date-range">
          {{ formatDateOnly(row.startDate) }}<br />
          <span class="date-separator">～</span>
          {{ formatDateOnly(row.endDate) }}
        </span>
      </template>

      <template #duration="{ row }">
        {{ row.duration }} 秒
      </template>

      <template #linkUrl="{ row }">
        <a v-if="row.linkUrl" :href="row.linkUrl" target="_blank" class="link-url" :title="row.linkUrl">
          {{ row.linkUrl }}
        </a>
        <span v-else class="no-link">—</span>
      </template>

      <template #isActive="{ row }">
        <el-tag
          :type="statusConfig[getAdStatus(row)].type"
          size="small"
          effect="light"
        >
          {{ statusConfig[getAdStatus(row)].label }}
        </el-tag>
      </template>

      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
    </BaseTable>

    <AdFormModal
      v-model="showModal"
      :ad="editingAd"
      @success="onModalSuccess"
    />
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }

.ad-thumbnail {
  width: 64px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--gray-200);
  display: block;
}

.date-range {
  font-size: 12px;
  line-height: 1.6;
  color: var(--gray-700);
}
.date-separator {
  color: var(--gray-400);
  font-size: 11px;
}

.link-url {
  color: var(--primary);
  text-decoration: none;
  display: block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.link-url:hover { text-decoration: underline; }

.no-link { color: var(--gray-400); }
</style>
